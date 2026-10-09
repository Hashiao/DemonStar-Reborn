# DemonStar Reborn 工作约定

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
