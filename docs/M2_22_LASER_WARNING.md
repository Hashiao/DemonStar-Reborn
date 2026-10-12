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

- 简单难度下，Boss 每轮激光前一秒显示同色脉冲预警，逐渐变亮；预警无伤害，完全显现时正式发射。
- 暂停冻结预警；中途切换难度沿用实际剩余时间；预警跟随炮口，多炮口和单双人共用。游戏内不新增难度区别说明。
- 保持原有发射时序、伤害、音频和机动。房间规则 8，联机双方须更新；0.2.22 / build 24。

401 项引擎/单元测试、30 组浏览器检查通过；12 个 Boss 的 132 组炮位/难度组合，以及与 0.2.21 对照的 96 组战斗、144,000 个逻辑步通过。Android Release/Debug/Lint（0 错误）、API 37 五组原生验收通过。[iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38198666309) 完成 ARM64 iPhoneOS 构建、iPhone/iPad 功能/三语/音频/新预警探针、原生 LAN 与单双人系统触控。两端包内部版本与全部 142 份 Web 资源匹配，APK 安装回读哈希一致。

这是用户确认的辅助扩展，不宣称原作自带预警。IPA 未签名，需自行签名；模拟器验收不代表真实手机、热点或 Android–iOS 双真机已通过。逻辑步为 35 ms，网络显示仍受传输延迟影响。

- On Easy, show matching pulsed Boss laser previews for one second before each volley, gradually increasing opacity. Previews are harmless; full visibility marks actual emission.
- Pause freezes warnings; difficulty changes preserve remaining time. Previews follow moving muzzles and support multiple mounts and solo/two-player play. Add no in-game difficulty explanations.
- Preserve firing schedules, damage, audio and mobility. Room revision 8 requires both peers to update; version 0.2.22 / build 24.

Passed 401 engine/unit tests and 30 browser suites, including 132 mount/difficulty combinations across 12 Bosses and 96 combat comparisons against 0.2.21 over 144,000 logic steps. Android Release/Debug/Lint (zero errors) and five API 37 native suites passed. [iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38198666309) completed ARM64 iPhoneOS compilation, iPhone/iPad functional/localization/audio/new-warning probes, native LAN and solo/two-player system touch. Both package versions and all 142 Web resources match; installed APK bytes match the release file.

This user-approved aid is not claimed as an original-game feature. The IPA is unsigned and requires user signing; emulator evidence does not certify physical phones, hotspots or Android–iOS hardware pairs. Logic uses 35 ms ticks and network display remains subject to transport latency.

`DemonStar-Reborn-release.apk` SHA-256: `0cdb226c4e33c68f5113474851f62f46a1f4ad8a75c51a8a8e0df248508fe809`

`DemonStar.ipa` SHA-256: `9aaa11d5a2d70877b4f0f5e209c0f2327f10df2b386597cbf6d793075b9c2eb2`

首轮浏览器开火断言早于 HUD 的 60 ms 刷新；已改为等待实际 DOM 状态，保留原断言与持续射击检查。Android 初次模拟器退出、第二次 ADB 5037 无响应的失败记录均保留；通过独立 ADB 5041 重跑同一现有 AVD 的完整五组检查。iOS 一轮完整通过，未调整其运行环境或断言。

The first browser fire assertion raced the 60 ms HUD refresh; it now waits for actual DOM state while retaining the assertion and sustained-fire checks. Preserve the initial emulator exit and subsequent unresponsive ADB 5037 failures. A dedicated ADB 5041 server completed all five suites on the same existing AVD. iOS passed in one complete run without environment or assertion changes.
