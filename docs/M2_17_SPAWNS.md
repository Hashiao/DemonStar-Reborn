# M2.17 四难度波次与出场修复 / Difficulty, formation and spawn fixes

用户于 2026-10-11 在完成逐关取证后授权按清单修复数量、时机和位置，接受大体忠于原作而不要求逐帧时钟一致。本轮对应 [原作设计清单](original-stage-design/README.md) 的 R01–R03 与首路径目标；自动补给归属/序列、跨关补充、HP/伤害、CREDITS 和循环战役仍不在本轮修改范围。

On 2026-10-11 the user authorized count, timing and position fixes from the stage ledger, accepting broadly faithful behavior without exact frame-clock matching. This implements R01–R03 and first path targets. Supply ownership/sequences, between-stage replenishment, HP/damage, credits and campaign looping remain outside this change.

## 已实现 / Implemented

- 按每条记录 0x04/0x08/0x20 标志判断四难度与有效人数；不按左右配对删减，不随机决定保留哪边。复活等待仍算有效；最终出局或断线的玩家不计入额外出场条件。暂停修改难度影响后续生成，不追溯删除已生成对象。
  Evaluate each placement's flags against difficulty and active players. No symmetry pruning or random side choice. Respawn waiting counts as active; elimination/disconnection does not. Paused difficulty changes affect future spawns without deleting existing objects.
- 保留原始归档顺序，相邻编队按同一批次生成，用组锚点与成员 Y 的差值安排出生高度；跳过记录也继续消费游标。保留原始地图和固定掉落编号。
  Preserve source order and dispatch adjacent formations as batches with anchor-relative birth heights. Skipped rows still advance the cursor. Source maps and explicit drop IDs are unchanged.
- 恢复负 Y 出生点、地物入口和侧面出生位置；模式 10 首路径节点使用与后续节点不同的镜像方向。
  Restore negative-Y/scenery/side entry coordinates and mode 10's distinct first-target mirroring.
- 补查并修正侧面及补给运动：mode 3 先每步下移 1，Y 超过机高+8 后横向进入；mode 6 按 0x300/0x500 斜向进入；mode 8 持续下移而非停在顶部。mode 3/4/5/6 进入战场后逐步趋近原表后速。依据 `0x4106d4–0x41082c`；延续现有浮点移动，不宣称复刻原作全部固定点取整。
  Additional native checks restore mode 3's one-unit downward drift before horizontal entry below sprite height+8, mode 6's diagonal entry, and mode 8's continued downward motion. Modes 3/4/5/6 approach their original later speed after entering play. Evidence is at `0x4106d4–0x41082c`; existing floating-point movement remains, not every native rounding detail.
- Boss 生成后地图调度继续，避免遗漏其后地面目标和地物。原作 `0x42d840–0x42d88f` 没有“Boss 已生成即停滚”判断；暂停/结束等游戏阶段仍停止本项目战斗推进。
  Continue map dispatch after boss creation so later ground/scenery records remain available. The native scroll routine does not stop merely because a boss exists. Paused/ended phases still stop battle advancement.
- 关卡档保持现有格式：读档、换关重建原始调度游标；联机由房主生成并发送坐标。房间版本升至 4，拒绝仍采用旧波次逻辑的旧端，双方须更新；状态快照仍为 v2，旧关卡档仍可读取。
  Keep checkpoint format and rebuild the source-order cursor on load/stage changes. Hosts generate the world and send coordinates. Room revision 4 rejects older spawning rules, so both peers must update; snapshots remain v2 and legacy checkpoints remain readable.

## 验证 / Verification

- 356 项引擎/单元测试通过，包含 18 关×4 难度×单双人共 144 组合，逐条比对取证清单的记录 ID、触发刻度、出生坐标和首路径目标。此调度测试人工推进滚动刻度，保证所有尾部记录也被覆盖，不冒充原机通关录像。
  356 engine/unit tests passed, including 144 stage/difficulty/player combinations with row-by-row IDs, triggers, spawn coordinates and first targets. The scheduler test explicitly advances scroll to cover trailing rows; it is not an original-game video playthrough.
- 覆盖固定左右补给、复活/出局/断线、四档之间全部 12 种暂停切换方向（单双人分别验证）、Boss 后批次、关卡档恢复、换关与房主快照；额外验证联机升/降难度后下一批按新规则生成且原实体不变。
  Covers fixed-side supply, respawn/elimination/disconnection, all twelve directed difficulty transitions in both player modes, post-boss batches, checkpoint reload, stage changes and authoritative snapshots. LAN raises/lowers difficulty before the next batch while preserving existing entities.
- 25 组浏览器检查通过；新增场景含 16 个实际打包调度/渲染组合及第三关编队间距。
  Twenty-five browser suites passed; the new suite includes sixteen bundled scheduler/rendering cases and stage-three formation spacing.

本轮没有新原机逐帧时钟验收；真实手机热点、Android–iOS 双真机、最低系统硬件与用户 iPhone 18 Pro/iOS 27.0.1 音频听感仍未验证。原作数值表、经典 HUD、18 枚炸弹扩展、三色保留规则、输入机动性、Android 原音频及 iOS 专用音频适配保留。

No new native frame-clock certification is claimed. Physical hotspots, Android–iOS hardware pairs, minimum-system hardware and listening quality on the user's iPhone 18 Pro/iOS 27.0.1 remain unverified. Preserve original numeric tables, classic HUD, eighteen-bomb extension, color-retention rules, player mobility and the existing Android/iOS audio implementations.

356 项引擎/单元测试、25 组浏览器检查通过，包含 144 个关卡/难度/人数逐条清单组合、四档难度全部 12 种切换方向及联机下一批出场验证。Android Release/Debug、Lint（各 0 错误、12 条警告）、API 37 原生操作/设置/三语/双 App LAN 通过。[iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38135345464) 通过 iPhoneOS 构建、iPhone/iPad 模拟器功能/三语/音频、原生双端 LAN 和系统长按检查。

356 engine/unit tests and 25 browser suites passed, including 144 stage/difficulty/player ledger cases, all twelve directed difficulty transitions and subsequent LAN spawning. Android Release/Debug, Lint (0 errors and 12 warnings each), API 37 native controls/settings/localization/two-app LAN passed. [iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38135345464) passed iPhoneOS compilation, iPhone/iPad simulator functionality/localization/audio, native-pair LAN and system long presses.

Android 默认 GPU 启动的模拟器曾退出，首次 smoke 未能连接设备；复用同一 AVD 改用 SwiftShader、关闭 Vulkan 后重跑全部原生检查通过，保留这次环境重试记录。

The default-GPU emulator exited and the first smoke attempt could not reach it. All native checks passed after restarting the same AVD with SwiftShader and Vulkan disabled; the infrastructure retry remains recorded.

后续新增的两项动态难度测试在本地运行，使总数为 356；构建提交的 iOS CI 执行 354 项。两次验证的应用源码相同，后续只增测试与文档。

Two additional local dynamic-difficulty tests bring the total to 356; iOS CI at the binary build commit ran 354. Application source is identical; only tests and documentation changed afterward.
