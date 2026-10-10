# M2.9 重绘来源 / Redraw provenance

使用内置 imagegen，参考本地 4.04 图形；没有发布原始像素。18 张最终 PNG：15 张对象图集、2 张敌弹图集、1 张炮台分层图集。第 20 次调用修正第 9 张对象图集；第 19 次矿石尝试弃用，四种矿石改为确定性透明散点。AI 基础外形与细节不代表逐帧精确复制。

Built-in imagegen referenced local 4.04 sprites; no source pixels are published. Eighteen final PNGs comprise fifteen object atlases, two enemy-shot atlases and one layered-turret atlas. Operation 20 corrects object atlas 9. Operation 19's ore attempt was rejected; four ore families use deterministic transparent flecks. AI base silhouettes/details are not exact frame-by-frame replicas.

完整机器记录与最终哈希见 [manifest](art-m29-manifest.json)。裁切依据透明沟槽及原作数值边界，固定炮台底座/炮管独立。图集中的矿石旧尝试格不参与渲染。

See the manifest for full operation records and final hashes. Crops use transparent gutters and original numeric bounds; fixed turret bases/barrels are separate. Unused solid-ore cells in the object atlases are never rendered.

## 01 — web/assets/campaign-objects-01-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-01-hd.png)

完整提示词 / Full prompt:

```text
Create a production HD sprite atlas from the supplied DemonStar 4.04 original reference sheet. This is faithful redrawing, not new designs. EXACTLY 4 equal columns by 4 equal rows, square canvas, 16 isolated objects in EXACT reference row-major cell order. Read the tiny reference labels only to preserve mapping; output NO TEXT, numbers, grid, labels or background. Transparent RGBA outside every object. Preserve EACH object's silhouette, original orientation, component placement and colors. Orthographic top-down 1990s industrial arcade style; crisp painted metal, restrained highlights, no sci-fi redesign, no added wings, no floating floor shadows. Give each object a modest clear margin so none touches another cell. Do not add a gun to a lid or change ground equipment into aircraft. Parked fighters remain as drawn. Gray objects stay gray; brown tanks stay brown; red details stay red. Keep the original width-to-height proportions within each cell, and accurately reproduce distinct matching pairs. Detailed cell requirements: Cell1 faceted closed gray dome lid, NO gun. Cell2 same gray lid with brown central core. Cell3 tan/brown narrow tracked tank with black circular central cannon. Cell4 round gray fixed turret with red center and upward barrel. Cell5 wide tan tracked tank, long dark middle channel and small gray nose. Cell6 tracked tan radar base with huge dark gray curved dish. Cells7 and9 tiny parked brown fighters in different mirrored silhouettes. Cell8 parked white/red pointed fighter facing RIGHT with black horizontal pods. Cell10 just a narrow vertical row of tiny RED runway lights, no broad runway added. Cell11 broad WHITE circular gas tank with RED checker pattern and four small rim fixtures. Cell12 tan tracked platform with round gray upward turret/red hub. Cell13 dark circular RED/gray segmented weapon depot and four stubs. Cell14 silver dome with four gold-capped pipe stubs. Cell15 similar four-stub silver fixed turret, red hub/up barrel. Cell16 plain silver lid with four RED edge lights and four gold pipe stubs.
```

## 02 — web/assets/campaign-objects-02-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-02-hd.png)

完整提示词 / Full prompt:

```text
Create a production HD sprite atlas from the supplied DemonStar 4.04 original reference sheet. This is faithful redrawing, not new designs. EXACTLY 4 equal columns by 4 equal rows, square canvas, 16 isolated objects in EXACT reference row-major cell order. Read the tiny reference labels only to preserve mapping; output NO TEXT, numbers, grid, labels or background. Transparent RGBA outside every object. Preserve EACH object's silhouette, original orientation, component placement and colors. Orthographic top-down 1990s industrial arcade style; crisp painted metal, restrained highlights, no sci-fi redesign, no added wings, no floating floor shadows. Give each object a modest clear margin so none touches another cell. Do not add a gun to a lid or change ground equipment into aircraft. Parked fighters remain as drawn. Gray objects stay gray; brown tanks stay brown; red details stay red. Keep the original width-to-height proportions within each cell, and accurately reproduce distinct matching pairs. Detailed cell requirements: Cells1 and2 four gold-pipe silver housings containing respectively yellow-brown glowing core and GREEN glowing core. Cell3 dark square industrial tile with four inset deep red panels. Cell4 upright tan tracked rectangular tank with two dark lower panels. Cell5 square dark industrial slab holding white/red spherical tank, gray dome and vertical pipes. Cells6 and7 mirrored diagonal tan tracked tanks, keep diagonal orientations. Cell8 horizontal long tan tracked armored vehicle, two dark vertical bands and black small tube along lower edge. Cell9 tall black cylindrical gas reservoir with three silver horizontal straps and brown top. Cell10 silver four-gold-pipe round BLUE core. Cell11 silver cross pipe coupling with small round gray center and gold ends. Cell12 four-gold-pipe housing with slightly different BLUE core. Cell13 round silver dome with dark BLUE checker pattern. Cell14 cross of dark industrial rails with red-brown channels and square central pad. Cell15 same cross with large red-white marked spherical dome. Cell16 same cross with black rectangular ribbed central container.
```

