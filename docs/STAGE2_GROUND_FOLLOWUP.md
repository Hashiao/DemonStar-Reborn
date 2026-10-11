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

当前不能把“斜向导弹”直接对应为弹型 43/44：它们是独立固定斜向构造器，不在上述第二关炮位里。已发出中央白孔/下端白尖的识别问题；在对应前不擅自旋转球弹或替换武器类型。

The phrase “diagonal missile” cannot automatically be mapped to types 43/44: they have separate fixed-diagonal constructors and do not occur in these stage-two guns. A central-ring/lower-right-cone identification question is pending. Do not rotate spherical bullets or substitute weapon types before matching the emitter.

新增实际审看的金标 P2 时刻为 85、91、96 秒，以及拼图中的 136、140、144、148、152、156、160、164 秒；其余抓取但未审看的帧不计入证据。六帧开盖及其计数依据本地原图/定义，未声称已从录像逐帧测出间隔。原图、诊断截图及 JSON 保留在忽略目录，不发布原作像素。

Newly inspected P2 timestamps are 85, 91 and 96 seconds, plus the contact-sheet frames at 136, 140, 144, 148, 152, 156, 160 and 164 seconds. Other uninspected captures are excluded. The six poses and their counters come from local artwork/definitions, not frame-exact video measurement. Original pixels, diagnostic captures and JSON stay in ignored local storage.
