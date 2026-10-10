# M2.10 Boss、结算与像素图标 / Bosses, results and pixel icon

2026-10-10：本轮先检查本地 DemonStar 4.04 死亡分支，并再次查看已缓存金标录像 P1 228 秒结算帧。原图、反汇编与录像帧均留在忽略目录。录像只是抽样，不能称为十八关逐帧验收。

On 2026-10-10, this pass inspected local DemonStar 4.04 death branches and revisited the cached P1 result frame at 228 seconds. Original images, disassembly and video frames remain ignored. Sampled evidence is not frame-by-frame verification of all eighteen stages.

## Boss 分支 / Boss branches

`0x40fdb0` 拒绝 `0x40` 地面标记，并要求 `0x80` 才进入坠毁。十八关对应的坠毁关卡为 3、4、5、6、9、12、13、15、18；其余关卡原位爆炸。旧版全部 Boss 统一下移/侧翻的泛化已移除。基础 HP、武器伤害、炮位、关卡事件和显式素材路由未修改。

`0x40fdb0` excludes ground flag `0x40` and requires `0x80` for falling. Eligible stages are 3, 4, 5, 6, 9, 12, 13, 15 and 18; the remaining Bosses explode in place. Universal downward translation/rightward roll is removed. Base HP, weapon damage, guns, stage events and explicit art routing are unchanged.

再次抽看金标 P3 的 238、241、243、243.25、243.5、244、244.25、244.75、245.25、245.5、246、246.5、247 秒后，确认死亡前后两轮多点爆炸，中间保留焦黑机体。使用本地原图对 238/241 秒活动机体、244.75/245.25 秒受损机体做只读模板比对，最佳显示尺度均为 1.375；后两帧匹配位置从 `(190,90)` 到 `(181,83)`，匹配相关系数约 0.755/0.885。这支持原大小、侧上漂移的状态 4，而非状态 3 的中心透视缩小；截图尺寸不是原作速度实测。

Further sampled P3 review at the listed timestamps shows two multi-point blast phases with a charred hull between them. Read-only original-sprite matching at 238/241 seconds (live hull) and 244.75/245.25 seconds (damaged hull) gives the same best display scale, 1.375. The damaged matches move from `(190,90)` to `(181,83)` with correlations approximately 0.755/0.885. This supports constant-size sideways/upward state 4 rather than state-3 perspective shrinking. Screenshot coordinates are not original-speed measurements.

当前默认状态 4 依 `0x4101a2`、`0x410cce`：每次增加 `0x5555` 定点深度，先检查超过 `0x100000`，第 50 次更新销毁；绘制整数深度的侧向/向上位移，不旋转、不缩小。`x<64` 向左，`x>336` 向右，中央区按原作二选一。状态 3 作为原程序另一条内部路径保留（初速/加速度 0.25、上限 4、超过 120 后第 39 次销毁及中心投影），没有新增画质菜单。

The default now follows state 4 at `0x4101a2`/`0x410cce`: increment fixed-point depth by `0x5555`, check the `0x100000` threshold before updating, destroy on update 50, and draw integer sideways/upward displacement without rotation/scaling. Left/right edge gates are 64/336, with the original binary direction choice centrally. State 3 remains an internal original alternative: 0.25 velocity/increment, velocity cap 4, threshold 120 and destruction on update 39 with center projection. No quality menu was added.

`0x40fdb0` 在进入坠毁时触发爆炸；`0x4111f0` 最终销毁再次触发 `0x40ed20`：四边中点加至少两个、或 `floor(max(width,height)/24)` 个内部爆点。当前使用已有重绘火球，在 104×104 的原作效果画布尺度表现，并保留首尾爆炸、受损帧和最终单次计分。移除坠毁期间额外的固定火焰柱，空血 Boss 标签隐藏。九个原作动画末帧后的损毁资源已独立重绘并显式映射，按关加载与完整解码检查保留；见 [受损图集](ART_M2_10_BOSS_DEATHS.md)。

