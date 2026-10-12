# M2.21 地面导弹与联机卷动 / Ground missiles and LAN scrolling

用户确认原作 G_ANGTNKR/L（ID 117/118）是反馈目标，并于定位后授权修复发射与移动。它们在原表第 4、6、12、16 关；此前第二关的口述不覆盖原始放置。证据见 [后续定位](STAGE2_GROUND_FOLLOWUP.md)。版本 0.2.21 / build 23，保留 M2.20 地物连锁与蛇形坠毁；完整发布验收尚在进行。

The user confirmed G_ANGTNKR/L (IDs 117/118) and authorized firing/movement fixes after diagnosis. Source placements are in stages 4, 6, 12 and 16; the earlier stage-two description does not override map records. See the linked evidence. Version 0.2.21 / build 23 retains M2.20 ground chains and snake falling. Full release verification is in progress.

## 改动 / Changes

- 原作 `0x42963a` / `0x4296ae` 分别固定为角度 `0x4ea` / `0x316`，约偏离正下方 41.13°。旧代码错误使用炮位角度 0，导致斜向图像竖直向上飞。现在按专用构造器向左下/右下发射，保留炮位原始速度、计时与伤害。
- 同族正下方弹 8 沿用 `0x4295c6`；三者恢复半高炮口 Y 偏移（8 / 4 / 4）。43/44 已有斜向图像，不叠加通用旋转。
- 补上三类导弹每步两粒的向后航迹。方向/数量参考 `0x428d01` / `0x409150`；灰色细烟使用现有重制粒子外观和 0.28 秒淡出，不宣称逐像素复刻原调色板粒子。视觉随机数独立，不消耗战斗随机序列，也不增加碰撞或伤害。
- 客户端地面和实体都从上一份收到的快照插值，修正原先混用“上一快照”和“房主上一逻辑步”的抖动。新出现的贴地装置也对齐地面；暂停、恢复、换关及首次快照统一直接定位。独立行驶炮台和漂浮拾取物不改成贴地运动。
- 房间输入/规则版本升为 7，旧版房间拒绝握手；快照格式仍为 2。

- Native `0x42963a` / `0x4296ae` fix angles at `0x4ea` / `0x316`, approximately 41.13 degrees from downward. The old code used raw gun angle zero, making diagonal artwork fly upward. Restore down-left/down-right construction while preserving source speed, cadence and damage.
- Downward type 8 follows `0x4295c6`; restore half-height muzzle Y offsets of 8 / 4 / 4. Existing diagonal artwork needs no extra generic rotation.
- Restore two backward-drifting trail particles per update. Direction/count follow `0x428d01` / `0x409150`; fine gray smoke reuses the remake particle style and 0.28-second fade, not pixel-exact palette-particle emulation. Visual randomness does not consume combat RNG or add collision/damage.
- Interpolate client terrain and entities from the preceding received snapshot, eliminating the mixed-snapshot/host-tick interval. Newly received fixtures also align with terrain; pause/resume/stage/first snapshots snap together. Autonomous turrets and floating pickups retain their separate movement.
- Room rule/input revision becomes 7 and rejects older peers; snapshot format stays at 2.

## 验收与边界 / Verification and limits

定向回归覆盖四个实际放置关卡、四难度、单双人、原始炮口/速度/伤害，以及 30/60/120 Hz 贴地移动和暂停切难度。快照间隔 1/2/3/6 步，检查新旧装置在整个插值区间相对地面不滑动；浏览器实际 Canvas 变换和斜弹像素也参与验收。所有完整套件和安装包结果在完成后追加，不将运行中或失败项记为通过。

Targeted regressions cover all four placement stages, four difficulties, one/two players, native muzzles/speeds/damage, and terrain movement at 30/60/120 Hz including paused difficulty changes. Snapshot gaps of 1/2/3/6 ticks cover existing/new fixtures throughout interpolation; browser checks inspect actual Canvas transforms and missile pixels. Full-suite/package results will be recorded on completion; pending or failed checks are never marked passed.

单机中“持续停在屏幕位置”的现象此前未复现，故不擅改正确的贴地速度。G_TNK2A 的六帧开盖是另一个已知遗漏，本轮确认对象并非它，暂未实现。未做手机真机/热点互通认证，也未声称完整十八关逐帧还原。

