# M2.22 简单难度激光预警 / Easy Boss laser warning

## 已确认规则 / Confirmed behavior

用户授权新增简单难度辅助：Boss 每轮激光开始前一秒，用同色原有激光美术预演闪烁脉冲；脉冲峰值透明度由 0 递增，实际发射才达到 100% 并产生伤害。整轮只预警一次。预警借用这一轮的实际脉冲间隔和四/五帧动画；短轮在一秒窗口内循环，轮末留一个暗逻辑步。预警没有弹体、碰撞、声音或随机数消耗。游戏内不新增难度区别说明、弹窗或设置开关。

The user authorizes an Easy-only aid: preview each Boss laser volley for one second with the existing matching beam art and pulsed animation. Pulse opacity rises from zero; only actual emission reaches full opacity and deals damage. Warn once per volley. Replay its actual pulse spacing and four/five-frame animation, repeating short volleys within the window with one dark logic tick between repeats. Warnings create no projectiles, collisions, sounds or RNG use. Add no in-game difficulty explanations, dialogs or switches.

暂停冻结预警；切出简单难度移除，切入时沿用剩余时间，不重置炮位。例如还剩 0.3 秒时，从约 70% 开始。死亡、换关、读档及炸弹抑制移除失效预警；抑制结束后按仍有效的实际攻击重新计算。预警随当前炮口移动，不提前锁定 Boss 位置。

Pause freezes the warning. Leaving Easy removes it; entering Easy uses remaining time without resetting guns (about 70% opacity with 0.3 seconds left). Death, stage/load changes and bomb suppression clear stale previews; remaining valid attacks are recalculated after suppression. Previews follow the moving muzzle instead of locking Boss position early.

## 范围与实现 / Scope and implementation

- 原始表不改。覆盖第 1–7、11、12、14、16、18 关的 12 个 Boss、33 个激光炮位，包含蓝色 9 和红色 10 号光束；第 5/18 关的普通激光敌机不增加预警。
- 炮位副本复用同一个调度器前看 29 个 35 ms 逻辑步。实际计时不变；绘制在剩余时间进入一秒时开始渐变，受逻辑/渲染采样精度限制。
- 游戏状态持有独立 `laserWarnings`，渲染读取炮口偏移及脉冲序列；正式激光仍走原碰撞和音效路径。保留 M2.18 音频、M2.19 机动及其他战斗参数。
- 房主下发预警状态，客户端不重新推演炮位。房间规则版本 8，旧版本拒绝加入。网络延迟仍可能影响客户端收到画面的时间，不声称设备物理时钟逐帧同步。
- 版本 0.2.22 / build 24。实际玩法仍为单人/双人，3P/4P 仅协议预留。

- Preserve source tables. Cover 12 Bosses and 33 laser mounts in stages 1–7, 11, 12, 14, 16 and 18, with blue type 9 and red type 10. Ordinary laser enemies in stages 5/18 get no preview.
- A gun copy uses the same scheduler to look ahead 29 fixed 35 ms ticks. Actual timing stays unchanged; rendering begins fading when remaining time enters the one-second window, subject to logic/render sampling resolution.
- Independent `laserWarnings` hold muzzle offsets and pulse sequences. Real beams retain existing collision and audio paths. Preserve M2.18 audio, M2.19 mobility and other combat parameters.
- Hosts send warning state; clients do not predict gun schedules. Room rule revision 8 rejects old peers. Network latency can still delay received frames; no physical-clock/frame synchronization claim.
- Version 0.2.22 / build 24. Public gameplay stays solo/two-player; P3/P4 remain protocol reserves.

## 验收 / Verification

开发验收进行中。新增检查覆盖全部 132 个炮位/难度组合、预警无伤害、原发射时机、组内不重复预警、暂停改难度、死亡/炸弹/读档清理、联机快照，以及真实 Canvas 的红蓝脉冲透明度和炮口位置。Android/iOS 显式原生探针增加预警交接检查；完整引擎、浏览器、Android 构建/Lint/现成模拟器与 iOS 构建/模拟器验收后才能正式发布。

Verification is in progress. Added checks cover all 132 mount/difficulty combinations, harmless previews, original firing timing, one warning per volley, paused difficulty changes, death/bomb/load cleanup, network snapshots and actual Canvas red/blue pulse opacity/muzzle positions. Explicit Android/iOS native probes check warning handoff. Formal publication requires the full engine/browser suites, Android build/Lint/existing-emulator checks and iOS build/simulator verification.
