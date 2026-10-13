# DemonStar Reborn 工作约定

- M2.24 验收完成：413 项引擎、12 组适用浏览器、96 种溢出拾取组合、32 帧实绘、Android 构建/Lint及3组适用检查、同轮完整 iOS 构建/功能/触控/LAN通过；0.2.24/build 26，房间规则10。20组未变浏览器专项及Android设置/语言专项本轮跳过，不计通过。IPA未签名，真机/热点未认证。
  M2.24 verified: 413 engine tests, 12 applicable browser suites, 96 overflow combinations, 32 rendered frames, Android build/Lint/3 applicable suites, and same-run complete iOS build/functional/touch/LAN passed; 0.2.24/build 26, room revision 10. Twenty unchanged browser suites and Android settings/localization are skipped, not passed. IPA unsigned; physical phones/hotspots unverified.

- M2.24：三色满级同色球/S溢出弹不抵消敌弹，保留原弹量/伤害；磁力与炸弹旧行为不变。G_TNK2A/G_TNK3A/G_BTANK1A恢复6/6/20帧原作炮门计时与按关重绘加载，所有复用关卡生效，炮位不改，三类炮台移除旧难度射击倍率。见 docs/M2_24_OVERFLOW_SHUTTERS.md。
  M2.24: full-tier same-color/S overflow no longer cancels hostile shots; preserve counts/damage and existing magnetic/bomb behavior. Restore source-timed 6/6/20 shutter poses for G_TNK2A/G_TNK3A/G_BTANK1A with stage-scoped redraws across every sharing stage; gun definitions are unchanged, with source cadence restored for these three families. See the linked document.

- M2.23 验收完成：407 项引擎、31 组浏览器、288 组合机动、96 组快档战斗对照、Android 全套及同轮 iOS 构建/功能/触控/LAN 通过；0.2.23/build 25，房间规则 9。IPA 未签名，未认证真机热点。
  M2.23 verified: 407 engine tests, 31 browser suites, 288 mobility combinations, 96 Fast combat comparisons, full Android and same-run iOS build/functional/touch/LAN passed; 0.2.23/build 25, room revision 9. IPA unsigned; physical hotspots unverified.

- M2.23：每位玩家独立慢/中/快速度，原作每轴 4/5/6 基准，默认中；三档覆盖所有难度/操作和斜向，保留轻推及目标限速。暂停可改且不清开火，操作偏好不由关卡档覆盖；联机各设备管自己的玩家，房间规则 9。画面设置新增默认开启的本机简单难度预警复选框，正式激光始终显示；预警前 0.8 秒保持 2%，仅最后 0.2 秒立方渐深，保留脉冲和原攻击时序。游戏内仅简短设置，详见 docs/M2_23_SPEED_SETTINGS.md。
  M2.23: independent slow/medium/fast player speeds use source-axis bases 4/5/6, default medium, across difficulties/controls/diagonals with partial-stick and target limits. Paused changes preserve latched fire; checkpoints do not override control preferences. LAN peers configure their own player with room revision 9. Display settings add a default-on local Easy-warning checkbox; real lasers always render. Warnings hold 2% opacity for 0.8 seconds and darken cubically only in the final 0.2 seconds, retaining pulses and firing timing. Keep product settings concise; see docs/M2_23_SPEED_SETTINGS.md.

- M2.22 验收完成：401 项引擎、30 组浏览器、96 组战斗对照、Android 全套及同轮 iOS 构建/功能/触控/LAN 通过；0.2.22/build 24，房间规则 8。IPA 未签名，未认证真机热点。
  M2.22 verified: 401 engine tests, 30 browser suites, 96 combat comparisons, full Android checks and same-run iOS build/functional/touch/LAN passed; 0.2.22/build 24, room revision 8. The IPA is unsigned; physical hotspots remain unverified.

- M2.22：用户授权简单难度 Boss 每轮激光前一秒预警，沿用正式激光脉冲节奏并由透明渐强；预警无伤害，正式发射才全不透明。暂停改难度沿用剩余时间，房主同步，房间规则 8。游戏内不添加难度区别说明，只在代码和 Git 文档记录。见 docs/M2_22_LASER_WARNING.md。
  M2.22: the user authorizes Easy Boss laser warnings for one second before each volley, pulsing like real beams while fading in. Previews are harmless; only actual emission reaches full opacity. Paused difficulty changes use remaining time; hosts synchronize warnings with room revision 8. Add no in-game difficulty explanations; document behavior in code and Git only. See docs/M2_22_LASER_WARNING.md.

