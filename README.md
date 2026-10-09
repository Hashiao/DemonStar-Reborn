# DemonStar Reborn / 恶魔之星·重生

**[下载 Android APK](https://github.com/Hashiao/DemonStar-Reborn/releases/latest/download/DemonStar-Reborn-release.apk)** · **[下载 iPhone / iPad IPA（未签名）](https://github.com/Hashiao/DemonStar-Reborn/releases/latest/download/DemonStar.ipa)** · [全部里程碑](https://github.com/Hashiao/DemonStar-Reborn/releases)

DemonStar 4.04 的非官方移动端高清复刻，目标 **Android 10+ / iOS 12+**。保留红色战机和经典工业科幻风格，参考本地原版素材用 imagegen 重绘，游戏实现代码开放。

首个里程碑仅提供中文界面，后续再加入英文语言包。Android 与 iOS 共用离线 Canvas 游戏内核，分别由系统 WebView 和 UIKit/WKWebView 承载；没有广告、账号、埋点、联网权限或内购。

**当前 M2.1（v0.2.1）修正经典 HUD、初始双发与双手操作，仍不是已验收的完整 1:1 移植。** 原版 1–18 关优先；19–25 关尚未开发。完整的确认项、推断值与差异见 [还原状态](docs/FIDELITY.md)。

![Menu](docs/screenshots/menu.png)

## 当前里程碑 M2.1

本次逐条核对全战役 411 个固定掉落记录、191 个自动补给点，并恢复同色升档、异色清空旧档、基础双发常驻、满级三色清屏和死亡掉球。详见 [装备与死亡规则](docs/DROPS_WEAPONS.md)。

修复开场方形补给敌机不掉落的问题，按原版 `0x200` 标志执行自动补给；使用用户提供的授权 MP3 接入开火、命中、爆炸及各类补给音效；开场使用原录音约 1.15 秒的 “Mission start” 无线电播报。主机满杆速度提高约 27%，采用 17 档侧身图和随前后移动变化的黄白尾焰。详见 [取证、声音来源与校准边界](docs/AUDIO_MOTION.md)。


- 导入原版 **18 关、8,368 条放置记录、387 条对象定义**，按稳定 ID 绑定对象；保留血量、速度、分数、路径、炮位和地图原始附加字段。
- 敌方炮位解释器支持原数据中的延迟、连射、瞄准、角度、弹速、次数；18 位 Boss 使用各自的原始定义和高清外形。
- 主机四类武器、六级火力、导弹、追踪导弹、侧/后向射击、超级武器、装甲修复、护盾与生命系统；部分数值和特殊效果仍需原作运行对照。
- 恢复七位得分、备用战机图标、16 格蓝色能量条和逐枚炸弹库存；开局 4 条命、3 枚炸弹，默认机炮左右双发。
- 左摇杆控制有上限的移动速度，按住 A 开火，B 释放炸弹；最多 6 枚、混合类型、后拾取先使用。支持多指、暂停/切后台释放输入。
- 手机竖屏不强制左右边框；折叠屏、平板和手机横屏重排控制区域，战场保持等比。
- 修正全部 16 类补给编号及已核实的轮换关系，使用新生成的高清图标；能量晶体恢复 2 格。
- 逻辑采用原作代码中的 35 毫秒基础节拍，绘制插值保持平滑；敌方移动/射击与关卡滚动统一计时，Boss 出场按原版采用两倍基础 HP（纠正 v0.2.0 的误改）。尚未完成原作录像逐帧速度验收。
- 原作机库菜单、主机、十八关背景、全部 Boss、第一关主要敌机/地物与武器弹体已有 AI 高清素材；尚未覆盖的敌机和地物仍有近似图形。原版音乐、双人、联网、地图编辑器未包含。

[Android 竖屏实测画面](docs/screenshots/android-game.png) · [横屏实测画面](docs/screenshots/android-landscape.png) · [M2 补给重绘记录](docs/ART_COMBAT.md)

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

M2.1 的 34 项引擎与音频回归通过，覆盖 18 关 Boss、开局双发、全部掉落编号、混合库存、轮换周期及不同刷新率的一致性。浏览器通过真实双指移动/开火、松手停止、禁止战场拖动瞬移、横竖屏及展开尺寸、暂停和旧 API 回退检查。

Android Debug/签名 Release 编译及两种 Lint 通过；现有 Android 17 / API 37 AVD 上通过摇杆、A/B、旋转保持库存、系统返回和后台暂停验收，最终重建 APK 与实测包哈希一致。[Apple CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/37907161109) 通过 iPhoneOS ARM64 编译，以及 iOS 18.5 的 iPhone 16 Pro、iPad Pro 11 英寸 (M4) 实际 WKWebView 输入探针：移动、双发、松手停止、初始生命/能量和炸弹消耗均通过。IPA 版本 0.2.0（2），包体与可执行文件最低系统检查为 12.0。[完整验收记录](https://github.com/Hashiao/DemonStar-Reborn/releases/download/v0.2.0/verification.json)。

旧 API 回退测试在 Chromium 中模拟缺失接口，**不是 iOS 12 真机测试**。`artifacts/*-verification.json` 和 Release 说明记录实际测试情况。

可选浏览器回归需要 Playwright 与已有 Chrome：`node tests/browser.mjs`。使用已有包时可设置 `PLAYWRIGHT_PATH`；`GAME_URL` 可指向构建后的预览服务。

## 原作数据与素材

最新 [原版战斗与布局取证](docs/ORIGINAL_COMBAT_RESEARCH.md) 已确认开局双发、16 点能量、经典 HUD 和掉落编号差异，并记录手机竖屏、折叠屏/平板横屏及左摇杆右 A/B 的后续目标。M1 安装包保持原样；本次修正属于 M2。

[格式记录](docs/FORMAT.md) · [还原差异](docs/FIDELITY.md) · [imagegen 提示词与素材来源](docs/ART.md) · [第三方声明](THIRD_PARTY_NOTICES.md)

原始 `Deamon Star/`、参考图、EXE、GLB、MAP、音乐与帮助文件不进入仓库。导入器可从用户自己的原版安装中重建关卡数据：

```sh
python tools/import-campaign.py "/path/to/your/DemonStar"
```

独立实现代码采用 [MIT](LICENSE)。该许可不重新授权原作的名称、设计、关卡或其他第三方内容；AI 重绘也不表示原设计进入公有领域。本项目不代表 Mountain King Studios / Scott Host。
