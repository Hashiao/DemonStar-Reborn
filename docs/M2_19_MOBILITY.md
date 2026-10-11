# M2.19 统一玩家机动上限 / Unified player mobility

## 依据与范围 / Evidence and scope

用户明确要求所有难度和操作方式对齐原作鼠标/模拟摇杆分支的满速等效水平 1.68 秒、垂直约 1.73 秒，并包括斜向。已确认斜向两轴分别满速，不做 √2 降速；摇杆轻推仍可慢移，目标剩余距离不足一步时不得越过。只改变玩家机动，不改变世界时钟、敌人、弹速、射速和伤害。

The user requests the original mouse/analog-joystick full-speed equivalent of 1.68 seconds horizontally and about 1.73 seconds vertically across all difficulties and control methods, including diagonals. Both diagonal axes retain full speed without √2 normalization. Partial sticks still permit slower movement and short target steps must not overshoot. Only player mobility changes, not the world clock, enemies, projectile speed, firing cadence or damage.

本地 `ds.exe` 的 `0x425b2d–0x425bb0` 键盘分支每轴上限为 4。鼠标 `0x417530–0x417645` 根据目标差除以 8 后分别限在 ±6；模拟摇杆 `0x417b70–0x417c7c` 根据轴样本右移 7 后限在 ±6，并由 `0x425b7b–0x425b96` 使用。二者不能只用历史“键盘每轴 4”概括。原作存在 320×400 和 400×480 等画面模式；本次沿用 M2.1 的 320×400 可活动跨度对齐基准，不宣称原机帧时钟实测或原鼠标接近目标算法逐帧复现。

In the local executable, the keyboard branch at `0x425b2d–0x425bb0` caps each axis at 4. Mouse handling at `0x417530–0x417645` divides target differences by eight and caps each axis at ±6. Analog-joystick handling at `0x417b70–0x417c7c` shifts axis samples by seven and caps them at ±6, consumed at `0x425b7b–0x425b96`. The old keyboard-only cap therefore does not describe every input. Original display modes include 320×400 and 400×480. This change retains M2.1's 320×400 movement-span comparison basis; it is not native wall-clock measurement or exact replication of mouse approach behavior.

## 实现 / Implementation

| 项目 / Item | 数值 / Value |
|---|---|
| 逻辑步长，不变 / Unchanged simulation step | 35 ms |
| 横向每步上限 / Horizontal cap per step | `6 × 368 / 288 = 7.6666667` |
| 纵向每步上限 / Vertical cap per step | `6 × 376 / 296 ≈ 7.6216216` |
| 水平完整跨度 / Full horizontal span | 48 steps = 1.68 s |
| 垂直理论完整跨度 / Ideal vertical span | 49⅓ steps ≈ 1.7267 s |
| 垂直离散到达 / Discrete vertical arrival | 50 steps = 1.75 s; last step shortened |
| 斜向 / Diagonal | X and Y each retain their cap; corner arrival in 50 steps |

- 四档难度和有效玩家使用相同引擎常量；暂停改变难度、换关和关卡读档不会降低机动上限。
- All four difficulties and active players use the same constants; paused difficulty changes, stage changes and checkpoint loading retain the cap.
- 键盘、方向键和倾斜输入按轴限制。固定/浮动摇杆及手柄将圆形杆边缘映射到每轴满速，保留径向轻推幅度；手柄保留 18% 中立死区，触屏保留 12% 中立判定。旋钮视觉仍在圆形范围内。
- Keyboard, directional pads and tilt clamp independently per axis. Fixed/floating sticks and gamepads map a circular rim to full per-axis movement while retaining partial radial magnitude; gamepads retain an 18% neutral dead zone and touch retains its 12% neutral test. The visual knob remains circular.
- 鼠标与跟手目标共用引擎限速；远处目标各轴向目标满速，某轴到达后停止该轴，最后一步截断到剩余距离。保持跟手松开/取消即停及同屏双人最多一人使用的限制；同屏双人仍禁用陀螺仪。
- Mouse and follow-finger targets share engine limits: each distant axis moves at its cap, stops on arrival and shortens its final step. Follow release/cancel still stops movement, only one shared-device player may follow, and tilt remains disabled on shared devices.
- 联机主机按轴校验输入，不再把斜向压成单位圆。房间输入版本升至 5，双方须更新；快照和关卡档格式不变，当前玩法仍限单人/双人，四席仅底层预留。
- The LAN host clamps axes without unit-circle normalization. Room input revision 5 requires both peers to update. Snapshot/checkpoint formats remain unchanged; public play stays solo/two-player, with four seats reserved only in the core.

音频沿用 M2.18。原始地图/数值表、敌机运动、弹丸自主速度和既有炮弹继承玩家位移的规则不变；继承到的实际位移随玩家新机动自然变化。没有用加快全局时间来提高飞机速度。

M2.18 audio is preserved. Original maps/numeric tables, enemy motion, independent projectile velocity and existing player-displacement inheritance rules remain unchanged; inherited displacement naturally follows the faster player. The global clock is not sped up.

## 验证与边界 / Verification and limits

373 项单元/引擎测试通过，新增全难度八种输入三方向的 96 组合、轻推幅度、独立双人、暂停切难度/读档、联机主机斜向/目标限速与旧版本拒绝。打包浏览器另核对 96 组合以及真实浮动触屏斜推和松开。完整浏览器、Android/iOS 编译和模拟器结果在发包前补齐。

373 unit/engine tests passed, adding 96 combinations of four difficulties/eight inputs/three directions, partial magnitude, independent players, paused difficulty/checkpoint transitions, authoritative LAN diagonal/target limits and old-version rejection. The built-browser probe also checks those 96 combinations plus real floating-touch diagonals and release. Complete browser, Android/iOS build and simulator results will be recorded before release.

上述秒数是固定逻辑步换算，不含输入采样、显示刷新、联网往返或设备卡顿。模拟器和浏览器结果不等于真机手感、最低系统硬件或真实热点互通验收。IPA 仍未签名，须自行签名。

These times are fixed-step conversions, excluding input sampling, display refresh, network round trips and device stalls. Browser/simulator checks do not certify physical feel, minimum-OS hardware or real-hotspot interoperability. The IPA remains unsigned and requires user signing.
