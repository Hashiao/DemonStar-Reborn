# 原作 18 关设计恢复清单 / Recovered original eighteen-stage design

记录日期 / Recorded: 2026-10-11。实现核查基线 / Runtime baseline: `ec1b52b` / v0.2.16。

后续实施更新：用户已授权 [M2.17](../M2_17_SPAWNS.md) 修复准入、批次、出生位置与首目标。下面的数据与“本轮研究”说明保留为实施前的证据快照；`runtime_current_*` 字段不代表更新后的运行时。真实可见/开火帧仍未全面标定。

Later implementation: the user authorized M2.17 admission, batch, spawn-position and first-target fixes. Data and research-only statements below remain the pre-implementation evidence snapshot; `runtime_current_*` fields do not describe the updated runtime. Full visible-entry/firing-frame calibration remains incomplete.

**本轮为本地研究记录，不修改游戏、地图导入文件、测试或构建代码。** 用户要求先逐关明确不同难度下的数量、位置、时机和原作规则，随后依据清单分步修改。这里恢复的是本地 DemonStar 4.04 程序与地图中的可核实设计数据，不是取得了原作者的源码或设计文稿，也不是十八关四难度全部实机通关验收。

**This is local research documentation, without changing game, imported maps, tests or build code.** The user requests per-stage counts, positions, timing and difficulty rules before later incremental fixes. This recovers verifiable design data from the local DemonStar 4.04 program/maps, not an original author's source/design document or hardware playthrough certification of every stage and difficulty.

## 从哪里开始 / Start here

- [总规则与地址证据 / Rules and native evidence](RULES.md)：原作出场条件、分组时序、坐标、路径、补给与难度差异。
- [逐步修改清单 / Implementation checklist](IMPLEMENTATION_CHECKLIST.md)：按依赖关系排列的修复项、验收与未决事项；所有实现项均待执行。
- 下方 18 份关卡 Markdown：每关有八种难度/人数统计、编队批次和**每一条对象记录的完整出场表**，不是抽样清单。
  The eighteen linked Markdown files contain eight difficulty/player cases, formation batches and **every placement**, not samples.
- 每关同名 CSV：可筛选原始坐标、触发刻度、出生坐标、首路径目标、固定/自动补给和当前实现差异。
  Each matching CSV supports filtering raw coordinates, triggers, spawn centers, first path targets, supplies and current-runtime differences.
- [定义目录 / Definition catalog](data/definitions.md) 与 [JSON](data/definitions.json)：387 个原型的尺寸、基础数值、路径节点和全部炮口原始参数。
  All 387 definitions retain dimensions, base values, path nodes and every raw gun configuration.
- [逐条 JSONL / Placement JSONL](data/placements.jsonl)、[144 组合汇总 / Case summary](data/difficulty-summary.csv)、[源文件哈希 / Source manifest](data/source-manifest.json)、[核验结果 / Verification](data/verification.json)。

## 时间和位置的精度 / Timing and position precision

本清单把以下三件事分开 / This ledger separates three concepts:

1. **地图标注坐标**：原文件中的 X、Y。Y 主要用于滚动调度，不是敌机出生后的屏幕 Y。
   **Map coordinates:** original X/Y. Map Y drives scrolling/scheduling rather than being the spawned object's screen Y.
2. **逻辑生成时刻与位置**：按原作相邻分组规则计算触发刻度、批次、纵向偏移和出生中心点，逐条给出数值；原作界面横向相机偏移不包含在世界坐标中。
   **Logical spawning:** numeric trigger scroll, batch, vertical offset and spawn center per placement, reconstructed from native grouping. World coordinates exclude the viewport's horizontal camera offset.
3. **玩家看见它进入战场的真实时刻**：取决于后续移动、机体尺寸、相机、暂停和出击过程。本轮没有逐帧运行原机来填满这一列，不能冒充精确录像时间。
   **Actual visible entry:** depends on movement, dimensions, camera, pauses and launch presentation. No complete native frame trace was run to establish this for every object.

