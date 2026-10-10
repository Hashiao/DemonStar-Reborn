# M2.10 多人操作与原作表现开发记录

基线为 M2.9 `7b9a543`，完整需求见 [定位报告](FEATURE_AUDIT_2026_10_10.md)。2026-10-10 用户授权分阶段开发、测试、提交 Git，最终仍覆盖全部需求。此文记录开发中的实际状态，不代表版本已发布。

Baseline: M2.9 `7b9a543`. The linked audit defines the full scope. On 2026-10-10 the user authorized staged development, testing and Git commits. Every requirement remains in scope; this development record is not a release announcement.

| 范围 / Scope | 验收要求 / Acceptance | 状态 / Status |
|---|---|---|
| 玩家内核 / Player model | 1–4 独立玩家；移动、武器、伤害、拾取、复活、奖励归属 / 1–4 independent players with combat and reward ownership | 开发中 / In progress |
| 操作与映射 / Input and bindings | 键盘、鼠标、手柄；三种触控；固定摇杆位置大小编辑；简单改键持久化 / Keyboard, mouse, controller, three touch modes, stick layout editing and saved bindings | 待实现 / Pending |
| 同机双人 / Local cooperative play | 至少两人同时触屏移动开火投弹；清晰玩家 HUD / At least two simultaneous touch players and distinct HUDs | 待实现 / Pending |
| 局域网 / LAN | Android–Android、Android–iOS、iOS–iOS；最多四人；热点、重连、同步 / All platform pairings, up to four players, hotspots, reconnection and synchronization | 待实现 / Pending |
| 触感 / Haptics | 原生调用、开关、能力检测 / Native feedback, preference and capability handling | 待实现 / Pending |
| Boss / Boss deaths | 按本地原作分支和录像核对，修复动画 / Branch-specific evidence and presentation | 待实现 / Pending |
| 结算 / Results | 原作战场叠层、玩家奖励框、三语 / Original battlefield overlay, player rewards, three locales | 待实现 / Pending |
| 选关 / Stage selection | 设置/暂停随时切关；联机房主同步决定 / Available from settings/pause, host coordinated online | 待实现 / Pending |
| 存档 / Saves | 关卡起点快照、版本校验、装备生命分数、多人 / Versioned stage-entry snapshots with equipment, lives, scores and players | 待实现 / Pending |
| 图标 / Icon | 原作参考重绘，统一两端像素构图 / Redrawn from original reference, shared pixel composition | 待实现 / Pending |
| 首屏音乐 / Startup BGM | 原生自动播放，尊重静音、音量和后台 / Native startup playback respecting mute, volume and lifecycle | 待实现 / Pending |
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
