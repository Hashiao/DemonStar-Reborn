# M2.5 出击、爆炸与残骸重绘

2026-10-10 使用 **内置 imagegen**，非 CLI。四张图均以本地原作参考重新生成，保留生成的 RGBA/alpha，未手工绘制或修改像素。`presentation-art.js` 仅记录运行时裁切；爆炸同一行采用共享裁切框以保留膨胀/消散和中心稳定。原图及取证截图位于忽略的 `.local/reference/`，不发布。

| 输出 | 内容 |
|---|---|
| `web/assets/launch-carrier-hd.png` | 本地 4.04 灰色 88 母舰，1448×1086 |
| `web/assets/launch-doors-hd.png` | 上下机械舱门，2×1 图集，1774×887 |
| `web/assets/blast-animation-hd.png` | 小命中/大命中/空中击毁/地面击毁，6×4 图集，1536×1024 |
| `web/assets/ground-wrecks-hd.png` | 八类焦黑基座与建筑残骸，4×2 图集，1774×887 |

母舰参考 `S_LAUNCH`；舱门参考 `S_DOORUP/S_DOORDN`；火花参考 `S_EXPLO1A–L/S_SEXPNEW` 帧；残骸参考站台、油罐、炮台、机械、建筑的本地损毁帧。纹理和动画关键帧是高清近似，非原像素发布。未覆盖的残骸共用相近家族图形。现有 `weapons-hd.png/pickups-hd.png` 未重新生成，只修正运行时透明留白裁切。

## 母舰提示词

Create a faithful HD redraw of the attached DemonStar 4.04 S_LAUNCH top-down spacecraft carrier sprite. This is a game asset, orthographic top-down, NOT perspective, no environment. Preserve the exact original outer silhouette, long charcoal flight deck, number 88 at its upper end, three narrow longitudinal rails, asymmetric grey gun turrets (large on upper left, small upper right and three lower right), mechanical grey side pods, small blue star roundels and yellow hazard bands. Keep all details in the same relative positions as reference. Remove the tiny red player fighter embedded in the left docking bay so the actual animated player can be rendered separately. Sharper painted metal details with restrained realistic highlights, dark industrial 1990s arcade palette, not neon. Full carrier extends almost full image height and has same proportions as reference, entire silhouette visible. Transparent background with real alpha, no black rectangular backdrop, no checkerboard, no shadow outside silhouette. Output landscape 4:3 canvas, corresponding to original 640x480 canvas including transparent margins on sides; carrier body centered like reference.

## 舱门提示词

Create a two-sprite HD game asset atlas faithfully redrawing the attached original DemonStar mechanical doors. Canvas wide 2:1. EXACTLY two equal square cells in one row. Left cell: upper shutter panel, same rusty brown pitted armored steel, thick dark grey beveled frame, two recessed rust panels split by a blocky interlocking vertical central spine, small dark red indicator lamp row along lower edge, mechanical teeth along bottom. Right cell: matching lower shutter panel, matching the second reference, teeth along its top edge. Each panel should occupy almost the full square cell from left edge to right edge and top to bottom, with very small transparent margin; DO NOT retain the huge empty half-height of the original reference canvas. Orthographic flat front view, rectangular panels, no perspective, no text, no extra parts. Faithful dark industrial arcade palette, sharper metal texture but preserve source design. Transparent background, actual alpha outside each isolated panel.

## 爆炸提示词

Create a faithful HD redraw sprite animation atlas for the attached DemonStar original impact/fireball reference. EXACT regular 6 columns x 4 rows, 24 equal square cells, transparent real alpha. NO labels, no grid, no colored background. Every frame centered within its own cell with generous 18% transparent padding, no overlap. Row 1 small impact animation 6 successive frames: tiny bright yellow four-point flash; bright creamy gold star; small solid white-yellow ball; broken orange hot ring; scattered orange sparks; few dying rust-red sparks. Row 2 HEAVY bullet impact 6 successive frames: compact chunky white-yellow plasma puff; asymmetric white-hot cauliflower ball; expanded lobed yellow-white fireball; ragged golden-orange fireball; fragmented orange embers; few fading embers. Row 3 enemy death fireball 6 successive frames: dense tiny white flash; expanding opaque white-yellow fireball; broad lumpy yellow blast with orange fringe; broken orange fireball with dark cavities; orange burning fragments with charcoal wisps; dissipating dark grey debris and tiny red embers. Row 4 larger ground destruction explosion 6 successive frames: white-gold flash with metal flecks; dense white-yellow fire; broad orange explosion rim around yellow core; charred smoke with molten orange fragments; dark grey smoke and red embers; fading charcoal scraps. Keep progression within each row consistent, expansion and dissipation real frame animation. Faithful original warm white/yellow/orange palette, bright OPAQUE cores, crisp arcade painted detail, no excessive transparency, no blue lens flares, no magic circles. Use original as design reference, redraw and refine edges rather than copy pixels.

## 残骸提示词

Redraw the attached original DemonStar destroyed ground structures as a faithful HD game sprite atlas. EXACTLY 4 columns x 2 rows, eight equal square cells, each isolated centered with 15% transparent padding. Orthographic TOP DOWN, no perspective. Row-major objects match reference: 1 charred octagonal low station with collapsed dark center; 2 destroyed cross-shaped radar foundation; 3 broken round fuel dome with three small side lobes and hollow black bowl; 4 wrecked low rectangular machinery and four rusty detached blocks; 5 blasted square turret base with octagonal central mount and tread-like side blocks; 6 collapsed square oil platform with diagonal girders and hollow center; 7 ruined rectangular concrete building, irregular soot-black crater inside and grey walls left/right; 8 tall rectangular cracked fuel structure with charred dark pipes inside, all burnt black, NO bright green. Preserve each footprint and asymmetry of the source, charcoal black and muted rusty brown debris with subtle grey highlights so visible over terrain. Clearly dead, no lights, no active guns, no flames, no intact buildings, no smoke masking silhouette. No labels or text or border or grid. Actual transparent alpha background outside rubble shapes. Painted sharp arcade HD detail rather than pixel copying. Eight sprites, evenly spaced.

## 交付图集 SHA-256

- `launch-carrier-hd.png`：`c432a28a3b1dfc3bc44ee34d3d4adce69affa62c04acab65adad1de3851d549b`
- `launch-doors-hd.png`：`64859e1fdddcaa35acdd3b4b704a852cbbdead51a38018552ea4b8c4744dab18`
- `blast-animation-hd.png`：`8b2c61993cda195d2256fa54a2b5c6e65a19c59d3c738f163368e14377553922`
- `ground-wrecks-hd.png`：`ef1e3816dae923037b8fcbb7aa3b4afc0b464a611054141608c9dbefeb9e3364`