## 03 — web/assets/campaign-objects-03-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-03-hd.png)

完整提示词 / Full prompt:

```text
Create a production HD sprite atlas from the supplied DemonStar 4.04 original reference sheet. This is faithful redrawing, not new designs. EXACTLY 4 equal columns by 4 equal rows, square canvas, 16 isolated objects in EXACT reference row-major cell order. Read the tiny reference labels only to preserve mapping; output NO TEXT, numbers, grid, labels or background. Transparent RGBA outside every object. Preserve EACH object's silhouette, original orientation, component placement and colors. Orthographic top-down 1990s industrial arcade style; crisp painted metal, restrained highlights, no sci-fi redesign, no added wings, no floating floor shadows. Give each object a modest clear margin so none touches another cell. Do not add a gun to a lid or change ground equipment into aircraft. Parked fighters remain as drawn. Gray objects stay gray; brown tanks stay brown; red details stay red. Keep the original width-to-height proportions within each cell, and accurately reproduce distinct matching pairs. Detailed cell requirements: Cell1 faceted dark brown rim with glowing GREEN mottled core. Cells2,3,5 three differently angled brown ore trucks carrying bright GOLD rubble, gray frame and black treads; preserve distinct angles. Cell4 black square heavy industrial frame with recessed gold ore ring. Cell6 rectangular dark gray building with central X-braced lid and horizontal black rail bands. Cell7 BLUE cross-shaped ribbed sci-fi ground pad with raised gray central square. Cell8 brown rounded octagonal plate with gray circular turret and orange-red hub/upward barrel. Cell9 narrow gray tracked tank with red central muzzle and upward small black cannon. Cell10 parked WHITE/RED swept fighter facing LEFT, do not turn it into a tank. Cell11 tall brown tracked bus-like ground vehicle, row of three gray panels and vents, gray nose near lower right. Cell12 silver pipe CROSS, gray round central coupling. Cells13-16 four distinct industrial corridor plates from reference: horizontal brown X braces; central red square framed with braces; vertical X-braced spine; vertical row of four black/red vents. Keep exact layouts and top-down rectangles.
```

## 04 — web/assets/campaign-objects-04-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-04-hd.png)

完整提示词 / Full prompt:

```text
Faithfully redraw the supplied original DemonStar 4.04 sprite reference as an HD production atlas. EXACT 4 columns by 4 rows, square canvas, 16 cells in identical row-major order. Transparent RGBA background, no labels/text/numbers/grid. Keep each reference object's proportions, orientation, silhouette, details and color identity; top-down industrial arcade art, crisp painted metal, not generic spacecraft. No additional wings or invented guns. Clear modest transparent margin around each sprite; no floor shadows or glow extending between cells. Preserve exact rectangular panel layouts and long thin pipes/trains. Do not copy enlarged pixel blocks; redraw with clear detailed surfaces. Per-cell specification: 1 gray square industrial plate: horizontal row of four black/red vents in middle, pale panels above, dark grilles below. 2 brown vertical brace crossed by long dark horizontal double-ended barrel. 3 plate with brown horizontal X-braces across middle and a NOTCH at upper right. 4 BLUE ribbed cross pad, central gray rectangular OPEN hatch with yellow hazard edges. 5 dark city-tech plate, VERTICAL central track, paired rows of tiny GOLD lights on both sides. 6 corresponding HORIZONTAL track tile with gold lights above/below. 7 cross-junction of those tracks. 8 LONG HORIZONTAL gray four-section train car with dark brown nose at LEFT, do not rotate. 9 simple upright gray two-panel slab. 10 pale silver round agricultural dome with rim pipes. 11 short horizontal silver pipe. 12 tall vertical silver pipe. 13 silver round dome with dark GREEN gridded center. 14 silver round dome with brown four-arm mechanism at center. 15 LONG HORIZONTAL brown four-section train, bright GREEN cargo panels. 16 BLUE ribbed cross platform with gray round red-hub UP-facing turret.
```

