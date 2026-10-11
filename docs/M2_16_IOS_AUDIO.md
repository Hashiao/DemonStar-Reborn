# M2.16 iOS 音频修复 / iOS audio mitigation

用户报告 iPhone 18 Pro、iOS 27.0.1 连续开火和切换主菜单时爆音、射击声缺失，并要求本轮只改变 iOS 行为。记录为用户提供的环境，尚未取得该设备的音频录制或性能追踪。

The user reports crackling and missing shot sounds during continuous fire and menu transitions on an iPhone 18 Pro running iOS 27.0.1, and explicitly limits behavior changes to iOS. This environment is user-reported; no recording or performance trace from that device has been obtained.

## 已定位问题 / Located mechanisms

- 原音效节点抢占后立即停止并断开。受击素材约 1.09 秒，连续命中可在约 35 毫秒后抢占；非零波形直接切断存在点击噪声风险。
- Effect stealing immediately stopped and disconnected nodes. The roughly 1.09-second impact clip could be replaced after about 35 ms; stopping nonzero waveforms risks click transients.
- 暂停时通用按钮调用解锁，会让退出确认弹窗恢复战斗音效。回菜单又先恢复旧关卡音乐，再通过第二条 iOS 桥消息换菜单曲。
- Generic dialog unlocking resumed battle effects while the game stayed paused. Returning to the menu first requested the old stage track to resume, then sent another iOS message for the menu track.
- Web Audio 未处理 interrupted 状态；原生端未监听音频中断、耳机路由变化与媒体服务重置。
- Web Audio did not handle interrupted state; the native host did not observe session interruptions, headset-route changes or media-services resets.

## 修复边界 / Scope

新增 `ios-audio.js`，仅原生 WKWebView demonstar 桥启用。Android/普通浏览器仍实例化未修改的 `audio.js`、`music.js` 类；Android 原生源码未变，安装包版本号随里程碑更新。三路逻辑声道、同类上限、音效优先级、55 毫秒射击过滤、PCM 与 MP3 内容均保持原样。优先级竞争仍可能有意省略射击声，本轮不承诺每发子弹都独立发声。

The new `ios-audio.js` adapter is selected only by the native WKWebView demonstar bridge. Android/ordinary browsers instantiate the unchanged `audio.js` and `music.js` classes. Android native source is unchanged; package versions follow the milestone. Three logical voice slots, per-kind limits, priorities, the 55 ms shot filter, PCM and MP3 contents remain unchanged. Priority competition can still intentionally omit shots; this release does not promise one independent sound per projectile.

iOS 音效采用 4 毫秒起音、8 毫秒释放；抢占先释放逻辑槽位，在短尾音结束后才断开节点，少量尾音可短暂重叠。暂停通过总音量短淡出后挂起，并防止异步恢复覆盖更新的暂停。实际继续或系统恢复可处理 interrupted；媒体服务重置会重建音效上下文。

iOS effects use a 4 ms attack and an 8 ms release. Stealing releases the logical slot immediately but disconnects only after the brief tail; tails may overlap transiently. Pausing fades the master before suspension, and a late asynchronous resume cannot override a newer pause. Explicit resume handles interrupted contexts; media-services resets rebuild the effect context.

iOS BGM 合并同一 JavaScript 轮次的状态，只发送最终曲目。原生先准备新播放器，旧曲短淡出，新曲短淡入，音量变化用渐变；过期暂停回调不能暂停已经恢复或换曲的播放器。中断、耳机接入/拔出和媒体服务重置通过原生通知暂停战斗，继续沿用用户点击继续与陀螺仪校准流程；主菜单可恢复音乐。

iOS BGM coalesces state within a JavaScript turn, sending the final track only. Native playback prepares the new player before fading the old one, fades in playback and ramps volume. Stale pause callbacks cannot pause a resumed/replaced player. Native notifications for interruptions, headset changes and service resets pause battle; resuming follows the existing user action and tilt calibration flow. Menu music can recover automatically.

## 验收与限制 / Verification and limits

定向回归包含音频状态时序、暂停菜单、三路优先级、iOS/Android 实例分流、原素材哈希和真实 OfflineAudioContext 渲染。恒定测试信号的停止点最大相邻采样跳变从 0.5 降至约 0.001302；它验证包络，不是手机听感或系统声卡输出测量。iOS 原生探针另检查真实打包 WebKit 的淡出清理、暂停设置静音及原生 BGM 时钟/音量。最终执行结果见发布说明和 `verification.json`。

Targeted regressions cover ordering, paused dialogs, priorities, iOS/Android routing, original asset hashes and real OfflineAudioContext rendering. The maximum adjacent-sample step at a constant test signal's stop falls from 0.5 to about 0.001302; this verifies the envelope, not phone listening quality or hardware output. The native iOS probe additionally checks packaged WebKit release cleanup, silent paused settings and native BGM clocks/volume. Final executed results are recorded in release notes and `verification.json`.

用户真机 iOS 27.0.1 的连续听感、蓝牙输出及系统音频中断仍需复测；不宣称已完全消除所有爆音/漏音。

Continuous listening, Bluetooth output and system interruptions on the user's iOS 27.0.1 hardware still require verification. This is not a claim that all crackling or missing sounds have been eliminated.
