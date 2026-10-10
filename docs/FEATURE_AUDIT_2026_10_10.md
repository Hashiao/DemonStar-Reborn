# DemonStar Reborn 操作与还原问题定位报告

核对日期：2026-10-10。基线：M2.9 / v0.2.9，提交 `7b9a543`。本次定位覆盖输入、双人、震动、Boss 死亡、结算、选关、关卡存档、图标和首屏音乐。现有键盘和单人多指控制可用；扩展输入、双人和关卡快照尚未实现，Boss 与结算仍有明确的表现差异，首屏 BGM 被应用自身的解锁条件挡住。

本报告没有修改游戏实现或发布安装包。当前浏览器探针使用独立 Chrome 会话；原作画面是已缓存录像的明确抽样，不是十八关死亡过程的逐帧验收。

## 逐项定位

| 项目 | 当前行为与原因 | 主要位置 |
|---|---|---|
| 键盘 | 已支持方向键/WASD 移动、Z/J 开火、空格/X/K 炸弹、Esc/P 暂停；键名直接写在事件和每帧输入中，没有可编辑映射。 | `web/js/app.js:113,144–152` |
| 鼠标 | 可以点击菜单、拖动虚拟摇杆、点击 A/B；未实现独立的鼠标移动控制方案、左右键动作映射或鼠标设置。单鼠标拖摇杆与单独点击 A 并不等价于完整的鼠标战斗方案。 | `web/js/app.js:136–142` |
| 手柄 | 没有 Gamepad 轮询、连接/断开处理、轴死区、玩家分配或原生控制器接入。个别设备可能把按键模拟为键盘，但这不构成已实现的手柄支持。 | `web/js/app.js`；两端宿主 |
| 三种触控模式 | 固定摇杆中心每次都取元素几何中心，只接受一个移动 pointer；没有位置/大小编辑、按下处重设中心的浮动摇杆或八方向虚拟按键。 | `web/js/app.js:24–25,136–142`；`web/index.html:36–38` |
| 自定义按键 | 保存结构没有 bindings、设备或玩家配置；所有输入直接进入同一组 x/y/fire 与 useBomb。需要统一动作层和冲突检测、恢复默认、持久化。 | `web/js/app.js:10–26,113,132–152` |
| 同机双人同时触屏 | 已有的是一个玩家同时移动和开火。第二个移动触点被忽略；引擎只有 `game.player`，HUD、碰撞、拾取、发射、瞄准和渲染均引用它，没有第二玩家状态。 | `web/js/original-rules.js:60–64`；`web/js/app.js:138`；`web/js/render-hd.js:165` |
| Android 与 iOS 热点局域网双人 | 没有房间、发现/直连、传输、输入同步、世界状态同步或断线恢复。Android 清单没有网络权限，宿主拦截非本地资源；iOS 没有网络服务或消息桥接。当前静态开发服务器也不是联机服务。 | `android/app/src/main/AndroidManifest.xml`；`MainActivity.java:19,43–50`；`ios/DemonStar/AppDelegate.swift:29–52` |
| 震动 | 没有硬件触感调用、原生触感桥接或设置。已有 `game.shake` 是画面震动，不会驱动设备马达。 | `web/js/app.js:117–126`；两端宿主；Android 清单 |
| Boss 坠毁 | 所有 Boss 归零后都走同一套 fall 累加；渲染统一下移、向右偏移和旋转（地面标记取消侧移/旋转，但仍下移），再附加重复火焰及通用爆炸。原程序死亡分支没有完整移植。 | `web/js/original-rules.js:227–250`；`web/js/render-hd.js:107–111` |
| 每关结算 UI | 奖励公式已是炸弹×1000、勋章×2000；界面却复用了设置/帮助的全屏遮罩弹窗，加入击杀、命中率、时间等统计。缺少原作战场上的完成标题、玩家奖励框、图标和构图。 | `web/js/app.js:76–86`；`web/style.css`；`web/classic-menu.css`；`web/combat.css:72` |
| 随时选关 | `showMissions()` 仅由主菜单按钮打开，并限制到当前难度已解锁关卡；选择只改 selectedStage。暂停设置只有继续/返回主菜单，没有切关入口。直接复用 `start()` 还会重置分数、生命和装备。 | `web/js/app.js:40,65,71–74,133`；`web/js/original-rules.js:54–62` |
| 按关存读档 | localStorage 只保存设置、分难度最高分和解锁数，没有关卡快照、档位、保存/读取入口。关间运行内存中的装备保留，不代表关闭应用后可以读取。 | `web/js/app.js:10–27`；`web/js/original-rules.js:64–65` |
| APP 图标 | Android 仍是几条 path 组成的矢量飞机；iOS 从现有高清机体 atlas 裁切放大到 1024。两端来源不同，都没有专门按原版像素构图设计的统一图标。iOS 现图偏金属高光和连续明暗。 | `android/app/src/main/res/drawable/ic_launcher.xml`；`tools/make-icons.mjs:5–8`；`ios/DemonStar/Assets.xcassets/AppIcon.appiconset/` |
| 冷启动主菜单 BGM | 曲目 MDS_INTRO 已加载且设置为开启，但构造时 `unlocked=false`，play 要求 unlocked。音乐只在开始/按钮点击时解锁。两端 WebView 已允许无需手势播放，JavaScript 没有利用这项配置。 | `web/js/music.js:5–8`；`web/js/app.js:40,158–159`；`MainActivity.java:39–40`；`AppDelegate.swift:31–32` |