- M2.21 交付状态：PR #5 已合并 main；395 项引擎、29 组浏览器、48 组脚本交火、Android 全套及同一轮 iOS 构建/功能/系统触控/原生 LAN 完整验收通过。0.2.21/build 23 两端包内部版本及 142 份 Web 资源已核验，正式报告为 passed；IPA 未签名，真机热点未认证。保留早期失败及候选哈希，正式包使用最终校验和。见 docs/M2_21_GROUND_MISSILES.md。
  M2.21 delivery status: PR #5 merged into main; 395 engine tests, 29 browser suites, 48 scripted combat cases, full Android checks and same-run iOS build/functional/system-touch/native-LAN verification passed. Both 0.2.21/build 23 packages have verified versions and 142 matching Web resources; the final report is passed. IPA remains unsigned and physical hotspots are not certified. Preserve earlier failures/candidate hashes; use final checksums for official packages. See docs/M2_21_GROUND_MISSILES.md.

- M2.21：用户已确认 G_ANGTNKR/L 两种斜置导弹台并授权立即修复发射与移动。原表位于第 4/6/12/16 关；不再把该对象强行称为第二关。恢复 8/43/44 专用方向与半高炮口、导弹航迹，统一客户端地面和贴地装置的快照插值，房间版本 7。单机 mode 8 / speed 1 及原作炮位、伤害、M2.18 音频、M2.19 机动不变。G_TNK2A 开盖动画仍单列后续，未包含本轮；M2.20 未发布的既有修复随新候选保留，发布仍需完整验收。见 docs/M2_21_GROUND_MISSILES.md。
  M2.21: the user confirmed the G_ANGTNKR/L angled launchers and authorized immediate firing/movement fixes. Source placements are in stages 4/6/12/16, not stage two. Restore type-8/43/44 constructor angles, half-height muzzle offsets and missile trails; align client terrain/fixture snapshot interpolation with room revision 7. Preserve solo mode-8/speed-1 motion, source guns/damage, M2.18 audio and M2.19 mobility. G_TNK2A cover animation remains separate future work. Retain unpublished M2.20 fixes in the new candidate; full release verification remains required. See docs/M2_21_GROUND_MISSILES.md.

- 2026-10-12 长期合并授权：用户明确允许以后通过本地整套适用测试的修改直接推送并合并 main，无需逐个 PR 再次确认；同时已授权合并当前 PR #4 并先发布此前修复，再处理两条新明确的第 2 关反馈。合并授权不替代发布验收，不得把远端 iOS 失败或未测项目记为通过。
  Standing merge authorization (2026-10-12): after the full applicable local test suite passes, the user authorizes pushing and merging changes into main without per-PR confirmation. PR #4 is also explicitly authorized, with its existing fixes to be released before addressing the two newly clarified stage-two reports. Merge permission does not waive release verification or permit reporting remote iOS failures/untested cases as passes.

- M2.20 已合并，发布验收未完成：按原程序补齐 0x20000 地物的基础 HP / 宽+1 范围延迟连锁，以及 S_ENEMY35/36/37 蛇形部件的损毁帧与坠毁。编队组号仅表示入场批次，不得冒称原作存在打头无条件全组死亡。地面箱子与 G_TNK2A 的卷动在当前受控场景中正确；已发现 G_TNK2A 六帧开盖动画遗漏，尚未开发，也不能将“斜向导弹”标为已修复。用户要求先发布此前修复再继续。规则版本 6；原始定义、M2.19 机动及 M2.18 音频不变。见 docs/M2_20_STRUCTURES.md。
  M2.20 merged, release verification incomplete: restore native 0x20000 delayed ground chains (base HP, width+1 radius) and damaged/falling S_ENEMY35/36/37 parts. Formation IDs are dispatch batches, not evidence of unconditional head-linked destruction. Ground-box/G_TNK2A scrolling is correct in controlled checks. The native six-frame G_TNK2A cover animation is missing and remains unimplemented; the diagonal-missile report is not marked fixed. The user requests shipping existing fixes first. Room revision 6 preserves source definitions, M2.19 mobility and M2.18 audio. See docs/M2_20_STRUCTURES.md.

