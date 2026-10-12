# M2.24 三色溢出弹与地面炮门 / Color overflow and ground shutters

## 范围与证据 / Scope and evidence

用户于 2026-10-13 要求核对满级同色球/S 的消弹，以及第 2、4 关固定炮台开合盖；原作证据明确即修复。依据本地 DemonStar 4.04，EXE SHA-256 为 `d3d9d0205b069e5d134fdedba7b9fbd74ebcafd9785b7c9ce3d2e5ed847691b2`。本轮实际查看本地原作的 32 帧炮门图；金标既有第 2/4 分集抽样只作对象定位，未新增视频观看或声称逐帧录像时长认证。

On October 13, 2026, the user authorized evidence-backed fixes for full-tier same-color/S overflow cancellation and stage-2/4 turret shutters. Evidence comes from the local DemonStar 4.04 binary with the SHA-256 above. All 32 local source shutter frames were inspected. Previously recorded video samples identify objects; this round adds no video-viewing claim or frame-exact video timing certification.

## 三色溢出弹 / Color-overflow volleys

- 原程序 `0x429980` 二级分派表将 45/46/47 分别送至 `0x42a0a0 / 0x42a151 / 0x42a231`，发出黄 16、蓝 32、红 64 发。模板更新模式均为 0；友方碰撞 `0x4286d4–0x42872f` 调用 `0x4114c0` 攻击敌机，模式 0 的移动/收尾没有敌弹碰撞删除。
- `0x428d42–0x428da0` 炸弹爆炸分支另设消弹标记，`0x428dd6–0x428de2` 据此调用 `0x4285d0`。不能把这个炸弹能力套给三色溢出弹。
- 旧重制版在每颗 `nova` 飞行时扫描敌弹并标为死亡；旧回归也误将此行为写成正确预期。本轮只移除三色 45/46/47 的相交消弹，并将该回归改为保留敌弹与后续玩家受伤验证。保留弹量、弹速、伤害、拾取规则、玩家归属、三色保留扩展和炸弹机制；磁力溢出旧行为未纳入本轮。

- The native constructor table routes types 45/46/47 to the addresses above and emits 16/32/64 projectiles. Their update mode is zero. Friendly collision calls the enemy-damage helper; their movement/cleanup path does not cancel hostile shots.
- Bomb explosion code separately sets a clearing flag and calls the global projectile-clear helper. That ability must not be assigned to color overflow.
- The remake explicitly killed hostile shots crossed by any nova, and an old regression encoded that assumption. This change removes crossing cancellation only for the three colors and corrects the regression to verify survival and subsequent player damage. Counts, speed, damage, pickup rules, ownership, retained-color extension and bombs remain unchanged; magnetic overflow remains outside scope.

## 原作炮门 / Native shutters

| 定义 / Definition | 本次反馈关卡 / Reported stages | 原作帧 / Source frames | 原作计时 / Source counters |
|---|---|---|---|
| 88 G_TNK2A | 2 / 4 | Game.glb 1225–1230，6 帧 / poses | interval 1, initial pause 200, end/start pause 30/30, ping-pong, cycles 999 |
| 89 G_TNK3A | 4 | Game.glb 1231–1236，6 帧 / poses | interval 1, initial pause 200, end/start pause 30/30, ping-pong, cycles 9 |
| 185 G_BTANK1A | 4 | Game.glb 1436–1455，20 帧 / poses | interval 1, initial pause 250, no endpoint pause, cyclic, cycles 999 |

`SHIPDEFS_DAT` 的 +64/+66/+68/+70/+72/+82/+84 分别为动画间隔、初始暂停、循环帧数、轮数、起始帧、尾/首暂停；0x10000 为往返标志。`0x4102bd–0x41038c` 的计数器与现有动画调度一致。短炮台在第 202 次更新开始开盖，第 210 次到完全开启，第 244 次开始合盖；这只是源逻辑步数，不是手机墙钟测量。

The source animation fields and ping-pong flag drive the existing state machine. Native counter handling matches its update order. Small shutters first advance on tick 202, reach fully open on tick 210 and start closing on tick 244. These are source logic ticks, not measured phone wall time.

原作炮门动画之后独立调用炮位更新 `0x4103b1 → 0x40f770`；没有添加“只有开到某帧才允许开火”的新门槛，也未调整任何炮位数、延迟、轮数、难度倍率或伤害。两种开合盖与三列轮换炮门均补齐显式帧映射，按每帧原始边界绘制、按关加载/释放。相同原型在其他关卡复用该修复。已有动画快照传输状态，房间规则提升为 10，双方须更新。

Native gun updates run independently after animation. No new frame-based firing gate is introduced, and gun counts, delays, cycles, difficulty multipliers and damage stay unchanged. All three families use explicit redraw frames at source bounds, loaded/released per stage. Other stages sharing the same prototypes receive the fix. Existing snapshots carry animation state; room revision 10 requires both peers to update.

素材与完整提示词见 [重绘记录 / Art provenance](ART_M2_24_SHUTTERS.md)。原图不发布，高清内纹与门板细节仍属重绘近似。

## 验收范围 / Verification scope

候选为 0.2.24 / build 26。正式发布状态须以最终报告为准，不能使用上一版报告顶替。 / Candidate: 0.2.24 / build 26. Final release status must come from its own report, never the previous version's evidence.

本轮按用户认可的影响范围选测：保留廉价全量引擎回归；浏览器覆盖通用启动、装备/武器、全战役美术、受伤美术、战斗表现、Boss 损毁、地物、斜弹、LAN、激光预警和新增炮门，共 12 组。Android 保留构建/Lint、安装启动、双 App LAN、操作及新增打包探针；独立设置与语言专项因实现未变本轮跳过，脚本保留。iOS 仍采用现有完整同轮构建/功能/触控/LAN workflow，附加相同新探针。跳过不计作本轮通过。

Impact-based selection retains the inexpensive full engine suite and twelve browser suites: startup, equipment/weapons, campaign art, damage art, presentation, boss death, structures, ground missiles, LAN, laser warnings and new shutters. Android retains builds/Lint, installation/startup, native paired LAN, controls and the new packaged probe. Dedicated settings/localization suites are skipped because those implementations are unchanged; their scripts remain. iOS retains the existing complete same-run build/functional/touch/LAN workflow with the new probe. Skipped checks are not counted as current passes.

新增定向检查包括 96 种四难度×规则×玩家×颜色×拾取组合；敌弹穿越后仍伤害玩家；32 帧实绘；18 关资源加载；炮门起停/轮数/暂停与 LAN 状态；四难度三原型各 1000 步炮火与不带动画的同炮位轨迹对照。原作定义与武器/弹体数值表保持字节不变。

Focused checks cover 96 difficulty/rule/player/color/pickup combinations, hostile damage after crossing overflow, all 32 rendered frames, stage-scoped resources across eighteen stages, shutter timing/cycles/pause/LAN, and 1000-tick gun traces for three prototypes across four difficulties against identical guns without animation. Original campaign and weapon/projectile numeric tables remain byte-identical.

首次新增浏览器检查在手动加载第 4 关图集时仍让 App 显示第 1 关，渲染循环正确地换回第 1 关，导致等待超时。已修正测试场景同步切关，保留失败日志与所有断言；没有放宽等待或改动产品加载规则。 / The first new browser check loaded stage-4 art while the app still displayed stage 1, whose render loop correctly restored its assets. The fixture now switches the game stage too. Failed logs and all assertions are preserved; product loading and timeout limits are unchanged.
