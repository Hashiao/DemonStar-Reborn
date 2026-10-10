# M2.10 多人操作与原作表现开发记录

基线为 M2.9 `7b9a543`，完整需求见 [定位报告](FEATURE_AUDIT_2026_10_10.md)。2026-10-10 用户授权分阶段开发、测试、提交 Git，最终仍覆盖全部需求。此文记录开发中的实际状态，不代表版本已发布。

Baseline: M2.9 `7b9a543`. The linked audit defines the full scope. On 2026-10-10 the user authorized staged development, testing and Git commits. Every requirement remains in scope; this development record is not a release announcement.

| 范围 / Scope | 验收要求 / Acceptance | 状态 / Status |
|---|---|---|
| 玩家内核 / Player model | 1–4 独立玩家；移动、武器、伤害、拾取、复活、奖励归属 / 1–4 independent players with combat and reward ownership | 开发中 / In progress |
| 操作与映射 / Input and bindings | 键盘、鼠标、手柄；三种触控；固定摇杆位置大小编辑；简单改键持久化 / Keyboard, mouse, controller, three touch modes, stick layout editing and saved bindings | 已接入网页和兼容包；外设真机待验收 / Integrated; physical peripherals pending |
| 同机双人 / Local cooperative play | 至少两人同时触屏移动开火投弹；沿用 1P 原作 HUD / Simultaneous touch players using the original 1P HUD style | 六触点浏览器检查通过；真屏待验收 / Six browser contacts passed; physical touch pending |
| 局域网 / LAN | Android–Android、Android–iOS、iOS–iOS；最多四人；热点、重连、同步 / All platform pairings, up to four players, hotspots, reconnection and synchronization | 待实现 / Pending |
| 触感 / Haptics | 原生调用、开关、能力检测 / Native feedback, preference and capability handling | 两端代码已接入；Android 模拟器调用通过，真实手感待验收 / Both implementations added; Android emulator call passed, physical feel pending |
| Boss / Boss deaths | 按本地原作分支和录像核对，修复动画 / Branch-specific evidence and presentation | 待实现 / Pending |
| 结算 / Results | 原作战场叠层、玩家奖励框、三语 / Original battlefield overlay, player rewards, three locales | 待实现 / Pending |
| 选关 / Stage selection | 设置/暂停随时切关；联机房主同步决定 / Available from settings/pause, host coordinated online | 本地入口已实现；联机同步待实现 / Local UI implemented; LAN pending |
| 存档 / Saves | 关卡起点快照、版本校验、装备生命分数、多人 / Versioned stage-entry snapshots with equipment, lives, scores and players | 自动档与三个槽位已实现；联机同步待实现 / Automatic/three manual slots implemented; LAN pending |
| 图标 / Icon | 原作参考重绘，统一两端像素构图 / Redrawn from original reference, shared pixel composition | 待实现 / Pending |
| 首屏音乐 / Startup BGM | 原生自动播放，尊重静音、音量和后台 / Native startup playback respecting mute, volume and lifecycle | JS 首屏播放已修复；原生冷启动待验收 / Startup play fixed; native verification pending |
| 发布 / Release | 引擎/浏览器/Android构建Lint模拟器/iOS构建模拟器；独立签名APK、unsigned IPA、哈希、中英说明 / Applicable checks, independently signed APK, unsigned IPA, hashes and bilingual notes | 待验收 / Pending |

开发顺序为玩家与输入基础、同机双人和关卡快照、原生接口与局域网、原作表现及最终双端验收。代码测试不替代真屏多指、真实手柄/震动或跨平台热点测试。四人模拟和四台真机分别报告。保留显式原型/敌弹映射、固定炮台图层、按关资源解码、三语和已核实战斗规则。

Development proceeds through player/input foundations, local cooperative play and checkpoints, native/LAN integration, then presentation and final platform verification. Automated checks do not replace physical touch, controllers/haptics or mixed-platform hotspot tests. Four simulated peers and four physical devices are reported separately. Preserve explicit art/projectile routes, turret layers, per-stage decoded assets, localization and verified combat rules.