Persistent screen-stationary objects in solo play were not reproduced, so correct terrain-bound speed is preserved. G_TNK2A's six-frame cover animation is a separate known omission, not the confirmed target, and remains unimplemented. No physical-phone/hotspot certification or complete eighteen-stage frame-exact fidelity is claimed.

为排查 M2.20 iOS 验收超时，模拟器测试优先使用已安装的小尺寸 iPhone SE 3；显式触控测试只在状态变化时刷新无障碍观察标签，JSON 键顺序固定。保留全部系统长按及双机联机断言；这些调整是否解决 CI 失败仍以新运行结果为准。

To investigate M2.20 iOS verification timeouts, prefer an already installed smaller iPhone SE 3 and update the explicit touch-test accessibility observation label only when its sorted JSON changes. Preserve all system-touch and paired-LAN assertions. Whether these adjustments resolve CI failures depends on the new run.

### iOS 失败记录 / iOS failure history

main 运行 [38187573607](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38187573607) 的设备构建、iPhone/iPad 功能与原生双端 LAN 通过，但 iPhone XCTest 在双人长按/拖动/开火断言完成后，于 `TouchTests.swift` 的诊断 `app.screenshot()` 超时，退出 65；单人及 iPad 后续用例未完成，整轮未通过。将截图移到 Python 的 `simctl io screenshot`，保留截图步骤及全部操作断言，最后一场单人保持打开以供截图，再重新跑完整 workflow。不能把旧轮次补写为通过。

Main run [38187573607](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38187573607) passed device compilation, iPhone/iPad functional probes and native paired LAN. Its iPhone XCTest completed two-player hold/drag/fire assertions, then timed out in the diagnostic `app.screenshot()` call and exited 65. Subsequent solo/iPad cases did not complete; the overall run failed. Move capture to Python's `simctl io screenshot`, retain the capture step and every input assertion, leave the final solo game open for capture, and run a complete new workflow. The earlier run remains failed.

分支运行 [38187185632](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38187185632) 的 iPhone 触控完成；iPad 日志已走完单双人操作、全部断言及两次截图，约 496 秒进入 Tear Down，却在 Xcode 启动/构建/执行/收尾合计达到外层 600 秒时被终止。该运行仍算失败。仅将外层总预算改为 900 秒，Swift 各条件 25 秒、系统长按 1.6 秒、持有记录至少 1.3 秒和全部状态断言不变。

Branch run [38187185632](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38187185632) completed iPhone touch checks. Its iPad log reached the end of solo/two-player actions, all assertions and both screenshots, entering Tear Down near 496 seconds, but total Xcode startup/build/execution/cleanup exceeded the outer 600-second process limit. The run remains failed. Increase only that outer budget to 900 seconds; preserve Swift's 25-second condition waits, 1.6-second system presses, at-least-1.3-second observed holds and every state assertion.

运行 [38189641418](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38189641418) 的 touch job 在繁体 iPhone 功能用例等待 `audio-shot-clock` 时超时，尚未进入系统长按。旧错误只含游戏状态，不能判定音频上下文中断、重建或时钟停止的具体原因。补充真实上下文状态、当前/目标时间、轮次和射击时间诊断；音频实现和 8 秒断言期限不变，再进行一次完整验收。未宣称用户真机有此故障或已修复。

The touch job in [38189641418](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38189641418) timed out awaiting `audio-shot-clock` in the Traditional Chinese iPhone functional case, before system-touch checks. Its old error contained only game state and cannot distinguish context interruption/replacement from a stalled clock. Add real context state, current/target times, iteration and shot-clock diagnostics; preserve audio behavior and the eight-second assertion deadline, then perform another complete verification. This is not a claimed user-device defect or fix.

## 当前交付状态 / Current delivery status

修复已在 main（PR #5）。本地通过 395 项引擎/单元测试、29 组完整浏览器检查、48 组无敌脚本交火，以及 Android Release/Debug/Lint（均 0 错误）和 API 37 操作/设置/三语/双 App LAN/控制五组验收。初次浏览器运行因 dist 刷新而有两组启动失败，原退出码保留；之后新的完整运行 29 组全部通过，没有手工覆盖失败。