- M2.19：用户要求所有难度/操作方式对齐原作鼠标与模拟摇杆满速，横向 48 步/1.68 秒，纵向理论约 1.73 秒、离散 50 步/1.75 秒。玩家每轴以原作 6 校准，斜向两轴满速；圆形摇杆保留轻推幅度，鼠标/跟手不越过目标。联机输入版本 5；只调玩家机动，不改世界时钟、敌机/弹速/射速/伤害及 M2.18 音频。见 `docs/M2_19_MOBILITY.md`。
  M2.19: all difficulties/input methods use the original mouse/analog full-speed basis: horizontal 48 ticks/1.68 s, vertical ideal ~1.73 s or discrete 50 ticks/1.75 s. Calibrate each axis from 6; diagonals retain both caps. Circular sticks preserve partial magnitude and mouse/follow targets never overshoot. Room input revision 5; change player mobility only, preserving world timing, enemies/projectile speed/firing cadence/damage and M2.18 audio. See `docs/M2_19_MOBILITY.md`.

- M2.18：用户授权两端共用音效调度修复，取代 M2.16 保留三路/Android 音效类冻结的历史范围。`audio.js` 统一八路世界音效及每位玩家两路射击保留、归属/55 ms 过滤与固定混音余量；`ios-audio.js` 继承分配，仅保留 iOS 启停平滑和系统恢复。保持原音源、优先级及战斗数值；这不是原作三路混音的 1:1 还原。见 `docs/M2_18_AUDIO_VOICES.md`。
  M2.18: the user authorizes shared scheduling on both platforms, superseding M2.16's historical three-slot/unchanged-Android scope. `audio.js` owns eight world voices, two protected shot voices per player, ownership/55 ms filtering and fixed mix headroom. `ios-audio.js` inherits allocation and retains iOS smoothing/recovery. Preserve recordings, priorities and combat values; this is not original three-voice mixing fidelity. See `docs/M2_18_AUDIO_VOICES.md`.

- M2.17：用户已解除前轮“仅取证”限制，授权按逐关清单修复四难度的数量/时机/位置，接受非逐帧精度。恢复每条记录准入、原始相邻编队及出生偏移、侧面/地物入场、mode 10 首目标、Boss 后调度；房间版本 4，当前玩法仍限单/双人。见 `docs/M2_17_SPAWNS.md`。自动补给归属序列、跨关补给、HP/伤害及循环战役仍待后续，不能随本次修复擅改；原作清单的“当前实现”字段固定指其取证基线，不重写历史数据。
  M2.17 supersedes the earlier research-only restriction: the user authorizes ledger-based difficulty/count/timing/position fixes without exact frame timing. Restore per-record gates, adjacent formations/offsets, side/scenery entry, mode-10 first targets and post-boss dispatch; room revision 4 still exposes solo/two-player play. See `docs/M2_17_SPAWNS.md`. Supply ownership/sequences, stage replenishment, HP/damage and campaign looping remain separate future work. Ledger current-runtime fields stay tied to their historical baseline.

- 2026-10-11 原作逐关设计恢复：用户明确要求先逐关核对四难度、人数、每个对象的出现时机和位置并本地固化，暂不修改代码。入口为 `docs/original-stage-design/README.md`：18 份逐关完整表、8,368 条放置、144 种静态组合、387 个定义，以及 `RULES.md` / `IMPLEMENTATION_CHECKLIST.md`。按原始分组区分地图 Y、触发刻度、出生中心和首次可见；名义 35 ms 换算不等于原机实测。所有后续修改项仍待实施，原始数值冻结及既有用户扩展不因研究解除；不要只拿总数或对称关系修复波次。
  Original per-stage recovery (2026-10-11): the user requires local evidence for all four difficulties, player counts and each object's timing/position before any code changes. Start at `docs/original-stage-design/README.md` for eighteen full ledgers, 8,368 placements, 144 static cases, 387 definitions, rules and the implementation checklist. Distinguish map Y, dispatch scroll, spawn center and first visibility using original groups; nominal 35 ms conversion is not native measurement. All fixes remain pending, and research does not lift numeric freezes or undo approved extensions. Never repair waves using totals or symmetry alone.

