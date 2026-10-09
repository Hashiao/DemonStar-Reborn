# DemonStar Reborn / 恶魔之星·重生

**[下载 Android APK](https://github.com/Hashiao/DemonStar-Reborn/releases/latest/download/DemonStar-Reborn-release.apk)** · **[下载 iPhone / iPad IPA（未签名）](https://github.com/Hashiao/DemonStar-Reborn/releases/latest/download/DemonStar-Reborn-iOS-unsigned.ipa)** · [全部里程碑](https://github.com/Hashiao/DemonStar-Reborn/releases)

DemonStar 4.04 的非官方移动端高清复刻，目标 **Android 10+ / iOS 12+**。保留红色战机和经典工业科幻风格，参考本地原版素材用 imagegen 重绘，游戏实现代码开放。

首个里程碑仅提供中文界面，后续再加入英文语言包。Android 与 iOS 共用离线 Canvas 游戏内核，分别由系统 WebView 和 UIKit/WKWebView 承载；没有广告、账号、埋点、联网权限或内购。

**当前 M1 是可玩的数据驱动 Alpha，不是已验收的完整 1:1 移植。** 原版 1–18 关优先；19–25 关尚未开发。完整的确认项、推断值与差异见 [还原状态](docs/FIDELITY.md)。

![Menu](docs/screenshots/menu.png)

## 当前里程碑

- 导入原版 **18 关、8,368 条放置记录、387 条对象定义**，按稳定 ID 绑定对象；保留血量、速度、分数、路径、炮位和地图原始附加字段。
- 敌方炮位解释器支持原数据中的延迟、连射、瞄准、角度、弹速、次数；18 位 Boss 使用各自的原始定义和高清外形。
- 主机四类武器、六级火力、导弹、追踪导弹、侧/后向射击、超级武器、装甲修复、护盾与生命系统；部分数值和特殊效果仍需原作运行对照。
- 相对拖动、自动射击、炸弹按钮、键盘控制、暂停、切后台自动暂停、离线最高分与关卡解锁。
- 原作主机、十八关背景和全部 Boss 已有 AI 高清素材；尚未覆盖的敌机和地物仍有近似图形。原版音乐、双人、联网、地图编辑器未包含。

## 安装

| 平台 | 最低部署目标 | 交付形式 |
|---|---|---|
| Android | Android 10 / API 29 | 本项目独立签名的 Release APK |
| iPhone / iPad | iOS 12.0 | 真正 iPhoneOS ARM64 构建的 **未签名 IPA** |

**IPA 需要用自己的 Apple 身份签名后才能安装，下载不等于可直接安装。当前没有 TestFlight 邀请。** 仓库不包含账号、证书、配置描述文件或签名私钥。最低部署目标不代表已在最低版本实机验收。

每个完成的里程碑都提交对应源码并发布 APK、IPA 与 `SHA256SUMS.txt`；不覆盖已有版本标签。GitHub Release 与 README 会明确列出实际测试的系统版本和仍未完成的事项。

## 操作

| 动作 | 手机 / 平板 | 电脑 |
|---|---|---|
| 移动 | 单指相对拖动战场 | WASD / 方向键 / 拖动 |
| 开火 | 自动 | 自动 |
| 超级武器 | 右下角 ✦ | 空格 |
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

当前本地：9 项引擎/原数据/炮位/18 关 Boss 回归通过；桌面、390×844 触屏及旧 API 回退浏览器检查通过；Android Debug 构建、Debug/Release Lint 通过。Release 安装验证与 Apple CI 结果将在本次里程碑发布前补齐。

旧 API 回退测试在 Chromium 中模拟缺失接口，**不是 iOS 12 真机测试**。`artifacts/*-verification.json` 和 Release 说明记录实际测试情况。

可选浏览器回归需要 Playwright 与已有 Chrome：`node tests/browser.mjs`。使用已有包时可设置 `PLAYWRIGHT_PATH`；`GAME_URL` 可指向构建后的预览服务。

## 原作数据与素材

[格式记录](docs/FORMAT.md) · [还原差异](docs/FIDELITY.md) · [imagegen 提示词与素材来源](docs/ART.md) · [第三方声明](THIRD_PARTY_NOTICES.md)

原始 `Deamon Star/`、参考图、EXE、GLB、MAP、音乐与帮助文件不进入仓库。导入器可从用户自己的原版安装中重建关卡数据：

```sh
python tools/import-campaign.py "/path/to/your/DemonStar"
```

独立实现代码采用 [MIT](LICENSE)。该许可不重新授权原作的名称、设计、关卡或其他第三方内容；AI 重绘也不表示原设计进入公有领域。本项目不代表 Mountain King Studios / Scott Host。