## 05 — web/assets/campaign-objects-05-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-05-hd.png)

完整提示词 / Full prompt:

```text
Faithfully redraw the supplied original DemonStar 4.04 sprite reference as an HD production atlas. EXACT 4 columns by 4 rows, square canvas, 16 cells in identical row-major order. Transparent RGBA background, no labels/text/numbers/grid. Keep each reference object's proportions, orientation, silhouette, details and color identity; top-down industrial arcade art, crisp painted metal, not generic spacecraft. No additional wings or invented guns. Clear modest transparent margin around each sprite; no floor shadows or glow extending between cells. Preserve exact rectangular panel layouts and long thin pipes/trains. Do not copy enlarged pixel blocks; redraw with clear detailed surfaces. Per-cell specification: 1 BLUE cross-shaped ribbed ground pad with a gray curved radar dish at center. 2 BLUE cross pad with silver/red marked central dome. 3 gray square pyramidal building roof with four pale rounded side pipes. 4 tall VERTICAL silver pipe, central coupling. 5 HORIZONTAL silver pipe with central coupling. 6 wide round dark-gray tracked armored ground machine, two small red/tan upper viewports and small central muzzle. 7 BLUE cross pad with four central dark-gray panels. 8 pale silver rectangular two-panel hatch. 9 deep DARK RED/brown glossy circular lid with broad SILVER cross. 10 angular gray faceted octagonal roof with tiny dark slots and rounded side stubs. 11 silver spherical dome with three RED triangular markings. 12 RED glowing circular core in gray rim with four pipe tabs. 13 silver spherical dome divided by diagonal X seams. 14 silver spherical dome divided by CROSS seams with narrow black UPPER tube. 15 gray hexagonal turret, circle divided by cross, TWO barrels pointing upper RIGHT. 16 mirrored turret with two barrels pointing upper LEFT. Match every original distinct silhouette.
```

## 06 — web/assets/campaign-objects-06-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-06-hd.png)

完整提示词 / Full prompt:

```text
Faithfully redraw the supplied original DemonStar 4.04 sprite reference as an HD production atlas. EXACT 2 columns by 2 rows, square canvas, 4 cells in identical row-major order. Transparent RGBA background, no labels/text/numbers/grid. Keep each reference object's proportions, orientation, silhouette, details and color identity; top-down industrial arcade art, crisp painted metal, not generic spacecraft. No additional wings or invented guns. Clear modest transparent margin around each sprite; no floor shadows or glow extending between cells. Preserve exact rectangular panel layouts and long thin pipes/trains. Do not copy enlarged pixel blocks; redraw with clear detailed surfaces. Per-cell specification: EXACTLY FOUR cells only, 2x2. Top-left: small bright orange-white irregular spherical gas-fire object, glowing opaque yellow-white core, dark burnt orange lower left, no casing invented. Top-right: gray square industrial plate with vertical column of brown X-braces near center and a large rectangular notch entering from RIGHT. Bottom-left: very LONG THIN VERTICAL gray mechanical shaft, upper vented block, two spaced BLUE star-shaped rotor hubs, pointed metallic lower end. Bottom-right: silver circular housing with RED-and-white spherical core and four GOLD-capped pipe stubs at cardinal points.
```

## 07 — web/assets/campaign-objects-07-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-07-hd.png)

完整提示词 / Full prompt:

```text
Faithful HD redraw of this DemonStar 4.04 original reference sprite sheet. EXACT 4 columns x4 rows,16 isolated cells in the reference order, square transparent RGBA. No labels, numbers, text, grid, background or floor shadows. Preserve each distinct silhouette, color and ORIGINAL direction/orientation. Orthographic top-down industrial arcade metal sprites with crisp detailed surfaces. Do not substitute one generic fighter, do not recolor everything red, do not rotate all craft to a common direction. Blue rocks stay blue, poles and station pieces stay poles, not airplanes. Maintain original proportions and leave clear modest margins in each cell. Specific cells: 1 brown four-lobed mechanical fighter with dark central spine. 2 distinct brown split-wing fighter with three gray upper exhausts, exactly as reference. 3 compact twin dark-gray pods with two RED narrow windows, black center. 4 narrow brown aircraft with splayed upper gray fins, pointed lower brown nose. 5 broad silver WHITE fighter, sweeping RED wings, two upper gray pods and long thin black outer spikes. 6 very narrow silver vertical spindle with RED triangular side fins. 7 large blocky RED rectangular fighter with twin gray side engines, four black circular details, pointed gray engine noses. 8 small horizontal two-pod craft with ORANGE bands on each dark pod. 9 gray angular top attached to vertical spindle and black lower point. 10 gray round hub with BLUE propeller pattern and two vertical rails. 11 vertical gray spindle with wide horizontal vent block at center. 12 small gray diamond-like craft with fine RED side edges. 13 round gray twin-engine fighter with two bright RED rectangular grilles, two top pipes and black bottom point. 14 tiny dark-gray four-claw drone with ring center. 15 silver four-gold-pipe station with broad dark RED curved dish on its LOWER half. 16 only a long thin HORIZONTAL silver tube with GOLD bands, do not make a plane.
```

## 08 — web/assets/campaign-objects-08-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-08-hd.png)

完整提示词 / Full prompt:

```text
Faithful HD redraw of this DemonStar 4.04 original reference sprite sheet. EXACT 4 columns x4 rows,16 isolated cells in the reference order, square transparent RGBA. No labels, numbers, text, grid, background or floor shadows. Preserve each distinct silhouette, color and ORIGINAL direction/orientation. Orthographic top-down industrial arcade metal sprites with crisp detailed surfaces. Do not substitute one generic fighter, do not recolor everything red, do not rotate all craft to a common direction. Blue rocks stay blue, poles and station pieces stay poles, not airplanes. Maintain original proportions and leave clear modest margins in each cell. Specific cells: 1 silver triangular split fighter with two small top round engines, black long lower nose and curved lower claws. 2 tiny compact gray/orange fighter. 3 horizontal gray two-pod fighter with orange windows and dark angular central cockpit. 4 compact dark silver twin-engine fighter with blocky RED side fins. 5 large central silver pointy fighter with two broad RED swept wings. 6 and7 mirrored dark triangular stealth-like ships angled DOWN-RIGHT and DOWN-LEFT, gray tips and restrained red/orange trim. 8 tiny ORANGE irregular rotating rock/fire object, not a craft. 9 gray-blue vertically stacked segmented fighter with dark nose at bottom and blue side brackets. 10 matching longer symmetric gray-blue segmented craft. 11 compact gray multi-barrel square machine with thin orange details. 12 horizontal dumbbell craft, two tall gray teardrop pods with RED bands and central gray oval/red core. 13 RED central ring with FIVE long gray spikes, preserve five. 14 only a very LONG THIN VERTICAL white/silver pole. 15 small gray central capsule with RED four-point side wings. 16 long horizontal chain of FIVE gray/orange armored engine pods.
```

## 09 — web/assets/campaign-objects-09-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-09-hd.png)

完整提示词 / Full prompt:

```text
Faithful HD redraw of this DemonStar 4.04 original reference sprite sheet. EXACT 4 columns x4 rows,16 isolated cells in the reference order, square transparent RGBA. No labels, numbers, text, grid, background or floor shadows. Preserve each distinct silhouette, color and ORIGINAL direction/orientation. Orthographic top-down industrial arcade metal sprites with crisp detailed surfaces. Do not substitute one generic fighter, do not recolor everything red, do not rotate all craft to a common direction. Blue rocks stay blue, poles and station pieces stay poles, not airplanes. Maintain original proportions and leave clear modest margins in each cell. Specific cells: 1 bright RED triangular wings around narrow silver vertical fuselage. 2 broad gray triangular rotor body with long vertical gray spindle, dark lower point. 3 tiny gray cross-shaped mini-drone with small lower spindle. 4 gray central long spindle with TWO parallel side engine tubes and small orange caps. 5 blocky gray machine, two upper tubes and two large curved lower black claws, three dark central ports. 6 SMALL faceted BLUE irregular asteroid. 7 LONG oblique faceted BLUE asteroid, much more elongated. 8 gray bell-shaped craft with two large curved upper horn handles, red center and lower exhaust block. 9 wide gray double-body ship with two tall upper exhausts and black lower nose. 10 small tilted silver round drone with BLUE quarter-panel and four projections. 11 LARGE squat broad polygonal BLUE asteroid. 12 gray sphere with sharp silver spikes and small red details. 13 small BLUE cylindrical horizontal pod, dark nose on LEFT and gray teeth on RIGHT. 14,15,16 are THREE distinct BLUE vertical ribbed ships with gray central spine: 14 has a lower cluster of five fine black prongs; 15 has no prongs and an open lower edge; 16 has a gray rectangular central collar. Preserve reference details, do not merge these.
```

