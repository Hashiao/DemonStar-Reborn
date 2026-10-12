# M2.21 地面导弹与联机卷动 / Ground missiles and LAN scrolling

用户确认原作 G_ANGTNKR/L（ID 117/118）是反馈目标，并于定位后授权修复发射与移动。它们在原表第 4、6、12、16 关；此前第二关的口述不覆盖原始放置。证据见 [后续定位](STAGE2_GROUND_FOLLOWUP.md)。版本 0.2.21 / build 23，保留 M2.20 地物连锁与蛇形坠毁；完整发布验收尚在进行。

The user confirmed G_ANGTNKR/L (IDs 117/118) and authorized firing/movement fixes after diagnosis. Source placements are in stages 4, 6, 12 and 16; the earlier stage-two description does not override map records. See the linked evidence. Version 0.2.21 / build 23 retains M2.20 ground chains and snake falling. Full release verification is in progress.

## 改动 / Changes

- 原作 `0x42963a` / `0x4296ae` 分别固定为角度 `0x4ea` / `0x316`，约偏离正下方 41.13°。旧代码错误使用炮位角度 0，导致斜向图像竖直向上飞。现在按专用构造器向左下/右下发射，保留炮位原始速度、计时与伤害。
- 同族正下方弹 8 沿用 `0x4295c6`；三者恢复半高炮口 Y 偏移（8 / 4 / 4）。43/44 已有斜向图像，不叠加通用旋转。
- 补上三类导弹每步两粒的向后航迹。方向/数量参考 `0x428d01` / `0x409150`；灰色细烟使用现有重制粒子外观和 0.28 秒淡出，不宣称逐像素复刻原调色板粒子。视觉随机数独立，不消耗战斗随机序列，也不增加碰撞或伤害。
- 客户端地面和实体都从上一份收到的快照插值，修正原先混用“上一快照”和“房主上一逻辑步”的抖动。新出现的贴地装置也对齐地面；暂停、恢复、换关及首次快照统一直接定位。独立行驶炮台和漂浮拾取物不改成贴地运动。
- 房间输入/规则版本升为 7，旧版房间拒绝握手；快照格式仍为 2。

- Native `0x42963a` / `0x4296ae` fix angles at `0x4ea` / `0x316`, approximately 41.13 degrees from downward. The old code used raw gun angle zero, making diagonal artwork fly upward. Restore down-left/down-right construction while preserving source speed, cadence and damage.
- Downward type 8 follows `0x4295c6`; restore half-height muzzle Y offsets of 8 / 4 / 4. Existing diagonal artwork needs no extra generic rotation.
- Restore two backward-drifting trail particles per update. Direction/count follow `0x428d01` / `0x409150`; fine gray smoke reuses the remake particle style and 0.28-second fade, not pixel-exact palette-particle emulation. Visual randomness does not consume combat RNG or add collision/damage.
- Interpolate client terrain and entities from the preceding received snapshot, eliminating the mixed-snapshot/host-tick interval. Newly received fixtures also align with terrain; pause/resume/stage/first snapshots snap together. Autonomous turrets and floating pickups retain their separate movement.
- Room rule/input revision becomes 7 and rejects older peers; snapshot format stays at 2.

## 验收与边界 / Verification and limits

定向回归覆盖四个实际放置关卡、四难度、单双人、原始炮口/速度/伤害，以及 30/60/120 Hz 贴地移动和暂停切难度。快照间隔 1/2/3/6 步，检查新旧装置在整个插值区间相对地面不滑动；浏览器实际 Canvas 变换和斜弹像素也参与验收。所有完整套件和安装包结果在完成后追加，不将运行中或失败项记为通过。

Targeted regressions cover all four placement stages, four difficulties, one/two players, native muzzles/speeds/damage, and terrain movement at 30/60/120 Hz including paused difficulty changes. Snapshot gaps of 1/2/3/6 ticks cover existing/new fixtures throughout interpolation; browser checks inspect actual Canvas transforms and missile pixels. Full-suite/package results will be recorded on completion; pending or failed checks are never marked passed.

单机中“持续停在屏幕位置”的现象此前未复现，故不擅改正确的贴地速度。G_TNK2A 的六帧开盖是另一个已知遗漏，本轮确认对象并非它，暂未实现。未做手机真机/热点互通认证，也未声称完整十八关逐帧还原。

Persistent screen-stationary objects in solo play were not reproduced, so correct terrain-bound speed is preserved. G_TNK2A's six-frame cover animation is a separate known omission, not the confirmed target, and remains unimplemented. No physical-phone/hotspot certification or complete eighteen-stage frame-exact fidelity is claimed.

为排查 M2.20 iOS 验收超时，模拟器测试优先使用已安装的小尺寸 iPhone SE 3；显式触控测试只在状态变化时刷新无障碍观察标签，JSON 键顺序固定。保留全部系统长按及双机联机断言；这些调整是否解决 CI 失败仍以新运行结果为准。

To investigate M2.20 iOS verification timeouts, prefer an already installed smaller iPhone SE 3 and update the explicit touch-test accessibility observation label only when its sorted JSON changes. Preserve all system-touch and paired-LAN assertions. Whether these adjustments resolve CI failures depends on the new run.
