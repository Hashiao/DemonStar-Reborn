# M2.10 原生局域网与触感

Android 和 iOS 采用原生 TCP 字节流，端口 37654，每条 UTF-8 JSON 消息以换行结束。局域网消息由本地游戏页经受限桥接发送，WebView 仍只加载打包资源；没有远程网页、账户、服务器注册或互联网中转。加入目标限制为本地 IPv4 地址。热点由系统建立，游戏接入已有热点或 Wi-Fi。

Android and iOS use native TCP on port 37654 with newline-delimited UTF-8 JSON. The bundled game exchanges messages through a restricted bridge while WebViews continue loading packaged resources only. There are no remote pages, accounts, registrations or internet relays. Join targets are local IPv4 addresses. Users establish hotspots in system settings; the game connects over an existing hotspot or Wi-Fi.

桥接操作为 capabilities、host、join、send、drop、stop 和 haptic。网络 IO 不阻塞 UI；每条消息有 1 MiB 上限，待发送消息队列限长，按连接解析拆包/粘包并处理 UTF-8 字节分片。关闭/重开会递增会话代号，旧连接不能向新会话补发回调。原生最多容纳 8 个传输连接以处理未握手和重连；协议层最多预留四座位，当前 App 房间上限为两人，不能把传输连接数当作玩家数量。

Bridge operations are capabilities, host, join, send, drop, stop and haptic. Network IO runs off the UI thread. Messages are bounded to 1 MiB with bounded send queues; per-peer framing handles fragmented/coalesced UTF-8 data. A generation counter prevents stale connections from emitting into a replacement session. The transport allows eight connections to accommodate pending handshakes/reconnects; the protocol reserves four seats, while current app rooms cap at two.

