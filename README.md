# DemonStar Reborn / 恶魔之星·重生

**[下载 Android APK](https://github.com/Hashiao/DemonStar-Reborn/releases/latest/download/DemonStar-Reborn-release.apk)** · **[下载 iPhone / iPad IPA（未签名）](https://github.com/Hashiao/DemonStar-Reborn/releases/latest/download/DemonStar.ipa)** · [全部里程碑](https://github.com/Hashiao/DemonStar-Reborn/releases)

DemonStar 4.04 的非官方移动端高清复刻，目标 **Android 10+ / iOS 12+**。保留红色战机和经典工业科幻风格，参考本地原版素材用 imagegen 重绘，游戏实现代码开放。

首个里程碑仅提供中文界面，后续再加入英文语言包。Android 与 iOS 共用离线 Canvas 游戏内核，分别由系统 WebView 和 UIKit/WKWebView 承载；没有广告、账号、埋点、联网权限或内购。

**当前 M2.3（v0.2.3）修正流星轨迹、首关 Boss 弹型和旋转敌机，默认开启 BGM，仍不是已验收的完整 1:1 移植。** 原版 1–18 关优先；19–25 关尚未开发。完整的确认项、推断值与差异见 [还原状态](docs/FIDELITY.md)。

![Menu](docs/screenshots/menu.png)

## 当前里程碑 M2.3

- 新安装及旧存档升级后默认开启 BGM；升级后手动静音仍会保存，不会每次启动强行打开。
- 冲向主机的流星在路径结束时仅瞄准一次，之后直线飞行，不会持续追踪玩家位置。
- 第一关 Boss 恢复红橙色四芒星弹、双侧导弹、中央蓝色贯穿激光。激光按原炮位表发射三轮，每轮五次，随后停止；星弹继续。
- Boss 前的陀螺恢复六帧横向旋转，并在原路径节点短暂加速俯冲。路径速度按原逻辑逐步变化，不改原数据表。

HP、敌弹/撞击伤害和超级武器预算保持冻结。[原作证据与边界](docs/M2_3_RESEARCH.md) · [星弹画面](docs/screenshots/boss1-stars.png) · [蓝色激光](docs/screenshots/boss1-laser.png) · [旋转敌机六帧](docs/screenshots/spinner-poses.png) · [内置 imagegen 重绘与提示词](docs/ART_ENEMY_ATTACKS.md)。

56 项回归及 Android、iPhone/iPad 模拟器验收通过，安装包版本 0.2.3（5）。详细环境与边界见下方测试记录和 [本版验收报告](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.3/verification.json)。

## M2.2 已完成内容

本轮使用用户提供的 BGM，直接核对原程序的 18 关音乐跳转表；前三关对应“05_相位、06_慢速火箭、07”。20 个命名音频去重为 18 首，音乐与音效独立开关/音量，后台暂停、恢复续播。完整表见 [音乐核对](docs/MUSIC.md)。

全部拾取/清屏与 Boss 出场不再弹出中央字幕；底部显示武器图标、六格等级、同色升档提醒和辅助装备。中大型敌机血条可开关。统一保护屏外敌人，恢复持续朝向玩家的机型、濒死红闪、Boss 燃烧坠毁过程，以及蓝色三档、红色六档的弹体尺寸。

三种超级武器分别表现为前射金色能量团、32 枚周围投弹和连续电蓝脉冲；Boss 出场改为 W_RADIO1，补齐出击声和战场环境音，限制同类音效叠加并移除 A/B 的菜单点击声。**HP 与伤害参数按用户要求冻结**，炸弹旧预算与原表差异、原作音频时序和未还原细节见 [本轮取证与边界](docs/M2_2_RESEARCH.md)。

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

M2 的 IPA 文件名统一为纯字母 `DemonStar.ipa`；包内目录及可执行文件也是英文，桌面显示名保留中文。此前安装器报错的确切原因尚未确认，文件命名调整不代表所有签名/安装工具均已验收。

每个完成的里程碑都提交对应源码并发布 APK、IPA 与 `SHA256SUMS.txt`；不覆盖已有版本标签。GitHub Release 与 README 会明确列出实际测试的系统版本和仍未完成的事项。

## 操作

| 动作 | 手机 / 平板 | 电脑 |
|---|---|---|
| 移动 | 左侧虚拟摇杆 | WASD / 方向键 |
| 开火 | 按住右侧 A，松开停止 | 按住 Z / J |
| 超级武器 | 右侧 B | 空格 / X / K |
| 暂停 | Ⅱ / 系统返回 | Esc / P |

接触补给拾取，持续躲避弹幕并留意装甲。当前各难度分别保存最高分与解锁进度。

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

M2.3 的 56 项引擎/声音回归通过。浏览器覆盖真实双指输入、全部拾取和 Boss 无中央遮挡、装备栏多尺寸布局、血条开关、三种炸弹和红蓝档位，并检查全部 18 首 BGM 的解码、独立音效静音、暂停后音乐位置续播及入场声音顺序。

本版 56 项引擎/声音回归与四组浏览器检查通过，覆盖旧存档音乐迁移、真实 BGM 播放、流星锁定、陀螺加速及首关三轮激光。Android Debug/签名 Release、Lint（0 错误、3 提示）及现有 Android 17 / API 37 AVD 操作、旋转、后台和设置检查通过。[iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/37974187884) 通过 iPhoneOS ARM64 编译和 iOS 18.5 的 iPhone 16 Pro、iPad Pro 11-inch (M4) WKWebView 检查，包括 BGM 时钟推进与新图集加载。版本 0.2.3（5），两个包的游戏代码与素材核对通过（HTML/CSS 仅有平台换行差异），音频哈希匹配、包内路径 ASCII。[验收记录](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.3/verification.json)。

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

独立实现代码采用 [MIT](LICENSE)。该许可不重新授权原作的名称、设计、关卡或其他第三方内容；AI 重绘也不表示原设计进入公有领域。本项目不代表 Mountain King Studios / Scott Host。