- 2026-10-11 波次取证：当前遗漏地图 `record[7]` 的人数/难度出场条件。补给载机不是一律留左，也不是随机左右，更不能把所有对称敌机砍半；按固定记录的 0x04/0x08 条件处理。已核对金标第 1/3 分集和原程序，见 `docs/WAVE_SPAWN_AUDIT_2026_10_11.md`。本轮仅定位，尚未修复；不据此改变 HP/伤害或宣称十八关完整波次已验收。
  Spawn audit on 2026-10-11: the current implementation omits player/difficulty conditions in map `record[7]`. Supply carriers are not always left-only or randomly sided; never halve every symmetric formation. Follow each fixed placement's 0x04/0x08 conditions. Reference parts 1/3 and native-code evidence are in `docs/WAVE_SPAWN_AUDIT_2026_10_11.md`. This is diagnosis only, not a fix, HP/damage authorization or full eighteen-stage wave certification.

- 关卡编辑器规划（2026-10-11）：面向非程序员，内置 18 关可直接加载并复制为独立自定义作品，原作关卡不可覆盖，副本修改不得影响共用模板或其他作品。当前仅固化方案，不启动开发；完整流程、现有加载/存档/联机约束及验收见 `docs/LEVEL_EDITOR_PLAN.md`。完整编辑设备范围、自定义 HP/速度/炮火数值权限仍待确认；记录文档不代表解除原作参数冻结。当前玩法仍限单人/双人。
  Level editor plan (2026-10-11): serve non-programmers by loading any of the eighteen built-in stages and copying it into an independent custom work. Originals cannot be overwritten, and edits must not mutate shared templates or other works. Record the plan only, without starting implementation; see `docs/LEVEL_EDITOR_PLAN.md` for workflow, loading/save/network constraints and acceptance. Full-editing device coverage and custom HP/speed/firing permissions remain pending; documenting the proposal does not lift original parameter freezes. Public play remains solo/two-player.

- 最后阶段规划：用户于 2026-10-11 同意各系统分别提供安装包，将 Windows/macOS/Linux 桌面免开发环境交付与五平台双人局域网互通放在项目最后阶段。当前只固化需求，不启动实现；具体缺口、签名/分发条件、25 个房主/客户端平台组合及待决策项见 `docs/FINAL_PLATFORM_DELIVERY.md`。Electron 是评估候选，尚未选定；普通浏览器独立联机不作安装包方案的必要前提，3P/4P 仍仅协议预留。不得将规划或模拟器证据写成桌面包/跨平台真机已通过。
  Final-phase plan: on 2026-10-11 the user accepted separate OS packages and deferred turnkey Windows/macOS/Linux delivery and five-platform two-player LAN to the project's final phase. Record requirements now without implementing them; see `docs/FINAL_PLATFORM_DELIVERY.md` for gaps, signing/distribution conditions, 25 host/guest platform categories and deferred decisions. Electron is a candidate, not selected; browser-only LAN is not a prerequisite for packaged delivery, and P3/P4 remain protocol reserves. Do not report plans or simulator evidence as delivered desktop packages or verified cross-platform hardware.

- M2.16：用户明确要求只修复 iOS 音频行为，Android 音效/音乐类及原生逻辑保持原样。iOS 适配层由 WKWebView 的 demonstar 消息桥选择；保留三路音效优先级、55 毫秒射击过滤和原始音源，采用短启停过渡、同轮次 BGM 状态合并、暂停菜单静音和系统音频中断恢复。不得把模拟器/离线波形回归写成用户 iPhone 18 Pro / iOS 27.0.1 真机已消除爆音。见 `docs/M2_16_IOS_AUDIO.md`。
  M2.16: the user explicitly scopes audio behavior fixes to iOS. Preserve Android's original effect/music classes and native logic. Select the iOS adapter through WKWebView's demonstar bridge. Retain three-slot priorities, the 55 ms shot filter and original recordings; add short start/stop envelopes, same-turn BGM coalescing, silent paused dialogs and system-audio interruption recovery. Simulator/offline waveform checks do not prove that crackling is eliminated on the user's iPhone 18 Pro / iOS 27.0.1. See `docs/M2_16_IOS_AUDIO.md`.