表内 `秒†` 仅为 `触发滚动刻度 × 0.035` 的无暂停名义换算；不能直接把它当成从点击开始、出击动画结束或录像起点算起的时间。后续修复应先严格匹配刻度/批次/坐标，再以原机画面校准真实入场。全量数据中的未实测可见时刻保留为未验证，不以猜测填充。

Seconds† mean only `trigger scroll × 0.035`, without pauses. They are not timestamps from Start, launch completion or the recording's beginning. Match logical triggers/batches/coordinates first, then calibrate visible entry against native footage. Unmeasured visible timestamps remain unverified, not guessed.

**具体例子：**第三关 `S03-R0080` 至 `S03-R0084` 的地图 Y 分别是 1192、1224、1256、1288、1320；原作在刻度 **1192 一次生成整组**，中心出生点依次为 **(168,-192)、(168,-224)、(168,-256)、(168,-288)、(168,-320)**。当前实现按各自 Y 延迟生成，因此只统计“五架”无法发现这个差异。

**Example:** stage-three records `S03-R0080`–`S03-R0084` have map Y values 1192, 1224, 1256, 1288 and 1320. The original creates the whole group at scroll **1192**, with spawn centers **(168,-192), (168,-224), (168,-256), (168,-288), (168,-320)**. The current runtime schedules their individual Y values; a count of five alone misses this difference.

## 本轮覆盖与验证 / Coverage and verification

- 直接重新读取原作 GLB，18 关、8,368 条放置、387 个已提取定义字段与当前导入文件一致，原始八个整数逐条可逆核对通过。
  Fresh GLB extraction matches the current import: eighteen maps, 8,368 placements and 387 extracted definitions. All eight raw placement integers round-trip exactly.
- 每关四档难度 × 两个人数状态，共 144 个静态设计组合；汇总假设注册版、18 张地图、玩家有效人数和难度不在关中变化，且对象池有空间。
  Four difficulties × two player-count states per stage yield 144 static cases, assuming the registered eighteen-map game, constant difficulty/active count and available object slots.
- 对 `0x42d731` 出场准入分支做局部指令解释，3,072 组标志/难度/人数/版本条件与归纳规则一致。它只解释该条件分支，不是运行整个原作。
  An isolated instruction interpreter for the admission branch matched 3,072 flag/difficulty/player/edition cases. It interprets that branch only, not the entire game.
- 11 关存在非零编队组，共 483 条分组记录，其中 415 条具有非零生成 Y 偏移。原始顺序下触发批次均不倒退，均位于 8 的倍数刻度。
  Eleven stages contain 483 grouped records, including 415 nonzero spawn-Y offsets. Batch triggers do not go backward in source order and are multiples of eight.
- 使用未改动的当前 `Game.spawnRecord` 对全部记录核对，清单里的“当前出生坐标”全部一致。首路径节点 X 有 944 条静态差异，见 [对应条目](data/first-path-target-differences.json)；不将其夸大为 944 个独立机型或完整轨迹已验收。
  Unmodified current spawning matches every recorded current-runtime spawn coordinate. There are 944 placement-level first-path-target X differences in the linked data, not 944 distinct enemy types or fully verified trajectories.
- 本轮没有新增录像审看或实机通关；沿用 [前轮视频取证](../WAVE_SPAWN_AUDIT_2026_10_11.md) 的有限证据，不把它扩展成全程证明。
  No new video frames or native playthroughs were reviewed this turn. Earlier sampled footage remains limited evidence.

## 数据阅读约定 / Reading the data

`S01-R0001` 表示第一关原文件的第一条记录，便于后续修复准确引用；它不是新增运行时 ID。`S / 2P` 中每个四位串按 Easy、Normal、Hard、Insane 排列，1=允许出场、0=跳过。出场条件在运行时判断，暂停改难度或玩家出局后不应继续使用开局时一次筛选的结果。

`S01-R0001` identifies the first source placement of stage one for research references, not a new runtime ID. S / 2P four-bit masks list Easy, Normal, Hard, Insane; 1 admits and 0 skips. Evaluate admission at runtime rather than caching the initial difficulty/player state forever.

