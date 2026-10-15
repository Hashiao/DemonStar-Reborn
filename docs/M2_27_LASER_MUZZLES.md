# M2.27 Boss 炮口对齐与同色光球 / Boss muzzle alignment and matching orbs

2026-10-15，0.2.27 / build 29，房间规则仍为 10。
2026-10-15; version 0.2.27 / build 29; room revision remains 10.

## 已确认问题 / Confirmed findings

用户指出第 11 关及其他 Boss 的光球、激光没有正对炮口，并补充第 5 关明确偏移，要求每个 Boss 都检查。旧绘制把 `ships-hd.png` 视为严格 4×4、`bosses-07-18-hd.png` 视为严格 4×3，再按完整矩形乘 1.12/1.13 缩放。实际重绘图留白、行高和炮管位置并不完全符合等分网格，导致偏移、拉伸和邻格残片。第 5 关左右侧炮向外/下偏，第 11 关炮位与炮管横向错开。

The user reported misaligned orbs/lasers, especially in stage 11, explicitly identified stage 5 and requested every Boss be checked. Rendering treated `ships-hd.png` as a strict 4×4 grid and `bosses-07-18-hd.png` as a strict 4×3 grid, scaling entire cells by 1.12/1.13. Actual redraw padding, row heights and barrels differ from that grid, producing offsets, stretching and neighboring fragments. Stage 5 side emitters were outward/downward; stage 11 mounts were horizontally displaced from their barrels.

另有移动首帧问题：新光束的 `px/py` 出生于当前位置，Boss 则按前后位置插值。现在正式光束与光球均跟随同一个 Boss 插值坐标，再加原始炮口偏移。

New beams also began with previous coordinates at their current spawn position while the Boss interpolated between frames. Live beams now follow the same interpolated owner position as warning orbs, adding the original muzzle offsets.

## 修正方法与边界 / Implementation and limits

- 逐个标记 12 个激光 Boss 的 33 条炮位记录，见 [数值配准清单](boss-muzzle-registration.json)。第 18 关两条红激光调度记录共用同一个炮口，不能误称 33 个不同物理炮口。
- 使用明确裁切及炮口控制点，把已有重绘机体配准至原作炮口。以少量三角形分片绘制，在边界轻微重叠避免接缝；只调整绘制，不修改图片文件、原作表、真实弹体坐标或碰撞范围。
- 9 号蓝激光显示蓝光球，10 号红激光显示红光球。保留一秒蓄能、逐渐加大的明暗/大小脉动和频率、发射同时消失、简单难度及本机开关范围。
- 保留原射击计时、伤害、音频、炮门、玩家速度和房间协议。美术配准不是原作像素 1:1；原红激光素材自身的半像素可见边界偏移保留。

- Review all 33 laser mount records across twelve Bosses; see the numeric registration manifest. Two red-laser schedules in stage 18 share one physical muzzle, so these are not 33 distinct physical emitters.
- Explicit crops and muzzle control points register existing redraws to source mounts. Small triangular drawing patches overlap slightly to avoid seams. Only rendering changes: image bytes, source tables, physical projectile positions and collision bounds remain unchanged.
- Blue type 9 uses a blue orb; red type 10 uses a red orb. Retain one-second charging, growing brightness/size pulse amplitudes and frequency, disappearance at emission, Easy-only assistance and the local toggle.
- Preserve firing timing, damage, audio, shutters, player speed and protocol. Registration is not pixel-identical original art; the existing red beam asset's half-pixel visible-bound offset remains.

第 12 关原作六条激光从下翼缘出光，按原表对应出光点配准，不擅加新炮管。其余 6 个无激光 Boss 不添加光球或激光；其既有非激光美术未纳入本次重绘配准，第 8/13 关等分图集的相邻碎边仍是独立美术遗留问题。

Stage 12's six source lasers emerge along the lower wing edges; register those source emission points without inventing barrels. The six non-laser Bosses receive no orbs or lasers. Their existing artwork is outside this laser registration change; neighboring fragments from uniform atlas slicing in stages 8/13 remain separate art issues.

## 专项检查 / Targeted verification

用户明确授权只测本项后推送 main、发布 APK/IPA。6 项激光逻辑检查和 1 组浏览器实绘通过，后者逐一覆盖全部 18 个 Boss、12 个激光 Boss/33 条炮位、6 个无激光 Boss，以及画面配准、红蓝同色预警、移动首帧、暂停、客户端快照与物理偏移不变。生成三张完整对照图及第 5/11 关独立图，逐张审看。它们是受控场景，不代表十八关完整通关验收。

The user explicitly authorized only this feature's checks before pushing main and publishing APK/IPA. Six laser logic checks and one rendered browser suite passed. The browser suite individually covers all eighteen Bosses, twelve laser Bosses/33 mount records, six non-laser Bosses, art registration, matching orb colors, moving first-frame beams, pause, client snapshots and unchanged physical offsets. Three full comparison sheets and separate stage-5/11 images were visually reviewed. These are controlled scenes, not full eighteen-stage playthroughs.

首次颜色检查发现蓝色渐变量化在初始不完整脉冲额外产生一个很小的局部亮度峰值；已改为比较完整周期，保留红蓝色占优、脉动增长、范围和发射消失断言。诊断与失败日志保留，不记作通过。

The first color check found a tiny additional local intensity peak in the initial incomplete pulse due to blue-gradient quantization. Compare complete cycles while retaining color dominance, amplitude growth, spatial bounds and emission-removal assertions. Diagnostic and failed logs remain and are not passes.

其余引擎/浏览器、Android Debug/完整 Lint/模拟器、iOS 模拟器功能/触控/LAN 与真机/热点均跳过，不记通过；完整流程保留。IPA 未签名，需自行签名。

Other engine/browser suites, Android Debug/full Lint/emulator, iOS simulator functional/touch/LAN and physical-device/hotspot checks are skipped, not passed. Full workflows remain available. The IPA is unsigned and requires user signing.

包构建与完整性核对结果将在发布前补齐。
Package build and integrity results will be recorded before release.