- M2.15 取代 M2.14 的点按目标行为：跟随当前手指位置，松手/取消立即停止，不保留自动飞行目标；同屏双人仍限一人。陀螺仪新默认阈值 6°，保留已有显式设置。双击战场投弹为独立复选框，默认关闭，同机双人禁用。炸弹容量按用户扩展为 18，原作图标每排 6 枚、最多三排；不改变原作自动补给阈值或伤害。结算提示全屏轻触换关，联机仍仅房主可推进；设置内容独立滚动，滚动条常驻，返回固定底部。见 `docs/M2_15_CONTROLS.md`。
  M2.15 supersedes M2.14 tap targets: follow the currently held finger and stop on release/cancel, with no persistent autopilot target; one shared-device player maximum. New tilt defaults use 6°, preserving saved choices. Double-tap battlefield bombing is a separate default-off checkbox, disabled on shared devices. The user-requested bomb capacity is 18, six classic icons per row and three rows maximum; original automatic supply thresholds and damage stay unchanged. Results accept a full-screen tap to advance, host-only on LAN. Settings scroll independently with a persistent scrollbar and fixed Back footer. See `docs/M2_15_CONTROLS.md`.

- M2.14：点按目标移动松手后继续、到点停止，沿用现有逐步机动性；同屏双人最多一人使用。陀螺仪同屏双人禁用，临时回退浮动且保留偏好。倾斜按可调角度死区产生满强度方向输入，保留双轴反向；每次出击（含换关）及恢复由玩家确认当前中立位，联机全员准备后恢复。切换开火实际长按 1.2 秒显示 3 秒提示，同一次长按仅一次。炸弹按用户确认保持现状。
  M2.14: tap targets continue after release and stop on arrival using existing movement steps; at most one shared-device player uses this mode. Tilt is disabled for shared-device play with temporary floating fallback that preserves preferences. An adjustable angular dead zone produces digital full-direction input with independent inversions. Confirm neutral at run/stage start and every resume; LAN waits for all peers. A physical toggle-fire hold of 1.2 s shows a 3 s toast once per hold. Preserve the accepted bomb behavior.

- 用户最新范围：3P/4P 仅保留协议与底层扩展能力，当前实际游玩、人数设置、同机触屏和局域网房间只开放单人/双人。不要把四人协议测试写成当前四人玩法已开放。
  Latest scope: reserve 3P/4P in the protocol/core only. Current gameplay, player-count settings, local touch and LAN rooms expose solo/two-player modes. Four-seat protocol tests must not be described as an available four-player mode.

- M2.13：开局选项同页呈现，“从头开始 / 选择关卡”须明确；开启三色保留时，常驻显示每位玩家三色等级。所有旧操作设置统一初始化为浮动摇杆，保留键位及外设分配。默认切换开火，每位玩家独立设置且覆盖触屏/键鼠/手柄；普通暂停保留，死亡仅清除所属玩家，换关/读档/新局清除。任意方向切换开火模式都清除旧开火状态。见 `docs/M2_13_CONTROLS.md`。
  M2.13: show setup options on one page with explicit start-from-stage-1 / choose-stage choices; retained-color mode always displays each player's three levels. Initialize all older touch preferences to floating while preserving bindings and device assignments. The default fire mode is toggle, configured independently per player across touch/keyboard/mouse/gamepad; ordinary pause preserves the latch, death clears only its owner, and stage/load/new-run transitions clear it. Changing fire mode in either direction clears stale firing. See `docs/M2_13_CONTROLS.md`.

- M2.12：设置按声音与震动、玩家与操作、画面与界面、游戏规则、语言分类；存读档放在开局/暂停入口。新游戏先选起始关卡，再选难度；暂停可改难度而不重置战斗，局域网由房主统一操作。关卡档仍保存入关状态（含入口难度），兼容旧档。
  M2.12: categorize settings into sound/haptics, player controls, display/interface, game rules and language. Save/load belongs to setup/pause. New runs select stage then difficulty; paused difficulty changes preserve combat and LAN hosts control the shared setting. Saves remain stage-entry checkpoints, including entry difficulty, with legacy compatibility.
- 三色火力保留是默认关闭的可选规则，不冒充原作：黄/蓝/红分别升级至 6，换色与低能量不降级，只在所属玩家死亡时清空。切回已满级颜色并拾取时触发一次该色清屏，S 只补满当前颜色。本局开局确定、读档恢复；同步关卡档及联机快照。见 `docs/M2_12_SETTINGS.md`。
  Retained color power is an optional, default-off extension, not an original mechanic: yellow/blue/red independently reach 6, survive color changes and low energy, and clear only on their owner's death. Picking up an already full color equips it and triggers one matching nova; S fills only the equipped color. Select the rule before launch and restore it when loading; serialize it in checkpoints and LAN snapshots. See `docs/M2_12_SETTINGS.md`.

