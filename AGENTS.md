# DemonStar Reborn 工作约定

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
