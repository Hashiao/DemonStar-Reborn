import UIKit
import WebKit
import Network
import CoreHaptics
import Darwin

// 本地游戏的局域网/触感桥接，网络 IO 在独立队列中运行。
// LAN/haptics bridge for the bundled game; network IO runs on a dedicated queue.
final class GameBridge: NSObject, WKScriptMessageHandler {
    static let port: UInt16 = 37654
    private let limit = 1_048_576
    private let queue = DispatchQueue(label: "io.github.hashiao.demonstar.lan")
    private let output: ([String: Any]) -> Void
    private var listener: NWListener?
    private var peers: [String: Peer] = [:]
    private var generation = 0
    private var serial = 0
    private var lastHaptic: TimeInterval = 0
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let heavy = UIImpactFeedbackGenerator(style: .heavy)
    private final class Peer {
        let id: String
        let connection: NWConnection
        let generation: Int
        var buffer = Data()
        var pending = 0
        var closed = false
        init(_ id: String, _ connection: NWConnection, _ generation: Int) { self.id = id; self.connection = connection; self.generation = generation }
    }
    init(output: @escaping ([String: Any]) -> Void) { self.output = output; super.init() }
    private func emit(_ value: [String: Any]) { DispatchQueue.main.async { [weak self] in self?.output(value) } }
    private func reply(_ request: [String: Any], _ value: Any = NSNull(), error: String? = nil) { guard (request["requestId"] as? Int ?? 0) != 0 else { return }; emit(["requestId": request["requestId"] ?? 0, "value": value, "error": error as Any? ?? NSNull()]) }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.isFileURL == true, let request = message.body as? [String: Any], let method = request["method"] as? String else { return }
        if method == "capabilities" {
            var haptics: Any = "unknown"
            if #available(iOS 13.0, *) { haptics = CHHapticEngine.capabilitiesForHardware().supportsHaptics }
            reply(request, ["lan": true, "haptics": haptics, "platform": "ios", "port": Self.port]); return
        }
        if method == "haptic" {
            if UIApplication.shared.applicationState == .active && Date.timeIntervalSinceReferenceDate - lastHaptic >= 0.07 {
                lastHaptic = Date.timeIntervalSinceReferenceDate
                let generator = request["kind"] as? String == "heavy" ? heavy : light
                generator.prepare(); generator.impactOccurred()
            }
            reply(request, true); return
        }
        queue.async { [weak self] in self?.handle(request, method) }
    }
    private func handle(_ request: [String: Any], _ method: String) {
        switch method {
        case "stop": stopOnQueue(); reply(request, true)
        case "host": host(request)
        case "join": join(request)
        case "send":
            guard let data = request["data"] as? String, data.utf8.count <= limit, !data.contains("\n"), let target = request["peer"] as? String else { reply(request, error: "packet-size"); return }
            let targets = target == "*" ? Array(peers.values) : peers[target].map { [$0] } ?? []
            if targets.isEmpty && target != "*" { reply(request, error: "disconnected"); return }
            for peer in targets { send(data, peer) }; reply(request, true)
        case "drop": if let id = request["peer"] as? String, let peer = peers[id] { close(peer) }; reply(request, true)
        default: reply(request, error: "unsupported")
        }
    }
    private func host(_ request: [String: Any]) {
        stopOnQueue(); let run = generation
        do {
            let parameters = NWParameters.tcp; parameters.allowLocalEndpointReuse = true
            let server = try NWListener(using: parameters, on: NWEndpoint.Port(rawValue: Self.port)!)
            listener = server
            server.stateUpdateHandler = { [weak self] state in
                guard let self = self, run == self.generation else { return }
                switch state {
                case .ready: self.reply(request, ["addresses": self.addresses(), "port": Self.port])
                case .failed: self.reply(request, error: "listen-failed"); self.emit(["type": "error", "error": "listen-failed"])
                case .waiting: self.emit(["type": "error", "error": "local-network-permission"])
                default: break
                }
            }
            server.newConnectionHandler = { [weak self] connection in
                guard let self = self, run == self.generation, self.peers.count < 8 else { connection.cancel(); return }
                self.serial += 1; self.attach("peer-\(self.serial)", connection, run)
            }
            server.start(queue: queue)
        } catch { reply(request, error: "listen-failed") }
    }
    private func join(_ request: [String: Any]) {
        stopOnQueue(); let run = generation
        guard let host = request["host"] as? String, Self.localAddress(host) else { reply(request, error: "connect-failed"); return }
        let connection = NWConnection(host: NWEndpoint.Host(host), port: NWEndpoint.Port(rawValue: Self.port)!, using: .tcp)
        attach("host", connection, run, request)
        queue.asyncAfter(deadline: .now() + 6) { [weak self, weak connection] in
            guard let self = self, run == self.generation, let connection = connection else { return }
            if case .ready = connection.state { return }
            connection.cancel(); self.reply(request, error: "connect-failed")
        }
    }
    private func attach(_ id: String, _ connection: NWConnection, _ run: Int, _ request: [String: Any]? = nil) {
        let peer = Peer(id, connection, run); peers[id] = peer
        connection.stateUpdateHandler = { [weak self, weak peer] state in
            guard let self = self, let peer = peer, run == self.generation else { return }
            switch state {
            case .ready: self.emit(["type": "connected", "peer": id]); if let request = request { self.reply(request, ["peer": id]) }; self.receive(peer)
            case .failed: if let request = request { self.reply(request, error: "connect-failed") }; self.close(peer)
            case .cancelled: self.close(peer)
            case .waiting: self.emit(["type": "error", "error": "local-network-permission"])
            default: break
            }
        }
        connection.start(queue: queue)
    }
    private func receive(_ peer: Peer) {
        peer.connection.receive(minimumIncompleteLength: 1, maximumLength: 16384) { [weak self, weak peer] data, _, complete, error in
            guard let self = self, let peer = peer, !peer.closed, peer.generation == self.generation else { return }
            if let data = data {
                peer.buffer.append(data)
                while let newline = peer.buffer.firstIndex(of: 10) {
                    let line = peer.buffer[..<newline]
                    guard line.count <= self.limit, let text = String(data: line, encoding: .utf8) else { self.close(peer); return }
                    self.emit(["type": "message", "peer": peer.id, "data": text]); peer.buffer.removeSubrange(...newline)
                }
                if peer.buffer.count > self.limit { self.close(peer); return }
            }
            if complete || error != nil { self.close(peer) } else { self.receive(peer) }
        }
    }
    private func send(_ text: String, _ peer: Peer) {
        guard !peer.closed else { return }; peer.pending += 1
        // 限制队列，避免弱网络积压数秒旧画面。 / Bound queues so slow peers do not accumulate stale frames.
        if peer.pending > 6 { close(peer); return }
        peer.connection.send(content: (text + "\n").data(using: .utf8), completion: .contentProcessed { [weak self, weak peer] error in
            guard let self = self, let peer = peer else { return }; peer.pending -= 1; if error != nil { self.close(peer) }
        })
    }
    private func close(_ peer: Peer) {
        guard !peer.closed else { return }; peer.closed = true; peers.removeValue(forKey: peer.id); peer.connection.cancel()
        if peer.generation == generation { emit(["type": "disconnected", "peer": peer.id]) }
    }
    private func stopOnQueue() { generation += 1; listener?.cancel(); listener = nil; for peer in Array(peers.values) { close(peer) }; peers.removeAll() }
    func stop() { queue.async { [weak self] in self?.stopOnQueue() } }
    private static func localAddress(_ host: String) -> Bool {
        let parts = host.split(separator: "."); guard parts.count == 4 else { return false }
        let values = parts.compactMap { UInt8($0) }; guard values.count == 4 else { return false }
        return values[0] == 10 || values[0] == 127 || values[0] == 192 && values[1] == 168 || values[0] == 172 && (16...31).contains(values[1]) || values[0] == 169 && values[1] == 254
    }
    private func addresses() -> [String] {
        var first: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&first) == 0, let start = first else { return [] }; defer { freeifaddrs(first) }
        var result: [String] = []
        for pointer in sequence(first: start, next: { $0.pointee.ifa_next }) {
            guard let address = pointer.pointee.ifa_addr, address.pointee.sa_family == UInt8(AF_INET) else { continue }
            var host = [CChar](repeating: 0, count: Int(NI_MAXHOST))
            if getnameinfo(address, socklen_t(address.pointee.sa_len), &host, socklen_t(host.count), nil, 0, NI_NUMERICHOST) == 0 {
                let text = String(cString: host); if !text.hasPrefix("127.") && Self.localAddress(text) { result.append(text) }
            }
        }
        return result
    }
}