2026-10-10 基线引擎测试：109/109 通过。日志保存在忽略的 `.local/m210-baseline-tests.log`。

2026-10-10 baseline engine checks: 109/109 passed. The log is retained in the ignored local directory.

## 玩家内核阶段

2026-10-10：实现 1–4 玩家独立状态、弹丸/炸弹/激光归属、独立生命与复活、共享战场单次推进、单独奖励与团队总分。淘汰一人不会中断仍存活队友；敌弹一次只由首个有效碰撞消耗，原作持续激光可命中多位玩家。各机使用编号与颜色区分，未更改原作机体图或伤害预算。

2026-10-10: implemented 1–4 independent players, projectile/bomb/laser ownership, individual lives and respawns, one shared world update, per-player rewards and a team total. Eliminating one player does not end surviving teammates' run. Ordinary hostile projectiles are consumed once; sustained original beams may hit several players. Number/color markers distinguish ships without replacing original artwork or changing damage budgets.

多人新增规则：瞄准最近的活动玩家，重生等待时优先其他活动玩家；拾取由接触范围内最近玩家取得，等距按稳定 ID；自动补给检查最近玩家的库存。以上是本版多人设计，尚未完成原作双人算法取证，不能宣称原版多人 1:1。

New cooperative rules target the nearest active player, prefer active teammates during respawn, and assign pickups to the closest eligible player with stable ID tie-breaking. Automatic supply checks the nearest player's inventory. These are explicit remake design choices, not a claim that the original multiplayer algorithms have been verified.

关卡快照 API 保存入关时的生命、能量、装备、分数、补给序列和随机状态；读取重新开始该关。版本或字段无效时不改变当前游戏。尚未接入存档菜单和持久化槽位，也没有把四人内核测试当作同屏触控或联网已完成。

The checkpoint API captures stage-entry lives, energy, equipment, scores, supply sequence and random state. Loading restarts that stage, and invalid versions/fields leave the current game intact. Save menus and persistent slots are still pending; four-player engine tests do not establish completed touch UI or networking.

验收：121 项引擎测试通过，包括四人推进十八关至 Boss、奖励只发一次、多人激光/炸弹和档案恢复；浏览器已核对四架机体及对应激光渲染、恢复关卡、返回单人。既有单人浏览器回归覆盖键盘、模拟多指、尺寸变化、暂停和旧 PointerEvent 回退。无真实外设/双设备联机验收。

Verification: 121 engine checks passed, including four players reaching all eighteen Bosses, one-time reward payment, independent beams/bombs and checkpoint restoration. Browser checks cover four ships and owner-linked beams, checkpoint load and return to solo. Existing solo browser checks cover keyboard, emulated multitouch, resizing, pause and legacy PointerEvent fallback. Physical peripherals and two-device networking remain unverified.

## 操作界面与存档阶段

2026-10-10：菜单可设置 1–4 位本机玩家；前两位有独立触屏移动/A/B，第三、四位使用键盘或手柄。固定摇杆可调位置与大小，浮动摇杆以触点建立中心，八方向按键的斜向输入归一限速。动作映射按玩家保存，键盘、鼠标和手柄各自保留映射；拒绝动作冲突和重复手柄分配，失焦、取消、断开会释放输入。

2026-10-10: the menu now selects 1–4 local players. The first two have separate movement/A/B touch controls; players three/four use keyboards or controllers. Fixed sticks support layout/size edits, floating sticks establish their center at touch-down, and diagonal pad input is normalized. Player mappings persist separately for keyboard, mouse and controller categories. Conflicting bindings/device assignments are rejected; focus loss, cancellation and disconnection release input.

设置与暂停都有原版 1–18 关入口，切关明确以初始装备重新出击；未继续用解锁条件禁止自由选关。入关自动保存，暂停可保存到三个手动槽位。存储失败不覆盖旧槽位。读档恢复该关开始时的多人生命/装备/得分，不把战斗中途状态误称为关卡起点。冷主菜单在设置音量与静音之后主动尝试播放 BGM；浏览器策略拒绝时保留交互重试。