Death entry triggers explosions in `0x40fdb0`; final destruction invokes `0x40ed20` again at `0x4111f0`: four edge midpoints plus at least two or `floor(max(width,height)/24)` interior points. Existing redrawn fireballs use the original 104×104 effect-canvas scale, with initial/final blasts, a damaged frame and one final score award. Extra permanent flame columns during falling are removed, and the empty Boss bar is hidden. Nine post-animation destroyed resources now have independent redraws and explicit mappings, retaining per-stage loading/full-image readiness; see the linked atlas record.

边界：火球仍为六关键帧重绘而非原版全部 26 帧；碎片、随机火点和原机墙钟时序仍有近似。未以本轮抽样宣称十八关整段逐帧验收或完整 1:1。

Limits: fireballs remain six redrawn keyframes rather than all 26 original frames. Debris, random fire sites and original wall-clock timing remain approximate. These samples do not establish complete eighteen-stage frame-by-frame fidelity.

## 结算 / Results

通关现在保留战场背景和经典 HUD，显示 MISSION COMPLETE 对应三语标题。每人有细蓝边框、红/蓝标题、炸弹图标奖励、勋章图标奖励、合计三行；双人分栏。通用击杀/命中率/时间卡片不再用于关卡结算。下一关/返回菜单保留为移动端操作；奖励公式和已确认的一次入账规则未改。

Completion retains the battlefield and classic HUD beneath the localized MISSION COMPLETE heading. Each player gets a thin blue frame, red/blue header, bomb-icon reward, medal-icon reward and total; two players have separate columns. Generic kills/accuracy/time cards are removed from stage results. Next-stage/hangar actions remain for mobile use; verified formulas and one-time award behavior are unchanged.

三语单人/双人、四种尺寸、透明叠层、奖励归属、切关保留装备及返回普通设置样式已通过浏览器检查。保留约 0.525 秒行间显现并支持减少动态效果；字体及原版自动转场节奏仍有移动端适配差异。

Browser checks cover three locales, solo/two-player results, four sizes, transparent overlays, rewards, retained equipment and ordinary settings afterward. Rows retain approximately 0.525-second reveal intervals with reduced-motion support. Fonts and original automatic transition timing retain mobile adaptation differences.

## 图标 / Icon

内置 imagegen 参考本地 `PLAYER1I` 的红色机体、银白炮舱、暖色尾焰和像素轮廓，重新绘制星空像素图标。发布源 `web/assets/app-icon-pixel-hd.png` 为 1254×1254 RGB，SHA-256：`ecd3a2f52dbc9d0a39eddaa0dc5078fc7b20d08a2d173037d1c700db5c67f993`。原图仅参考，不发布。

Built-in imagegen redrew a star-field pixel icon from local PLAYER1I's silhouette, red hull, silver-white pods and warm exhaust. The published 1254×1254 RGB source and SHA-256 are listed above. Original pixels are reference-only and not redistributed.

`tools/make-icons.mjs` 只机械生成平台尺寸，两端使用同一来源。iOS 全套尺寸无透明通道；Android 提供标准密度与安全内缩 adaptive icon，替换旧现代矢量。源码图和生成物已检查，安装后系统遮罩可能略有不同。

The packaging script only generates platform sizes from the shared source. iOS sizes are opaque; Android includes density variants and an inset adaptive icon, replacing the old vector. Source/generated files were inspected; installed launcher masks can differ.

当前验证：162 项引擎/单元测试，经典结算、三语、战斗反馈/音乐和双人房间浏览器检查通过。双端新安装包仍须在发布前完成构建验收。

Current verification: 162 engine/unit checks and classic-results, localization, combat/audio and two-player room browser suites passed. Fresh native packages still require build verification before release.

Android 新图标与界面已通过 Debug 编译/Lint，以及 API 37 打包版冷主菜单 BGM、原生触感调用、TCP 收发和双人重连复验。iOS 与正式 Release 包仍待本次构建结果。

The icon/UI passed Android Debug build/Lint and packaged API 37 rechecks for cold-menu BGM, haptic commands, TCP traffic and two-player reconnect. iOS and final release packages still await this build pass.
