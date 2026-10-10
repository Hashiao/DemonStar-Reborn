package io.github.hashiao.demonstar;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

/** 仅向本地游戏开放局域网消息和触感；不加载远程页面。
 * Local-game-only LAN messages and haptics; remote pages remain blocked. */
final class GameBridge {
    static final int PORT = 37654;
    private static final int LIMIT = 1048576;
    private final Activity activity;
    private final Consumer<JSONObject> output;
    private final ExecutorService workers = Executors.newCachedThreadPool();
    private final ConcurrentHashMap<String, Peer> peers = new ConcurrentHashMap<>();
    private final AtomicInteger serial = new AtomicInteger();
    private volatile ServerSocket listener;
    private volatile int generation;
    private long lastHaptic;
    private final Vibrator vibrator;
    interface Permission { void request(JSONObject command); }
    private final Permission permission;

    GameBridge(Activity activity, Consumer<JSONObject> output, Permission permission) {
        this.activity = activity; this.output = output; this.permission = permission;
        vibrator = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
    }
    static JSONObject object(Object... fields) {
        JSONObject result = new JSONObject();
        try { for (int i = 0; i < fields.length; i += 2) result.put((String) fields[i], fields[i + 1]); } catch (Exception ignored) { }
        return result;
    }
    private void emit(JSONObject value) { activity.runOnUiThread(() -> output.accept(value)); }
    private void reply(JSONObject request, Object value, String error) { if (request.optInt("requestId") != 0) emit(object("requestId", request.optInt("requestId"), "value", value, "error", error)); }
    @JavascriptInterface public void command(String text) {
        if (text == null || text.length() > LIMIT + 4096) return;
        try { JSONObject request = new JSONObject(text); activity.runOnUiThread(() -> handle(request)); }
        catch (Exception ignored) { }
    }
    void handle(JSONObject request) {
        String method = request.optString("method");
        if ((method.equals("host") || method.equals("join")) && Build.VERSION.SDK_INT >= 37 && activity.checkSelfPermission("android.permission.ACCESS_LOCAL_NETWORK") != android.content.pm.PackageManager.PERMISSION_GRANTED) { permission.request(request); return; }
        switch (method) {
            case "capabilities": reply(request, object("lan", true, "haptics", vibrator != null && vibrator.hasVibrator(), "platform", "android", "port", PORT), null); break;
            case "haptic":
                if (activity.hasWindowFocus() && vibrator != null && vibrator.hasVibrator() && SystemClock.elapsedRealtime() - lastHaptic >= 70) {
                    lastHaptic = SystemClock.elapsedRealtime();
                    int effect = request.optString("kind").equals("heavy") ? VibrationEffect.EFFECT_HEAVY_CLICK : VibrationEffect.EFFECT_TICK;
                    vibrator.vibrate(VibrationEffect.createPredefined(effect));
                }
                reply(request, true, null); break;
            case "stop": stop(); reply(request, true, null); break;
            case "host": startHost(request); break;
            case "join": join(request); break;
            case "send": {
                String target = request.optString("peer"), data = request.optString("data");
                if (data.length() > LIMIT || data.indexOf('\n') >= 0) { reply(request, null, "packet-size"); break; }
                if (target.equals("*")) for (Peer peer : peers.values()) peer.send(data);
                else { Peer peer = peers.get(target); if (peer == null) { reply(request, null, "disconnected"); break; } peer.send(data); }
                reply(request, true, null); break;
            }
            case "drop": { Peer peer = peers.get(request.optString("peer")); if (peer != null) peer.close(); reply(request, true, null); break; }
            default: reply(request, null, "unsupported");
        }
    }
    void denied(JSONObject request) { reply(request, null, "local-network-permission"); }
    private void startHost(JSONObject request) {
        stop(); final int run = generation;
        workers.execute(() -> {
            try {
                ServerSocket server = new ServerSocket(); server.setReuseAddress(true); server.bind(new InetSocketAddress(PORT));
                if (run != generation) { server.close(); return; } listener = server;
                JSONArray addresses = new JSONArray();
                for (NetworkInterface network : Collections.list(NetworkInterface.getNetworkInterfaces())) if (network.isUp()) for (InetAddress address : Collections.list(network.getInetAddresses())) if (address instanceof Inet4Address && !address.isLoopbackAddress() && address.isSiteLocalAddress()) addresses.put(address.getHostAddress());
                reply(request, object("addresses", addresses, "port", PORT), null);
                while (run == generation && !server.isClosed()) {
                    Socket socket = server.accept();
                    if (peers.size() >= 8) { socket.close(); continue; }
                    attach("peer-" + serial.incrementAndGet(), socket, run);
                }
            } catch (Exception error) { if (run == generation) { reply(request, null, "listen-failed"); emit(object("type", "error", "error", "listen-failed")); } }
        });
    }
    private void join(JSONObject request) {
        stop(); final int run = generation;
        workers.execute(() -> {
            try {
                String host = request.optString("host");
                if (!host.matches("[0-9.]{7,15}")) throw new IllegalArgumentException();
                InetAddress address = InetAddress.getByName(host);
                if (!(address instanceof Inet4Address) || !(address.isSiteLocalAddress() || address.isLoopbackAddress() || address.isLinkLocalAddress())) throw new IllegalArgumentException();
                Socket socket = new Socket(); socket.connect(new InetSocketAddress(address, PORT), 5000);
                if (run != generation) { socket.close(); return; }
                attach("host", socket, run); reply(request, object("peer", "host"), null);
            } catch (Exception error) { if (run == generation) reply(request, null, "connect-failed"); }
        });
    }
    private void attach(String id, Socket socket, int run) throws Exception {
        socket.setTcpNoDelay(true); socket.setKeepAlive(true); Peer peer = new Peer(id, socket, run); peers.put(id, peer); emit(object("type", "connected", "peer", id)); workers.execute(peer::read);
    }
    void stop() {
        generation++; ServerSocket current = listener; listener = null; try { if (current != null) current.close(); } catch (Exception ignored) { }
        for (Peer peer : peers.values()) peer.close(); peers.clear(); if (vibrator != null) vibrator.cancel();
    }
    void destroy() { stop(); workers.shutdownNow(); }
    private final class Peer {
        private final String id;
        private final Socket socket;
        private final int run;
        private final ExecutorService writer = Executors.newSingleThreadExecutor();
        private final AtomicInteger pending = new AtomicInteger();
        private volatile boolean closed;
        Peer(String id, Socket socket, int run) { this.id = id; this.socket = socket; this.run = run; }
        void send(String data) {
            if (closed) return;
            // 不积压陈旧世界快照；慢连接断开后走重连同步。
            // Do not accumulate stale snapshots; slow peers reconnect to a fresh state.
            if (pending.incrementAndGet() > 6) { close(); return; }
            try { writer.execute(() -> { try { socket.getOutputStream().write((data + "\n").getBytes(StandardCharsets.UTF_8)); socket.getOutputStream().flush(); } catch (Exception error) { close(); } finally { pending.decrementAndGet(); } }); }
            catch (Exception error) { close(); }
        }
        void read() {
            try {
                InputStream input = socket.getInputStream(); byte[] buffer = new byte[16384]; ByteArrayOutputStream line = new ByteArrayOutputStream(); int length;
                while (!closed && run == generation && (length = input.read(buffer)) != -1) for (int i = 0; i < length; i++) {
                    if (buffer[i] == '\n') { String text = line.toString(StandardCharsets.UTF_8.name()); line.reset(); emit(object("type", "message", "peer", id, "data", text)); }
                    else { line.write(buffer[i]); if (line.size() > LIMIT) throw new IllegalArgumentException(); }
                }
            } catch (Exception ignored) { } finally { close(); }
        }
        synchronized void close() {
            if (closed) return; closed = true; peers.remove(id, this); try { socket.close(); } catch (Exception ignored) { } writer.shutdownNow();
            if (run == generation) emit(object("type", "disconnected", "peer", id));
        }
    }
}
