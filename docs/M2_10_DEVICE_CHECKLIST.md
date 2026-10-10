# M2.10 真机验收清单 / Physical-device checklist

本表记录尚需设备提供的证据，空白不代表通过。使用同一版本和构建号，并填写下载包 SHA-256。当前只开放单人/双人，3P/4P 仅协议预留。

This checklist records evidence that still requires devices. Blank entries are not passes. Use matching versions/build numbers and record package SHA-256 values. Current play is solo/two-player; P3/P4 are protocol reserves only.

| 配对 / Pair | 房主 / Game host | 热点来源 / Hotspot owner | 机型与系统 / Models and OS | 建房/动作/暂停/重连 / Room, actions, pause, reconnect | 结果 / Result |
|---|---|---|---|---|---|
| Android–Android | Android A | Android A / B 分别检查 / each | 待填 / Pending | 待填 / Pending | 未实测 / Untested |
| Android–iOS | Android | 两种热点来源分别检查 / each platform | 待填 / Pending | 待填 / Pending | 未实测 / Untested |
| Android–iOS | iPhone/iPad | 两种热点来源分别检查 / each platform | 待填 / Pending | 待填 / Pending | 未实测 / Untested |
| iOS–iOS | iOS A | iOS A / B 分别检查 / each | 待填 / Pending | 待填 / Pending | 未实测 / Untested |

1. **建立双人房间。** 系统先连接相同 Wi-Fi/热点；房主进入主菜单 → 多人游戏 → 局域网双人 → 创建房间，另一台输入显示的 IPv4 地址及六位房间码。接受系统本地网络授权。错码被拒绝，第三人不能加入，界面不出现 3P/4P 选项。
2. **独立控制。** P1 红色、P2 蓝色，两端分别连续移动和开火，再分别投弹。确认方向、炸弹库存、能量、生命和得分归属正确；两端看到同一世界。P2 右下角的小蓝机在能量条左端，炸弹在上方。
3. **暂停与切关。** 任一端暂停后，两端敌机/弹幕停住；房主继续。暂停中分别切换三语，确认战斗、装备和分数未重置。仅房主可选择另一关；双方进入同一关且旧弹幕清空。
4. **关卡存读档。** 入关后取得装备并进入下一关，暂停存到手动槽位；换关后读回。核对两人的该关起点装备、生命、分数恢复，奖励不会重复发放。另确认离线读档/改键可跨 App 重启保留。
5. **断线恢复。** 暂停前记录 P2 装备和库存，短暂断开客户端网络。房间应暂停；恢复连接后自动或手动重连回 P2 座位，装备保留。各检查一次 App 切后台后恢复；记录实际恢复时长和错误提示。
6. **同机双人触屏。** 分别在 Android 和 iOS 选择多人游戏 → 同屏双人，同时用两只摇杆移动、两枚 A 开火，并按两枚 B；独立松开一方不能影响另一方。检查固定摇杆位置/大小、浮动中心和八方向斜向限速，旋转后不中断关卡。
7. **外设。** 记录键盘/鼠标/手柄型号和连接方式。检查玩家分配、轴向、开火/炸弹映射、冲突提示、保存后的重启，以及拔出/断连后无残留移动或开火。
8. **触感与首屏音乐。** 支持震动的手机上检查受伤、投弹、死亡、拾取反馈，关闭设置后不振动，切后台后不振动。冷启动无需点击主菜单即可播放 BGM；保存静音/零音量后重启仍尊重设置。
9. **表现。** 对照指定原作录像：P1/P2 颜色和 HUD；第 1/2 关 Boss 原位爆炸、符合标志的飞行 Boss 受损后侧上漂移、地面 Boss 不侧翻；结算保留战场并按玩家显示图标奖励。记录具体关卡与录像时刻，不能用单帧通过替代全程动画验收。

1. **Join a two-player room.** Connect devices to the same Wi-Fi/hotspot first. Open Main menu → Multiplayer → Two players · LAN → Create room; the guest enters the displayed IPv4 address and six-digit code. Grant local-network access. Wrong codes and third players must be rejected; no P3/P4 option is exposed.
2. **Independent ownership.** Red P1 and blue P2 move/fire independently, then bomb separately. Check movement, inventory, energy, lives and score ownership against the shared world. P2's bottom-right blue ship sits left of its energy bar, with bombs above.
3. **Pause and stages.** Either player pauses both worlds; the host resumes. Switch all three locales while paused without resetting combat/equipment/scores. Only the host changes stages; both enter the same stage with old projectiles cleared.
4. **Stage checkpoints.** Carry acquired equipment into a new stage and save a manual slot; change stage and load it. Verify both players' stage-entry equipment/lives/scores and no duplicate bonus. Offline saves and bindings must also survive app restarts.
5. **Reconnect.** Record P2 equipment/inventory, briefly disconnect its network, then reconnect automatically/manually into the retained P2 seat. Check background/foreground transitions on both apps. Record actual recovery time and errors.
6. **Local touch.** On Android and iOS, move both sticks and hold both A buttons while pressing both B buttons. Releasing one player's controls must not affect the other. Check fixed layout/size editing, floating centers, bounded diagonal pad movement and rotation without restarting the stage.
7. **Peripherals.** Record models/connection methods, assignments, axes, fire/bomb mappings, conflict feedback, persistence and safe release after unplug/disconnect.
8. **Haptics and startup audio.** On hardware with haptics, verify hit/bomb/death/pickup feedback, disabled/background silence, untouched cold-menu BGM and persistence of mute/zero volume.
9. **Presentation.** Compare the designated original video: P1/P2 colors/HUD, in-place stage 1/2 explosions, eligible damaged airborne hulls drifting sideways/upward, no ground-Boss rolling, and battlefield reward panels. Record stages/timestamps; a still image cannot certify a full animation.

记录每项为通过、失败或未测试，并附机型/系统、版本/构建号、包哈希、重现步骤。unsigned IPA 须由测试者自行签名后安装；签名工具与安装错误单独记录。最低系统目标不等于已实测版本。

Mark each item passed, failed or untested, with model/OS, version/build, package hash and reproduction steps. Testers must sign the unsigned IPA themselves; record signing tools/installation errors separately. Minimum deployment targets are not tested-version claims.

M2.11 补充 / Additional check: 在用户 iOS 真机上分别长按两人的 A、B、固定/浮动/八方向区域两秒，并同时移动/开火。不得弹出选字、放大镜或菜单，松手须立即释放；联机地址与房间码仍须能输入、选择和粘贴。 / On the user’s iOS hardware, hold each player’s A, B and fixed/floating/eight-way control for two seconds, including simultaneous move/fire. No selection, loupe or callout should interrupt play; release must clear input. LAN fields must still accept typing, selection and paste.
