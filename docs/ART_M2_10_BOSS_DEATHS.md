# M2.10 受损 Boss 图集 / Damaged Boss atlases

2026-10-10：内置 imagegen 以本地原作损毁帧为参考生成，再通过同一工具修正布局/透明背景；没有用代码绘制或修改图像像素。原作 PNG 仅存于忽略的 `.local/reference/m210-boss-deaths/`。发布素材是新重绘，保留工具返回的 RGBA。工具预览中的暗色底不代表资产不透明；已检查实际 alpha，并在战场绘制验证。

On 2026-10-10, built-in imagegen redrew local original destroyed frames and handled layout/background corrections. Code did not paint or modify image pixels. Original PNGs remain in the ignored reference directory; published files are new redraws retaining generated RGBA. A dark tool preview is not an opacity claim: actual alpha and battlefield rendering were checked.

## 显式来源 / Explicit sources

`0x40fdf8` 选择原作定义的动画末帧之后一帧。以定义的末帧/首帧差定位实际 GLB 项，不能一律使用 A 后的首个 B；扩展包中的多个 B 同名项也不能混淆。原作可见边界只用于重绘裁切后的显示尺寸和偏移，不复制其像素。

`0x40fdf8` selects the frame after the definition's animation end. The end/start difference identifies the actual GLB entry; this is not universally the first B after A, and repeated B names in expansion packs must stay distinct. Original visible bounds supply numeric display dimensions/offsets only, without copying pixels.

| 关卡 / Stage | 原型 / ID | 损毁资源 / Destroyed resource | GLB 项（从零）/ Entry (zero-based) |
|---|---|---|---|
| 3 | 42 | S_BOSS3B | Game.glb / 1171 |
| 4 | 43 | S_BOSS4D | Game.glb / 1175 |
| 5 | 44 | S_BOSS5D | Game.glb / 1179 |
| 6 | 45 | S_BOSS6M | Game.glb / 1192 |
| 9 | 236 | S2_BOSS3B | game2.glb / 228 |
| 12 | 239 | S2_BOSS6B | game2.glb / 265 |
| 13 | 240 | S2_BOSS7B | game2.glb / 271 |
| 15 | 242 | S2_BOSS9B | game2.glb / 282 |
| 18 | 263 | S2_BOSS12B | game2.glb / 346 |

| 发布素材 / Published asset | 尺寸 / Size | SHA-256 |
|---|---|---|
| `web/assets/boss-deaths-classic-hd.png` | 1254×1254 RGBA | `d881398b39460595e847a09918d1c65a23f2ebf8e021f9830f2be90b9940db17` |
| `web/assets/boss-deaths-expansion-hd.png` | 1024×1536 RGBA | `d6703415f77e14f69d897ac1cd70ed4bf513d46d6b45dd30857c8c72593d8416` |

`web/js/boss-deaths.js` 为九个原型逐项记录图集、紧裁切、原作尺寸与偏移。原版四种红色机体为第一张图，扩展五种为第二张；运行时不依赖等分格推测裁切。当前关最多加载其中一张，离开相关关卡释放引用及染色缓存。缺失映射记录诊断，不回退为通用机体。两张图均加入原生逐张解码检查；九种实际绘制、无额外缩放/旋转与按关释放另有浏览器验证。

The metadata records atlas/crop/original dimensions/offsets explicitly for each of nine IDs. Four classic red hulls occupy the first atlas and five expansion hulls the second; runtime crops do not infer equal cells. At most one atlas is loaded for the current stage, with old references/tint caches released. Missing mappings are diagnosed without generic hull fallback. Both atlases join native sequential decoding; browser checks cover all nine actual draws, no added scale/rotation and stage-scoped release.

## 提示词记录 / Prompt record

共同要求：正上方视角、原作轮廓/朝向/配色/破损、清晰的九十年代像素轮廓；不要修复机体，不加火焰、烟雾、爆炸、文字或场景。第一张按四种参考排列，第二张按五种参考排列并留空末格。布局修正要求缩小并保留透明边距，透明修正要求保持机体和内部焦黑金属，只清除外围背景。以上说明对应下列主要提示词片段。

Shared requirements were exact source silhouettes/orientation/palettes/damage, top-down framing and crisp 1990s pixel contours, without repaired hulls, flames, smoke, explosions, labels or scenes. The first sheet follows four references; the second follows five with an unused final cell. Layout correction reduced ships into padded regions; background correction retained the hulls and opaque dark interiors while removing surrounding background. Principal prompt excerpts follow.

> Preserve the exact reference silhouettes, orientation, appendages and damage. All are already destroyed: blackened patchy plating, charred holes and broken/scorched panels, dark original red and gunmetal gray. Retain original 1990s chunky pixel contours and crisp tiny pixel shading while redrawing at HD clarity, not a smooth modern illustration or glossy 3D render. Do not repair the damage.

> Preserve each supplied exact silhouette, facing direction, proportions, appendages, colors and damaged surfaces. […] Preserve this fifth reference's lighter silver metal rather than inventing heavy damage. Authentic 1990s blocky pixel contours, compact original palette and crisp pixel/dither shading; redraw in HD clarity, not smooth modern 3D.

> The space outside the crisp spacecraft silhouettes must be completely transparent alpha zero, including the entire unused bottom-right cell and every gap. Ship interiors should remain fully opaque, including black scorched metal and dark recesses.

这些是高清重绘，不是原像素复刻。火球六关键帧、碎片和墙钟时序的剩余差异见 [表现记录](M2_10_PRESENTATION.md)。

These are HD redraws, not original-pixel replicas. See the presentation record for remaining fireball-keyframe, debris and wall-clock differences.
