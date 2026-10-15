# M2.28 Boss 图集碎块清理 / Boss atlas fragment cleanup

2026-10-15，0.2.28 / build 30，房间规则 10。
2026-10-15; version 0.2.28 / build 30; room revision 10.

## 依据与修正 / Evidence and changes

第 8 关蓝色细片来自同一图集中第 7 关机体的右缘；第 13 关左侧灰块来自第 12 关翼缘。旧等分 4×3 裁切包含了这些相邻像素。用明确裁切排除邻格，同时把裁切坐标换算回旧绘制矩形，保留本体位置、尺寸与纵横比例。

The blue sliver beside stage 8 comes from the stage-7 body's right edge in the same atlas; the gray block beside stage 13 comes from stage 12's wing. Uniform 4×3 cells included those neighboring pixels. Explicit crops exclude them and map back into the previous drawing rectangle, preserving body placement, size and aspect ratio.

第 1 关嘴下三片金属块可用 M2.27 之前的等分 4×4 裁切复现；M2.27 的明确裁切已排除这些块，当前普通/闪红/激光场景未复现该大块残片。本轮进一步将所有已配准激光 Boss 以及本次第 8/13 关的本体复制到独立纹理，再进行缩放/分片绘制，防止图集边缘采样带入邻格；换关释放缓存。

The three metal pieces below the stage-1 muzzle reproduce with the pre-M2.27 uniform 4×4 crop. M2.27's explicit crop already excludes them; current normal/red-flash/laser scenes did not reproduce those large fragments. This release additionally isolates every registered laser Boss and the stage-8/13 bodies into individual textures before scaling/patch rendering, preventing atlas-edge sampling from including neighbors. Stage changes release the cache.

原 PNG、原作数值表、炮口配准控制点、光球颜色/脉动、发射时机、真实弹体和碰撞、音频与玩家操作均不改。清理是运行时裁切/采样修正，不是再次重绘机体。数值清单见 [boss-clean-crops.json](boss-clean-crops.json)。

Original PNG bytes, source numeric tables, muzzle registration controls, orb colors/pulses, firing timing, physical projectiles/collisions, audio and player controls remain unchanged. This is a runtime crop/sampling correction, not a new body redraw. See the numeric crop manifest.

## 完整验收要求 / Full verification requirement

用户明确要求清理后进行完整 iOS、Android 测试再发包。本轮恢复完整流程，不沿用 M2.25–M2.27 的有限验收例外。计划执行全量引擎与浏览器、Android Debug/Release/Lint 和现有模拟器全部测试脚本、同一次 iOS 构建/功能/三语/音频/系统触控/原生 LAN。失败和未执行项目不得记通过，也不拼接不同失败轮次的 iOS 成功步骤。

The user explicitly requests complete iOS/Android testing before release. Restore the full workflow; M2.25–M2.27's limited-verification exceptions do not apply. Run all engine/browser checks, Android Debug/Release/Lint and existing-emulator test scripts, plus a single successful iOS build/functionality/localization/audio/system-touch/native-LAN run. Failures and unexecuted checks are not passes, and successful steps from different failed iOS attempts are not combined.

新增包内像素探针覆盖第 1/8/13 关、3 个缩放、普通/闪红、整数/小数位置；首关另检查四个蓝激光帧，共 84 个场景。旧错误裁切必须能检测出碎块，当前绘制在指定碎块区域必须为零，并确认本体仍显示、换关缓存释放。浏览器、Android WebView 和 iOS WKWebView 使用相同探针。

A new packaged pixel probe covers stages 1/8/13, three scales, normal/red states and integer/fractional positions, with four blue-laser frames additionally checked for stage 1: 84 scenes. The old incorrect crops must produce detectable fragments; current rendering must leave zero fragment pixels in the specified regions while retaining the body and releasing caches on stage change. Browser, Android WebView and iOS WKWebView use the same probe.

完整结果及包校验将在发布前补齐。IPA 未签名，需自行签名；模拟器不等于真机、热点或跨平台双真机认证。
Full results and package integrity will be recorded before release. The unsigned IPA requires user signing; simulators do not certify physical devices, hotspots or cross-platform hardware pairs.
