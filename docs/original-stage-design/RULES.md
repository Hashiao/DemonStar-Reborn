# 原作规则与证据 / Original rules and evidence

[总说明 / Guide](README.md) · [修改清单 / Checklist](IMPLEMENTATION_CHECKLIST.md)

证据等级：**D**=直接读取本地原表/程序分支；**S**=依据原分支计算或局部解释，未运行整款游戏；**V**=前轮明确记录的录像抽样；**U**=待核实。不推测原作者设计意图，不将静态设计记录称作实机时序。源文件哈希见 [manifest](data/source-manifest.json)。

Evidence: **D** direct local tables/native branches; **S** derived calculations or isolated interpretation without running the full game; **V** previously logged video samples; **U** unresolved. Do not infer authorial intent or call static design a measured playthrough. Source hashes are linked.

## R01 四档难度与出场条件 / Difficulty and spawn eligibility — D/S

原表 `0x43ce18` 的四个字符串指针分别为 EASY、NORMAL、HARD、INSANE，对应索引 0、1、2、3。主要准入分支为 `0x42d731–0x42d7a1`；注册版状态取 `0x442020`，已装载地图数取 `0x442d00`。

The four pointers at `0x43ce18` identify indices 0–3 as EASY/NORMAL/HARD/INSANE. Admission is evaluated at `0x42d731–0x42d7a1`, with edition state at `0x442020` and loaded map count at `0x442d00`.

| 记录标志 / Flags | 容易单人 / E1 | 一般单人 / N1 | 较难单人 / H1 | 疯狂单人 / I1 | 容易双人 / E2 | 一般双人 / N2 | 较难双人 / H2 | 疯狂双人 / I2 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 无 0x04/0x08 / Neither | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| 0x04 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 1 |
| 0x08 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 1 |
| 0x0c = 0x04 + 0x08 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | 1 |

0x04 和 0x08 组合是 OR 条件。跳过记录仍推进地图游标，不得让一条不合条件的记录阻塞后面波次。有效人数由 `0x4233d0` 计数玩家结构 `+0x794`，不是直接读取开局模式；普通掉命的重生等待不应自动等同于出局。

Combined bits use OR. Skipped records still advance the cursor; they must not block subsequent waves. Active count comes from player marker `+0x794` via `0x4233d0`, not initial mode alone. Temporary respawn waiting is not automatically elimination.

**0x20 是单独覆盖分支：**若带该位，`0x42d781–0x42d799` 要求注册版状态非零且装载地图数大于 6；成立直接准入，否则跳过。`0x419efb–0x419f28` 的注册版初始化可交叉佐证其版本语义。本战役只有 `S01-R0001 / S_BHOLE1A` 使用该位，所列注册版 18 图假设下出场。不再把上一轮尚未解释的 0x20 简单视为固定禁用。

**0x20 is a separate overriding gate:** registered state must be nonzero and loaded map count greater than six. Success admits directly; failure skips. Registered initialization at `0x419efb–0x419f28` supports this interpretation. Only `S01-R0001 / S_BHOLE1A` uses it, and it is admitted under this catalog's assumptions. Do not turn the previously unresolved bit into an unconditional exclusion.

0x01 在 `0x42d700` 可将出生 X 改为所选玩家 X；选择器 `0x42d600` 在有效槽位之间轮转，不是随机左右。本战役没有任何记录使用 0x01。0x02 仅见 `S02-R0466 / G_TNK1A` 与 `S16-R0426 / G_RADAR1A`，未在当前出场分支找到影响准入的消费者，保留原值，其他用途仍为 U。

Bit 0x01 can replace spawn X with a player's X; `0x42d600` rotates among enabled slots rather than randomly selecting sides. No campaign record uses it. Bit 0x02 occurs in the two listed placements; it does not alter admission in this branch, while other uses remain U. Preserve it.

## R02 原始顺序、批次与纵向偏移 / Order, batches and offsets — D/S

地图每条记录保留八个整数 / Preserve all eight integers:

| 索引 / Word | 含义 / Meaning |
|---:|---|
| 0 | 原始 X / Source X |
| 1 | 地图滚动 Y / Map scroll Y |
| 2 | 稳定原型 ID / Stable definition ID |
| 3 | 旧编辑器缓存索引，不能作稳定 ID / Legacy editor-cache index, not a stable ID |
| 4 | 本战役全部为 1；具体附加用途仍未解释 / Always 1 here; further role unresolved |
| 5 | 显式掉落 ID，-1 表示无指定掉落 / Explicit drop ID; -1 means none |
| 6 | 编队组号，0 为未分组 / Formation group, 0 ungrouped |
| 7 | 放置标志 / Placement flags |