- 多人 HUD 必须沿用已核实 1P 的原作风格：飞机余命图标、逐枚且区分类型的炸弹图标、16 格能量条。只扩展玩家位置与标识，不得替换为“生命/炸弹/能量”文字表或现代状态卡。
  Multiplayer HUD must reuse the verified 1P style: spare-ship icons, individual typed bomb icons and sixteen energy segments. Extend placement and player identity only; never replace these with text summaries or modern status cards.
- P2 战机、余命与状态小飞机必须为原作蓝色。以用户于 2026-10-10 最后确认的双人截图排列为准：P2 整组在右下角，小蓝机在能量条左端，炸弹在上方；此前“左右镜像”的口述已被该截图确认取代。
  P2's fighter and HUD ship icons must use the original blue palette. Follow the user's final confirmed two-player screenshot from 2026-10-10: the P2 group is anchored bottom-right, its blue ship is left of the energy bar, and bombs are above. This supersedes the earlier verbal mirror-layout description.

- M2.9：全战役原型和敌弹必须按 `campaign-art.js` / `enemy-shots.js` 显式映射，不得重新引入编号取模飞机或通用地物回退。保留五类炮台固定底座/独立炮管、按关加载与完整图片解码检查。基础外形覆盖不代表全部动画已还原；见 `docs/M2_9_RESEARCH.md`。
  M2.9: use explicit campaign-object and enemy-shot mappings; never reintroduce modulo fighters or generic scenery fallbacks. Preserve five fixed-base turret layers, per-stage loading and complete-image readiness. Base-art coverage is not full animation fidelity; see the M2.9 research document.

## 长期语言要求 / Long-term language policy

- 从 M2.6 起，新增/修改的核心注释、源码重要说明、提交说明、PR、Release 和其他重要 Git 信息必须提供简体中文及英文。README.md 为简体中文，README.en.md 为等价英文版，互相链接并同步维护。历史发布记录保留，不覆写既有标签。
  From M2.6 onward, new or changed core comments, important source explanations, commit messages, PRs, releases and significant Git information must be available in Simplified Chinese and English. Keep README.md and README.en.md equivalent, linked and up to date. Preserve historical release records and tags.
- 游戏菜单、设置、HUD、帮助、提示、结算及无障碍文案支持简体中文、繁体中文、英语；首次启动根据原生系统首选语言选择，明确 Hans/Hant 字形优先，TW/HK/MO 默认繁体，CN/SG/未指定字形的 zh 默认简体，其他语言使用英语。保存选择，用户手动切换后优先使用保存值。
  Localize menus, settings, HUD, help, feedback, results and accessibility copy into Simplified Chinese, Traditional Chinese and English. On first launch use the native preferred language: explicit Hans/Hant takes precedence; TW/HK/MO select Traditional; CN/SG or unspecified Chinese select Simplified; other languages use English. Persist the choice and respect manual overrides.
- 设置可随时切换三语并立即生效；不可重置战斗、装备、难度、音乐设置、最高分或解锁进度。繁体中文独立润色，采用港澳台读者熟悉的通用游戏表达，不机械转字、不硬套方言或声称已通过当地母语审校。
  Switching language in settings must apply immediately without resetting combat, equipment, difficulty, audio, high scores or unlocks. Author Traditional Chinese naturally for readers in Hong Kong, Macao and Taiwan; do not rely on character conversion, force dialect, or claim native-speaker review without evidence.
- 新版本提供中英发布说明、README 和测试边界。测试语言识别、手动选择持久化、旧存档迁移、暂停中切换和三语屏幕适配。参见 docs/LOCALIZATION.md。
  Ship bilingual release notes, READMEs and verification limits. Test detection, saved overrides, legacy-save migration, switching while paused and layout in all three languages. See docs/LOCALIZATION.md.

