# 第 2 关地面装置后续定位 / Stage-two ground-object follow-up

用户要求先发布 M2.20，再处理防空装置与未破坏补给箱。这里记录补充描述后的只读核对，**不宣称新的修复已经完成**。

The user requested shipping M2.20 before addressing ground launchers and intact supply boxes. This records read-only follow-up work; **no new fix is claimed**.

## 补给箱卷动 / Supply-box scrolling

原作 S_ENBON2（ID 87，金色）及 S_ENBON4（ID 152，橙色）均为 mode 8、speed 1。原程序 0x4107cc–0x4107d7 将该速度加到 Y；当前引擎和地图卷动均每逻辑步下移 1，符合“固定于地面，随前进向下卷动”的描述。打爆后的拾取物使用独立漂浮规则，未修改。

Native S_ENBON2 (ID 87, gold) and S_ENBON4 (ID 152, orange) both use mode 8 and speed 1. Native 0x4107cc–0x4107d7 adds that speed to Y. The current engine moves them and terrain down by one unit per tick, matching terrain-bound scrolling. Drops after destruction retain their separate floating behavior.

在当前代码上检查四难度 × 单/双人 × 30/60/120 Hz 输入更新，共 24 个场景、72 个对象（另包含 G_TNK2A）：7 秒后均下移 200；暂停、切难度、恢复及 LAN 快照后相对地面的 Y 差保持不变。浏览器实际绘制也确认：两个箱子和 G_TNK2A 从 Y=150 到 230，地面 scroll 从 100 到 180，相对差均为 50，无缺图。

Current-code checks cover four difficulties × one/two players × 30/60/120 Hz updates: 24 cases and 72 objects including G_TNK2A. All move down 200 units in seven seconds. Pause/difficulty/resume and LAN snapshots preserve terrain-relative Y. Actual browser drawing confirms both boxes and G_TNK2A move from Y=150 to 230 while terrain scroll advances from 100 to 180, retaining an offset of 50 with no missing sprites.

这是受控场景，不是用户设备的异常复现。当前未找到这些地面箱子停在屏幕坐标的代码证据，不能为凑“修复”而改成另一种运动。S_ENBON3 是另一种较长、带发动机的飞行载机，不能因同为橙色就一起强制贴地。

These are controlled scenes, not reproduction on the user's device. No fixed-screen-position defect is reproduced for these ground boxes; do not change correct movement merely to produce a patch. The longer, engine-equipped S_ENBON3 is a distinct flying carrier and must not be forced onto terrain based only on its orange color.

## 防空装置识别 / Launcher identification

用户给出的特征：黑底座、棕色盖子、白色发射点、随地面向下移动。原作有相似外形，仍需准确对应白点的位置：

The description is a black base, brown cover and white firing point scrolling with terrain. Several original objects share aspects of this appearance; the white point's position distinguishes them:

| 对象 / Object | 外形与运动 / Appearance and motion | 原炮位弹型 / Native gun type |
|---|---|---|
| G_TNK1A / 85 | 中央白色圆孔，四块棕色装甲；mode 10 有自身路径 / Central white ring, four brown panels; mode 10 follows its own path | 2 |
| G_TNK2A / 88 | 两块棕色盖板，下端偏右白色尖头；mode 8 随地面 / Twin brown covers, lower-right white cone; mode 8 scrolls with terrain | 1，六个炮口 / 1, six muzzles |
| G_TNKSHT1A / 153 | 棕色底座、灰色转炮管；mode 9 有自身路径 / Brown base with gray rotating barrel; mode 9 follows its own path | 7 |

### 确定的开盖帧遗漏 / Confirmed missing cover animation

G_TNK2A 的原作图集项为 1225–1230：首项 G_TNK2A，随后五项同名 G_TNK2B；构成六帧从闭合到开启的动画，完全打开后露出两列、每列三个炮口。不是六张不同敌机，也不能把 B 一概当成损毁图。

Native entries 1225–1230 contain G_TNK2A followed by five entries named G_TNK2B. These are six closed-to-open frames exposing two columns of three ports, not six enemies or a generic damaged-B frame.

SHIPDEFS_DAT 的 ID 88 数值为 interval=1、initial pause=200、loopFrames=6、cycles=999、start=0、pauseEnd=30、pauseStart=30、pingPong=true。当前 enemy-art.js 没有该动画项，campaignObject 只画闭合图。该遗漏已确证，用户要求先发 M2.20 后再补齐；本记录不代表已经修复，也不改变原始炮位、射速、弹型或伤害。