## 10 — web/assets/campaign-objects-10-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-10-hd.png)

完整提示词 / Full prompt:

```text
Redraw the supplied original DemonStar 4.04 sprite reference faithfully as a crisp HD game atlas. EXACT 4 columns x4 rows, 16 cells, square transparent RGBA, exact row-major reference order. No labels, text, numbers, grid, black/colored background, ground shadows or unrelated decoration. Original top-down arcade art direction, preserve orientation, shape proportions, specific colors and each mechanical detail. Never replace assorted objects with a repeated generic plane. Rocks, ripples, poles and sparks must remain those objects. Give each sprite clear modest margins. Detailed cell list: 1 BLUE ribbed vertical body, gray central spine and three UPPER tubes, matching reference. 2 broad triangular SILVER flying wing pointing DOWN, tiny central RED dot and small upper nub. 3 small RED boxy fighter, gray star-shaped upper cockpit and twin lower engines. 4 elongated SILVER aircraft with a small upper cross-wing and a much larger lower transverse wing, central RED details. 5 subtle BLUE water-ripple sprite only: thin broken blue outer ring and tiny blue center ripple, NO ship or opaque orb. 6 brown square drone with black diamond center and four black rim pods. 7 complex gray pinched X-like aircraft with RED side fins and central black cross opening. 8 tall gray rectangular spacecraft with FOUR large side engine pods, two each side. 9 broad silver triangle around long upright silver central spindle. 10 RED cube center and FOUR long thin silver diagonal needles forming X. 11 bulky tall gray armored craft with three upper chimneys, panel grids and one WHITE curved pipe on lower RIGHT. 12 very wide thin BLUE wing structure with gray central axis and tiny downward spikes. 13 tiny orange RED star-shaped drone. 14 BLUE twin bulb-pod craft with silver V-shaped bridge and RED center dot. 15 gray horizontal three-panel technical module with BLACK downward spike. 16 identical gray three-panel module WITHOUT downward spike; do not merge.
```

## 11 — web/assets/campaign-objects-11-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-11-hd.png)

完整提示词 / Full prompt:

```text
Redraw the supplied original DemonStar 4.04 sprite reference faithfully as a crisp HD game atlas. EXACT 4 columns x4 rows, 16 cells, square transparent RGBA, exact row-major reference order. No labels, text, numbers, grid, black/colored background, ground shadows or unrelated decoration. Original top-down arcade art direction, preserve orientation, shape proportions, specific colors and each mechanical detail. Never replace assorted objects with a repeated generic plane. Rocks, ripples, poles and sparks must remain those objects. Give each sprite clear modest margins. Detailed cell list: 1 gray horizontal technical module with two upright exhaust stacks. 2 tiny BLUE symmetric short cylinder craft around gray central shaft. 3 joined two-hull angular fighter: LEFT half SILVER, RIGHT half BLUE, black panels and upper exhausts. 4 silver pointed aircraft with pale swept wings and slim black/brown lower tip. 5 rectangular vivid GREEN two-lobed body with gray central spindle/red dot and upward curved black claws. 6 matching GREEN body with claws curving DOWN, keep separate. 7 compact BLUE sideways cylindrical pod, gray short nose RIGHT and comb of black prongs LEFT. 8 large porous BLACK lava asteroid with a few restrained thin ORANGE fissures, preserve chunky irregular outline. 9 smaller dark lava rock with orange edge fissures. 10 blocky RED trident-shaped spacecraft, broad flat upper wings and two tapering lower red prongs around a silver spine. 11 tall spray of tiny ORANGE sparks rising UP from one bright yellow/orange falling tip at BOTTOM, NOT a solid rock and not a spaceship. 12 brown/tan triangular delta craft with a dark vertical cockpit. 13 small DARK RED four-point diamond drone with WHITE center flare. 14 gray vertical spindle between two broad segmented RED rectangular wings, small red central ring. 15 FOUR BLUE bulb pods around an X-shaped silver bridge with red center dot. 16 bronze/brown mechanical beetle-shaped spacecraft, rectangular center, silver swept side horns and black lower side pods.
```

## 12 — web/assets/campaign-objects-12-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-12-hd.png)

完整提示词 / Full prompt:

```text
Redraw the supplied original DemonStar 4.04 sprite reference faithfully as a crisp HD game atlas. EXACT 2 columns x2 rows, 4 cells, square transparent RGBA, exact row-major reference order. No labels, text, numbers, grid, black/colored background, ground shadows or unrelated decoration. Original top-down arcade art direction, preserve orientation, shape proportions, specific colors and each mechanical detail. Never replace assorted objects with a repeated generic plane. Rocks, ripples, poles and sparks must remain those objects. Give each sprite clear modest margins. Detailed cell list: EXACT FOUR cells in 2x2. Top-left: broad silver horizontal wing with central vertical gray spindle and black lower nose, several short white lower prongs. Top-right: wide dark gray fighter with RED bands, four tall upper pod/exhaust modules, silver vented center and four smaller lower side pods, black pointed center. Bottom-left: tiny red/gray compact fighter with triangular lower red tip and short side projections. Bottom-right: compact gray three-pod fighter with RED upper bands, dark pointed lower central pod, two silver square vent structures at sides. Preserve the four very different silhouettes and the original view.
```

## 13 — web/assets/campaign-objects-13-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-13-hd.png)

完整提示词 / Full prompt:

```text
Faithful HD redraw of this DemonStar 4.04 environment reference atlas. EXACT 4 equal columns x4 equal rows, square transparent RGBA. Keep exact row-major reference order and shapes. No text, labels, numbers or grid. These are independent TOP-DOWN sprite cutouts, not a composed scene: industrial plates, pipes, terrain patches and deck structures. Preserve reference proportions and distinct connections, orientations, colors, cutouts and holes. Transparent outside each object with modest clear cell margins. No perspective floor, no added buildings, no aircraft substitutions. Original dark industrial arcade look with crisp detailed surfaces. For ore, ripples and cracks retain transparent gaps; do not turn them into solid disks. Full rectangular plates retain their opaque surfaces but have transparent exterior margin. Detailed cells: 16 cells. 1 THREE parallel HORIZONTAL silver pipes, clean separated. 2 gray square/octagonal junction plate with four RED diamond markings and small side flanges. 3 THREE horizontal silver pipes with tapered/unequal RIGHT ends. 4 THREE parallel VERTICAL silver pipes. 5 brown low horizontal panel holding TWO circular gray fans. 6 subtly different matching two-fan horizontal panel. 7 THREE vertical silver pipes with subtly flared lower ends. 8 brown VERTICAL two-fan panel. 9 gray square panel with FOUR square quadrants and tiny central yellow/black hazard-bordered opening. 10 matching vertical two-fan panel with correct side caps. 11 tiny diagonal crashed RED/WHITE player fighter wreck, not a flying craft. 12 large dark square frame with diagonal X girders and clear dark interior panels. 13 SMALL loose patch of tiny GOLD ore fragments, sparse transparent gaps. 14 LARGER wide patch of scattered tiny gold fragments. 15 LONG diagonal narrow band of gold fragments, from upper LEFT to lower RIGHT. 16 brown square panel holding FOUR gray fans in2x2.
```

## 14 — web/assets/campaign-objects-14-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-14-hd.png)

完整提示词 / Full prompt:

```text
Faithful HD redraw of this DemonStar 4.04 environment reference atlas. EXACT 4 equal columns x4 equal rows, square transparent RGBA. Keep exact row-major reference order and shapes. No text, labels, numbers or grid. These are independent TOP-DOWN sprite cutouts, not a composed scene: industrial plates, pipes, terrain patches and deck structures. Preserve reference proportions and distinct connections, orientations, colors, cutouts and holes. Transparent outside each object with modest clear cell margins. No perspective floor, no added buildings, no aircraft substitutions. Original dark industrial arcade look with crisp detailed surfaces. For ore, ripples and cracks retain transparent gaps; do not turn them into solid disks. Full rectangular plates retain their opaque surfaces but have transparent exterior margin. Detailed cells: 16 cells. 1 large irregular GOLD ore scatter patch, keep transparent gaps among grains. 2 huge LONG VERTICAL silver mechanical structure: repeated red X braces down spine and SEVEN curved white horns along EACH side; preserve tall narrow proportions. 3 only a few tiny BLUE water sparks separated by transparent space, no opaque shape. 4 dark square landing/industrial tile, central faint circular cross marking and GOLD dashed perimeter. 5 matching square tile filled with gray domes, brown X brace, red rails and pale lower-right wedge. 6 very LONG VERTICAL gray blocky mothership/structure with two tiny upper horns and multiple red brace bars along central channel, no huge side wings. 7 square dark industrial deck tile with central VERTICAL ladder and slim X-braced side rails. 8 horizontal SILVER rail with four BLUE supports alternating above/below. 9 faint dark VERTICAL road/track strip. 10 faint dark HORIZONTAL road/track strip. 11 CROSS junction of those dark track strips. 12 small thin diagonal patch of deep BLUE water with tan shore rim. 13 larger elongated diagonal blue water patch and tan rim. 14 square blue water pond, tan shore rim, FOUR small silver domes in2x2. 15 large irregular blue water patch, tan shoreline and narrow upper inlet. 16 broad almost-square dark BLACK asteroid/slab with irregular rocky rim and flat gritty inset surface.
```