Android 使用 ServerSocket/Socket，保留 API 29 最低部署目标，增加 INTERNET、VIBRATE 和 ACCESS_LOCAL_NETWORK。当前 targetSdk 37 的本地网络操作会在需要时请求运行时授权；拒绝时返回可识别错误，不默认为已经授权。依据 [Android 本地网络权限](https://developer.android.com/privacy-and-security/local-network-permission)。

Android uses ServerSocket/Socket while retaining the API 29 deployment target, with INTERNET, VIBRATE and ACCESS_LOCAL_NETWORK declarations. With targetSdk 37, LAN operations request runtime permission when necessary and return an explicit denial error. See the linked Android documentation.

iOS 使用 iOS 12 已有的 Network 框架 NWListener/NWConnection；Info.plist 的本地网络用途说明具备简体中文、繁体中文、英文。直接地址连接不使用 Bonjour 或组播，不申请不需要的组播能力。依据 [Apple TN3179](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy)。

iOS uses Network framework's NWListener/NWConnection with the iOS 12 deployment target. The local-network purpose description is localized in Hans, Hant and English. Direct-address connections do not use Bonjour or multicast and do not request unnecessary multicast entitlements. See Apple TN3179.

触感跟随受伤、投弹、死亡与拾取事件，设置可以关闭并保存；连续事件有 70 ms 间隔限制。Android 使用 API 29 预定义反馈并检查设备振动能力；iOS 使用 UIImpactFeedbackGenerator，iOS 13+ 查询硬件能力，iOS 12 的能力标记为未知而非声称已支持。应用失去前台后不触发反馈。[Android 触感接口](https://developer.android.com/develop/ui/views/haptics/haptic-feedback)，[Apple UIImpactFeedbackGenerator](https://developer.apple.com/documentation/uikit/uiimpactfeedbackgenerator)。

Haptics follow hits, bombs, deaths and pickups, with a saved toggle and a 70 ms rate limit. Android uses API 29 predefined effects and checks vibration capability. iOS uses UIImpactFeedbackGenerator, queries hardware capability on iOS 13+, and reports unknown capability on iOS 12 rather than claiming support. Background events do not trigger feedback. The linked platform APIs describe these facilities.

## 当前证据

2026-10-10：Android Debug 编译和 Lint 通过。既有 API 37 模拟器中的打包 WebView 已通过原生能力查询、未点击菜单时 BGM 播放、三个同时 TCP 测试端、拆分 UTF-8 消息、广播和原生客户端回连。测试使用 adb 端口转发/反向转发与桌面 TCP 端，证明实际 Android 桥接与字节流收发，不证明手机热点或 Android–iOS 实际互通。仅为本次 debug 应用授予本地网络权限；授权弹窗拒绝/重试分支仍待 UI 验收。

2026-10-10: Android Debug build and Lint passed. The packaged WebView in the existing API 37 emulator passed capability queries, untouched-menu BGM playback, three simultaneous TCP test peers, fragmented UTF-8 framing, broadcasts and native-client return traffic. The probe uses adb forwarding/reverse forwarding and desktop TCP endpoints. It establishes actual Android bridge/stream operation, not physical hotspot or Android–iOS interoperability. Permission was granted to this debug application for the probe; denial/retry UI remains unverified.

证据：`tests/android-native-bridge.mjs`、`tests/native.test.mjs`，本地结果 `artifacts/m210-android-native.json`。模拟器接受触感调用不等于通过真实振动手感验收。iOS 编译/模拟器结果与双人房间、状态同步、断线恢复须分别补充；此阶段不能标记完整联机功能完成。

Evidence: the native Android probe and bridge unit tests, with local results in `artifacts/m210-android-native.json`. An accepted emulator haptic call does not certify physical feedback. iOS compilation/simulator evidence and two-player rooms, state synchronization and reconnection must be established separately; this phase is not completed multiplayer acceptance.

## 游戏协议与房间

`demonstar-lan-1` 在上述传输上实现房间握手、六位代码、最多四个协议座位和主机权威快照（当前 App 限两人）。所有设备使用同一协议和原型 ID 表。客户端约每 50 ms 发送本机动作，主机约每 50 ms 发布世界状态；暂停时降低快照频率。300 ms 没有新输入即释放移动/开火，6 秒无通信触发掉线处理。断线先统一暂停；存活队友可由房主继续，离线战机不参与碰撞/攻击/奖励，重连恢复原座位和装备。随机重连标识仅存在本地存储，不使用设备账号或广告标识。

`demonstar-lan-1` implements room handshakes, six-digit codes, up to four protocol seats and authoritative snapshots (the current app caps rooms at two) over this transport. Devices share the protocol and prototype-ID table. Clients send local actions approximately every 50 ms; the host publishes world state at the same interval, less frequently while paused. Inputs release after 300 ms without refresh and communication loss is handled after six seconds. Disconnect initially pauses the room. The host can continue surviving teammates; offline ships do not attack, collide or earn bonuses. Reconnection restores the seat/equipment. A random local reconnect token is stored without device accounts or advertising identifiers.

同步数据只包含已知世界字段、对象原型 ID 和受限事件，不传输可执行代码或整套原图。客户端校验协议、关卡、人数、原型、数值和消息容量；根据原型表恢复绘制引用。战斗只在房主推进，因此不同渲染帧率和设备浮点表现不会分别推进两套战斗。客户端对相邻位置做显示插值。每次重开/切关/读档递增关卡代号，拒绝旧代号动作；炸弹动作编号去重。

Synchronization includes known world fields, prototype IDs and bounded events, never executable code or original artwork. Clients validate protocol, stage, player count, prototypes, numbers and capacity, then recover render references from the shared table. Combat advances only on the host; render rates and engine differences do not independently simulate competing worlds. Clients interpolate adjacent displayed positions. Restart/stage/load operations change the stage epoch, rejecting old actions; bomb sequence numbers prevent duplicate consumption.

2026-10-10：单元测试保留四座位协议预留，并新增当前双人上限、第三人拒绝、未入房连接不接收世界状态及双人客户端拒绝四人房间。完整 App 浏览器测试已收紧到双人，覆盖建房、动作、同帧暂停、独立语言、切关、重连和读档，并确认被拒绝的第三端不能进入战斗。Android 完整游戏探针同样改为一台模拟器主机与一名桌面协议客户端；原生桥接的三 TCP 连接压力检查仅验证传输，不能当作三/四人玩法。

Unit tests retain the four-seat protocol reserve and add the current two-player cap, third-player rejection, no state broadcast to unadmitted peers and rejection of larger rooms by two-player clients. Full-app browser checks now cover two players through rooms, actions, shared pause, local language, stage changes, reconnect and load, while a rejected third device cannot enter combat. The Android game probe now uses one emulator host and one desktop protocol client; the native three-connection stress probe only tests transport, not a public three/four-player mode.

证据边界：浏览器端平台标签只是测试夹具，桌面 TCP 端不是 iOS 真机。adb 转发验证原生套接字与应用协议，不替代实际热点可达性、跨品牌安卓设备、Android–iOS 或 iOS–iOS 原生联局。早期原生桥接提交 `0764f6e` 的 [iOS 构建/常规模拟器运行](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38044298431) 已成功；新的房间代码仍需后续 iOS 和双设备验收。

Limits: browser platform labels are fixtures and desktop TCP peers are not iOS devices. adb forwarding verifies native sockets/application protocol, not hotspot reachability, different Android vendors, Android–iOS or iOS–iOS native sessions. The linked iOS build/standard simulator run succeeded for the earlier bridge commit `0764f6e`; newer room code still needs subsequent iOS and device-pair verification.
