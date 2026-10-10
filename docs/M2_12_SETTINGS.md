# M2.12：设置、出击与三色进度 / Settings, launch and retained color power

## 范围与依据 / Scope and evidence

本次按用户确认的交互需求修改，属于可选玩法扩展，不宣称来自原作。默认关闭三色保留，继续使用已核实的原作换色归最低档、低能量降火和死亡重置。敌人基础 HP、武器伤害表、超级武器预算、美术/HUD、十八关编排未调整。实际玩法仍只开放单人/双人，3P/4P 仅协议与核心预留。

This milestone implements the user's approved interaction requirements and an optional gameplay extension, not a claimed original mechanic. Retained color power defaults off; verified classic color resets, critical-energy downgrades and death resets remain the default. Enemy base HP, weapon damage tables, superweapon budgets, artwork/HUD and the eighteen-stage campaign are unchanged. Play remains solo/two-player; P3/P4 are protocol/core reserves only.

## 交互 / Navigation

定位结果：原设置与暂停页共用一整段设置控件，声音、语言、操作入口和存读档混排；模式按钮直接启动战斗，没有统一出击准备。武器只有当前颜色及等级，换色时直接重置，因此单改拾取逻辑不足以支持三色记忆，还必须扩展关卡档与网络序列化。修复分别落在分类路由、出击准备、暂停难度处理及版本化状态存储中。

Diagnosis: settings and pause reused a single flat block mixing audio, language, controls and saves. Mode buttons immediately started combat without a common setup step. Weapons stored only the equipped color/level and reset on switching; retaining three colors required checkpoint and network serialization changes in addition to pickup logic. The fix separates category navigation, launch setup, paused difficulty handling and versioned state storage.

- 主菜单：单人游戏、多人游戏、设置；多人再选同屏双人或局域网双人。
- 每种模式出击前：从头开始 / 选择出击点 / 读取存档。新游戏选择关卡后再选四档难度，然后开始。局域网房主在两位玩家就绪后设置。
- 设置分为声音与震动、玩家与操作、画面与界面、游戏规则、语言。存读档不放在设置内。
- 暂停菜单可调整难度、保存关卡、读取存档、切关、进入设置。嵌套菜单返回上一级，不意外解除暂停。三语切换保留当前语言分类页及战斗。
- 房主决定难度、开始、继续、切关和读档。客机可以请求暂停、设置本机操作/语言并保存收到的关卡入口档。

- Main menu: Single player, Multiplayer, Settings; multiplayer branches into same-device or LAN two-player play.
- Before launch: start from stage 1, choose a stage, or load a save. New runs select a stage, then one of four difficulties, then launch. LAN hosts configure the run after two players connect.
- Settings categories: sound/haptics, player controls, display/interface, game rules, language. Saves are outside settings.
- Pause offers difficulty, save/load, stage changes and settings. Nested Back returns one level without accidentally resuming. Language changes retain the category page and combat state.
- Hosts control difficulty, launch, resume, stage changes and loading. Guests may request pause, configure their local controls/language, and save the received stage-entry checkpoint.

## 规则与存档 / Rules and saves

三色保留默认关闭，可在主菜单设置或出击准备开启；本局开始后锁定，读档恢复档内规则。每名玩家的黄/蓝/红等级独立，未取得为 0，首次拾取为 1，上限 6。拾取切换至该颜色并升一级；已达 6 时维持 6 并触发一次该颜色清屏。黄 6 → 蓝 1 → 黄补给 = 黄 6 + 黄色清屏，之后蓝补给 = 蓝 2。S 只补满当前颜色，磁力武器保留原有规则。三色进度跨关卡保留、低能量不降级，只在所属玩家死亡后清空；死亡掉落仍按死亡前的当前装备生成。

The optional rule defaults off and can be selected in menu settings or launch setup. It is fixed during a run and restored by loading. Each player's yellow/blue/red levels are independent: 0 means uncollected, first pickup gives 1, maximum 6. Pickups equip and increment their color; an already full color stays at 6 and emits one matching nova. Yellow 6 → blue 1 → yellow pickup yields yellow 6 plus a yellow nova; the next blue pickup gives blue 2. S fills only the equipped color; magnetic power keeps its existing rules. Banks survive stages and low energy, clearing only when their owner dies. Death drops still use the equipped weapon immediately before death.

暂停改难度只更新现有难度规则，不重置当前玩家、敌人、弹幕、计时或分数；后续受伤与开火等按新难度处理，已有冷却不重置。关卡档仍是入关状态，包含入关难度、规则与三色进度；本关中途改难度后存档不会把入口装备与当前难度拼接。读档从该关开头及入口难度重玩。新关继承当前难度，并生成新入口档。旧 v1 档按原作模式迁移，保留原有装备。v2 保存三色数组。

Paused difficulty changes replace the existing difficulty rules without resetting players, enemies, projectiles, timers or score. Subsequent hits and firing use the new rules; existing cooldowns remain intact. A stage save is still the entry state, including entry difficulty, rule and color banks. Saving after a mid-stage difficulty change does not splice current difficulty into entry equipment: loading restarts at the saved entry difficulty. The next stage inherits the current difficulty and captures a new checkpoint. Legacy v1 saves load in classic mode with their original equipment; v2 adds color banks.

局域网快照 v2 同步难度、规则和每位玩家的三色等级。握手明确校验快照版本，旧新版本混联会提示升级，避免静默丢失规则。难度变化不产生关卡切换；读档产生新关卡 epoch 并清理旧输入。大厅和暂停均可由房主原子读档，存档人数须匹配房间。

LAN snapshot v2 synchronizes difficulty, rules and every player's banks. Handshakes check the snapshot version and reject incompatible versions with an update message. Difficulty changes do not change stage epochs; loading creates a new epoch and discards stale input. Hosts can atomically load from either lobby or pause; saved party size must match the room.

## 验证 / Verification

引擎回归包含精确拾取序列、S、死亡隔离、低能量、跨关、v1 迁移、损坏数组拒绝、快照复制、暂停难度不重置、大厅读档与版本不匹配拒绝。浏览器检查通过实际按钮走开局和分类菜单，覆盖三语、五种窗口、双人多点触控、暂停保存/读取与房主同步。原生构建、模拟器结果与实际测试边界在发布说明及验证报告记录；模拟器与浏览器不得代替实机热点或 iOS 12 / Android 10 真机结论。

Engine regressions cover the exact pickup sequence, S, per-player death, low energy, stage transitions, v1 migration, malformed banks, snapshot copies, non-resetting difficulty changes, lobby loads and version rejection. Browser checks use real buttons for setup/categories across three languages and five sizes, two-player multitouch, paused save/load and host synchronization. Native builds, simulator results and verification boundaries are recorded in the release notes/report. Browser/emulator checks do not establish physical-hotspot or iOS 12 / Android 10 device compatibility.