对象类别为互斥的 carrier / boss / scenery / ground / enemy；固定掉落和自动补给是附加属性，不能与类别数重复相加。未解释字段、两条 0x02 记录、资源池上限、屏幕裁切和完整运动边界都保留在待核项目中。

Object categories are exclusive; explicit drops and automatic supply overlap them and must not be added as more objects. Unknown fields, two 0x02 records, pool limits, viewport clipping and complete motion boundaries remain tracked questions.

## 逐关入口 / Stage ledgers

| 关卡 / Stage | 原始记录 / Records | 触发批次 / Batches | 编队偏移条目 / Offsets | 单人 E/N/H/I 总数 / Solo | 双人 E/N/H/I 总数 / Two |
|---|---:|---:|---:|---|---|
| [01](stages/01.md) · [CSV](stages/01.csv) | 502 | 305 | 0 | 461/461/489/502 | 480/480/502/502 |
| [02](stages/02.md) · [CSV](stages/02.csv) | 612 | 335 | 0 | 576/576/591/612 | 604/604/612/612 |
| [03](stages/03.md) · [CSV](stages/03.csv) | 574 | 286 | 80 | 520/520/531/574 | 565/565/574/574 |
| [04](stages/04.md) · [CSV](stages/04.csv) | 456 | 218 | 28 | 442/442/447/456 | 451/451/456/456 |
| [05](stages/05.md) · [CSV](stages/05.csv) | 604 | 251 | 77 | 590/590/590/604 | 604/604/604/604 |
| [06](stages/06.md) · [CSV](stages/06.csv) | 511 | 281 | 0 | 479/479/479/511 | 511/511/511/511 |
| [07](stages/07.md) · [CSV](stages/07.csv) | 299 | 194 | 8 | 289/289/292/299 | 296/296/299/299 |
| [08](stages/08.md) · [CSV](stages/08.csv) | 477 | 288 | 0 | 460/460/468/477 | 469/469/477/477 |
| [09](stages/09.md) · [CSV](stages/09.csv) | 309 | 224 | 16 | 293/293/300/309 | 303/303/309/309 |
| [10](stages/10.md) · [CSV](stages/10.csv) | 437 | 253 | 15 | 406/406/410/437 | 433/433/437/437 |
| [11](stages/11.md) · [CSV](stages/11.csv) | 518 | 282 | 73 | 466/466/480/518 | 504/504/518/518 |
| [12](stages/12.md) · [CSV](stages/12.csv) | 413 | 230 | 2 | 404/404/406/413 | 411/411/413/413 |
| [13](stages/13.md) · [CSV](stages/13.csv) | 439 | 269 | 45 | 421/421/426/439 | 434/434/439/439 |
| [14](stages/14.md) · [CSV](stages/14.csv) | 485 | 253 | 32 | 468/468/470/485 | 483/483/485/485 |
| [15](stages/15.md) · [CSV](stages/15.csv) | 369 | 246 | 39 | 335/335/358/369 | 346/346/369/369 |
| [16](stages/16.md) · [CSV](stages/16.csv) | 456 | 238 | 0 | 445/445/446/456 | 455/455/456/456 |
| [17](stages/17.md) · [CSV](stages/17.csv) | 469 | 264 | 0 | 446/446/448/469 | 467/467/469/469 |
| [18](stages/18.md) · [CSV](stages/18.csv) | 438 | 190 | 0 | 426/426/428/438 | 436/436/438/438 |

## 本地原始证据 / Private source evidence

原二进制、反汇编片段和研究脚本留在 `Deamon Star/` 与忽略目录 `.local/reference/stage-design-2026-10-11/`、`.local/recover-stage-design.py`。本文档集只存文字、数字和原型标识，不包含原图、音乐、EXE 或 GLB，不改写原始资料。当前是本地固化记录，未因此创建 Release 或改变发布版本。

Original binaries, disassembly excerpts and research tooling remain in the original/ignored local directories. This documentation contains text, numbers and prototype IDs, not original artwork, music, executables or archives; sources remain unchanged. This is a local record, not a Release or version change.
