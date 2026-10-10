# DemonStar Reborn / 恶魔之星·重生

**[简体中文](README.md) · [English](README.en.md)**

**[下载 Android APK](https://github.com/Hashiao/DemonStar-Reborn/releases/latest/download/DemonStar-Reborn-release.apk)** · **[下载 iPhone / iPad IPA（未签名）](https://github.com/Hashiao/DemonStar-Reborn/releases/latest/download/DemonStar.ipa)** · [全部里程碑](https://github.com/Hashiao/DemonStar-Reborn/releases)

DemonStar 4.04 的非官方移动端高清复刻，目标 **Android 10+ / iOS 12+**。保留红色战机和经典工业科幻风格，参考本地原版素材用 imagegen 重绘，游戏实现代码开放。

游戏现提供简体中文、繁体中文和英语。首次启动按手机首选语言自动选择；设置可随时切换并保存。繁体中文采用港澳台常见游戏用语，独立润色。Android 与 iOS 共用离线 Canvas 游戏内核，分别由系统 WebView 和 UIKit/WKWebView 承载；没有广告、账号、埋点或内购。单人和同机双人可离线游玩；可选原生局域网使用本地网络相关权限，不使用互联网中转。

**当前里程碑 M2.11（v0.2.11）修复 iOS 长按选字并重排单人、多人和设置入口，仍不是完整 1:1 移植。** 原作 1–18 关优先，19–25 关尚未开发；见 [还原状态](docs/FIDELITY.md)。


![菜单](docs/screenshots/menu.png)

## 当前里程碑 M2.11

- 修复 iOS 长按 A/B、摇杆时的文字选择与长按菜单冲突；防护包含两位玩家、固定/浮动摇杆和八方向按键，联机文本框仍可选择与粘贴。
- 主菜单前三项为“单人游戏 → 多人游戏 → 设置”。多人页提供“同屏双人 / 局域网双人”；单人入口固定启动 1P，设置保留操作映射，不再混放联机和人数入口。
- 空白区域不再直接开局，Enter 激活聚焦菜单；设置和多人入口具有明确的三语可访问名称。经典 HUD、红 P1/蓝 P2、战斗数值、关卡档案和原生音乐保持原有行为。

168 项引擎/单元和六组相关浏览器回归通过；Android 编译/Lint/API 37 模拟器操作、三语、双原生 App 联机通过。[iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38060772488) 通过 iPhoneOS 构建、iOS 18.5 iPhone/iPad 检查、原生双模拟器联机，以及 XCTest 系统长按 1.6 秒的单人/双人 A、B、摇杆检查。浏览器另测六触点同时长按；模拟器不代替用户真机复测。

[APK](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.11/DemonStar-Reborn-release.apk) · [IPA（未签名，须自行签名）](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.11/DemonStar.ipa) · [SHA-256](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.11/SHA256SUMS.txt) · [完整报告](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.11/verification.json)

[主菜单](docs/screenshots/m211-main-menu.png) · [多人入口](docs/screenshots/m211-multiplayer-menu.png) · [问题定位与修复](docs/M2_11_INPUT_MENU.md)。当前仍只开放单人/双人，3P/4P 仅协议预留。真机热点、Android–iOS 真机配对、实体外设及触感仍待实测。

## M2.10 已完成内容

- 当前开放单人、同机双人和双人局域网；3P/4P 仅协议/内核预留，人数菜单与房间不会开放四人。
- 双人可同时触屏移动/开火/投弹；固定摇杆可调位置大小、浮动摇杆随触点建立中心、八方向按键斜向限速；支持键盘、鼠标、手柄分配及简单改键，重复手柄分配会提示并停用冲突座位。
- 保留红色 P1、蓝色 P2 与经典图标 HUD。右下角小蓝机在能量条左侧，炸弹在上方。
- 设置/暂停可选择全部 18 关；自动档及三个手动槽位保存关卡起点的双人生命、装备和得分。联机由房主开始、继续、切关及读档；客户端可暂停和断线重连。
- 原生触感有保存开关与能力检测；冷主菜单尝试播放 BGM；iOS 使用原生播放器，尊重静音、音量与后台。
- 按原作标志区分原位爆炸与金标中的侧上漂移，新增九种受损机体及首尾多点爆炸；结算改为战场叠层、玩家框和图标奖励；两端统一像素图标。

168 项引擎/单元测试及 17 组浏览器检查通过。Android 项目签名 Release、Debug、Lint 和 API 37 现有模拟器已验收；[iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38056089782) 通过 iPhoneOS 构建及 iOS 18.5 的 iPhone/iPad 检查，包括 20 张战役/敌弹/受损图集解码。Android 两个原生 App 进程和 iOS 两个模拟器分别验证了双人原生 TCP。真机热点、Android–iOS 原生双机、实体外设和振动手感未实测，不能将模拟器结果视为这些项目通过。最低系统目标不等于已测版本。

[APK](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.10/DemonStar-Reborn-release.apk) · [IPA（未签名）](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.10/DemonStar.ipa) · [SHA-256](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.10/SHA256SUMS.txt) · [完整报告](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.10/verification.json)

[双人 HUD](docs/screenshots/m210-classic-2p.png) · [原作式结算](docs/screenshots/m210-results-2p.png) · [实现与边界](docs/M2_10_DEVELOPMENT.md) · [真机待验收清单](docs/M2_10_DEVICE_CHECKLIST.md)。原作 HP、伤害与战役表未变；火球关键帧、碎片和墙钟时序仍有近似，不宣称完整 1:1。

## M2.9 已完成内容

- 全战役 251 个原型建立显式映射，实际 18 关使用 244 个；补齐 213 个缺失原型，移除敌机编号取模和通用地物回退。第二关锅盖、坦克、雷达与炮台恢复各自外形。
- 15 种实际敌弹按原始帧名、颜色和可见尺寸映射，补上绑定炮口的五帧红色激光；伤害仍取原表。
- 五类炮台固定底座、独立转动炮管；图集按当前关加载并释放旧染色缓存，等待完整解码后才判定就绪。
- 对照十八个录像分集各四个代表时刻，并逐项检查本地原型。新增基础外形覆盖不等于完整动画逐帧还原；部分方向与旋转仍用单张重绘旋转近似，地面阴影及残骸仍有差异。

109 项回归、十组浏览器及 Android/iPhone/iPad 验收通过，版本 0.2.9（11）。详见下方测试记录与 [本版报告](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.9/verification.json)。

[第二关原型](docs/screenshots/campaign-02-prototypes.png) · [敌弹图鉴](docs/screenshots/enemy-projectiles-gallery.png) · [证据与边界](docs/M2_9_RESEARCH.md) · [完整覆盖表](docs/campaign-art-coverage.json) · [重绘来源与完整提示词](docs/ART_M2_9.md)。HP、关卡、玩家伤害表和超级武器旧预算不变。

## M2.8 已完成内容

- 追踪弹恢复原作 4×8 细弹体，保持每步 8 的飞行速度；循环分配目标、保持锁定，失效后重选，转弯不再不断减速。
- 按原作恢复转向步长及转后对齐、16 向姿态、101 步保险丝和短暂的主机位移继承。
- 黄色高档侧弹恢复并排成对外形；蓝色三种长度组合六档；红色主条逐档加宽，辅助小弹恢复独立外形及减速。去掉旧版红蓝额外的 1.5 倍放大。
- [用户提供的十八关录像](docs/REFERENCE_VIDEO.md)作为长期视觉参考，记录本轮实际看过的代表时刻；全部十八档组合另核对本地原始表和图形。HP、主机伤害表、主炮射速与超级武器预算不变。

104 项回归、九组浏览器及 Android/iPhone/iPad 原生验收通过，版本 0.2.8（10）。详见下方测试记录及 [本版报告](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.8/verification.json)。

[黄色六档](docs/screenshots/weapon-yellow-levels.png) · [蓝色六档](docs/screenshots/weapon-blue-levels.png) · [红色六档](docs/screenshots/weapon-red-levels.png) · [细追踪弹](docs/screenshots/homing-missiles.png) · [证据与边界](docs/M2_8_RESEARCH.md) · [内置 imagegen 素材与完整提示词](docs/ART_M2_8.md)。目标槽位回收次序、碰撞和烟迹仍有近似；磁力转向未在本轮核验。

## M2.7 已完成内容

- 母舰出击连同舱门约 3.7 秒，保留顺滑插值；战斗速度与关卡计时不受影响。时长属于参考校准，尚未完成原机逐帧测量。
- 首关大煤气罐按原作 44×87 可见轮廓修正宽高比例，保留 700 HP 与碰撞尺寸。
- 普通敌机与 Boss 血条独立设置，**默认普通血条关闭、Boss 血条开启**。普通条只显示最大 HP 达到开局方形补给机（905）及以上的敌人；旧合并设置一次性迁移。
- 蓝色炸弹改为包住主角的紫色闪电罩和连续粗蓝激光，随主角移动，在前方最近可攻击目标处停止；不再发射护罩圆环。伤害仍使用原有临时预算。

94 项回归、八组浏览器及 Android/iPhone/iPad 原生验收通过，版本 0.2.7（9）。详见下方测试记录及 [本版报告](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.7/verification.json)。

[默认血条设置](docs/screenshots/m27-default-settings.png) · [紫色护罩与蓝激光](docs/screenshots/blue-laser-aura.png) · [气罐比例](docs/screenshots/tanker-proportions.png) · [原作证据与边界](docs/M2_7_RESEARCH.md) · [内置 imagegen 素材与完整提示词](docs/ART_M2_7.md)。

## M2.6 已完成内容

- 首次启动优先使用原生系统语言：简体中文、繁体中文（含台湾、香港、澳门）或英语回退；明确 Hans/Hant 字形优先。
- 主菜单及暂停设置可立即切换三语，手动选择优先并保存；不重开战斗、不重置装备、分数、难度、解锁或声音偏好。
- 菜单、HUD、帮助、补给提示、Boss 名称、结算及无障碍文案全部本地化；桌面显示名跟随系统。英文无线电录音和 DemonStar 标志保持原样。
- 繁体版独立改写，采用「設定、主選單、搖桿、飛彈、電漿砲、強化火力」等通用表达，不机械转字。
- [项目规范](AGENTS.md)、[贡献约定](CONTRIBUTING.md)、核心注释、README、重要提交和 Release 提供简体中文及英文；[语言规范](docs/LOCALIZATION.md)规定后续验收要求。

87 项回归、七组浏览器及 Android/iPhone/iPad 原生验收通过，版本 0.2.6（8）。详见下方测试记录及 [本版报告](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.6/verification.json)。

[简体菜单](docs/screenshots/menu-zh-Hans.png) · [繁体菜单](docs/screenshots/menu-zh-Hant.png) · [英文菜单](docs/screenshots/menu-en.png) · [语言设置](docs/screenshots/settings-en.png)。繁体文案未声称经过地区母语玩家审校。[iPhone 英文设置](docs/screenshots/ios-settings-en.png) · [iPad 繁体设置](docs/screenshots/ios-settings-zh-Hant.png)。

## M2.5 已完成内容

- 开始和换关增加机械舱门与母舰甲板出击，母舰离场后才开始关卡计时、操作和无线电；出击期间可暂停/后台恢复。
- 左下 HUD 去掉透明留白并设置最低显示尺寸；默认双发弹体恢复清晰的 3×13，黄色增强/导弹也使用紧裁切。
- 普通敌机击毁新增逐帧爆炸；蓝红强化弹按原弹型使用大命中火花，黄色维持小火花。Boss 最终爆炸后才进入结算。
- 指定地面目标保留焦黑残骸；奖励按剩余炸弹 ×1000、勋章 ×2000 计算且只入账一次。死亡/换关清零勋章。

80 项回归、六组浏览器及 Android/iPhone/iPad 模拟器验收通过，版本 0.2.5（7）。详细环境和边界见下方测试记录及 [本版报告](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.5/verification.json)。

[原作证据与边界](docs/M2_5_RESEARCH.md) · [母舰出击](docs/screenshots/carrier-launch.png) · [命中与击毁](docs/screenshots/hits-and-blasts.png) · [地面残骸](docs/screenshots/ground-remnants.png) · [关末奖励](docs/screenshots/stage-bonus.png) · [内置 imagegen 图集与提示词](docs/ART_M2_5.md)。母舰以本地 4.04 灰色 88 原型为准；特效关键帧和残骸家族仍为重绘近似。

## M2.4 已完成内容

- 敌弹从原始弹型表取伤害，按容易/一般/较难/疯狂分别减半取整（最低 1）、原值、加 1、加 2；例如首关星弹为 6/12/13/14，激光每次命中为 2/4/5/6。
- 普通撞机使用原作独立分支，按机体宽度扣 4/12/16，并使敌机损失 305 HP。该分支不套用敌弹的难度公式。
- 普通中弹不再获得旧版额外 0.65 秒无敌；保留重生保护。黄/蓝/红武器受伤后剩 1–3 能量时降一级，包含满级 6→5；死亡仍按原有规则掉球并重置。
- 圈中 S_ENEMY1A 改为正确六帧原型，后段网架改为 32 向固定炮台，大岩石修正宽度并恢复 24 帧翻滚。

敌机基础 HP、主机伤害表及超级武器旧预算保持原值。[原作伤害与动画证据](docs/M2_4_RESEARCH.md) · [正确敌机](docs/screenshots/fighter-corrected.png) · [网架炮台](docs/screenshots/net-turrets.png) · [岩石翻滚帧](docs/screenshots/asteroid-24-poses.png) · [受伤降档](docs/screenshots/damage-tier-five.png) · [imagegen 图集与完整提示词](docs/ART_M2_4.md)。

69 项回归、五组浏览器与 Android/iPhone/iPad 模拟器验收通过，版本 0.2.4（6）。环境及边界见下方测试记录和 [本版报告](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.4/verification.json)。

## M2.3 已完成内容

- 新安装及旧存档升级后默认开启 BGM；升级后手动静音仍会保存，不会每次启动强行打开。
- 冲向主机的流星在路径结束时仅瞄准一次，之后直线飞行，不会持续追踪玩家位置。
- 第一关 Boss 恢复红橙色四芒星弹、双侧导弹、中央蓝色贯穿激光。激光按原炮位表发射三轮，每轮五次，随后停止；星弹继续。
- Boss 前的陀螺恢复六帧横向旋转，并在原路径节点短暂加速俯冲。路径速度按原逻辑逐步变化，不改原数据表。

HP、敌弹/撞击伤害和超级武器预算保持冻结。[原作证据与边界](docs/M2_3_RESEARCH.md) · [星弹画面](docs/screenshots/boss1-stars.png) · [蓝色激光](docs/screenshots/boss1-laser.png) · [旋转敌机六帧](docs/screenshots/spinner-poses.png) · [内置 imagegen 重绘与提示词](docs/ART_ENEMY_ATTACKS.md)。

56 项回归及 Android、iPhone/iPad 模拟器验收通过，安装包版本 0.2.3（5）。详细环境与边界见下方测试记录和 [本版验收报告](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.3/verification.json)。

## M2.2 已完成内容

本轮使用用户提供的 BGM，直接核对原程序的 18 关音乐跳转表；前三关对应“05_相位、06_慢速火箭、07”。20 个命名音频去重为 18 首，音乐与音效独立开关/音量，后台暂停、恢复续播。完整表见 [音乐核对](docs/MUSIC.md)。

全部拾取/清屏与 Boss 出场不再弹出中央字幕；底部显示武器图标、六格等级、同色升档提醒和辅助装备。M2.7 已将血条拆为普通高血量敌机和 Boss 两项独立设置。统一保护屏外敌人，恢复持续朝向玩家的机型、濒死红闪、Boss 燃烧坠毁过程，以及蓝色三档、红色六档的弹体尺寸。

三种超级武器分别表现为前射金色能量团、32 枚周围投弹和蓝色攻击（M2.7 已改正为护罩与连续激光）；Boss 出场改为 W_RADIO1，补齐出击声和战场环境音，限制同类音效叠加并移除 A/B 的菜单点击声。M2.2 当时按用户要求冻结 HP 与伤害；M2.4 经新授权修复受伤规则，敌机 HP 和炸弹旧预算继续保留。[旧预算与还原边界](docs/M2_2_RESEARCH.md)。

M2.1 的固定掉落、换色归零、死亡掉球、满级三色清屏继续保留，详见 [装备与死亡规则](docs/DROPS_WEAPONS.md)。

- 导入原版 **18 关、8,368 条放置记录、387 条对象定义**，按稳定 ID 绑定对象；保留血量、速度、分数、路径、炮位和地图原始附加字段。
- 敌方炮位解释器支持原数据中的延迟、连射、瞄准、角度、弹速、次数；18 位 Boss 使用各自的原始定义和高清外形。
- 主机四类武器、六级火力、导弹、追踪导弹、侧/后向射击、超级武器、装甲修复、护盾与生命系统；部分数值和特殊效果仍需原作运行对照。
- 恢复七位得分、备用战机图标、16 格蓝色能量条和逐枚炸弹库存；开局 4 条命、3 枚炸弹，默认机炮左右双发。
- 左摇杆控制有上限的移动速度，按住 A 开火，B 释放炸弹；最多 6 枚、混合类型、后拾取先使用。支持多指、暂停/切后台释放输入。
- 手机竖屏不强制左右边框；折叠屏、平板和手机横屏重排控制区域，战场保持等比。
- 修正全部 16 类补给编号及已核实的轮换关系，使用新生成的高清图标；能量晶体恢复 2 格。
- 逻辑采用原作代码中的 35 毫秒基础节拍，绘制插值保持平滑；敌方移动/射击与关卡滚动统一计时，Boss 出场按原版采用两倍基础 HP（纠正 v0.2.0 的误改）。尚未完成原作录像逐帧速度验收。
- 原作机库菜单、主机、十八关背景、全部 Boss、第一关主要敌机/地物与武器弹体已有 AI 高清素材；尚未覆盖的敌机和地物仍有近似图形。原版 BGM 已按用户提供 MP3 接入；双人、联网、地图编辑器未包含。

[装备栏与红色六档](docs/screenshots/plasma-level6.png) · [顶栏 Boss 血条与燃烧](docs/screenshots/boss-burning.png) · [Android 竖屏实测画面](docs/screenshots/android-game.png) · [横屏实测画面](docs/screenshots/android-landscape.png) · [满级等离子清屏](docs/screenshots/nova-plasma.png) · [补给舱高清图集](docs/ART_SUPPLY.md) · [主机姿态图集](docs/ART_MOTION.md)

## 安装

| 平台 | 最低部署目标 | 交付形式 |
|---|---|---|
| Android | Android 10 / API 29 | 本项目独立签名的 Release APK |
| iPhone / iPad | iOS 12.0 | 真正 iPhoneOS ARM64 构建的 **未签名 IPA** |

**IPA 需要用自己的 Apple 身份签名后才能安装，下载不等于可直接安装。当前没有 TestFlight 邀请。** 仓库不包含账号、证书、配置描述文件或签名私钥。最低部署目标不代表已在最低版本实机验收。

M2 的 IPA 文件名统一为纯字母 `DemonStar.ipa`；包内目录及可执行文件也是英文，桌面显示名支持三语。此前安装器报错的确切原因尚未确认，文件命名调整不代表所有签名/安装工具均已验收。

每个完成的里程碑都提交对应源码并发布 APK、IPA 与 `SHA256SUMS.txt`；不覆盖已有版本标签。GitHub Release 与 README 会明确列出实际测试的系统版本和仍未完成的事项。

## 操作

主菜单选择单人游戏，或多人游戏 → 同屏双人／局域网双人。设置 → 玩家与操作可调整触控方式、摇杆位置大小、鼠标归属、手柄和动作映射。移动有速度上限，松开/失焦/设备断开会释放输入。

| 输入 | 默认方式 |
|---|---|
| 触屏 | 各自的摇杆/方向键移动、A 开火、B 炸弹；双人触点独立 |
| 单人键盘 | WASD 或方向键，Z/J 开火，Space/X/K 炸弹，P/Esc 暂停 |
| 双人键盘 | P1：WASD、Z/X；P2：方向键、右 Ctrl/右 Shift；可改键 |
| 鼠标 | 在设置分配玩家；战场指针引导限速移动，左键开火、右键炸弹 |
| 手柄 | 默认左摇杆/方向键移动、按钮 0/1 开火/炸弹；按设备重新映射 |

局域网需要安装版：设备先连接同一 Wi-Fi/热点，房主建房，另一台输入显示地址和六位房间码。当前每台一名玩家、总计双人。本机双人是独立模式。关卡档从该关起点恢复；切关以初始装备出击，先保存可保留原关入口状态。设置支持三语即时切换。

## 构建

开发需要 Node.js 22+。构建包使用 esbuild 转译至 Safari 12 / Chrome 74，并提供旧 WebKit 触摸、视口布局和 DOM API 回退。

```sh
npm install
npm test
npm run build
npm start
```

浏览器预览打开 `http://127.0.0.1:4173`。构建产物在 `dist/`，并同步至两个原生工程。仓库只保存一份网页源代码，不重复提交原生资源副本。

### Android

复用已有 SDK、JDK、Gradle 缓存，不重复安装 SDK 或 AVD。维护者环境默认复用 BenchBridge 的工具配置；其他开发者传入自己的路径。

```powershell
python tools/prepare-signing.py --keytool "C:\path\to\jdk\bin\keytool.exe"
powershell -ExecutionPolicy Bypass -File tools/build-android.ps1 -SdkPath "C:\path\to\sdk" -JavaHome "C:\path\to\jdk" -Offline
```

独立 Release 密钥与密码只保存在忽略的 `.local/`。请私下备份；不要提交它们。首次离线构建要求所需 Gradle/Maven 依赖已在缓存中。脚本不安装 SDK 或系统镜像。

### iOS

```sh
npm run build
python3 tools/generate-ios-project.py
open ios/DemonStar.xcodeproj
```

在 Xcode 选择自己的 Team 后真机安装。无 Mac 可使用 [iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/workflows/ios.yml)：在 macOS 编译 ARM64 未签名 IPA，复用已安装的 iPhone/iPad 模拟器，记录实际系统和 WKWebView 探针结果。不会把模拟器包改名冒充 IPA。

## 测试

M2.10 的 168 项引擎/单元及 17 组浏览器检查通过，Android 两种构建/Lint（0 错误、12 提示）、现有 API 37 模拟器及 iOS 双端构建/模拟器证据详见上方里程碑。完整报告分别记录原生双应用、iOS 双模拟器和未测试真机项目。IPA 未签名，须自行签名。

M2.9 的 109 项引擎/声音/语言回归与十组浏览器检查通过。全部 244 个实际使用原型通过实绘可见像素检查，十八关 54 个场景、15 种敌弹和五类炮台的 32 朝向通过；当前关新增图集解码量最高 78 MiB，不代表 App 总内存。Android Debug/项目签名 Release、Lint（0 错误、4 提示）及现有 Android 17/API37 AVD 的三语、操作、旋转、后台恢复和独立血条设置通过。[iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38028435099) 通过 iPhoneOS ARM64 构建及 iOS 18.5 的 iPhone 16 Pro、iPad Pro 11-inch (M4) 检查；四种原生语言场景均逐张解码并绘制全部 18 张新增图集。两包版本 0.2.9（11），脚本、图集、音频、本地化资源与构建输入一致，仅允许 HTML/CSS 平台换行差异。IPA 未签名，须自行签名；最低系统及真机未实测。[完整验收](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.9/verification.json)。

原始 HP/主武器伤害表与 v0.2.1 一致。最低系统、手机扬声器和原机逐样本 A/B 仍未实测；独立激光启动音 W_PULSE 已定位在 Game3.glb，尚未包含在用户提供的 MP3 清单，“脉冲炮一”是另一资源 W_PULSAR。

旧 API 回退测试在 Chromium 中模拟缺失接口，**不是 iOS 12 真机测试**。`artifacts/*-verification.json` 和 Release 说明记录实际测试情况。

可选浏览器回归需要 Playwright 与已有 Chrome：`node tests/browser.mjs`。使用已有包时可设置 `PLAYWRIGHT_PATH`；`GAME_URL` 可指向构建后的预览服务。

## 原作数据与素材

最新 [原版战斗与布局取证](docs/ORIGINAL_COMBAT_RESEARCH.md) 已确认开局双发、16 点能量、经典 HUD 和掉落编号差异，并记录手机竖屏、折叠屏/平板横屏及左摇杆右 A/B 的后续目标。M1 安装包保持原样；本次修正属于 M2。

[格式记录](docs/FORMAT.md) · [还原差异](docs/FIDELITY.md) · [imagegen 提示词与素材来源](docs/ART.md) · [第三方声明](THIRD_PARTY_NOTICES.md) · [M2.2 武器图集与提示词](docs/ART_EFFECTS.md)

原始 `Deamon Star/`、参考图、EXE、GLB、MAP 与帮助文件不进入仓库。用户提供的音效和 BGM MP3 副本按声音/音乐清单记录来源与哈希。导入器可从用户自己的原版安装中重建关卡数据：

```sh
python tools/import-campaign.py "/path/to/your/DemonStar"
```

贡献前请阅读 [双语贡献约定](CONTRIBUTING.md)。新增/修改的核心注释、重要 Git 信息及发布说明提供简体中文和英文，两个 README 同步维护。

独立实现代码采用 [MIT](LICENSE)。该许可不重新授权原作的名称、设计、关卡或其他第三方内容；AI 重绘也不表示原设计进入公有领域。本项目不代表 Mountain King Studios / Scott Host。
