# M2.15 操控与菜单修整 / Controls and menu refinements

用户于 2026-10-11 授权开发。此版本按用户要求扩展便利操作和炸弹容量，不将这些扩展称作 DemonStar 4.04 原作规则。

Development was authorized on 2026-10-11. Convenience gestures and inventory capacity are user-requested extensions, not claimed as original DemonStar 4.04 rules.

## 跟手与投弹 / Following and bombing

- `point` 内部设置值继续兼容，界面改称“跟手移动”。手指在战场任意位置按下并持续移动即可控制，松手、取消、暂停、死亡、换关、读档和尺寸变化清除目标。沿用引擎每步移动上限，不瞬移、不改变机动性。同屏双人仍只允许一人使用；第二个触点不能抢走控制权。
- The saved `point` identifier remains compatible, now labeled Follow finger. Touch anywhere in the battlefield and move while held. Release, cancel, pause, death, stage/load transitions and resizing clear the target. Existing bounded movement steps remain unchanged. One shared-device player can use it; another contact cannot steal ownership.
- 双击投弹是独立复选框，默认关闭；单人和每机一人的局域网可用，同机双人禁用但保留偏好。区域包括分数到炸弹/能量 HUD，排除暂停及 A/B 等按钮。单次接触最多 250 毫秒，两次释放间隔不超过 320 毫秒；18 CSS 像素以内视为轻触，两次位置相距不超过 32 像素。拖动、长按、多触点和取消不组成双击；不绕过库存、冷却或复活限制。
- Double-tap bombing is a separate default-off checkbox, available solo and on one-local-player LAN devices. Shared-device play disables it while retaining the preference. The area spans score through energy/bomb HUD, excluding pause and A/B buttons. Each contact lasts at most 250 ms, releases are within 320 ms, tap movement within 18 CSS pixels, and tap locations within 32 pixels. Drags, holds, multiple contacts and cancellation break the sequence. Inventory, cooldown and respawn restrictions still apply.
- 跟手松开和双击动作在客户端立即发送给房主，不等待常规 50 毫秒发送周期；房主保留移动、伤害和投弹权威。
- Client release and double-tap actions send immediately, without waiting for the normal 50 ms interval; the host remains authoritative for movement, damage and bombing.

## 容量与兼容 / Capacity and compatibility

容量由 6 改为 18；拾取、存档校验和联机快照均更新。炸弹保持逐枚分类型图标及后入先出，每排 6 枚，最多三排向能量条上方增长；P2 蓝机仍在右下整组的能量条左端。初始/死亡库存仍为 3，原作自动补给阈值仍为 `[6,3,2,1]`，伤害、无敌和延迟不变。入关存档仍保存入关状态，不变成任意帧续存。旧六枚库存存档可读取；握手输入版本升为 3，旧端拒绝入房并提示更新，避免旧快照校验使双方卡住。

Capacity increases from 6 to 18 in pickups, save validation and network snapshots. Typed individual icons and last-in-first-out consumption remain, with six icons per row and three rows growing above the energy strip. P2's blue ship remains left of its energy bar in the bottom-right group. Starting/death inventory remains three, original automatic supply thresholds remain `[6,3,2,1]`, and damage, invulnerability and delays are unchanged. Saves still capture stage-entry state, not arbitrary combat frames. Old six-bomb saves load. Input handshake version 3 rejects incompatible older clients before admission.

## 倾斜、结算与设置 / Tilt, results and settings

新安装、缺失配置和重置玩家操作采用 6° 阈值；已保存角度保留，因为无法区分之前默认 10° 和用户主动选定 10°。3–30° 范围、2° 回差、满方向输入、双轴反向、每次恢复确认中立位和局域网全员准备流程保留。

Fresh/missing/reset player preferences use 6°. Saved angles are preserved because the former default 10° cannot be distinguished from a deliberate 10° selection. The 3–30° range, 2° hysteresis, digital directions, inversions, resume calibration and LAN readiness barrier remain.

普通关卡结算显示轻触屏幕进入下一关，屏幕空白处可操作；接受结算出现 350 毫秒后的新轻触，避免结束战斗的旧触点跳过结算。已有按钮各自生效，点击不会穿透到下一关准备屏。联机只有房主可换关，第 18 关胜利不继续生成关卡。

Ordinary stage results invite a screen tap for the next stage. Blank space across the viewport works. Only a new tap after a 350 ms guard is accepted, preventing the finishing combat contact from skipping results. Buttons retain their actions, and clicks do not reach the next Ready dialog. Only the LAN host advances; stage 18 victory never creates another stage.

普通设置/对话框内容独立纵向滚动；溢出时显示持续可见、可拖动且支持键盘的滚动条。标题及返回页脚固定。原作透明结算及紧凑开局页面保持各自布局。返回文案简化，新增文案支持简中、繁中和英语。

Ordinary dialogs scroll their contents independently, with a persistent draggable and keyboard-operable scrollbar when overflowing. Headers and Back footers stay fixed. Classic transparent results and compact launch setup retain their layouts. Back labels are shortened; all added copy supports Simplified Chinese, Traditional Chinese and English.

## 验收边界 / Verification limits

自动回归覆盖输入、容量、存读档、联机协议、双击、松手停止、三语小屏布局和换关。最终执行结果见版本发布说明及发布附件 `verification.json`。物理手机陀螺仪手感、双机热点和 Android–iOS 真机混联仍需真机验证；部署目标 Android 10 / iOS 12 不等于已实测系统。

Regression coverage includes input, capacity, saves, LAN protocol, double taps, release stopping, trilingual small-screen layout and stage changes. Final execution results are recorded in release notes and the attached `verification.json`. Physical tilt feel, two-device hotspots and physical Android–iOS interoperability still need hardware validation. Android 10 / iOS 12 are deployment targets, not claimed tested systems.
