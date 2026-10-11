# 第二、三关结构与表现修复（开发中） / Stage 2–3 structures and presentation (in progress)

本轮以本地 DemonStar 4.04 程序及用户指定录像为依据。已实现地物延迟连锁、蛇形部件坠毁；斜向导弹与“补给固定”尚待用户补充具体对象，**不能将四项反馈都写成已修复**。候选版本 0.2.20 / build 22，尚未正式发布。

This work uses the local DemonStar 4.04 executable and the user's reference recording. Delayed ground chains and falling snake segments are implemented. The diagonal-missile and stationary-supply reports still need object identification; **do not describe all four reports as resolved**. Candidate version 0.2.20 / build 22 is not a published release.

## 1. 地面连锁 / Ground chains

原程序 `0x411280–0x4112a1` 在带 `0x20000` 标志对象死亡时调用 `0x4116a0`。不是根据编队组号，也不是清除全屏同类对象：

- 只命中同样带 `0x20000` 的邻近对象；目标下缘须已越过屏幕顶部。
- 距离取两轴绝对差的较大值，半径为死亡对象原始宽度 + 1。
- 伤害为死亡对象定义中的基础 HP，不按当前难度额外乘倍率。
- 传入延迟 8，目标计数设为 9；`0x4101cf–0x4101f0` 递减到 1 时扣血。后来的波及覆盖旧计数和伤害，不累计多个排队爆炸。
- 死亡执行保留入场状态门槛；不可直接射击的管道仍可受到连锁伤害。
- 例如中心 G_STAT2A 为 750 HP，普通 G_STAT1A 为 700 HP；普通节点的爆炸不保证单次摧毁满血中心。管道按自身 1 HP 传递，不能擅自升为统一高伤害。

Native death code invokes the flagged-neighbor helper. Eligibility is not map-group membership: both objects need flag 0x20000, the target's lower edge must be visible, and Chebyshev distance must be no greater than source width + 1. Damage is the source definition's base HP. A delay of 8 sets a counter of 9, applying damage when it decrements to 1; subsequent hits overwrite pending damage/timing. Destruction waits for the active-entry state. Unshootable pipes can participate. A 700-HP node cannot automatically destroy a full 750-HP center; pipes propagate their own 1-HP value.

原程序 `0x40f280–0x40f2ee` 还对已入场、低于基础 HP 四分之一的对象每十次更新扣 1 HP。本轮为带连锁标志的地物补齐这条燃烧路径：例如剩余 50 HP 的中心继续燃烧 500 步后死亡并传播，不能停在 50 HP 永久不爆。完整普通敌机低血量行为仍不扩展到本轮之外。

Native `0x40f280–0x40f2ee` also drains one HP every ten updates from active objects below one quarter of base HP. This is restored for chain-flagged structures: a center left at 50 HP burns for another 500 updates, then explodes and propagates. Other ordinary-enemy low-HP behavior remains outside this focused change.

当前实现补齐这条路径，保留原始 HP、分值、掉落和残骸规则。联机采用明确的适配：连锁击杀记到引爆玩家；原生延迟 helper 本身不写入击杀归属，此处不声称逐字段照搬。四档难度与暂停改难度均不重置已发生的引爆。

The implementation preserves definition HP, scores, drops and remnant rules. One explicit multiplayer adaptation carries the detonator's ownership through the chain; the native delay helper does not itself write killer ownership, so this is not claimed field-for-field fidelity. Changing difficulty while paused does not restart a pending detonation.

## 2. 蛇形编队 / Snake formations

第 3 关首组记录为 S03-R0079 至 R0083：S_ENEMY37A、三段 S_ENEMY36A、S_ENEMY35A。第 10 关也复用这些对象。现有相邻批次与出生偏移能生成全部中段，实际渲染已确认。不能把“缺中段”归结为素材或记录缺失。

The first stage-three formation contains a nose, three middle sections and a tail. Stage ten reuses the family. Existing adjacent batching and spawn offsets produce all body sections, and actual rendering confirms them; missing source records/artwork have not been reproduced.

本地程序核对结果与“打爆头后其余无条件全灭”的推测不同：六条对应定义只有 0x80 坠毁标志，没有 0x20000 连锁标志；编队组号在调度中使用，死亡路径不按组号杀死其他成员。录像连续射击中的相继爆炸，不能证明停止后续命中也会全灭。因此没有添加共享 HP、无敌中段或强制整组删除。

The six definitions have the 0x80 falling flag, not the 0x20000 chain flag. Formation IDs are used by dispatch; the native death path does not kill other members by group ID. Consecutive explosions under sustained fire do not establish unconditional head-to-tail destruction. No shared HP, invulnerable bodies or forced group deletion has been added.

已确认的遗漏是：`0x40fdb0` 对这类部件也保留损毁帧和坠毁状态，而重制版原先只给 Boss 走此路径，普通部件立即消失。现在按已核实原作条件为蛇形部件补齐初始爆炸、原尺寸损毁帧、侧上漂移、最终爆炸；状态 4 使用现有已验证的 0x5555 定点步进，50 次更新后结束。其他普通机型的完整死亡表现不随本轮扩张。三个损毁帧由内置 imagegen 重绘，原图不发布，见 [素材记录](ART_M2_20_SNAKE.md)。