## Boss 和结算的原作依据

本轮明确审看用户指定录像 P1 的 **222、224、226、228、232 秒**缓存帧。222 秒可见机体与局部爆点；224 秒为较大范围爆炸和碎片；226 秒已经出现战场上方的 MISSION COMPLETE 与左侧 Player 1 奖励框；228/232 秒可见炸弹、勋章和 TOTAL 三行。相邻抽样足以确认构图差异，不能据此计算精确坠落速度或认定完整死亡动画。

本地原程序 `0x40fdb0` 先检查对象标志和状态，符合条件时才进入死亡状态 3/4；`0x41015c` 与 `0x4101a2` 是不同更新分支，`0x410c8c` 与 `0x410cce` 是不同绘制分支。现版把其中一组 .25 初值、.25 增量、4 上限、120 阈值泛化到所有 Boss，没有保留完整的分支选择。当前渲染中的 `fall*.12`、`fall*.55`、`fall*.004` 是近似系数，不是已确认的原作显示变换。

直接调用当前十八关 Boss 死亡更新的探针结果完全一致：**38 次更新、fall=122、dead=true**。这是现版逻辑证据，不是原作时长测量。应按 Boss/原作分支核对机体变化、火焰锚点、爆炸与碎片、最终销毁和结算衔接，保留已核实的 HP、伤害、炮位与显式素材映射。

结算奖励数值无需推翻：当前 3 枚炸弹与 10 枚勋章得到 23000，和原作抽样一致。需要修正的是布局、图标、玩家栏和演出节奏。现版虽有三行 CSS 延时显现，但没有还原原作整体构图；奖励在进入结算时一次入账，原程序在离开结算时入账，见 [M2.5 研究](M2_5_RESEARCH.md)。

## 本轮复核结果

- 4173 端口提供的 app.js 与当前工作区内容一致；开始审计时 Git 工作区干净。
- Chrome 冷主菜单：曲目 MDS_INTRO，enabled=true、readyState=4、unlocked=false、媒体 paused=true、currentTime=0。点击设置后 unlocked=true、paused=false、播放时间开始前进。曲目缺失不是本次静音的原因。
- 按住 D+Z 的五次逻辑更新：x 从 200 到 225.5556，发射计数从 0 到 4，确认现有键盘移动与开火能同时工作。
- 合成两个摇杆触点及一个开火触点：第二个移动触点不接管方向；释放第一个后移动停止，仍按住的第二触点不恢复移动，开火继续。该探针验证代码路由，不能替代两个人在真屏上的多指测试。
- 暂停弹窗没有关卡控件。结果弹窗可重现 23000 奖励与通用统计布局。
- 刷新后回到 menu，没有运行中的 player；存储字段仍只有设置、最高分与解锁进度。
- 最终本地诊断脚本退出码 0，页面脚本错误为空。审计脚本首次运行曾误用 spawn 方法名，改为现有 spawnRecord 后通过；这不是游戏源码修复。

探针及 JSON 位于忽略目录 `.local/audit-request-20261010.cjs`、`.local/audit-request-20261010.json`；本轮结果截图为 `.local/audit-pause-20261010.png`、`.local/audit-result-20261010.png`。参考原图仍留在 `.local/reference/`，不进入发布资产。

## 实施规模和依赖

