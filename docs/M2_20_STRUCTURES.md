# 第二、三关结构修复：已合并，发布待验收 / Stage 2–3 fixes: merged, release pending

PR #4 已于 2026-10-12 按用户授权合并 main，交付地物延迟连锁与蛇形部件损毁/坠毁源码。版本 0.2.20 / build 22 的 APK、未签名 IPA 已在本机准备，**完整 iOS 验收未通过，尚未创建正式 Release**。用户要求先发这版，再处理地面发射装置和补给箱后续反馈；不能将四项反馈都记为已修复。

PR #4 was merged into main on October 12 under explicit user authorization, delivering ground-chain and damaged/falling-segment source changes. Local 0.2.20 / build 22 APK and unsigned IPA candidates are ready. **Complete iOS verification has not passed and no official Release exists.** The user requested shipping these fixes before further launcher/supply work; do not claim all four reports resolved.

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

## 3. 已补充的对象说明 / Clarified follow-up objects

用户说明：黑色底座、棕色盖子、白色发射点的防空装置固定于地面并随地图向下；补给指未破坏的地面箱子，同样向下卷动，不是打爆后的漂浮物。

The user described a black-base/brown-cover launcher with white firing points, fixed to terrain and scrolling down. Supplies mean intact terrain-bound boxes, not floating drops.

当前 S_ENBON2/4 及 G_TNK2A 的卷动已通过受控核对，未复现固定在屏幕坐标。另确定 G_TNK2A 缺少原作六帧开盖/炮口动画，但尚未开发；这不等于已证明“斜向导弹”的具体根因。完整证据与边界见 [后续定位](STAGE2_GROUND_FOLLOWUP.md)。

Controlled checks confirm scrolling for S_ENBON2/4 and G_TNK2A; a fixed-screen defect was not reproduced. G_TNK2A is missing its native six-frame cover/port animation, which is not yet implemented. This does not establish the exact diagonal-projectile complaint's cause. See the linked follow-up record.

## iPad 验收中断记录 / iPad validation interruptions

2026-10-11/12 的 CI 并非一次全绿；以下失败保留，不能用后续结果覆盖历史。
The October 11/12 CI sequence did not pass on its first attempt. Preserve these failures even if a later run passes.

| 轮次 / Attempt | 已通过 / Passed | 未通过 / Not passed |
|---|---|---|
| [38149253384 / 1](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38149253384/attempts/1) | iPhoneOS 编译、三个 iPhone 语言功能用例 / Device build and three iPhone locale probes | iPad simctl launch 超时 600 秒 / iPad launch timed out after 600 s |
| [38149253384 / 2](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38149253384/attempts/2) | iPhoneOS、iPhone/iPad 功能、原生 LAN、iPhone 系统触控 / Device build, both functional probes, native LAN, iPhone system touch | iPad XCTest 在测试正文开始前超时 600 秒 / iPad XCTest timed out before its test body started |

第三轮只调整 `tools/test-ios-touch.py`：系统触控用例顺序冷启动一台已选中的模拟器，并关闭另一台本轮测试设备；不下载/新建模拟器，不重试或删除断言，仍保留每台 600 秒时限。用于验证启动状态隔离是否消除中断，不据此宣称已确定 CoreSimulator 的内部原因。游戏代码未再改变。

The third run changes only the UI-test harness: cold-boot one selected existing simulator at a time and shut down the other test device. No runtimes/devices are downloaded or created, no assertions are retried/removed, and the 600-second per-device limit remains. This tests startup isolation without claiming a proven internal CoreSimulator cause. Game code is unchanged.

## 当前验证与未通过项 / Current verification and failures