The verified omission is ordinary segment death presentation: native 0x40fdb0 retains damaged artwork and a falling state, while the remake applied it only to Bosses. Snake parts now retain initial explosion, constant-size damaged hull, sideways/upward drift and final explosion. Reference state four uses the existing verified 0x5555 fixed-point increments and finishes on update 50. Other ordinary enemy families are outside this focused change. Three damaged frames are newly redrawn with built-in imagegen; original pixels are not published.

## 3. 仍待对应的两条反馈 / Two reports still being identified

- 地面补给：本地 S_ENBON2 / S_ENBON4 为 mode 8、speed 1；原程序 `0x4107cc` 每步下移 1。当前代码也随地面卷动，未保留 M2.17 前“停在顶部”的旧逻辑。打爆后拾取物则统一进入 `0x405d30` 的漂浮分支。已询问用户具体指补给箱向上飞、箱子停在屏幕坐标，还是掉落物不动；未据含糊描述改写运动。
- 斜向导弹：第 2 关放置的 G_TUR1A 发射类型 2，G_TNKSHT1A 发射类型 7；均为原作球形弹。S_ENEMY24/25 发射类型 8 竖直导弹。43/44 为独立左下/右下弹型，原程序构造器使用固定角度 0x4ea / 0x316，但当前第二关炮位没有这两种类型。已复核原始弹型表，未发现按角度把类型 8 转成 43/44 的规则。待用户给出时段或敌人外形后继续定位，不能凭“斜向”二字把球弹通用旋转。

Ground supply carriers S_ENBON2/4 use mode 8, speed 1, matching native downward map scroll and current code; the pre-M2.17 top-hold behavior is already gone. Dropped pickups use a separate floating branch. The user has been asked which object/motion is affected.

Stage-two ground turrets emit native spherical types 2/7; missile aircraft emit vertical type 8. Types 43/44 are separate fixed diagonal branches at 0x4ea/0x316 and do not occur in the stage-two gun placements. The native table has been rechecked; type 8 is not remapped by angle in its constructor. The reported emitter/time is still needed before changing artwork or trajectories.

## iPad 验收中断记录 / iPad validation interruptions

2026-10-11/12 的 CI 并非一次全绿；以下失败保留，不能用后续结果覆盖历史。
The October 11/12 CI sequence did not pass on its first attempt. Preserve these failures even if a later run passes.

| 轮次 / Attempt | 已通过 / Passed | 未通过 / Not passed |
|---|---|---|
| [38149253384 / 1](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38149253384/attempts/1) | iPhoneOS 编译、三个 iPhone 语言功能用例 / Device build and three iPhone locale probes | iPad simctl launch 超时 600 秒 / iPad launch timed out after 600 s |
| [38149253384 / 2](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38149253384/attempts/2) | iPhoneOS、iPhone/iPad 功能、原生 LAN、iPhone 系统触控 / Device build, both functional probes, native LAN, iPhone system touch | iPad XCTest 在测试正文开始前超时 600 秒 / iPad XCTest timed out before its test body started |

第三轮只调整 `tools/test-ios-touch.py`：系统触控用例顺序冷启动一台已选中的模拟器，并关闭另一台本轮测试设备；不下载/新建模拟器，不重试或删除断言，仍保留每台 600 秒时限。用于验证启动状态隔离是否消除中断，不据此宣称已确定 CoreSimulator 的内部原因。游戏代码未再改变。

The third run changes only the UI-test harness: cold-boot one selected existing simulator at a time and shut down the other test device. No runtimes/devices are downloaded or created, no assertions are retried/removed, and the 600-second per-device limit remains. This tests startup isolation without claiming a proven internal CoreSimulator cause. Game code is unchanged.

## 验证与边界 / Verification and limits

- 387 项引擎/单元测试通过；新增传播边界、延迟、基础伤害、管道参与、覆盖而非叠加、双人归属、暂停改难度、完整蛇身、坠毁生命周期与快照检查。
- 新增浏览器用原作地图的六节点结构验证渐次爆炸，核验第 3/10 关完好/受损部件实际像素与按关释放。截图为重制版受控场景，不冒充原作游玩录像。
- 完整浏览器回归与 Android/iOS 构建/模拟器验收尚在进行；未发布新 Release，未宣称真机通过。
- 房间规则版本 6，旧版缺少这次规则和受损图集，双方需更新。玩法仍只开放单人/双人。
- 原始定义、主机机动、世界时钟、弹速/射速/主武器伤害、音频、三语文案与存档格式未调整。原作录像只作下列记录的抽样审看，不是全程逐帧验收。

387 engine/unit tests passed, including new chain boundaries/timing/damage/pipes/overwrites/ownership/pause-difficulty cases and snake completeness/death/snapshot checks. A new browser suite verifies sequential destruction of a six-node source-map structure, visible intact/damaged parts in stages 3/10, and stage-scoped asset release. These are controlled remake scenes, not original playthroughs. Full browser/native checks are pending; no new Release or physical-device claim is made. Room revision 6 requires updated peers. Public play stays solo/two-player; source definitions, player mobility, world timing, projectile/firing/main-weapon damage, audio, localization and save format remain unchanged.
