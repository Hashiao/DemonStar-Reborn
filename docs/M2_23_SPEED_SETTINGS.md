# M2.23 玩家速度与淡激光预警 / Player speeds and faint laser warnings

用户确认双人分别设置速度。设置位于“玩家与操作”，每个本地操作配置独立保存慢/中/快，新增字段缺失时默认中；保留已有操作方式、按键及外设分配。暂停可调整且保留开火锁存。速度属于设备操作偏好，关卡存档不覆盖偏好；联机每台设备配置自己的玩家，由房主按白名单档位执行并同步状态。房间规则 9，双方须更新，玩法仍限单/双人。

The user confirmed independent two-player speeds. Player controls persist slow/medium/fast per local profile, defaulting missing fields to medium while retaining existing controls, bindings and device assignments. Paused changes preserve latched fire. Speed is a device control preference, not a checkpoint override. Each LAN device configures its own player; the host executes only recognized tiers and synchronizes state. Room revision 9 requires both peers to update; public play stays solo/two-player.

| 档位 / Tier | 原作每轴基准 / Source-axis basis | 水平步数 / Horizontal ticks | 垂直步数 / Vertical ticks |
|---|---:|---:|---:|
| 慢 / Slow | 4 | 72 / 2.52 s | 74 / 2.59 s |
| 中（默认）/ Medium (default) | 5 | 58 / 2.03 s | 60 / 2.10 s |
| 快 / Fast | 6 | 48 / 1.68 s | 50 / 1.75 s |

依据为 [M2.19 原作分支取证](M2_19_MOBILITY.md)：键盘每轴 4，鼠标/模拟摇杆每轴 6。中档取速度的算术平均，不取穿屏时间平均。上表是完整可活动跨度的 35 ms 离散步数，末步截断，不是手机或原机墙钟实测。所有难度、键鼠/手柄/各触屏方式/倾斜均使用所选上限；斜向两轴保留满速，圆形杆轻推幅度保留，跟手/鼠标不越过目标。世界时钟、敌机与独立弹速、伤害和射速不变；原有弹体继承玩家位移自然随所选档位变化。

Evidence: [M2.19 source-branch research](M2_19_MOBILITY.md), with keyboard cap 4 and mouse/analog cap 6 per axis. Medium averages speeds, not traversal durations. Times above are discrete 35 ms traversal ticks with a shortened final step, not measured phone/native wall time. All difficulties and input routes use the selected cap. Diagonals retain both axes, partial circular-stick input stays proportional, and follow/mouse targets never overshoot. Preserve world timing, enemies, independent projectile speed, damage and cadence; existing player-displacement inheritance follows the selected speed naturally.

“画面与界面”新增“简单难度激光预警”复选框，默认开启并保存选择。它只影响本机预警绘制，同屏两人共用画面；联机另一端有自己的开关。正式激光始终绘制，实际攻击不变。关闭期间仍维护房主预警计时，所以重开按实际剩余时间显示。

Display settings add a default-on, persistent Easy laser warning checkbox. It controls only local warning rendering; a shared-device pair shares the display, while another LAN device has its own preference. Real beams always render and attacks remain unchanged. Host warning time continues while hidden, so reenabling uses actual remaining time.

用户最新明确：只有发射前最后 0.2 秒才变深。保留脉冲及一秒窗口：前 0.8 秒脉冲峰值固定 2%，最后 0.2 秒采用 `0.02 + 0.98 × ((progress - 0.8) / 0.2)³` 加速渐深；正式发射前小于 1。脉冲暗段仍然全透明，正式发射才全强度并伤害。游戏内只放简短设置项，不增加难度区别或数学说明。新增文案支持简体、繁体、英语。

The user's latest instruction reserves darkening for the final 0.2 seconds before firing. Retain pulses and the one-second window: pulse peaks stay at 2% for the first 0.8 seconds, then use `0.02 + 0.98 × ((progress - 0.8) / 0.2)³` during the last 0.2 seconds, below one until actual emission. Dark pulse gaps remain transparent; real emission reaches full intensity and deals damage. Product UI contains only short settings without difficulty or mathematical explanations. New copy supports Simplified/Traditional Chinese and English.

## 验收 / Verification

- 玩家与操作新增每位玩家独立的移动速度：慢为原作键盘基准，中为两者速度平均（默认），快保持上一版速度。所有难度和操作方式通用，保留斜向满速、摇杆轻推与目标截断。
- 画面与界面新增默认开启、可保存的简单难度激光预警复选框，仅影响本机显示，正式激光始终可见。
- 预警前 0.8 秒保持很淡，仅在发射前最后 0.2 秒加速变深；脉冲节奏、实际发射时机和伤害保持不变。游戏内只增加简短设置项。
- 版本 0.2.23 / build 25，房间规则 9，联机双方须更新。