`0x42d650` 从游标开始，要求当前滚动刻度等于首条记录 Y。局部保存当前组号与组锚点：组号变化时用该记录 Y 更新锚点；传给生成函数的偏移为 **锚点 Y − 本条 Y**。看下一条时：组号 0 要求 Y 等于锚点；非零组允许 Y 等于锚点，或与当前组号相同。符合则在同一次调用继续消费，否则停下等待下一批。

The dispatcher starts at the cursor when scroll equals the first row's Y. It tracks group/anchor locally: a group change resets the anchor to that row's Y. Spawn offset is **anchor Y − row Y**. The next ungrouped row must share the anchor Y; a grouped row may share that Y or the current group ID. Matching rows are consumed in the same call; otherwise the next batch waits.

这不是“把同编号的所有对象跨整张图拉到一起”，也不是先按所有对象 Y 排序。拒绝出场的对象仍参与游标和组结构遍历。全部原始行经过此规则后，批次刻度均非递减，无越界或遗失记录。

This does not merge every occurrence of a group ID across a map or sort all individual Y values. Omitted objects still participate in cursor/group traversal. Applying this rule to source order consumes every row with nondecreasing batch triggers.

`0x42d840–0x42d88f` 在允许滚动时增加滚动计数，并通过模 8 相位调用调度器；暂停/特定状态会阻止滚动。表内批次都是 8 的倍数。35 ms 仅沿用既有基准作名义换算，真实帧调度与录像零点仍须动态校准。

The update increments scroll when permitted and uses a modulo-eight phase for dispatch; pause/special states can stop it. Every catalog batch is aligned to eight. The existing 35 ms base is used only for nominal conversion; actual frame timing and video origin still need calibration.

## R03 出生中心点与首路径目标 / Spawn center and first path target — D/S

依据 `0x40f320–0x40f73f`、跳转表 `0x40f744` 和向量初始化 `0x41e5a0`。令 `X` 为记录横坐标，`h/w` 为原作图形尺寸，`off` 为 R02 偏移，`B = (h≤128 ? -192 : -64-h) + off`。负 Y 为屏幕上方，不是无效坐标。

From the native constructor, jump table and vector initialization. Let X be placement X, h/w original sprite dimensions, off the group offset and `B = (h≤128 ? -192 : -64-h) + off`. Negative Y is above play, not invalid.

| 本战役移动模式 / Mode | 生成中心 / Spawn center | 其他已核对初始化 / Other confirmed initialization |
|---:|---|---|
| 3 | X<200：(-16-w,B)；否则 / else：(w+415,B) | 水平入场，朝向 0x200 / 0x600；当前实现的 Y=100 不是这条原分支。 / Horizontal entry; current Y=100 does not match this branch. |
| 4 | (X,B) | 设置目标 Y 为原作视口高度变量；不等于每架立即在画面内。 / Target Y uses the native viewport-height variable; spawning is not immediately visible entry. |
| 6 | X<200：(-w,h)；否则 / else：(w+399,h) | 从侧面按 0x300 / 0x500 方向进入；该分支不使用 B。 / Side entry using headings 0x300/0x500; this branch does not use B. |
| 8 | (X,B) | 后续运动须按模式分支理解，不能套用当前运行时的停留规则。 / Interpret subsequent native movement separately from the current stopping rule. |
| 9 | (X,B) | 首目标 / first target：(X+dx0, dy0−k) |
| 10 | (X,B) | X<200 首目标 X+dx0，否则 X−dx0；首目标 Y=dy0−k。 / First X uses +dx0 on the left, −dx0 on the right. |

`k` 在路径标志含 0x10 时为 48，否则 16。模式 10 后续节点的水平正负规则与首节点初始化不同：`0x4109d8–0x410a85` 左侧减后续 ΔX、右侧加，不能用一个镜像因子处理整个路径。首段到达时还存在首步修正与状态切换；完整轨迹仍须动态校对。

`k` is 48 when path flags include 0x10, otherwise 16. Mode 10's subsequent horizontal deltas differ from its first target: subtract on the left, add on the right. One mirror factor cannot represent the entire path. First-arrival correction/state transitions still require full trajectory validation.

全部相对节点、速度变化节点和路径标志保留在定义目录。`0x410934` 在达到指定节点索引后每次推进向后速靠近 1；路径末端 0x04 循环、0x01 一次选取玩家位置、0x02 朝下退出及无出口标志移除已有分支证据。碰撞近似、完整运动更新、相机位移、首次可见帧不在本轮静态表里冒充已验证。

The catalog preserves all relative nodes, speed-change nodes and flags. Existing native evidence covers one-step speed convergence, loop/one-shot target/downward exit/removal branches. Collision approximations, complete motion, camera movement and first visible frames are not claimed verified by the static tables.

## R04 炮口与开火时机 / Gun configuration and timing — D/U