## 15 — web/assets/campaign-objects-15-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-15-hd.png)

完整提示词 / Full prompt:

```text
Faithful HD redraw of this DemonStar 4.04 environment reference atlas. EXACT 4 equal columns x4 equal rows, square transparent RGBA. Keep exact row-major reference order and shapes. No text, labels, numbers or grid. These are independent TOP-DOWN sprite cutouts, not a composed scene: industrial plates, pipes, terrain patches and deck structures. Preserve reference proportions and distinct connections, orientations, colors, cutouts and holes. Transparent outside each object with modest clear cell margins. No perspective floor, no added buildings, no aircraft substitutions. Original dark industrial arcade look with crisp detailed surfaces. For ore, ripples and cracks retain transparent gaps; do not turn them into solid disks. Full rectangular plates retain their opaque surfaces but have transparent exterior margin. Detailed cells: 13 populated cells only; last THREE cells completely empty transparent. 1 narrow jagged YELLOW/ORANGE lava crack running upper-left to lower-right with short side branches, transparent around it. 2 large lumpy BLACK porous lava rock, no glow invented. 3 smaller dark round lava rock. 4 different diagonal orange lava crack branch layout. 5 HORIZONTAL dark industrial bridge tile with rusty RED grilles along upper/lower edges, GOLD dashed borders and gray ribbed center. 6 small dark rock. 7 irregular patch of hot YELLOW/ORANGE molten lava, glowing granular texture, clear jagged edge. 8 very small short orange lava-crack fragment. 9 wide gray dark HEXAGON paving plate, subtle riveted dotted surface. 10 horizontal bridge strip with rusty border rails and gray ribbed interior. 11 vertical charcoal road, white dashed centerline, golden dashed outer margins, fine grilles. 12 horizontal charcoal road with white dashed centerline and golden dotted margins. 13 CROSS road intersection, pale gray cross marking in center, four dark grille quadrants, small gold corner markings. Preserve actual reference edges; do not fill remaining cells.
```

## 16 — web/assets/enemy-projectiles-01-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/enemy-projectiles-01-hd.png)

完整提示词 / Full prompt:

```text
Faithful HD DemonStar 4.04 enemy-projectile atlas, EXACT4 columns x4 rows,16 cells in the exact order of original reference. Transparent RGBA outside sprites, no text/grid/background, each centered with wide clear margins. Bright opaque readable cores with restrained narrow edge glow, preserve original colors and silhouettes. Cells1-2: two pulse frames of a SMALL dark charcoal/gray round shell with deep RED-orange square/round core, second frame darker red center. Cells3-4: two GOLD/ivory compact four-point DIAMOND bullets, dark burnt-orange points, nearly white center. Cells5-6: two round GOLD/orange orbs with pale yellow-white centers and solid amber rim, ROUND rather than star. Cells7-8: two ICE BLUE compact diamond bullets, pale blue center and darker blue four points. Cells9-10: two frames of the SAME thin VERTICAL enemy missile, narrow gray shaft, BLUE tail at TOP, tiny dark side fins near upper half, RED nose at BOTTOM; gray horizontal white band above red nose, NO large flame. Cell11-15: FIVE frames of a RED/PINK laser segment: squared wide pale pink shoulders at TOP narrowing to parallel-sided pink/red vertical stem below, first frames broad bright, fifth frame narrower/dimmer. Follow reference silhouettes exactly. Cell16: short straight pink beam segment, flat ends, white-pink center with red/pink margins. Do not invent weapons or recolor bullets. Clear HD arcade illustration, not enlarged pixel mosaics.
```

## 17 — web/assets/enemy-projectiles-02-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/enemy-projectiles-02-hd.png)