Settings and pause expose all eighteen stages, explicitly starting a fresh run with initial equipment when switching. Stage entry autosaves; pause can save three manual slots. Failed writes preserve prior slots. Loading restores the multiplayer stage-entry lives/equipment/scores. Cold menus attempt BGM after applying mute and volume, retaining gesture retries where browser autoplay policy rejects playback.

用户复核纠正：不得把多人 HUD 改成文字状态卡。初期文字栏已移除，玩家上方沿用 1P 得分和飞机余命图标，下方沿用逐枚、分类型炸弹以及 16 格能量条。双人左右分区，四人扩展两组；颜色和编号只用于玩家标识。单人保持原布局，全部使用既有重绘素材与共用样式。

User review correction: multiplayer must not replace the original HUD with text cards. The temporary summary rows were removed. Each player retains the 1P score/spare-ship icons above and individual typed bombs/sixteen energy segments below. Two players occupy left/right positions; four extend to two sets. Color/numbers identify players only. Solo layout is preserved, using the existing redrawn assets and shared styling.

本阶段检查：130 项单元/引擎测试通过；原有单人浏览器与三语检查通过；六个同时触点覆盖双人移动/开火/投弹和独立释放；四人键盘、四个注入的 Gamepad API 设备、鼠标限速移动及左右键操作通过；关卡档与映射可跨刷新恢复。兼容构建成功，并在兼容包上复核触控/存档流程。额外 HUD 检查比较多人和 1P 的图标、尺寸、颜色、16 格填充，覆盖 2P/4P、四种尺寸及返回单人。

Phase checks: 130 unit/engine checks passed, plus existing solo browser/localization checks. Six simultaneous contacts cover two-player movement/fire/bombs and independent release. Four keyboard players, four injected Gamepad API fixtures, bounded mouse movement and mouse-button actions passed. Saves and mappings survive reload. The compatibility build succeeds and its touch/save flow passes. Additional HUD checks compare multiplayer with 1P assets, dimensions, colors and sixteen-segment fill across 2P/4P, four viewport sizes and return to solo.

上述是桌面浏览器输入/设备注入与兼容构建检查，不代表实际手柄、手机震动、真屏六指或原生冷启动已验收。局域网、原生触感、Boss 死亡分支、原作结算和统一重绘图标仍在完整目标内。

These are desktop-browser input/device fixtures and compatibility-build checks, not physical controller, haptic, six-finger touchscreen or native cold-start certification. LAN, native haptics, Boss death branches, original results presentation and the unified redrawn icon remain in the full objective.

P2 后续纠正：以用户最新确认的双人截图为准，右下角组不镜像，小蓝机在能量条左端、炸弹在上方。P2 机体/余命/状态图标已接入本地原作参考的蓝色重绘，原暖色尾焰保留；P3/P4 扩展复用红/蓝并带编号。详见 [P2 素材与验证](ART_M2_10_P2.md)，包含 17 姿态蓝色路由和 HUD 顺序检查。

P2 follow-up correction follows the user's final screenshot choice: the bottom-right group is not mirrored; its blue ship is left of the energy bar and bombs are above. Blue P2 body/life/status redraws now reference the local original, retaining warm exhaust. Extended P3/P4 reuse red/blue with numbers. The linked record covers all seventeen blue pose routes and HUD ordering.

用户随后确认当前多人战机与 HUD 的风格思路正确，后续以此为基线。原生局域网/触感实现和 Android 实际收发证据见 [网络记录](M2_10_NETWORK.md)；房间和游戏同步仍需接入，完整目标保持进行中。

The user subsequently confirmed the current multiplayer fighter/HUD style direction as the continuing baseline. Native LAN/haptic implementation and actual Android transport evidence are recorded in the linked network document. Rooms/game synchronization remain to be integrated; the full goal stays active.
