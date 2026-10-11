# 后续逐步修改清单 / Checklist for later incremental fixes

[总说明 / Guide](README.md) · [原作证据 / Native evidence](RULES.md)

**M2.17 更新：出场准入、编队调度、出生位置与首路径目标已实施；完整动态轨迹和下列其他规则仍待后续。** 不按关卡总数粗调，不按对称性删一半，不随机改左右。每次引用 `Sxx-Rnnnn` 和源文件哈希，修改后对照对应记录的准入、批次、出生点、路径与掉落。

**M2.17 update: admission, formation dispatch, spawn positions and first path targets are implemented; full dynamic motion and the other rules below remain future work.** Do not adjust aggregate counts, halve symmetric formations or randomize sides. Reference row IDs/source hashes and compare eligibility, batch, spawn point, paths and drops after each later change.

| 顺序 / Order | 项目 / Task | 验收要求 / Acceptance |
|---|---|---|
| 1 | R01 出场准入（M2.17 已实现） / Spawn admission (implemented) | 0/4/8/12 与四难度、单/双有效人数逐项一致；跳过对象不阻塞后续；0x20 注册版特例独立。 / Match every flag/difficulty/player case, advance skipped rows and retain the separate edition gate. |
| 2 | R02 波次分组（M2.17 已实现） / Formation scheduling (implemented) | 按原始相邻组生成，验证 483 条分组记录和 415 条偏移；不以稳定 Y 排序代替原顺序。 / Verify grouped records/offsets without substituting a global Y sort. |
| 3 | R03 出生位置（M2.17 已实现） / Spawn positions (implemented) | 全部 8,368 条按模式核对，重点检查 mode 3/6、地物入口、分组偏移；先不改全局速度。 / Compare every constructor case, especially modes 3/6, scenery and offsets, without global speed changes. |
| 4 | R03 首节点已修，完整路径待核 / First targets fixed; full motion pending | 复查 944 条首节点差异；首节点与后续节点分别处理。取得原机动态小样本后再扩展整套运动。 / Address first/subsequent nodes separately and obtain native motion samples before broad changes. |
| 5 | R05 补给归属与序列 / Supply ownership/sequences | 固定掉落和自动补给独立；两名玩家火力序列各自推进、炸弹序列共享；核对击毁归属和失效回退。 / Preserve independent explicit/auto drops, per-player weapon cycles, shared bomb cycle and owner fallback. |
| 6 | R06 跨关补充 / Stage replenishment | 四难度补充、P1/P2 类型、首关跳过准确；换关/跳关/读档不能反复领取。 / Match difficulty/player rules and prevent repeated grants across stage/load paths. |
| 7 | 动态时序验收 / Runtime timing | 对代表波次记录原机触发/首可见/首发射帧；声明录像零点和时钟，停止把名义秒当实测秒。 / Trace representative spawn/visibility/fire frames with explicit time origins. |
| 8 | R04 炮火难度推断 / Firing-difficulty inference | 先找到或排除相关原分支，再处理现有冷却倍率；不得凭手感直接删除或改倍数。 / Resolve the original branch before changing current multipliers. |
| 9 | R06 其他独立流程 / Separate systems | Boss 双人 HP、CREDITS、通关循环各立明确范围；参数冻结与已批准扩展单独处理。 / Scope boss HP, credits and campaign wrap separately; preserve freezes and approved extensions. |

每一项完成后记录“哪些关、哪些记录、哪个难度和人数、如何测试、未测什么”，再进入下一项。前三项是同一原作调度链，需处理依赖，不能以孤立局部通过宣称整条链已完成。

For each item, record stages/rows, difficulty/player state, method and untested scope before proceeding. The first three belong to one scheduling chain; isolated passes do not certify the entire chain.

## 按关验收表 / Per-stage acceptance

以下标注 M2.17 的实际自动回归范围，不冒充原机逐帧验收。
The table records actual M2.17 automated coverage, not native frame-by-frame certification.

| 关卡 / Stage | 四难度×单/双 / Eight cases | 出场时机与位置 / Trigger/position | 路径与首可见 / Path/visibility | 固定与自动补给 / Drops/supply |
|---|---|---|---|---|
| 01 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 02 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 03 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 04 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 05 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 06 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 07 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 08 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 09 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 10 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 11 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 12 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 13 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 14 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 15 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 16 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 17 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |
| 18 | 清单通过 / Ledger passed | 逻辑通过 / Logic passed | 首目标通过；完整动态待验 / First targets passed; full motion pending | 字段保留；归属序列待修 / Fields preserved; ownership pending |

## 实施时不可遗漏 / Requirements for later implementation

- 在对象真正生成时使用当前难度与有效玩家状态；原作定义与本项目 LAN 断线、等待复活、最终出局分别对应，不能简单用数组长度。
  Evaluate current difficulty/active status at spawning, mapping LAN disconnection, respawn waiting and elimination separately rather than using array length.
- 关卡档、联机快照和版本协商同步更新；联机客户端不独立生成另一套敌机。暂停切换难度只影响之后符合原规则的处理，不追溯删已出场对象。
  Update checkpoints, snapshots and compatibility together. Clients do not independently spawn enemies; difficulty changes must not retroactively delete existing objects.
- 保留用户已批准的 18 枚炸弹上限、可选三色进度、经典 HUD、输入机动性及 Android/iOS 音频隔离。这些用户扩展与原作恢复分别记录。
  Preserve approved eighteen-bomb capacity, optional color retention, classic HUD, input mobility and platform audio boundaries, recording extensions separately from original behavior.
- 原始地图与原版素材只读；复核期间不自动回写 `campaign.js`，不把原 EXE/GLB/图像纳入发布。
  Keep original maps/assets read-only; never automatically rewrite campaign.js during research or publish original executables/archives/images.
