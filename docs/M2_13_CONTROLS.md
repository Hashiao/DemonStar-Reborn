# M2.13：单页开局与开火模式 / One-page setup and fire modes

本次依据用户确认的操作需求扩展界面，不改动原作关卡、敌人 HP、玩家伤害表或超级武器预算。单人和双人实际玩法范围保持不变，3P/4P 仍仅核心/协议预留。

This milestone implements the user's confirmed interaction requirements without changing original stages, enemy HP, player damage tables or superweapon budgets. Public gameplay remains solo/two-player; P3/P4 remain core/protocol reserves.

## 开局与状态 / Setup and status

- 点击单人游戏直接打开同一页的关卡、难度、三色规则和读档控件。关卡明确分为“从头开始”和“选择关卡”，选择后在本页显示第 1–18 关。调整后直接开始。双人共用这一页。
- 读档直接使用本页选择的槽位；恢复存档记录的关卡入口状态，包含原有难度、规则及人数。页面上的新游戏选项不会覆盖存档。
- 开启三色保留规则时，战场外状态区常驻黄/蓝/红各六格进度、当前武器标识及玩家编号。双人各有自己的状态组。原作生命、炸弹、能量 HUD 及蓝色 P2 保持原样。
- 新安装、重置操作及本版首次读取旧操作设置，均统一设为浮动摇杆，不保留旧版固定/八方向偏好；键位、摇杆尺寸位置、外设分配仍保留。初始化完成后，用户仍可手动选择固定/浮动/八方向并保存。

- Single player opens one page with stage, difficulty, retained-color rule and save loading. Stage explicitly offers Start from stage 1 or Choose stage; all eighteen stages are selected on that page. Two-player modes share this setup page.
- Loading uses the selected slot and restores its stage-entry difficulty, rule and party size. New-game controls do not override a loaded checkpoint.
- With retained colors enabled, an outside-field status area always shows six segments for each yellow/blue/red bank, an equipped-color marker and player number. Both players have separate groups. Classic life/bomb/energy HUD and blue P2 remain unchanged.
- Fresh installs, control resets and first loading of pre-release input preferences initialize every player to floating sticks, replacing prior fixed/eight-way choices while preserving bindings, size/position and device assignment. Subsequent explicit fixed/floating/eight-way choices remain available and persistent.

## 开火状态 / Fire state

默认“切换开火”，每位玩家独立配置，适用于触屏、键盘、鼠标、手柄。按一次开启持续射击，整枚 A 键保持压下外观；再按一次关闭。长按模式则需要实体输入持续按住。保存的是模式选择，不保存正在射击的临时状态。

Toggle fire is the default, configured independently per player across touch, keyboard, mouse and gamepad. One press latches shooting and the entire A button's pressed appearance; another stops it. Hold mode requires held physical input. Preferences store the selected mode, not the transient firing state.

| 情况 / Event | 行为 / Behavior |
|---|---|
| 普通暂停、分类设置、语言切换及旋转 / Ordinary pause, settings, language, resize | 保留持续开火，暂停期间不模拟战斗 / Preserve the latch; combat stays frozen during pause |
| 修改开火方式，任一方向 / Change fire mode in either direction | 清除持续开火和旧输入，需要重新操作 / Clear latched and stale fire input; require a new action |
| 玩家死亡 / Player death | 仅清除该玩家，其他玩家保持 / Clear only the dead player's latch |
| 换关、读档、开始新局、返回主菜单 / Stage change, load, new run, main menu | 清除开火状态 / Clear firing state |
| 联机断开、所属手柄断开 / LAN or assigned gamepad disconnection | 清除对应本机状态，防止旧输入滞留 / Clear affected local state to avoid stale input |

输入层将触点/键位和持续开火分开处理，键盘重复事件和手柄逐帧采样不重复切换。联机发送最终开火状态，不发送会被重复执行的切换指令；客机暂停中修改模式时立即发送停止状态。死亡事件和玩家生命数共同确保客机清理自己的开火状态。

Physical contacts/keys are separate from the latch. Keyboard repeat and gamepad polling do not repeatedly toggle it. LAN transmits the resolved firing state rather than repeatable toggle commands; a client changing mode while paused immediately sends its stopped state. Death events and observed life counts both clear the affected client's local latch.

## 验证边界 / Verification boundaries

测试覆盖新默认与旧配置统一、按键边沿、双人隔离、暂停、复活、换关、读档、模式切换、三色状态常驻、三语和窄屏。既有按住/固定摇杆测试显式选择相应模式，新默认另有回归。原生 iOS 验证包括模拟器系统长按、浮动摇杆拖动及再次点击停止；模拟器不代表 iOS 12 / Android 10 或真机热点、实体外设与触感已经实测。最终匹配构建结果见本版发布说明和 verification.json。

Tests cover defaults/legacy resets, input edges, player isolation, pause, respawn, stage/load resets, mode changes, persistent color banks, three languages and compact screens. Legacy hold/fixed-stick checks explicitly select those modes; new defaults have separate regressions. Native iOS verification includes simulator system long presses, floating-stick drags and re-tap-to-stop. Simulators do not establish iOS 12 / Android 10 hardware, physical hotspots, peripherals or haptic testing. Matching build results are recorded in this release's notes and verification.json.
