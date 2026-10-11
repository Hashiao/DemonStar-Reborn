# M2.14 点按与倾斜操作 / Point and tilt controls

## 简体中文

- 点按战场设置目的地，无需按住飞机。松手后继续飞行，到点停止，再点更换目标。目标经现有逐步移动函数处理，每步速度受同样上限约束，最后一步仅缩短剩余距离，禁止瞬移。键盘或外设方向输入可取消当前目标。暂停、死亡、换关、读档和模式切换清理旧目标。
- 同屏双人最多一位玩家使用点按移动。若旧偏好同时选择点按，P2 本次回退浮动摇杆；不覆盖其单人偏好。同屏双人完全禁用陀螺仪，单人及局域网每设备一人可用。
- 陀螺仪模拟方向键，默认触发角度 10°，可设 3–30°。两轴独立判断，越界输出 -1/0/1，再使用既有斜向归一化；加大倾角不提速。回落阈值比触发阈值低 2°，减少边界抖动。左右、前后可分别反向。默认角度是待真机调校的初始值，并非原作参数。
- 每次出击、换关、读档启动及暂停恢复时，使用陀螺仪的玩家须拿稳设备并点击“准备好了”。确认时采样当前姿态为中立位；普通复活不额外弹窗。横竖屏改变或传感器数据过期时暂停，恢复重新校准。中立位仅保留在当前运行内，不跨启动沿用。
- Android 使用系统重力传感器，iOS 使用 Core Motion 的融合重力；30 Hz 采样并按屏幕方向转换。数据只在设备内参与输入。无传感器、权限失败或四秒内没有有效样本时，说明原因并临时回退浮动摇杆。浏览器尝试 DeviceMotion；支持程度依设备及浏览器权限而定。
- LAN 准备阶段由房主维持全局暂停，双方确认后恢复。目标坐标由房主逐步执行，不接受客机直接修改飞机位置。控制握手版本为 2，拒绝缺少新控制协议的旧版本，四席底层容量仍保留，产品只开放两人。
- 切换开火且射击已开启时，实际按住触屏、键盘、鼠标或手柄开火 1.2 秒，显示 3 秒说明。一次连续长按只提示一次；松手后可以再次触发。提示位于底部状态栏上方，不拦截触控。显示为按下的锁定按钮不等于真实长按。
- 原有浮动摇杆默认、按住/切换开火生命周期、原作 HUD、三色进度及炸弹行为保持。用户已接受当前炸弹实现，未将通用一秒投弹保护宣称为已核实原作规则。

平台参考：[Android sensor coordinates](https://developer.android.com/develop/sensors-and-location/sensors/sensors_overview)、[Apple Core Motion](https://developer.apple.com/documentation/coremotion/cmmotionmanager)。原生模拟器测试和注入传感器样本不能替代实际手机、平板的倾斜手感测试。

## English

- Tap the battlefield to set a destination without grabbing the ship. Travel continues after release, stops at arrival and changes with another tap. The existing movement step enforces the same speed limit; only the final step shortens the remaining distance. Keyboard/controller direction input cancels the target. Pause, death, stage/load and mode changes clear stale targets.
- At most one shared-device player uses point movement. Conflicting saved preferences temporarily give P2 a floating stick without overwriting the preference. Tilt is completely disabled for shared-device play; solo and one-player-per-device LAN can use it.
- Tilt acts as digital direction keys. The provisional default activation angle is 10°, adjustable from 3–30°. Each axis outputs -1/0/1 before existing diagonal normalization. Larger tilts never increase speed. A 2° release hysteresis suppresses threshold chatter. Independent horizontal/vertical inversion is available. The default awaits physical tuning and is not an original-game parameter.
- At run/load/stage start and every resume, tilt users hold the device comfortably and tap Ready; that instant sets neutral. Ordinary respawn does not add prompts. Orientation changes or stale motion data pause play; resume recalibrates. Neutral is runtime-only, never reused across launches.
- Android uses the system gravity sensor; iOS uses Core Motion fused gravity, sampled at 30 Hz and remapped for screen orientation. Sensor input stays on-device. Missing sensors, permission failures or no valid samples within four seconds explain the issue and temporarily use a floating stick. Browsers attempt DeviceMotion, subject to hardware and permissions.
- The LAN host keeps the shared world paused until both peers are ready. Hosts execute destination movement; clients cannot set ship positions. Input handshake version 2 rejects older control protocols. Four-seat core capacity remains reserved; public play stays two-player.
- In active toggle fire, holding the actual touch/key/mouse/pad fire input for 1.2 seconds displays a 3-second hint once per continuous hold. Releasing permits another hint. It appears above the lower status strip without intercepting input. A visually latched button alone never triggers it.
- Floating defaults, fire-mode lifecycle, original HUD, color progress and accepted bomb behavior are retained. The existing general one-second bomb protection is not presented as a verified original mechanic.

Native simulator checks and synthetic motion samples do not establish physical-phone/tablet tilt feel. Physical hotspots, Android–iOS hardware interoperability and minimum-OS hardware remain separate verification limits.
