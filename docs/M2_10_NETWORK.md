# M2.10 原生局域网与触感

Android 和 iOS 采用原生 TCP 字节流，端口 37654，每条 UTF-8 JSON 消息以换行结束。局域网消息由本地游戏页经受限桥接发送，WebView 仍只加载打包资源；没有远程网页、账户、服务器注册或互联网中转。加入目标限制为本地 IPv4 地址。热点由系统建立，游戏接入已有热点或 Wi-Fi。

Android and iOS use native TCP on port 37654 with newline-delimited UTF-8 JSON. The bundled game exchanges messages through a restricted bridge while WebViews continue loading packaged resources only. There are no remote pages, accounts, registrations or internet relays. Join targets are local IPv4 addresses. Users establish hotspots in system settings; the game connects over an existing hotspot or Wi-Fi.

桥接操作为 capabilities、host、join、send、drop、stop 和 haptic。网络 IO 不阻塞 UI；每条消息有 1 MiB 上限，待发送消息队列限长，按连接解析拆包/粘包并处理 UTF-8 字节分片。关闭/重开会递增会话代号，旧连接不能向新会话补发回调。原生最多容纳 8 个传输连接以处理未握手和重连；游戏层座位上限仍为四人，不能把传输连接数当作玩家数量。

Bridge operations are capabilities, host, join, send, drop, stop and haptic. Network IO runs off the UI thread. Messages are bounded to 1 MiB with bounded send queues; per-peer framing handles fragmented/coalesced UTF-8 data. A generation counter prevents stale connections from emitting into a replacement session. The transport allows eight connections to accommodate pending handshakes/reconnects; gameplay remains limited to four seats.

Android 使用 ServerSocket/Socket，保留 API 29 最低部署目标，增加 INTERNET、VIBRATE 和 ACCESS_LOCAL_NETWORK。当前 targetSdk 37 的本地网络操作会在需要时请求运行时授权；拒绝时返回可识别错误，不默认为已经授权。依据 [Android 本地网络权限](https://developer.android.com/privacy-and-security/local-network-permission)。

Android uses ServerSocket/Socket while retaining the API 29 deployment target, with INTERNET, VIBRATE and ACCESS_LOCAL_NETWORK declarations. With targetSdk 37, LAN operations request runtime permission when necessary and return an explicit denial error. See the linked Android documentation.

iOS 使用 iOS 12 已有的 Network 框架 NWListener/NWConnection；Info.plist 的本地网络用途说明具备简体中文、繁体中文、英文。直接地址连接不使用 Bonjour 或组播，不申请不需要的组播能力。依据 [Apple TN3179](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy)。

iOS uses Network framework's NWListener/NWConnection with the iOS 12 deployment target. The local-network purpose description is localized in Hans, Hant and English. Direct-address connections do not use Bonjour or multicast and do not request unnecessary multicast entitlements. See Apple TN3179.

触感跟随受伤、投弹、死亡与拾取事件，设置可以关闭并保存；连续事件有 70 ms 间隔限制。Android 使用 API 29 预定义反馈并检查设备振动能力；iOS 使用 UIImpactFeedbackGenerator，iOS 13+ 查询硬件能力，iOS 12 的能力标记为未知而非声称已支持。应用失去前台后不触发反馈。[Android 触感接口](https://developer.android.com/develop/ui/views/haptics/haptic-feedback)，[Apple UIImpactFeedbackGenerator](https://developer.apple.com/documentation/uikit/uiimpactfeedbackgenerator)。

Haptics follow hits, bombs, deaths and pickups, with a saved toggle and a 70 ms rate limit. Android uses API 29 predefined effects and checks vibration capability. iOS uses UIImpactFeedbackGenerator, queries hardware capability on iOS 13+, and reports unknown capability on iOS 12 rather than claiming support. Background events do not trigger feedback. The linked platform APIs describe these facilities.

## 当前证据

2026-10-10：Android Debug 编译和 Lint 通过。既有 API 37 模拟器中的打包 WebView 已通过原生能力查询、未点击菜单时 BGM 播放、三个同时 TCP 测试端、拆分 UTF-8 消息、广播和原生客户端回连。测试使用 adb 端口转发/反向转发与桌面 TCP 端，证明实际 Android 桥接与字节流收发，不证明手机热点或 Android–iOS 实际互通。仅为本次 debug 应用授予本地网络权限；授权弹窗拒绝/重试分支仍待 UI 验收。

2026-10-10: Android Debug build and Lint passed. The packaged WebView in the existing API 37 emulator passed capability queries, untouched-menu BGM playback, three simultaneous TCP test peers, fragmented UTF-8 framing, broadcasts and native-client return traffic. The probe uses adb forwarding/reverse forwarding and desktop TCP endpoints. It establishes actual Android bridge/stream operation, not physical hotspot or Android–iOS interoperability. Permission was granted to this debug application for the probe; denial/retry UI remains unverified.

证据：`tests/android-native-bridge.mjs`、`tests/native.test.mjs`，本地结果 `artifacts/m210-android-native.json`。模拟器接受触感调用不等于通过真实振动手感验收。iOS 编译/模拟器结果与四人房间、状态同步、断线恢复须分别补充；此阶段不能标记完整联机功能完成。

Evidence: the native Android probe and bridge unit tests, with local results in `artifacts/m210-android-native.json`. An accepted emulator haptic call does not certify physical feedback. iOS compilation/simulator evidence and four-player rooms, state synchronization and reconnection must be established separately; this phase is not completed multiplayer acceptance.