Fixes are on main (PR #5). Local verification passed 395 engine/unit tests, 29 full browser suites, 48 invulnerable scripted combat cases, Android Release/Debug/Lint (zero errors), and five API 37 operation/settings/localization/two-app LAN/control suites. Two initial browser loads overlapped dist refresh; their failed exit codes remain. A new complete run passed all 29 without rewriting failures.

最新 [38190762259](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38190762259) 通过 iPhoneOS 编译和简/繁体 iPhone 功能用例，但英语用例等待原生音乐状态变化超时，最后状态为 ready=true、paused=false、volume=0、currentTime=18.508662131519273。失败发生在新增音效时钟诊断之前，不能据此断言原生音乐时钟停止或定位具体切换步骤。该 job 未进入系统长按检查。停止无依据重跑，不修改冻结的音频实现。

Latest run [38190762259](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38190762259) passed the iPhoneOS build and Simplified/Traditional Chinese iPhone functional cases. The English case timed out awaiting native music state; its last snapshot was ready=true, paused=false, volume=0 and currentTime=18.508662131519273. This occurred before the new effects-clock diagnostics and does not prove a stopped music clock or identify the specific transition. That job never entered system-touch checks. Stop unsupported reruns without altering frozen audio behavior.

本机 `artifacts/v0.2.21-candidate/` 的 APK 与未签名 IPA 均验证内部 0.2.21 / build 23，142 份 Web 文件逐字节匹配已测构建。APK 签名沿用项目独立密钥且安装回读哈希一致；IPA 为 ARM64 iPhoneOS、最低 iOS 12.0，须自行签名。`verification.json` 明确为 `incomplete`，附 SHA256SUMS.txt。未创建正式或预发布 GitHub Release；发布方式等待用户决定。

Both local candidates in `artifacts/v0.2.21-candidate/` verify internal version 0.2.21 / build 23 and byte-identical copies of all 142 tested Web files. The APK uses the independent project signature and matches installed/pulled bytes. The unsigned IPA is ARM64 iPhoneOS with minimum iOS 12.0 and requires user signing. `verification.json` explicitly says `incomplete`, with SHA256SUMS.txt alongside. No official or prerelease GitHub Release was created; delivery status awaits the user's decision.

| 安装包 / Package | SHA-256 |
|---|---|
| DemonStar-Reborn-release.apk | `c91cd7189a39193c18ed56183a23e3d28a0d5aa13ae3e5cfc395661ebb1b0cd2` |
| DemonStar.ipa | `2ed763e43009b458a3184ede783bdd66a3c24bac4112fa5f438490e27e6c0d97` |

## 恢复验收基线 / Restore the verification baseline

用户明确要求继续完成完整验收，不选择预发布。回查成功运行 [38144102621](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38144102621)：`macos-15`、单 job、iPhone 16 Pro / iPad Pro 11-inch (M4)、iOS 18.5，总耗时约 16 分钟；基础检查 6 分 30 秒、LAN 42 秒、系统触控 6 分 46 秒。随后改为 Intel、拆分重复基础检查并在 LAN 前关闭模拟器，增加了冷启动和重复工作；近期基础检查约 12–15 分钟、一次 LAN 为 6 分 37 秒。耗时退步有记录，但不能直接断言全部音频超时均由执行器造成。

The user explicitly requests complete verification, not a prerelease. Successful run [38144102621](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38144102621) used `macos-15`, one job, iPhone 16 Pro / iPad Pro 11-inch (M4), and iOS 18.5. It took approximately 16 minutes: 6:30 for functional checks, 0:42 for LAN and 6:46 for system touch. Switching to Intel, duplicating functional checks across jobs and shutting simulators down before LAN added cold starts and repeated work; recent functional checks took roughly 12–15 minutes and one LAN run took 6:37. The slowdown is documented, but does not by itself explain every audio timeout.

恢复该执行器、既有设备选择和“基础检查 → 使用已启动模拟器进行 LAN → 系统触控”的单 job 顺序。保留全部新断言、原生时钟诊断、独立截图和收尾预算；不回退游戏修复或降低功能判定标准。由新一轮完整运行判断结果。

Restore that runner, existing-device selection and the single-job order: functional checks → LAN on warmed simulators → system touch. Preserve all new assertions, native-clock diagnostics, independent screenshot capture and teardown budget. Do not revert gameplay fixes or weaken functional acceptance. Assess the result from a new complete run.