| 工作组 | 规模判断 | 完成条件 |
|---|---|---|
| 首屏 BGM | 小 | 原生冷启动自动尝试播放，尊重保存的静音/零音量；浏览器保留播放失败后的交互恢复；后台与恢复正常。 |
| 输入模式、映射、震动 | 中 | 输入先归一为玩家动作；固定摇杆可编辑，浮动中心按触点建立，八方向斜向限速；支持键鼠/手柄分配、映射持久化和失焦释放；两端原生触感检测与开关。 |
| 选关和关卡存档 | 中 | 明确按“关卡起点”恢复；快照包含关卡、难度、模式、玩家生命/能量/装备/炸弹、得分及必要的补给序列和随机状态，版本化校验；暂停切关清理旧输入/弹幕/音频，奖励不可重复领取。任意战斗中逐帧续传不在“按关存档”的默认定义内。 |
| Boss、结算和图标 | 中至大 | 补看各死亡分支；独立结算渲染；统一复古像素构图的重绘图标并打包两端尺寸。仅换纹理不能解决死亡状态分支。 |
| 同机双人 | 大 | 引擎、攻击归属、敌人目标选择、拾取、生命、复活、超级武器、计分、HUD 与输入都支持两个玩家；触点按玩家占用和释放，双人可同时移动、开火与投弹。 |
| 跨平台局域网双人 | 最大 | 在双人内核上增加主机权威模拟、客户端输入与状态同步、加入/重连/退出、暂停/换关一致性；真机覆盖 Android↔Android、iOS↔iOS、Android↔iOS，以及不同热点主机方向。 |

实施建议是先完成玩家动作层，再做同机双人，以相同内核接入局域网。网络初版可采用明确的主机/加入与局域网地址直连，后加服务发现；热点由系统建立，游戏连接已有网络。该方案是设计建议，尚未实现或验证热点连通性。

两端原生网络服务必须补充平台配置。例如 iOS 原生局域网操作从 iOS 14 起涉及本地网络授权，Bonjour 浏览/注册还需声明服务类型，见 [Apple TN3179](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy)。这不表示现有 WKWebView 的所有流量都受同样授权要求；网络架构确定后应按实际 API 核对。