完整提示词 / Full prompt:

```text
Faithful HD redraw of original DemonStar projectile reference. EXACT4 columns x4 rows, transparent RGBA, exactly10 populated cells in row-major order; cells11-16 COMPLETELY EMPTY transparent. No text/labels/grid/backdrop. Top row cells1-4: FOUR pulse/tumble frames of small ICE BLUE energy orb, preserve original differing oval/round silhouettes and pale blue luminous center, restrained blue rim, not rings. Row2 cells5-8: FOUR rotation frames of the same vivid RED plasma star with small bright pale-red center and FOUR needle rays. Orientations follow reference: first orthogonal plus with long horizontal ray, second rotated, third diagonal X, fourth rotated opposite. Keep RED, not orange. Row3 cell9: tiny gray/red missile angled DOWN-LEFT, bright red nose at LOWER LEFT and small yellow exhaust at UPPER RIGHT. Cell10 mirrored DOWN-RIGHT missile, red nose lower right and yellow exhaust upper left. Compact opaque bright game sprites, restrained tiny glow, preserve original silhouette and color at game size, no giant hazy bubbles.
```

## 18 — web/assets/fixed-turret-layers-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/fixed-turret-layers-hd.png)

完整提示词 / Full prompt:

```text
Create a faithful layered sprite atlas for the FIVE fixed DemonStar turrets shown in reference. Reference top row shows barrels pointing UP and bottom row shows same bases with barrels DOWN. IMPORTANT: bases stay fixed and ONLY barrels turn. Output EXACT5 columns x2 rows, wide5:2 transparent RGBA atlas,10 cells, no text/grid/labels. TOP ROW five BASES, with ALL barrels and red/orange hubs removed cleanly so each central circular cap is plain gray. Preserve base designs: col1 small gray faceted round plate; col2 TAN tracked square vehicle platform with central gray circular cap; col3 SILVER circular pipe junction with FOUR GOLD end caps; col4 BLUE ribbed cross platform and central gray square/circular turret cap; col5 BROWN rounded octagonal inset inside dark gray thick octagonal border, central gray circular cap. BOTTOM ROW five matching isolated BARREL-AND-HUB layers only, all pointing straight UP, transparent outside: narrow dark-gray tapered barrel above a small RED hub for cols1-4, ORANGE-red hub for col5. NO circular base disk on these weapon layers, no additional cannons. Hub is near the BOTTOM of its crop and is the rotation pivot. Keep gun lengths/widths appropriate to original references, with clear margins. Top-down industrial arcade metal, faithful silhouettes/colors, smooth crisp HD detail, do not change the five base types or add ground shadows.
```

## 19 — Rejected / 已弃用

模式 / Mode: built-in imagegen

完整提示词 / Full prompt:

```text
Create FOUR faithful HD gold-ore SCATTER sprites from this original DemonStar reference, in EXACT2 columns x2 rows. Fully transparent RGBA background. NO soil, dirt, slab, rock pile, gold sheet, shadow or colored substrate whatsoever. ONLY hundreds of tiny separate GOLD/yellow flecks with true alpha-zero gaps between every fleck. At least75% of each scatter's interior footprint remains transparent, like sparse glitter grains sprinkled on invisible ground. Do not connect grains. Preserve the FOUR footprint shapes: top-left small roughly round patch; top-right larger roughly round patch; bottom-left broad irregular asymmetrical patch with small tail toward lower left; bottom-right long thin diagonal band upper-left to lower-right. Enlarge each reference footprint for crisp HD isolated grains, with generous clear cell margins. No text, labels or grid. The original tiny golden grains and negative space are essential; avoid opaque brown/gold blobs.
```

## 20 — web/assets/campaign-objects-09-hd.png

模式 / Mode: built-in imagegen

[资产 / Asset](../web/assets/campaign-objects-09-hd.png)

完整提示词 / Full prompt:

```text
Precise correction to image1, the HD4x4 sprite atlas; image2 is original reference only. Preserve ALL other sprites, cell alignment, transparent RGBA and artwork exactly. Change ONLY row2 column1 (cell5, gray clawed craft): put exactly THREE small black circular ports in a vertical stack in the central pale panel, as in original reference, instead of the current two. Keep body, two upper pipes and curved lower claws unchanged. Also row4 column2 (cell14, blue ribbed ship with lower prongs): make the lower cluster FIVE slim black prongs like the reference. Do not move objects, add text, recolor anything, change other cells, or add any background. Preserve alpha transparency.
```