- 目标：复刻工作区 `Deamon Star` 内的 DemonStar 4.04，Android 与 iOS 开源。先尽可能还原原版 1–18 关、敌人属性与双方能力，之后才设计 19–25 新关卡。不得用随机生成关卡冒充原版。
- 美术：使用本地原作作为 imagegen 参考，保留原作轮廓、配色与辨识度。不得将未经重绘的原始图片、音乐、EXE、GLB、HLP 推送仓库。
- 优先复用 BenchBridge：`K:\aida64-diskmark\src`，Android SDK `K:\android\sdk`，已有 AVD、JDK 与 Gradle 缓存。禁止重复下载 SDK、AVD、系统镜像或另建无必要工具链。
- 最低系统目标 Android 10 / API 29、iOS 12.0。使用兼容构建和旧 WebKit 触控/布局回退，区分部署目标与已实测版本。
- 用户要求每个完成的里程碑提交源码到 GitHub，并发布配套 APK 和 IPA 的 GitHub Release。README 同步更新里程碑、下载直链、测试记录、已确认的还原程度及遗留差异。
- APK 使用本项目独立签名的 Release 包；不得复用 BenchBridge 签名私钥。iOS 无签名时明确标注 unsigned，说明须自行签名；不能声称可直接安装或已通过真机测试。
- 发布前完成适用的引擎测试、浏览器检查、Android 编译/Lint/现成模拟器检查、macOS iOS 构建。失败项不能标为通过。两个安装包和 SHA-256 一起交付，不覆写既有正式版本标签。
- 参考 `K:\aida64-diskmark\src\README.md` 和 `tools/publish-release.py` 的发布方式，不修改 BenchBridge。
- `.local`、签名材料、凭据、参考原图与原始游戏目录必须忽略。发布前检查待提交文件。
- 未经验证的原作参数必须记录为推断/待核对，不得宣称已实现完全 1:1。

- 首个里程碑仅中文是历史状态；现已由上述长期三语要求取代。保留 DemonStar 原作标志。
  The first milestone was Chinese-only; the long-term trilingual policy above now supersedes that restriction. Preserve the DemonStar logo.
- 当前反馈处理顺序：先核对本地原作并记录证据，再修改玩法。研究阶段不得把用户估计的速度差当成实测结论。见 `docs/ORIGINAL_COMBAT_RESEARCH.md`。
- 后续操作目标：左侧虚拟摇杆控制有上限的移动速度，右侧 A 开火、B 炸弹；支持移动与开火同时操作，避免拖动造成瞬移。
- 后续布局目标：手机默认竖屏，不强制左右装饰边框；折叠屏和平板支持横屏及窗口尺寸变化。保留原版 HUD 的信息、图标和风格，战场等比呈现；布局变化不得改变敌机速度、弹速、触发时间或碰撞判定。不要把这些目标误写成 M1 已实现。
- IPA 对外下载文件名使用纯 ASCII 字母、数字与扩展名，优先 `DemonStar.ipa`；桌面显示名支持三语。安装器兼容性须实测，不得仅凭重命名宣称安装错误已解决。
  Keep the public IPA filename ASCII, preferably `DemonStar.ipa`; localize the launcher name in three languages. Renaming alone does not prove installer compatibility.

## Core project requirements (English counterpart)