手柄和触感需要按系统版本及硬件能力分支。Android 控制器事件见 [Android 官方输入文档](https://developer.android.com/games/sdk/game-controller/controller-input)；Apple 对键鼠的游戏接口与 UIKit 接入方式见 [WWDC20](https://developer.apple.com/videos/play/wwdc2020/10617/)，触感能力检查见 [supportsHaptics](https://developer.apple.com/documentation/corehaptics/chhapticdevicecapability/supportshaptics)。继续保留 Android 10 / iOS 12 部署目标，不能把新系统接口当作所有旧设备都有的能力。

这些需求具备可实施路径，但不能把代码完成等同于全部验收完成。同机双人是必要的内核改造，跨平台热点、真实外设与震动必须在对应设备上确认。本轮没有重新构建 APK/IPA，没有进行真机、手柄或双设备网络实测。

## English counterpart

Audit date: 2026-10-10. Baseline: M2.9 / v0.2.9, commit `7b9a543`. Existing fixed keyboard controls and simultaneous movement/fire for one touch player work. Expanded controls, multiplayer, haptics and stage snapshots remain unimplemented. Boss deaths and results retain substantial presentation differences, and the application's own unlock condition suppresses cold-start menu music. This audit changes documentation only, without shipping a build.

| Request | Finding and location |
|---|---|
| Keyboard and remapping | Arrow/WASD movement, Z/J fire, Space/X/K bomb and Esc/P pause are hardcoded in `web/js/app.js:113,144–152`. There is no editable or persisted mapping. |
| Mouse | Pointer handlers let a mouse operate menus and the existing stick/A/B controls. There is no dedicated mouse movement scheme or configurable mouse-button actions (`app.js:136–142`). |
| Controller | There is no Gamepad polling, device assignment, axis dead-zone handling, disconnect cleanup or native controller integration. Incidental keyboard emulation is not implemented controller support. |
| Touch modes | The existing stick uses its element's fixed center and a single movement pointer. Position/size editing, a center established at touch-down, and an eight-direction pad are absent (`app.js:136–142`). |
| Same-device two-player touch | Multiple fingers currently control one player. A second movement pointer is ignored. Simulation, aiming, collision, pickups, weapons, HUD and rendering reference one `game.player` (`original-rules.js:60–64`, `render-hd.js:165`). |
| Android/iOS hotspot LAN | No rooms, connection transport, synchronized inputs/world, discovery or reconnection exist. Android has no network permission and blocks non-asset resource requests; iOS has no native network service or message bridge. The development HTTP server is not a multiplayer service. |
| Haptics | No vibration/haptic API, native bridge or preference is present. The existing camera shake only moves the picture. |
| Boss death | Every Boss enters one fall accumulator, with generic translation/rotation, flames and a final explosion. Ground flags suppress side motion/rotation, but not downward translation. Original branch selection remains incomplete (`original-rules.js:227–250`, `render-hd.js:107–111`). |
| Results UI | Bombs×1000 and medals×2000 are already correct. The full-screen statistics dialog differs from the original battlefield overlay, completion heading, player reward panel and icons (`app.js:76–86`). |
| Stage switching | Stage selection is only on the main menu and limited by difficulty-specific unlocks. Pause/settings has no stage entry. Reusing start also resets score and equipment (`app.js:40,65,71–74`; `original-rules.js:54–62`). |
| Stage saves | Storage retains preferences, high scores and unlock counts, without run snapshots or save/load UI. In-memory equipment carried to the next stage is not a persistent save (`app.js:10–27`). |
| App icon | Android uses a simple vector; iOS crops and enlarges an existing HD ship atlas cell (`tools/make-icons.mjs:5–8`). They lack a shared icon deliberately redrawn around the original pixel composition. |
| Cold-start menu BGM | MDS_INTRO is loaded and enabled, but `unlocked=false` blocks play until an interaction. Both native WebViews already permit playback without a gesture (`music.js:5–8`, `app.js:158–159`, Android `MainActivity.java:39–40`, iOS `AppDelegate.swift:31–32`). |

The explicitly reviewed cached reference frames are P1 at 222, 224, 226, 228 and 232 seconds. They show local hits/flames, an extensive explosion with debris, then MISSION COMPLETE and a Player 1 panel over the battlefield. This sampling establishes composition differences, not exact crash speed or full eighteen-stage animation fidelity. The original executable gates death states 3/4 at `0x40fdb0`, updates them separately at `0x41015c`/`0x4101a2`, and draws them through different branches at `0x410c8c`/`0x410cce`. The remake generalizes one accumulator across all Bosses and adds approximate rendering coefficients.

The final isolated Chrome probe passed with no page script errors. Served app.js matched the workspace. Cold menu media was readyState=4, enabled but locked and paused at time zero; clicking settings unlocked playback. Holding D+Z for five logic updates moved x from 200 to 225.5556 and emitted four shots. Synthetic touch confirmed simultaneous movement/fire and rejection of a second movement pointer. Pause had no stage controls. A three-bomb/ten-medal result awarded 23000. Reload returned to the menu without a live player or saved equipment snapshot. Every stage's Boss reached fall=122 and death after 38 direct state updates; this measures the remake, not original wall-clock timing. The initial probe used an incorrect method name, corrected to spawnRecord before the passing run; application code was unchanged.

Implementation should first normalize device inputs into per-player actions, then establish two-player simulation, then add LAN synchronization to that same core. Input configuration, native haptics, stage selection and versioned stage-entry snapshots are medium-sized tasks; same-device multiplayer is a substantial engine change, and cross-platform LAN is the largest addition. Stage snapshots need difficulty, mode, player lives/energy/equipment/bomb inventories, scores, and relevant supply/random state. They must avoid duplicate bonus awards; arbitrary mid-stage frame-perfect continuation is a separate scope. Boss presentation needs branch-specific research, results need a dedicated overlay, and both platforms need one pixel-oriented redrawn icon source.

A possible initial network design uses a host-authoritative simulation with explicit host/join and local-address entry, adding discovery later. Users establish the hotspot in system settings. This is a proposed design, not verified connectivity. Native iOS LAN operations and Bonjour configuration must follow the linked Apple TN3179; its requirements should not be indiscriminately attributed to every WKWebView request. Controller and haptic features need OS/hardware capability handling while preserving Android 10 and iOS 12 deployment targets. The official platform references above describe those integration constraints.

All requests have plausible implementation paths. Code completion alone cannot establish real hardware vibration, external-device compatibility, simultaneous physical touch, or Android↔iOS hotspot interoperability. Acceptance needs same-platform and mixed-platform device pairs, both hotspot host directions, disconnect/rejoin and synchronized pause/stage changes. This audit did not rebuild APK/IPA or repeat native/mobile hardware tests. Existing HP, damage, original campaign data, explicit art mappings and trilingual behavior must remain protected during subsequent implementation.