每个炮口保留原始 18 个有符号整数，初始化复制见 `0x40f050`，更新见 `0x40f770–0x40f9eb`。已知字段如下；未解释字段原值保留，不置零。

Each gun retains eighteen signed integers. Initialization copies the record; the native update processes counters. Preserve uninterpreted words rather than zeroing them.

| 索引 / Word | 含义 / Meaning |
|---:|---|
| 0,1 | 相对炮口 X,Y / Muzzle X,Y |
| 2 | 弹型 ID / Projectile type |
| 3 | 待完整解释 / Not fully interpreted |
| 4 | 初始延迟计数 / Initial-delay counter |
| 5 | 连发内部间隔 / Inter-shot delay |
| 6 | 连发周期冷却 / Burst cooldown |
| 7 | 每轮发数 / Burst size |
| 8 | 初始角度，2048 单位一圈 / Initial angle, 2048 per turn |
| 9 | 发射角步进 / Angular step |
| 10 | 瞄准控制 / Aim control |
| 11 | 待完整解释 / Not fully interpreted |
| 12 | 弹速字段 / Projectile-speed field |
| 13,14 | 弧段及间隔计数 / Arc/gap counters |
| 15 | 待完整解释 / Not fully interpreted |
| 16 | 总连发周期数 / Burst-cycle budget |
| 17 | 待完整解释 / Not fully interpreted |

实际发射还受敌机状态与屏内条件影响，不能把“生成刻度＋初始延迟”直接宣称为第一个可见弹的准确时刻。当前难度开火倍率 `[1.3,1,0.85,0.7]` 仍缺原作分支依据；本轮查到的更新函数使用原始计数，未见直接读取难度变量，但这不证明其他间接路径绝对不存在。列为 U，禁止凭手感重标定。

Actual emission also depends on enemy state/visibility; spawn plus initial delay is not a guaranteed first-visible-shot timestamp. Current firing multipliers `[1.3,1,0.85,0.7]` remain unsupported by a verified original branch. This gun update uses raw counters without directly reading difficulty, but indirect effects are not categorically ruled out. Keep this U and do not retune by feel.

<a id="drops"></a>
## R05 固定掉落与自动补给 / Explicit drops and automatic supply — D/S

`0x411187` 先按放置记录的掉落字段生成物品；定义标志 0x200 在 `0x411195` 另行调用 `0x423c70`，二者可以同时发生。某些地物的可破坏条件仍另行处理，表中有掉落字段不代表必定能击毁得到它。

The death routine processes the placement's explicit drop, then independently invokes automatic supply for definition bit 0x200. Both may occur. Scenery destruction conditions remain separate; a recorded drop does not guarantee that an object is destructible.

自动序列 `[2,3,4,13,14]`：原作关卡索引 0–5 循环前三项，6–17 循环五项。`0x423ce8` 使用 `0x4425f4/0x4425f8` 两个玩家各自的序列索引；炸弹颜色循环索引 `0x442624` 则为共享。当前实现只有一个 `supplyIndex` 且按最近玩家取状态，与这条归属链存在差异。原作入口接收击毁归属玩家结构；槽位失效时序列索引有回退，须保留其精确语义，不擅自改成最近玩家。

The sequence is `[2,3,4,13,14]`: first three entries for zero-based stages 0–5, all five for 6–17. Two player-specific indices live at `0x4425f4/0x4425f8`, while bomb-color index `0x442624` is shared. The remake has one supply index and reads nearest-player state, differing from the ownership path. Native supply receives the destruction-owner player structure and has slot fallback; preserve its exact semantics rather than substituting proximity.

| 条件 / Condition | 结果 / Result |
|---|---|
| 玩家能量 <4 / Energy <4 | 额外能量 ID 1 / Extra energy |
| 4≤能量<12 / 4≤energy<12 | 额外晶体 ID 11 / Extra crystal |
| 能量≥12 / Energy≥12 | 不补能量类 / No energy item |
| 炸弹数低于难度阈值 / Bombs below threshold | 追加一枚，ID 按 5→6→15 循环 / Add one, cycling IDs 5→6→15 |

炸弹阈值依次为容易 6、一般 3、较难 2、疯狂 1。此阈值不是用户已扩展到 18 的库存上限，不能随库存容量一起改。无归属玩家的特殊入口走 ID 5/6 选择，使用原作循环随机表，不走完整玩家补给序列；其实际触发覆盖仍需后续动态核对。

Bomb thresholds are 6/3/2/1 for Easy/Normal/Hard/Insane. These are not the user-extended capacity of eighteen and must remain independent. A null-owner entry chooses ID 5 or 6 using the original cyclic random table instead of the full player-supply path; actual triggering coverage still needs runtime verification.