407 项引擎/单元测试、31 组浏览器检查、三档速度的 288 个组合通过。快档与 0.2.22 的 96 组战斗、144,000 个逻辑步对照一致。Android Release/Debug/Lint（0 错误）和 API 37 五组原生验收通过。[iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38208214366) 完成 iPhoneOS 构建、iPhone/iPad 三档速度与最后 0.2 秒预警探针、功能/三语/音频、单双人系统触控和原生 LAN。两端版本及全部 142 份 Web 资源一致，APK 安装回读哈希匹配。

IPA 未签名，需自行签名。以上为浏览器和模拟器证据，未认证手机真机、真实热点或 Android–iOS 真机混联。速度秒数为 35 ms 逻辑步换算，网络画面受传输延迟影响。

- Add independent movement speeds under player controls: Slow uses the original keyboard basis, Medium averages the two speeds and is the default, and Fast preserves the previous version. All difficulties and controls retain full diagonal axes, partial sticks and target clamping.
- Add a persistent, default-on Easy laser warning checkbox under display settings. It affects only local warnings; real beams always remain visible.
- Warnings stay faint for the first 0.8 seconds and darken only in the final 0.2 seconds before firing. Preserve pulse cadence, actual emission timing and damage. Product UI adds only concise settings.
- Version 0.2.23 / build 25; room revision 9 requires both peers to update.

Passed 407 engine/unit tests, 31 browser suites and 288 combinations across all three speed tiers. Fast matches 0.2.22 across 96 combat comparisons and 144,000 logic ticks. Android Release/Debug/Lint (zero errors) and five API 37 native suites passed. [iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38208214366) completed iPhoneOS compilation, iPhone/iPad three-speed/final-0.2-second warning probes, functional/localization/audio checks, solo/two-player system touch and native LAN. Versions and all 142 Web resources match across packages; installed APK bytes match.

The IPA is unsigned and requires user signing. Browser/simulator evidence does not certify physical phones, real hotspots or Android–iOS hardware pairs. Traversal seconds are 35 ms logic-tick conversions; network display remains subject to transport latency.

`DemonStar-Reborn-release.apk` SHA-256: `9bea8ab7154f9cc3b1c7c666d4bf04ef6213981f452bc4a0aaf7a311d9c8126b`

`DemonStar.ipa` SHA-256: `07cadf8c51e0233150597937358baa9280245ecacf349f0ced723df071dfb1d6`

## CI 控制服务恢复 / CI control-service recovery

首轮 [38204137016](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38204137016) 在 iPad 的 `simctl launch` 等待 600 秒后失败；iPhone 三语功能已通过。第二轮 [38205633257](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38205633257) 完成功能和 LAN，但 LAN 结束时两次关机超时，随后触控脚本的 `simctl list` 也超时，尚未进入触控断言。这两轮均保留失败结果。

因此只为 GitHub macOS 当前用户增加 CoreSimulatorService 恢复，参考 [Apple 开发工具工程师说明的服务重启方式](https://developer.apple.com/forums/thread/13718)。保留已有设备、运行时与全部游戏断言；一次工作流最多恢复三次，恢复后的设备清单必须成功返回。无探针文件的系统启动超时允许重启服务后对同一设备重新安装并启动一次；已有应用结果或其他错误直接失败。XCTest 的 25 秒条件等待、1.6 秒真实按压和所有断言不变。新增独立检查保护“不重试应用断言失败”的边界。

Run [38204137016](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38204137016) timed out after 600 seconds in iPad `simctl launch`, after all three iPhone locale cases passed. Run [38205633257](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38205633257) passed functional and LAN checks, but both LAN shutdowns timed out and the touch controller's `simctl list` timed out before any touch assertion. Both failures remain recorded.

Recovery is limited to the current user's CoreSimulatorService on GitHub macOS, referencing the [service restart described by an Apple Developer Tools Engineer](https://developer.apple.com/forums/thread/13718). Preserve installed devices, runtimes and all game assertions. Allow at most three service recoveries per workflow and require a successful device listing afterward. A system launch timeout without a probe file permits one reinstall/launch retry on the same device; an existing application result or other error fails immediately. XCTest's 25-second conditions, real 1.6-second presses and every assertion stay unchanged. Dedicated tests protect the no-application-failure-retry boundary.

最终成功轮次未触发自动恢复；恢复逻辑的边界由九项独立测试覆盖。

The final successful workflow did not trigger automatic recovery; nine dedicated tests cover its control-plane boundaries.
