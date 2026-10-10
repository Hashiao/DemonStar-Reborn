# M2.10 蓝色 P2 战机与 HUD

2026-10-10：用户提供双人原作截图，并在澄清后明确选择“按这张原作截图的排列”。P2 战机、上方余命和下方状态小飞机为蓝色；状态组靠右下角，小飞机在能量条左端，炸弹位于上方。该确认取代先前口述的镜像排列，详见 [开发记录](M2_10_DEVELOPMENT.md)。

2026-10-10: the user supplied a two-player original screenshot and explicitly chose its arrangement after clarification. P2's fighter, spare-life icons and status ship are blue. Its status group sits bottom-right, with the ship left of the energy bar and bombs above. This supersedes the earlier verbal mirror arrangement.

本地原作 `Game.glb` 包含独立 `PLAYER2A–Q` 和 `PLRICON2`。本轮查看 `PLAYER2I`、`PLRICON2` 并以其配色和轮廓作为参考；原图及用户截图只保存在忽略的 `.local/reference/`。没有把原始资源作为发布资产。

The local original contains separate PLAYER2A–Q and PLRICON2 entries. PLAYER2I and PLRICON2 were inspected as palette/silhouette references. Original images and the user screenshot remain in the ignored reference directory; no original pixels are redistributed.

发布素材：`web/assets/player2-motion-hd.png`，由内置 imagegen 编辑既有重绘 P1 姿态图集生成，1402×1122 RGBA、5 列×4 行。前 17 格为蓝色机体，索引 17 为蓝色 HUD 小飞机，其余两格不用。保持现有 17 姿态布局；没有声称本轮完成原作全部姿态逐帧校准。暖色尾焰继续从既有独立喷焰格绘制，不使用蓝色火焰。

Published asset: `web/assets/player2-motion-hd.png`, generated with built-in imagegen by editing the existing redrawn P1 atlas. It is 1402×1122 RGBA with five columns/four rows: seventeen blue body poses and one blue HUD icon at index 17; the final two cells are unused. Existing pose layout is retained, without claiming complete original pose calibration. Warm exhaust continues to use the existing independent flame cells.

SHA-256: `bbb956f5ab75a6086c697839cd51b3dfafc842626341fceb4b036a78b83ea6ab`。

HUD 蓝色小飞机的紧裁切为 `[632,903,138,135]`，通过 CSS 背景定位使用同一重绘图集，不把留白缩入图标。P2 的机体和 HUD 均显式选用蓝图；扩展的 P3/P4 分别复用红/蓝，并保留编号。P3/P4 仅为协议与内核预留，当前不开放三、四人玩法。

The blue HUD ship uses a tight `[632,903,138,135]` crop through CSS background coordinates. P2 body and HUD explicitly use this blue atlas. Extended P3/P4 reuse red/blue with distinct numbers; P3/P4 remain a protocol/core reserve, with no current three/four-player mode.

生成提示词要点 / Generation prompt summary:

> Use case: precise-object-edit. Production DemonStar P2 sprite atlas, transparent RGBA. Input image 1 is the existing generated HD PLAYER1 motion atlas to edit. Input image 2 is the authoritative local original PLAYER2I blue fighter color reference. Input image 3 is the original PLRICON2 blue HUD life icon reference. Produce a 5-column by 4-row equal-cell atlas. First 17 cells row-major preserve the existing fighter silhouettes, scale, centers, banking poses, silver rails and mechanical structure. Change red painted hull/wings to original P2 medium blue, with icy blue highlights and navy recesses. Keep silver metal and warm cockpit details. In index17, add one blue HUD ship matching PLRICON2; final two cells transparent. Keep original warm exhaust in its separate atlas. No redesign, captions, grid, background, shadow or outline halos. True transparent alpha and original arcade readability.

核查：18 个使用格都有透明背景上的非空内容；浏览器检查 17 格蓝色主色、各姿态选择蓝图、尾焰仍选择原暖色图。P2 HUD 检查蓝色素材、右下角位置、小飞机在能量条左侧、炸弹在能量条上方，并复查 1P 素材未改。

Checks cover eighteen nonempty used cells, blue-dominant body pixels in all seventeen poses, body/exhaust routing, blue HUD assets, bottom-right placement, ship-left/energy-right ordering and bombs above. The P1 assets remain unchanged.