- 本地 387 项引擎/单元测试、28 组浏览器检查、16 组脚本交火、Android Release/Debug/Lint 和 API 37 模拟器五组检查通过。安装后回拉 APK 哈希、独立签名证书与包内版本已核验。 / Local validation passed: 387 engine tests, 28 browser suites, 16 scripted combat cases, Android Release/Debug/Lint and five API 37 emulator suites. Installed APK hash, project signing identity and internal version were checked.
- 38153590283 的功能和 LAN 断言全部通过，但关闭 iPhone 模拟器超时导致步骤失败；清理现单列记录，不遮盖功能断言。38156213011 再次在 iPad 安装/启动时超时。 / Run 38153590283 passed functional/LAN assertions but failed during iPhone cleanup; cleanup is now recorded separately. Run 38156213011 again timed out during iPad installation/launch.
- 38166279687 的功能与 iPhone/iPad 系统触控均通过，之后 LAN 房主启动超时。触控与 LAN 后来拆为同一提交下的独立 CI job。 / Run 38166279687 passed functional and both system-touch checks, then timed out launching the LAN host. Touch and LAN now use separate jobs at one commit.
- 38167837399 的触控 job 在音频时钟探针超时；LAN 客机完成全部动作，房主计时却消耗在等待客机冷启动。显式探针已增加音频就绪/有限时钟检查，并分开大厅与对局的有界计时。正常游戏与音频实现未改变。 / Run 38167837399 hit an audio-clock probe timeout; its LAN client completed all actions but host polling expired after waiting for peer startup. Explicit probes now wait for audio readiness, reject non-finite clocks and separate bounded lobby/gameplay budgets. Normal gameplay/audio is unchanged.
- 38169310314 的完整功能与 iPhone/iPad XCTest 均通过；LAN 客机 simctl launch 180 秒超时，没有生成探针，房主仍在大厅。本机候选 IPA 取自该轮通过的触控 job，不能把全轮标为通过。 / Run 38169310314 passed complete functional and iPhone/iPad XCTest checks. LAN guest launch timed out after 180 seconds without a probe; the host remained in its lobby. The local candidate IPA comes from the passing touch job, not a passing whole workflow.
- 最后 [38170762970](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38170762970) 使用标准 Intel 执行器：两组功能检查通过；LAN 的 iPad boot 180 秒超时，iPhone 清理也超时；iPhone XCTest 通过，iPad 在打开多人菜单后查询无障碍快照超时（退出 65）。增加内存未消除失败，不能声称已证明 OOM 或已解决环境问题。 / Final run 38170762970 used the standard Intel runner. Both functional probes passed, but LAN iPad boot timed out after 180 seconds and iPhone cleanup also timed out. iPhone XCTest passed; iPad failed querying an accessibility snapshot after opening Multiplayer (exit 65). More memory did not eliminate the failures; no proven OOM or resolved-environment claim is made.

首次超时和随后失败都保留，不拼接成一次完整通过。正式发布脚本要求 verification.status 为 passed；当前仍为 incomplete。已向用户提供“先上传预发布包 / 继续完整验收”的选择，尚未得到新答复，不擅自改写验收状态。

Initial timeouts and subsequent failures are retained, never combined into a clean passing run. The official publisher requires verification.status=passed; the current report remains incomplete. A prerelease-versus-complete-verification choice has been offered and has no response yet; verification status is not overridden.

## 本机候选包 / Local candidates

路径为 artifacts/v0.2.20-candidate/。两包内部均为 0.2.20 / build 22，完整网页资源逐文件一致。APK 来自 b1fff70485dc0d0059575e68c15d5ae282d89fd9；IPA 来自 6735579914f282fa505d8d6086c73a09e97c38fb，后续差异为验收脚本、显式探针及文档，常规玩法/音频未改。IPA 为 ARM64 iPhoneOS，部署目标 12.0，未签名，须自行签名。

Both local candidates identify as 0.2.20 / build 22 and contain matching web resources. The APK comes from b1fff70485dc0d0059575e68c15d5ae282d89fd9; the IPA comes from 6735579914f282fa505d8d6086c73a09e97c38fb. Later differences concern verification scripts, explicit probes and documentation, preserving normal gameplay/audio. The ARM64 iPhoneOS IPA targets iOS 12.0 and requires user signing.

| 文件 / File | SHA-256 |
|---|---|
| `DemonStar-Reborn-release.apk` | `cbe70fa346a000bda6405d552f9815634bcb24d5403d75c73e781e2ba45e98f7` |
| `DemonStar.ipa` | `990448ddaa34984225560259c4a2489a48c33fcfed938019f09ca5911f3baf10` |

房间规则版本 6，玩法仅单/双人；四席仅底层预留。原作录像为抽样，脚本交火不是四难度全关通关；未认证最低系统硬件、用户真机听感、真实热点或跨平台双真机。

Room revision 6 exposes solo/two-player play, with four core-only seats. Reference review is sampled; scripted combat is not full campaign-clear verification. Minimum-OS hardware, user-device audio, physical hotspots and cross-platform hardware pairs remain unverified.
