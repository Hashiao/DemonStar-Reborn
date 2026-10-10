# M2.9 全战役回退排查 / Campaign fallback audit

用户要求从第二关扩展到全部十八关。依据本地 DemonStar 4.04 的 Game.glb、game2.glb、Game3.glb、关卡对象表和[指定录像](REFERENCE_VIDEO.md)，先建立名称清单再修改渲染。原始图片只留在忽略目录。

The user expanded the stage-two issue to all eighteen stages. Local DemonStar 4.04 archives, campaign records and the designated recording supply evidence. Inventory names before changing rendering; original pixels remain ignored.

## 根因与覆盖 / Cause and coverage

旧 `shipCell` 通过编号取模选六种飞机；未知地面名称取默认编号，因而锅盖和坦克也变成红色飞机。地物另走通用矩形，敌弹按取模风格绘制整张留白格，造成形状和颜色不清。这是旧覆盖缺口，不是原始关卡数据回退。

The former `shipCell` selected six fighters by numeric modulo. Unknown ground names received a default number, turning lids/tanks into red fighters. Scenery used generic rectangles and enemy bullets used modulo styles with padded cells. This was incomplete presentation coverage, not a regression in original campaign records.

- 387 个定义、366 个实际使用定义；251 个不同原型，十八关实际用 244 个。新增 213 个名称映射，保留 38 个既有明确路由。所有定义必须显式映射，未知名称记录诊断，不再伪装成通用飞机。
- 387 definitions, 366 used; 251 distinct prototypes, 244 used across the campaign. Add 213 named mappings and retain 38 existing explicit routes. Unknown names produce diagnostics instead of generic fighters.
- 第二关：G_STAT1A 灰色闭合盖、G_STAT2A 棕芯盖、G_TNK1A / G_TNK2A 履带坦克、G_TNKSHT1A 旋转炮塔、G_TUR1A 固定炮台、G_RADAR1A 雷达及停机、气罐、管道各自映射。原表 HP 不变。
- Stage two: gray closed lids, brown-core lids, tracked tanks, rotating turrets, fixed emplacements, radar, parked craft, tanks and pipes have their own named art. Original HP remains unchanged.

完整逐名称、定义 ID、关卡、原作尺寸、裁切和 SHA-256 见 [coverage](campaign-art-coverage.json)；重绘操作和提示词见 [ART_M2_9](ART_M2_9.md)。四种矿石使用专用透明散点，以原作轮廓和稀疏程度校准，不导出原像素坐标。

The coverage file records names, definition IDs, stages, original geometry, crops and SHA-256. ART_M2_9 records redraw operations/prompts. Four ore types use dedicated transparent flecks calibrated to source footprints/density, without exporting original pixel coordinates.

## 敌弹 / Enemy shots

| 类型 / Type | 本地图形索引 / Local graphic index | 外形 / Appearance |
|---|---|---|
| 0 | 532–533 | 灰色圆弹 / Gray round shot |
| 1,12 | 534–535 | 黄白菱形 / Yellow-white diamond |
| 2,3,40 | 548–549 | 金色圆弹 / Gold round shot |
| 7 | 536–537 | 蓝色菱形 / Blue diamond |
| 8 | 538–539 | 向下红头、蓝尾导弹 / Downward red-nose blue-tail missile |
| 9 | 544–547 | 既有四帧蓝激光 / Existing four-frame blue beam |
| 10 | 593–597，炮口 598 / cap 598 | 五帧红粉激光 / Five-frame red-pink beam |
| 11 | 554–557 | 既有橙色星弹 / Existing orange star |
| 41 | 550–553 | 四帧蓝色球 / Four-frame blue orb |
| 42 | 585–588 | 四帧红色四芒星 / Four-frame red four-ray star |
| 43,44 | 507,503 | 左下、右下导弹 / Down-left and down-right missiles |

原程序 `0x429722` 把 9/10 都绑定发射对象；`0x428a77` 使用宽 8、向下 480 的光束判定。补齐 10 号分支，播放五帧、随炮口移动，仍使用原表伤害 16 和现有四难度伤害函数。9 号已有行为不变。弹体按各帧可见尺寸和偏移绘制，43/44 已带斜向姿态，不再额外旋转。

Original `0x429722` attaches both 9/10 to their emitter; `0x428a77` checks a rectangle eight units wide and 480 downward. Restore type 10's five-frame muzzle-bound behavior, keeping original damage 16 and the existing difficulty function. Type 9 is preserved. Render per-frame visible dimensions/offsets; 43/44 already encode diagonal poses.

本地程序 SHA-256：`d3d9d0205b069e5d134fdedba7b9fbd74ebcafd9785b7c9ce3d2e5ed847691b2`。本轮未改变其他敌弹路径、原始敌机 HP、玩家武器伤害、关卡记录或超级武器旧预算。

Local executable SHA-256 is shown above. Other enemy trajectories, base HP, player damage, campaign records and provisional superweapon budgets remain unchanged.

## 分层和内存 / Layers and memory

G_TUR1A、G_TNKSHT1A、S_STAT9A、S2_SHIP29A、S2_SHIP31A 保持底座不动，只转动炮管。根据原图轴心、人工核对的炮管边界和生成图轴心组合。它仍是重绘旋转近似，不是原作每方向光照精确复制。其余新增方向对象按原首帧朝向旋转。

The five named turret families keep their bases fixed and rotate only barrels, using original hubs, manually checked barrel bounds and redrawn hubs. This is a rotated redraw, not exact original directional lighting. Other new directional prototypes rotate from the original first pose.

只持有当前关需要的对象图集，换关释放旧图片与染色缓存；敌弹图集共享。透明沟槽用于划分生成单元，并排除边界碎片。资源就绪要求 `complete && naturalWidth > 0`，避免只读到 PNG 尺寸就误判加载完成。浏览器当前关新增对象图集解码量 0–78 MiB；这不等于 App 总内存，红色染色缓存仍会增加占用。

Retain only current-stage object atlases and evict old images/tint caches; share enemy-shot atlases. Transparent gutters partition generated cells and exclude edge fragments. Readiness requires complete images as well as nonzero dimensions. Current-stage new object atlases decode to 0–78 MiB in browser checks; this is not total app memory and red tint caches add overhead.

## 验证边界 / Verification limits

新增回归检查全定义/地图覆盖、所有 15 种敌弹、裁切范围与资产哈希、第二关原型、五类炮台及红激光生命周期。浏览器逐关实绘全部 244 个原型并检查可见像素，另捕获每关 60/120/180 秒场景；这不是玩家完整通关测试。原作视频每集审看四个代表时刻，共 72 帧，记录在参考文档。

New regressions cover all definitions/maps, fifteen enemy-shot types, crop bounds/hashes, stage-two prototypes, five turret families and red-beam lifetime. Browser checks render all 244 used prototypes with visible-pixel assertions and capture 60/120/180-second scenes in every stage. These are not full player-played clears. Seventy-two original representative frames are documented separately.

本轮没有核验全部原作动画帧、阴影、残骸细节、敌弹每种动画节拍及所有旋转姿态；不得把基础外形覆盖标成完整 1:1。最低系统与真机测试状态以发布验收记录为准。

Complete original animations, shadows, wreck detail, every shot-animation cadence and every directional pose are not certified in this pass. Base silhouette coverage is not full 1:1 fidelity. Release verification records actual OS/device coverage.