ID 88's source fields are interval=1, initial pause=200, loopFrames=6, cycles=999, start=0, pauseEnd=30, pauseStart=30 and pingPong=true. Current enemy-art.js lacks this animation and campaignObject draws only the closed pose. This omission is confirmed and remains queued until M2.20 ships. No gun, firing-rate, projectile-type or damage change is made.

初次核对不能仅凭“斜向导弹”就把第二关上述炮位替换为 43/44。用户随后明确补充：约 45° 连发、音效为连续“fufufu”、外观类似第一关 Boss 的灰白飞弹，并要求发射与装置移动都仔细检查。该补充指向下节的另一对地面导弹台；G_TNK2A 开盖遗漏仍是独立问题，不能当作该反馈的根因。

The initial description alone did not justify substituting types 43/44 into the listed stage-two guns. The user subsequently specified roughly 45-degree bursts, repeated “fufufu” sounds and missiles resembling the first Boss's gray-white missiles, and requested careful checks of both firing and launcher movement. This points to the separate launcher pair below. G_TNK2A's cover omission remains a distinct finding, not the established cause of this report.

新增实际审看的金标 P2 时刻为 85、91、96 秒，以及拼图中的 136、140、144、148、152、156、160、164 秒；其余抓取但未审看的帧不计入证据。六帧开盖及其计数依据本地原图/定义，未声称已从录像逐帧测出间隔。原图、诊断截图及 JSON 保留在忽略目录，不发布原作像素。

Newly inspected P2 timestamps are 85, 91 and 96 seconds, plus the contact-sheet frames at 136, 140, 144, 148, 152, 156, 160 and 164 seconds. Other uninspected captures are excluded. The six poses and their counters come from local artwork/definitions, not frame-exact video measurement. Original pixels, diagnostic captures and JSON stay in ignored local storage.

## 斜置导弹台：新增证据 / Angled launchers: additional evidence

原作 G_ANGTNKR（ID 117）/ G_ANGTNKL（ID 118）具备黑色履带底座、斜置棕色盖板及白色尖端；均为 mode 8、speed 1，炮位分别使用弹型 44 / 43。本地原始记录及导出表一致，出现于第 4、6、12、16 关，第二关没有这两个定义。用户在查看参考图与定位结果后回复“对的，修复它们”，确认对象并授权修复；后续以原表关卡为准。实施见 [M2.21](M2_21_GROUND_MISSILES.md)。

Native G_ANGTNKR (ID 117) / G_ANGTNKL (ID 118) have black tracked bases, angled brown covers and white tips. Both use mode 8 and speed 1, firing types 44 / 43 respectively. Local source records agree with the exported data and place these definitions in stages 4, 6, 12 and 16, not stage two. After reviewing the references/findings, the user confirmed the targets and authorized repair. Follow source placements; implementation is recorded in the linked M2.21 document.

已确证的发射差异：

Confirmed firing differences:

- `0x429110` 跳表把 43 / 44 分别交给 `0x42963a` / `0x4296ae`；构造器忽略炮位原始角度 0，固定使用 `0x4ea` / `0x316`，即向左下/右下、偏离正下方约 41.13°。这是用户“约 45°”描述的接近候选，不应擅改为数学上精确 45°。
- 当前 `Gun.tick` 对二者直接使用炮位角度 0。实际调用两个原始炮位后均得到 `vx=0, vy=-171.428571…`：**斜向弹体竖直向上飞**，不是单纯贴图朝向错误。
- 原构造器还分别把弹型半高（43/44 为 4，8 为 8）加到炮口 Y；当前通用发射路径未应用此偏移。原敌弹更新有 233 号调色板颜色、每次 2 个航迹粒子；当前烟迹分支只处理友方导弹。这些是另列的炮口/表现差异，未修改伤害、射速或音效调度。
- 第一关 Boss 的该类飞弹是 8，使用独立的正下方构造器 `0x4295c6`，而非 43/44；原程序三种构造器均调用同一导弹音效句柄 `0x5c98b0`，现版也统一映射到 `enemyMissile`。音色相似不能作为弹型相同的证据。

