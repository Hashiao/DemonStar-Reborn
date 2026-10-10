# M2.8 追踪弹与三色六档 / Homing missiles and six tiers per color

## 简体中文

依据本地 DemonStar 4.04（EXE SHA-256 `d3d9d0205b069e5d134fdedba7b9fbd74ebcafd9785b7c9ce3d2e5ed847691b2`）与用户提供的 [18 关原作录像](https://www.bilibili.com/video/BV1Xf4y1p7F1/)。视频作为持续视觉参考，抽样记录见 [录像金标](REFERENCE_VIDEO.md)。本轮逐档核对原始表、原图尺寸、发射分支和代表画面；没有声称逐秒看完 18 关或录像展示了所有中间等级。

### 已定位并修复

| 问题 | 原作证据 | M2.8 |
|---|---|---|
| 追踪弹过粗 | 38 普通导弹与 39 追踪导弹的图形都是 4×8；当前却显示为 8×17 | 恢复 4×8，保留蓝/红小尾翼与黄色尾焰，增加细小灰色航迹 |
| 转弯越追越慢 | `0x428908` 先按速度 8 移动，再转向；当前混合速度向量使长度不断缩短 | 每逻辑步保持 8，先移动再更新方向；不再意外衰减速度 |
| 频繁抢换最近目标 | `0x40fc90` 循环寻找活动非地物目标；`0x428918` 只有原目标失效才重新获取 | 发射时循环分配、持有目标，失效再选；保持屏外保护 |
| 转向规律不对 | `0x428950–0x4289a7` 在 2048 角单位一圈中按 ±64 转动，转后与目标差≤64则对齐 | 恢复固定步长及转后对齐；注意这不是简单地把最终每步转角限制为 64 |
| 导弹姿态/结束 | `0x428a52` 为 `(angle+2)>>7 &15`，共 16 向；`0x428a27` 超过 100 次更新自毁；越界清理在 `0x428e00` | 16 向显示、101 步保险丝和爆点、四边 16 像素清理边界 |
| 黄色侧弹被画成单根 | 18–25 号弹各自一张原图含两条并排斜弹，而旧版套用了单条直弹 | 按原图两块轮廓组合重绘笔画；仍是一颗逻辑弹，不额外翻倍伤害 |
| 蓝红弹体过大或轮廓不对 | 蓝色原图 3×8、3×12、3×16；红色 1×14、3/5/9/11/13×16；旧显示额外放大 1.5 倍，红色辅助弹复用长条 | 恢复原始尺寸，红色保持平头直边、辅助弹使用 3×4 小弹；不将所有弹体按飞行方向旋转 |
| 红色辅助弹不减速 | 模板 +56/+60：32/33 每步 −1 到 12；34–37 每步 −2 到 8，见 `0x428b28` | 先按本步速度移动，再减速至各自下限；主红条仍固定 16 |
| 发射后相对位移缺失 | `0x429e9d` 主炮继承两步主机位移；`0x42a00c` 追踪弹一步；`0x429fb1` 普通导弹零步 | 分别保留 2/1/0 步，之后独立飞行 |

“8/16/24”是原作每次逻辑更新的位移值，本项目沿用 35 ms 步长。未用录像目测百分比修改全局速度，也未改基础 HP、普通武器伤害、原有超级武器预算、主炮射速或库存间隔。

### 六档对照（基础双发始终叠加）

| 颜色 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| 黄：弹型 | 16×2 | 17×2 | 17×2 +18/19 | 17×2 +22/23 | 前档 +20/21 | 17×2 +22/23 +24/25 |
| 蓝：中央/外侧 | 3×8 双发 | 3×12 双发 | 3×16 双发 | 中央 3×16，外侧 3×8 | 中央 3×16，外侧 3×12 | 四条 3×16 |
| 红：主条宽/辅助弹 | 1 /32 | 3 /33 | 5 /34 | 9 /35 | 11 /36 | 13 /37 |

黄弹高档是更多不同倾角的成对弹体；蓝弹先增长、再增加外侧双发；红弹主条逐档加宽，同时有沿原 16 相位表发射的小弹。不是三色共用同一套“加粗＋散射”。现有原始炮位、伤害与相位表 `player-rules.js` 保持字节一致。

[黄色六档实绘](screenshots/weapon-yellow-levels.png) · [蓝色六档实绘](screenshots/weapon-blue-levels.png) · [红色六档实绘](screenshots/weapon-red-levels.png) · [追踪弹](screenshots/homing-missiles.png) · [重绘素材与完整提示词](ART_M2_8.md)。对比图来自构建后的真实 Canvas 渲染，不是概念图。

### 明确保留的边界

- 本版循环目标按稳定出生 ID 排列，未完全复现原程序 128 槽位回收次序；锁定、失效重选及非最近目标原则已经修正。
- 敌我碰撞仍有圆形扫掠近似；没有在本轮宣称碰撞逐像素一致。磁力武器及磁力清屏仍使用旧转向实现，不能把追踪导弹修复当作它们也已核验。
- 16 向导弹由同一重绘弹体按原方向档位旋转，未复制原 16 张像素图；烟迹 0.28 秒/1.6 显示单位为视觉近似。
- 高清黄色双弹内部使用原独立轮廓边界组合，非原始像素复印；局部光照和形状仍是重绘。保留原作画风不等于宣称整作 1:1 验收完成。

## English

Evidence comes from the local DemonStar 4.04 binary with the SHA-256 above and the user's [18-stage original recording](https://www.bilibili.com/video/BV1Xf4y1p7F1/). [Reference coverage](REFERENCE_VIDEO.md) records representative frames. This pass audits all eighteen color/tier combinations against original tables, sprite dimensions and firing branches; it does not claim every second of all stages was watched or every intermediate upgrade appears in the video samples.

- **Missile shape:** both ordinary type 38 and homing type 39 use 4×8 sprites. The old 8×17 display was too large. Restore the thin blue/red fins and yellow exhaust, with a small grey trail.
- **Speed and lock:** `0x428908` moves at eight units per tick before steering. Velocity blending incorrectly reduced speed. The new implementation preserves eight, cycles active targets through `0x40fc90` semantics, and keeps a lock until invalid instead of repeatedly chasing the nearest enemy.
- **Steering:** `0x428950–0x4289a7` turns by ±64 in a 2048-unit circle, then snaps when the remaining difference is at most 64. This post-turn snap means the final angular change is not always capped at 64. Display uses the source sixteen headings; the fuse expires on update 101 and boundary cleanup uses sixteen units.
- **Yellow:** types 18–25 are paired parallel pellets inside one projectile sprite. Reconstruct both strokes at their original component bounds while retaining one logical projectile and one damage application. Six tiers add distinct pairs and angles, not uniformly enlarged single tracers.
- **Blue:** original dimensions are 3×8, 3×12 and 3×16. Levels one to three lengthen the central pair; levels four to six add outer short, medium and long pairs. Remove the old extra 1.5 scaling.
- **Red:** main widths are 1/3/5/9/11/13, with height 14 at the first tier and 16 afterward. Restore flat rectangular shafts and a separate upright 3×4 auxiliary pellet. Auxiliary types 32/33 start at 20 and decelerate by one to 12; types 34/35/36/37 start at 21/22/24/24 and decelerate by two to eight. Main shafts stay at sixteen. Original sixteen-phase emission tables remain intact.
- **Initial displacement:** main shots inherit two player movement updates, homing missiles one, ordinary missiles none (`0x429e9d`, `0x42a00c`, `0x429fb1`). Subsequent flight is independent.

These are per-update source values under the existing 35 ms simulation, not a new global speed multiplier estimated from video. Base HP, player damage tables, main firing cadence, missile inventory cadence and provisional superweapon budgets are unchanged. `player-rules.js` remains byte-identical.

The table above lists all six tiers per color, always in addition to default paired guns. The linked three-color galleries are actual built Canvas renders. The new [asset and complete prompts](ART_M2_8.md) use built-in imagegen.

Remaining limits: target cycling uses stable spawn IDs rather than fully reproducing the original 128-slot allocator's reuse order; collisions retain swept-circle approximations. Magnetic weapons and magnetic nova steering are unchanged and were not verified by this homing-missile fix. Sixteen missile headings rotate one HD redraw rather than copying original directional pixels. The 0.28-second, 1.6-unit smoke trail and reconstructed HD pellet interiors are visual approximations. Complete 1:1 fidelity is not claimed.
