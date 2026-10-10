# M2.10 Boss、结算与像素图标 / Bosses, results and pixel icon

2026-10-10：本轮先检查本地 DemonStar 4.04 死亡分支，并再次查看已缓存金标录像 P1 228 秒结算帧。原图、反汇编与录像帧均留在忽略目录。录像只是抽样，不能称为十八关逐帧验收。

On 2026-10-10, this pass inspected local DemonStar 4.04 death branches and revisited the cached P1 result frame at 228 seconds. Original images, disassembly and video frames remain ignored. Sampled evidence is not frame-by-frame verification of all eighteen stages.

## Boss 分支 / Boss branches

`0x40fdb0` 拒绝 `0x40` 地面标记，并要求 `0x80` 才进入坠毁。十八关对应的坠毁关卡为 3、4、5、6、9、12、13、15、18；其余关卡原位爆炸。旧版全部 Boss 统一下移/侧翻的泛化已移除。基础 HP、武器伤害、炮位、关卡事件和显式素材路由未修改。

`0x40fdb0` excludes ground flag `0x40` and requires `0x80` for falling. Eligible stages are 3, 4, 5, 6, 9, 12, 13, 15 and 18; the remaining Bosses explode in place. Universal downward translation/rightward roll is removed. Base HP, weapon damage, guns, stage events and explicit art routing are unchanged.

高效果状态 3 在更新前检查深度大于 120（`0x41015c`），再以初始 0.25、每步增加 0.25、上限 4 推进。第 38 次更新后深度为 122，第 39 次才销毁。绘制由 `0x410c8c` 进入 `0x414940`，用整数深度和系数 327 做中心透视缩小；当前浮点移植比例为 `65536 / (65536 + floor(depth) * 327)`，适配现有 400×480 战场。火焰跟随机体变换，最终爆炸中心一致。

High-detail state 3 checks depth greater than 120 before updating, starts at velocity 0.25, adds 0.25 per update and caps velocity at 4. Depth reaches 122 after update 38 and destruction occurs on update 39. Drawing calls `0x414940` from `0x410c8c`, using integer depth and coefficient 327 for center-based perspective shrink. The floating-point port uses the formula above in the existing 400×480 field. Flames share the hull transform and the final blast uses its displayed center.

边界：原程序低效果状态 4 使用另一分支（每步 `0x5555 / 65536`、阈值 16、侧向偏移并上移）；目前固定采用高效果表现，没有新增画质选项。原作受损姿态、各机碎片、随机火点仍未全部重绘或逐帧校准。此次修正分支和投影，不宣称全部死亡动画 1:1；原作定点逐像素舍入也不完全等于高清浮点绘制。

Limits: original low-detail state 4 has a different branch (increment `0x5555 / 65536`, threshold 16, lateral/upward displacement). The remake uses high-detail presentation without adding a quality option. Damaged poses, per-hull debris and random flame sites are not all redrawn or frame-calibrated. This fixes branch selection/projection rather than claiming complete animation fidelity. Original fixed-point pixel rounding also differs from HD floating-point rendering.

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

当前验证：151 项引擎/单元测试，经典结算、三语、战斗反馈/音乐和双人房间浏览器检查通过。双端新安装包仍须在发布前完成构建验收。

Current verification: 151 engine/unit checks and classic-results, localization, combat/audio and two-player room browser suites passed. Fresh native packages still require build verification before release.

Android 新图标与界面已通过 Debug 编译/Lint，以及 API 37 打包版冷主菜单 BGM、原生触感调用、TCP 收发和双人重连复验。iOS 与正式 Release 包仍待本次构建结果。

The icon/UI passed Android Debug build/Lint and packaged API 37 rechecks for cold-menu BGM, haptic commands, TCP traffic and two-player reconnect. iOS and final release packages still await this build pass.