- The `0x429110` dispatch table routes 43 / 44 to `0x42963a` / `0x4296ae`. Their constructors ignore raw gun angle zero and use fixed `0x4ea` / `0x316`, pointing down-left/down-right approximately 41.13 degrees from downward. This is a close candidate for the user's approximate 45 degrees, not authorization to replace it with exactly 45 degrees.
- Current `Gun.tick` directly uses raw angle zero. Calling both original gun definitions produces `vx=0, vy=-171.428571…`: **diagonal artwork travelling vertically upward**, beyond an artwork-orientation defect.
- Native construction also adds projectile half-height to muzzle Y (4 for 43/44, 8 for type 8); the current generic emission omits that offset. Native enemy-projectile updates emit two trail particles using palette color 233; the current trail branch handles friendly missiles only. These are separate muzzle/presentation differences; damage, cadence and audio scheduling remain unchanged.
- The first Boss uses type 8 and its separate downward constructor `0x4295c6`, not 43/44. All three native constructors use missile sound handle `0x5c98b0`, and the remake maps them to `enemyMissile`. Similar sound does not establish identical projectile type.

## 装置、箱子与地面相对移动 / Terrain-relative movement

扩大核对到 ID 87、152、88、117、118，保持实际炮位运行：四难度 × 单/双人 × 30/60/120 Hz 共 24 个受控场景、120 个对象，检查逻辑位置及渲染插值后的相对地面位置，均保持不变；暂停、切难度及恢复不破坏该关系。另运行第 2 / 4 关 × 四难度 × 单/双人共 16 个无敌、不主动射击的诊断场景，每场 7,200 逻辑步；累计检查 362 个目标实例、322,542 个对象采样，相对地面的 Y 与初始 X 均保持稳定。这不等于通关验收，也不是手机问题复现。

Expanded checks keep actual guns active for IDs 87, 152, 88, 117 and 118. Across four difficulties × one/two players × 30/60/120 Hz, all 24 controlled cases and 120 objects retain terrain-relative position in simulation and render interpolation, including pause/difficulty/resume. Sixteen stage-2/4 × difficulty × player-count diagnostic runs each execute 7,200 ticks with invulnerable players and no player firing: 362 target instances and 322,542 object samples preserve terrain-relative Y and initial X. These are diagnostic runs, not completed-stage acceptance or physical-phone reproduction.

**联机客户端另有可复现的插值错误。** `network-state.js` 对敌机用“上一份收到的快照”作为插值起点，但地面的 `previousScroll` 沿用房主“上一逻辑步”。两份快照相隔 3 步时，逻辑相对差始终为 100，绘制相对差却随插值从 98 → 99 → 100；相隔 6 步则从 95 → 97.5 → 100。浏览器真实 Canvas 绘制变换已复核五个对象：房主保持约 100，客户端确实为上述 98 → 99 → 100，且无缺图。该错误能解释短暂相对滑动/抖动，**不足以证明它就是单机持续固定不下移的原因**。

**A separate LAN-client interpolation defect is reproducible.** `network-state.js` starts enemy interpolation at the preceding received snapshot but retains the host's preceding simulation tick for terrain `previousScroll`. With three ticks between snapshots, authoritative offset stays 100 while rendered offset progresses 98 → 99 → 100; with six ticks it progresses 95 → 97.5 → 100. Actual browser Canvas transforms confirm all five objects: host offset remains approximately 100, client offset follows 98 → 99 → 100, with no missing artwork. This explains brief relative sliding/jitter, **not an established cause of persistent stationary objects in solo play**.

以上为修复前取证基线。补给拾取物、能自主行驶的炮台、贴地装置分开判断；不把所有 ground 标志对象统一强制绑定背景。用户确认后的修复分别覆盖斜弹构造、炮口与航迹、客户端地面插值；单机持续固定不下移的现象仍未复现。诊断脚本和 JSON 在忽略的 `.local/m221-*` 下，原作参数不变。

The above is the pre-fix evidence baseline. Floating drops, independently moving turrets and terrain-bound fixtures remain separate; do not bind every ground-flagged object to the background. The authorized fixes separately cover diagonal construction, muzzle/trail presentation and client terrain interpolation; persistent stationary objects in solo play remain unreproduced. Diagnostic scripts/JSON stay in ignored `.local/m221-*`; source parameters remain unchanged.
