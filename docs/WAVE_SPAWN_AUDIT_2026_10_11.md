# 单双人波次与补给出场审计 / Solo and two-player spawn audit

日期 / Date: 2026-10-11。基线 / Baseline: `8c4ed74` / v0.2.16。

**结论：存在已定位的出场条件缺失，本轮只取证，未修改玩法。** 原作按每条地图记录的标志、当前难度和有效玩家数判断是否生成。当前实现保留了这些记录字段，却不执行筛选，因此单人也生成额外补给载机及部分有条件的普通敌机。不能按左右对称关系统一砍半，不能一律保留左边，也不能随机选择一边。

**Finding: spawn eligibility is missing; this turn records evidence without changing gameplay.** The original evaluates each placement's flags, current difficulty and active-player count. The remake preserves the fields but skips this filtering, so solo play also spawns extra supply carriers and some conditional regular enemies. Do not halve symmetric formations, always retain the left side or randomly choose a side.

## 1. 金标视频实际对照 / Actual reference-video comparison

来源 / Source: [用户指定十八关录像 / designated eighteen-stage recording](https://www.bilibili.com/video/BV1Xf4y1p7F1/)。本轮定位播放器后查看截图，抽查第一与第三分集；不是十八关全程逐帧验收。具体审看时刻见 [录像记录](REFERENCE_VIDEO.md)。

This review sought the video player and inspected screenshots from parts one and three. It is not complete frame-by-frame verification of all eighteen stages. The linked reference log records the frames actually inspected.

| 录像位置 / Video position | 实际可见 / Observed | 对应地图记录 / Matching placement data |
|---|---|---|
| [第一关 50.5–51 s / Stage 1](https://www.bilibili.com/video/BV1Xf4y1p7F1/?p=1&t=50) | 左侧金色补给载机。 / Left gold carrier. | 保留 X=136、滚动位置 1064、标志 0；额外 X=312、1080、标志 8。 / Keep X=136, scroll 1064, flags 0; extra X=312, scroll 1080, flags 8. |
| 第一关 74–75 s / Stage 1 | 左侧橙色补给载机。 / Left orange carrier. | 保留 X=104、1736、标志 0；额外 X=296、1736、标志 8。 / Keep X=104, scroll 1736, flags 0; extra X=296, same scroll, flags 8. |
| [第一关 104 s / Stage 1](https://www.bilibili.com/video/BV1Xf4y1p7F1/?p=1&t=104) | 右侧橙色补给载机；106 s 可见后续爆炸/掉落。 / Right orange carrier, with subsequent explosion/drop visible at 106 s. | 保留 X=336、2520、标志 0；额外在左侧 X=80、2544、标志 8。 / Keep X=336, scroll 2520, flags 0; extra is on the left at X=80, scroll 2544, flags 8. |
| 第一关 127 s、166/170 s / Stage 1 | 两处左侧金色补给载机。 / Left gold carriers in both sections. | 分别对应 X=136、3232 及 X=112、4312 的无条件记录；各有独立的标志 8 额外记录。 / Match unconditional records at X=136/scroll 3232 and X=112/scroll 4312, each with a separate flags-8 extra. |
| 第三关 13 s / Stage 3 | 左侧橙色补给载机。 / Left orange carrier. | 保留 X=128、8、标志 0；额外 X=288、32、标志 8。 / Keep X=128, scroll 8, flags 0; extra X=288, scroll 32, flags 8. |
| [第三关 53–56 s / Stage 3](https://www.bilibili.com/video/BV1Xf4y1p7F1/?p=3&t=53) | 只有右侧金色补给载机，左侧其他敌机仍正常出现。 / Only the right gold carrier; other left-side enemies remain present. | 保留 X=280、1144、标志 0；额外在左侧 X=80、1184、标志 8。两条地图记录的指定掉落均为编号 6。 / Keep X=280, scroll 1144, flags 0; extra left X=80, scroll 1184, flags 8. Both records specify drop ID 6. |

表中坐标与滚动位置是地图数值，不是截图像素或录像秒数。视觉用于核对载机侧别及出场，掉落编号由原表确定，不凭低分辨率图标猜测。未审看录像的难度选择菜单，不能声称已直接确认录像采用哪一档难度。

Coordinates and scroll positions are map values, not screenshot pixels or video seconds. Visuals establish carrier side/spawning; drop IDs come from the original table rather than low-resolution icon guesses. The difficulty-selection menu was not reviewed, so the recording's exact difficulty is not directly established.

## 2. 原作分支 / Original eligibility branch

取证对象为本地 `Deamon Star/ds.exe`，SHA-256：`d3d9d0205b069e5d134fdedba7b9fbd74ebcafd9785b7c9ce3d2e5ed847691b2`。依据 `0x42d650` 地图出场函数；`0x42d731–0x42d7a1` 读取记录第八个整数，即当前数据的 `record[7]`。难度变量 `0x43ca9c` 已有 [M2.4 记录](M2_4_RESEARCH.md) 交叉佐证。

The local executable with the stated hash is the evidence source. Map spawning starts at `0x42d650`; `0x42d731–0x42d7a1` reads the eighth placement integer, now `record[7]`. Existing M2.4 research independently identifies difficulty variable `0x43ca9c`.

| 出场条件位 / Eligibility bits | 原作准入规则 / Original admission rule |
|---|---|
| 无 0x04/0x08 / Neither bit | 正常生成。 / Spawn normally. |
| 仅 0x04 / Only 0x04 | 较难或疯狂。 / Hard or Insane. |
| 仅 0x08 / Only 0x08 | 有效玩家数 >1，或疯狂；单人容易/一般/较难不生成。 / More than one active player, or Insane; omit in solo Easy/Normal/Hard. |
| 同时 0x04、0x08 / Both bits | 较难/疯狂，或有效玩家数 >1；两个条件是“或”，不是“且”。 / Hard/Insane, or more than one active player; the conditions combine with OR, not AND. |

`0x4233d0` 遍历两个玩家结构并计数 `+0x794` 的有效标记；`0x426433` 可在玩家退出有效状态时清除此标记。这不是简单读取最初选了几人，也不能把临时重生等待直接当成少一人。修复时还需把该语义映射到本项目的死亡出局、重连/断线和暂停改难度流程。

`0x4233d0` counts the active marker at `+0x794` in two player records; `0x426433` can clear it when a player becomes inactive. This is not simply the initial player-count selection, nor should temporary respawn waiting be treated as a missing player. A fix must map these semantics to elimination, disconnect/reconnect and paused difficulty changes in the remake.

侧别不是本分支随机生成的结果：记录的 X 在 `0x42d72b` 读取。第 0 位另有按玩家位置出场的路径，但全部 207 条 `S_ENBON1–4` 载机记录都没有该位。补给是否出现由每条固定放置记录判断，不能从“在左还是在右”反推出是否删除。

The branch does not randomly select a side: it reads the placement X at `0x42d72b`. Bit 0 has a separate player-position spawning path, but none of the 207 `S_ENBON1–4` placements use it. Eligibility belongs to each fixed placement; left/right geometry cannot decide deletion.

另有 `0x20` 特殊条件分支，十八关仅一条对应黑洞地物，本轮不把它混入补给统计，也不声称已完整解释全部地图标志与分组时序。原作多玩家 Boss 加血是另一条分支，非本次补给修复范围，不在此解除 HP 冻结。

A separate `0x20` condition applies to one black-hole scenery placement. It is outside carrier counts, and this audit does not claim all map flags/group scheduling are understood. Multiplayer boss HP is a separate branch, outside the supply-spawn scope; HP freezes remain intact.

## 3. 当前缺失与数量范围 / Current omission and counts

[加载关卡](../web/js/original-rules.js#L91) 把全部事件按滚动位置排序；[spawnRecord](../web/js/original-rules.js#L195) 直接构造对象；[推进循环](../web/js/original-rules.js#L499) 达到位置后逐条生成，没有上述准入判断。

Stage loading sorts every event by scroll position; `spawnRecord` constructs objects directly, and the progression loop spawns each eligible-by-position event without the original flag/difficulty/player admission logic.

本轮用实际 `Game` 类分别创建单人/双人实例，逐条调用原有生成入口，十八关均得到相同放置记录数与载机数。这是生成路径诊断，不是十八关完整实机通关。下表“原作应加载”来自逐条静态条件核对，不冒充原机整场观测数量。

The diagnostic instantiated the actual `Game` class for one/two players and called its existing spawn entry for every record. All eighteen stages produced identical placement/carrier counts. This tests the spawn path, not complete hardware playthroughs. Expected original counts below are static eligibility calculations, not claimed full-run observations.

| 关卡 / Stage | 当前单人、双人各自 / Current each mode | 原作一般单人 / Original Normal solo | 原作一般双人均有效 / Original Normal, two active players |
|---|---:|---:|---:|
| 1 | 12 | 6 | 12 |
| 2 | 14 | 6 | 14 |
| 3 | 10 | 5 | 10 |
| 4 | 15 | 9 | 15 |
| 5 | 14 | 5 | 14 |
| 6 | 14 | 7 | 14 |
| 7 | 8 | 4 | 8 |
| 8 | 12 | 6 | 12 |
| 9 | 10 | 4 | 9 |
| 10 | 13 | 5 | 12 |
| 11 | 10 | 5 | 10 |
| 12 | 12 | 6 | 12 |
| 13 | 8 | 4 | 8 |
| 14 | 12 | 6 | 12 |
| 15 | 11 | 6 | 10 |
| 16 | 8 | 4 | 8 |
| 17 | 14 | 8 | 14 |
| 18 | 10 | 5 | 10 |
| 合计 / Total | 207 | 101 | 204 |

统计对象仅四种补给载机，不包括所有会掉落物品的普通敌机、地物或最终掉落枚数。一般双人仍比当前少三条，是仅带 0x04 的载机需要更高难度；所以“双人保持全表，单人除以二”同样不正确。

These counts cover the four supply-carrier sprites, not every item-dropping enemy/scenery object or the number of resulting pickups. Normal two-player play omits three current carriers because those use only 0x04 and require higher difficulty. Thus “full table for two players, divide by two for solo” is also wrong.

全表 8,368 条放置中，325 条带 0x08，132 条带 0x04，其中 16 条同时具备两位。325 条中 103 条是补给载机，其余也包含普通敌机/地物。因此用户观察到的补给差异确实存在，但不能进一步断言“只有补给有条件，普通敌机都一样”。没有条件位的普通波次保持原样。

Among 8,368 placements, 325 carry 0x08 and 132 carry 0x04, including sixteen with both. Of the 325, 103 are supply carriers; others include regular enemies/scenery. The reported carrier discrepancy is real, but “only supplies vary and all regular enemies are identical” is not supported. Unconditional regular waves stay unchanged.

## 4. 后续修复边界 / Scope for a later fix

- 在出场入口按原始标志判断，保留原始地图、坐标、顺序和掉落编号；不删除原表记录，不做左右配对删减。
  Evaluate original flags at spawning while preserving map records, coordinates, order and drop IDs; do not delete source rows or prune left/right pairs.
- 在实际出场时读取难度和有效玩家数，避免仅开局预筛选导致暂停改难度、玩家出局等状态失效；已出场对象不因规则变化追溯消失。
  Read difficulty/active-player state at spawn time rather than filtering only at launch, to accommodate paused difficulty changes and elimination. Existing objects should not disappear retroactively.
- 分别验证 0/4/8/12 标志 × 四难度 × 单双人，并针对左右相反的载机样例、普通无条件编队、双人一人出局及 LAN 主机生成检查。
  Verify flags 0/4/8/12 across four difficulties and one/two players, with opposite-side carrier examples, unconditional formations, one-player elimination and authoritative LAN spawning.
- 本轮没有修改 Android、iOS 或共用玩法代码，没有调 HP/伤害、发包或宣称已修复。修复实施另行执行。
  No Android, iOS or shared gameplay code, HP/damage or release packages changed; this is not a fix claim. Implementation is a separate step.

本地证据位于忽略目录 `.local/reference/wave-audit-2026-10-11/`（原分支文本、数值统计）及 `.local/reference/video-review/`（播放器截图）。不提交原 EXE、原视频或参考截图。

Private evidence lives in the ignored wave-audit directory (native-branch text and numeric statistics) and video-review directory (player screenshots). Original executables, video and reference screenshots are not committed.