| ID | 物品 / Item | ID | 物品 / Item |
|---:|---|---:|---|
| -1 | 无指定 / None | 0 | 勋章 / Medal |
| 1 | 能量 / Energy | 2 | 黄色火力 / Yellow power |
| 3 | 蓝色火力 / Blue power | 4 | 红色火力 / Red power |
| 5 | 金色炸弹 / Gold bomb | 6 | 红色炸弹 / Red bomb |
| 7 | 护盾 / Shield | 8 | 普通导弹 / Missiles |
| 9 | 追踪导弹 / Homing missiles | 10 | 满火力 / Full power |
| 11 | 晶体 / Crystal | 12 | 侧射 / Side shot |
| 13 | 后射 / Rear shot | 14 | 磁力 / Magnetic |
| 15 | 超级脉冲 / Super pulse | | |

## R06 跨关补充与其他难度分支 / Between-stage and other difficulty rules — D/U

`0x42377c–0x42380a`，跳转表 `0x42383c`：首关索引 0 跳过这段补充；之后对启用玩家执行：

The native replenishment switch skips zero-based stage 0 and processes enabled players on subsequent stages:

| 难度 / Difficulty | 能量 / Energy | 炸弹 / Bombs |
|---|---|---|
| Easy | 补至 16 / Set to 16 | 原库存<5 时加一 / Add one if below 5 |
| Normal | 补至 16 / Set to 16 | 原库存<4 时加一 / Add one if below 4 |
| Hard | 加 4，上限 16 / Add 4, cap 16 | 原库存<1 时加一 / Add one if below 1 |
| Insane | 加 2，上限 16 / Add 2, cap 16 | 不加 / No addition |

追加类型按玩家固定值：P1=0、P2=1。表述为“低于阈值加一”，不是补满阈值，也不是重置全部炸弹。暂停改难度、跳关和读档如何映射这些原流程，后续需明确一次性入口，防止重复补给。

The added type is player-specific: P1=0, P2=1. This adds one below the threshold rather than filling/resetting inventory. Later map this carefully to paused difficulty changes, stage selection and loading so it cannot be awarded repeatedly.

其他已核对分支仅记录，不自动授权修改 / Other confirmed branches are recorded without implementing them:

- 敌弹伤害：正基础值在容易为 max(1,floor(base/2))，一般 base，较难 base+1，疯狂 base+2；非正值不走此调整。普通撞击另按宽度分档，不套难度倍率。见 `0x42683f–0x426879` 与 [M2.4](../M2_4_RESEARCH.md)。
  Enemy-shot damage adjusts positive base values as above; collisions remain a separate width-based rule.
- Boss 出场：`0x40f402–0x40f43f` 基础 HP 翻倍，有效人数>1 时再加 0xa28（2600）；不是全体敌机随难度统一乘倍数。既有 HP 冻结仍有效，记录与实施授权分开。
  Boss spawning doubles base HP and adds 2600 for more than one active player. It is not a global difficulty multiplier; existing HP freezes remain.
- 注册版新局 CREDITS：`0x423650` 容易/一般/较难/疯狂为 8/6/4/4；原分支在多人/联机条件满足时再加 2。CREDITS 与每架飞机的四条生命不同，不可混为一谈；联机入口条件须继续核对。
  Registered new-run credits are 8/6/4/4, with two extra under the native multiplayer/network condition. Credits are distinct from four player lives; network-entry conditions require further checking.
- 战役循环：`0x42d1d0–0x42d246` 关卡超过装载总数后回到索引 0，难度加一并封顶 3，并有权威端信用补充。当前“第 18 关结束”与原作循环不同；这是独立流程项目，不因本次波次核对直接改动。
  Campaign wrap returns to stage index zero and increases difficulty up to three, with authority-side credit replenishment. Current stage-18 completion differs; this is a separate future flow task.

## R07 保留的未知项 / Preserved unknowns — U

- 所有原始八字段已保存，但 word4 的完整含义、0x02 的其他用途未确认。
  All raw words are retained; full word4 semantics and other 0x02 uses are unresolved.
- 无完整原机逐帧 trace；首次可见帧、精确开火帧、暂停/Boss 停滚、资源池压力下的实际漏生成，不能由静态表保证。
  Without a full native frame trace, first visibility/firing, pause/boss-scroll timing and allocation-pressure omissions cannot be guaranteed from static data.
- 完整路径首段修正、固定点移动/碰撞、部分特殊弹型、Boss 部件、连锁/地物触发仍需专项校对。
  Initial-path correction, fixed-point movement/collision, special projectiles, boss parts and scenery/chains need dedicated checks.
- 录像仅能证明已有审看范围；不以单人录像推断双人具体运行结果。新接口和自定义规则不能反向污染原作规则表。
  Footage proves only reviewed scope; solo footage does not establish two-player runtime behavior. New interfaces/custom rules must not overwrite the original-rule record.