- Recreate the local `Deamon Star` DemonStar 4.04 for open-source Android and iOS. Restore the original 18 stages, enemy attributes and player abilities before designing stages 19–25. Never substitute random levels for the original campaign.
- Use local original art only as imagegen reference. Preserve silhouettes and colors; never publish original images, EXE, GLB or HLP files. The user's explicit authorization permits selected MP3 copies from `audio/`, with ASCII asset filenames and source/hash manifests. Keep the source directory ignored and unchanged. Do not replace supplied recordings with synthesized audio or TTS; do not publish music.glb.
- Reuse BenchBridge tools at `K:\aida64-diskmark\src`, SDK `K:\android\sdk`, existing AVDs, JDK and Gradle caches. Do not download duplicate SDKs, AVDs or system images, or modify BenchBridge. Deployment targets are Android 10/API29 and iOS12; test results must distinguish targets from actually tested systems.
- Each completed milestone requires source commits and a GitHub Release with the independently signed project APK, unsigned IPA when no signing identity exists, SHA-256 checksums and updated bilingual README. An unsigned IPA requires user signing and is not directly installable. Never reuse BenchBridge signing keys or overwrite a published tag.
- Before release run applicable engine/browser checks, Android build/Lint/existing-emulator checks, and macOS iPhoneOS builds and simulator checks. Never report failures as passes. Keep private keys, credentials, `.local`, references and original game folders ignored; inspect staged files.
- Research local-original evidence before changing gameplay. Preserve verified M2 controls, HUD, responsive layout, equipment mapping and M2.1 weapon/drop rules; use the fidelity and research documents instead of treating completed work as pending. Resizing must not change speed, timers or collisions. Do not call estimates measured or claim complete 1:1 fidelity.
- M2.4 explicitly authorized the verified projectile/collision difficulty branches, critical-energy weapon downgrades, removal of ordinary-hit invulnerability, corrected fighter, fixed turrets and asteroid frames. Base enemy HP, player weapon damage and old superweapon budgets remain frozen. See docs/M2_4_RESEARCH.md. M2.5 added launch, impacts, explosions, eligible ground wrecks and verified stage-bonus formulas; preserve them during localization.
- 用户已明确授权“执行修改 发包”，首次取证阶段已结束。M2 已落实默认双发、经典 HUD、限速摇杆/A/B、补给映射和响应式布局；后续工作以 `docs/FIDELITY.md` 的剩余差异为准，不要继续把这些写成尚未修改。
- M2.1 继续按用户反馈核对固定装备、颜色轮换、同色升档/异色归零、满火力 S、死亡掉球及三色清屏。以 `docs/DROPS_WEAPONS.md`、原始数值表和回归为依据，不用随机装备或统一散射替代。用户于 2026-10-09 明确授权使用根目录 `audio/` 的 MP3 作为游戏音效；该原始目录保持忽略且不修改，选用片段以 ASCII 文件名复制到发布资产，记录来源/哈希。此最新授权取代此前仅发布重制声音的约定；不要重新合成或使用 TTS 替代已提供录音。

- M2.2：用户已授权执行修复并使用 audio/ 新增 BGM MP3。按原程序音乐索引映射 18 关，来源/渲染方式和哈希写入 docs/MUSIC.md。该明确授权允许发布用户提供的 MP3 副本，不发布原始 music.glb。HP/伤害参数先冻结，来源和临时预算分开记录；不得凭手感擅调血量。屏外保护、全部拾取及 Boss 出场不遮屏、可选血条、红蓝弹型尺寸、持续转向、濒死/坠毁和三种超级武器按 docs/M2_2_RESEARCH.md 逐项验收。

- M2.4：用户在定位后明确授权修复撞击/敌弹伤害、S_ENEMY1A、网架炮台和大岩石，并要求核对四档难度、低能量降火及普通中弹无额外无敌。该授权解除这些受伤规则的冻结；敌机基础 HP、主机武器伤害及超级武器旧预算仍冻结。分别遵循原作撞机与敌弹处理分支，不统一乘经验倍率。证据见 docs/M2_4_RESEARCH.md。

- M2.7：普通高血量敌机（最大 HP≥905）与 Boss 血条独立，默认仅 Boss 开启；旧设置只迁移一次。蓝色炸弹是主角紫色护罩加向前激光，不是发射圆环；保留现有伤害预算，参见 docs/M2_7_RESEARCH.md。
  M2.7: independent regular (max HP ≥905) and boss bars default to boss-only, with a one-time legacy migration. The blue bomb is a player aura plus a forward laser, not travelling rings. Preserve the existing damage budget; see docs/M2_7_RESEARCH.md.

- 用户指定的十八关原作录像 `https://www.bilibili.com/video/BV1Xf4y1p7F1/`（分享 `https://b23.tv/DWFiNlB`）是长期视觉/行为金标。保留原作画风，可用 imagegen 高清重绘。按 docs/REFERENCE_VIDEO.md 记录实际观看时刻，不能把抽样写成全程逐帧验收。M2.8 追踪和三色武器修复依据 docs/M2_8_RESEARCH.md；保留已核实规则与原始伤害表。
  The user-designated eighteen-stage recording above is a long-term visual/behavioral reference. Preserve original art direction while permitting imagegen HD redraws. Record actual reviewed timestamps in docs/REFERENCE_VIDEO.md; sampled frames are not complete-run frame-by-frame verification. Preserve verified M2.8 homing/weapon rules and original damage tables; see docs/M2_8_RESEARCH.md.
