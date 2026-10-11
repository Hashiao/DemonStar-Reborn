# M2.18 共用音效调度 / Shared effect scheduling

## 问题与证据 / Problem and evidence

用户反馈 iOS 爆音已消失，但密集爆炸时射击声仍丢失，随后确认 Android 也有相似问题。现有两套音频类均限制三路非循环音效；玩家射击优先级为 6，弱于爆炸的 4、命中及普通敌弹的 5。满载时会截断已有射击声并拒播新的射击声。诊断用真实 Chromium AudioContext 重现了两类各 10/10 次射击拒播；这是调度证据，不是手机输出测量。

The user reports that iOS crackling has stopped but shots still disappear during explosions, and subsequently confirms similar Android behavior. Both implementations previously limited non-looping effects to three voices. Player shots (priority 6) lose to explosions (4), impacts and ordinary enemy fire (5), causing both voice stealing and rejected requests. Real Chromium AudioContext diagnosis reproduced 10/10 rejected shot requests in each class; this measures scheduling, not physical device output.

## 共用修复 / Shared fix

- `audio.js` 统一播放准入、声源创建/回收、优先级及射击过滤。`ios-audio.js` 不再复制 `sample` 和通道分配，直接继承共用实现，仅保留播放可用性、4 ms 起音、8 ms 释放、暂停/中断恢复及原生音乐合并。
- `audio.js` owns admission, source creation/cleanup, priorities and shot filtering. `ios-audio.js` inherits `sample` and allocation, retaining only availability, 4 ms attack/8 ms release, pause/interruption recovery and native music coalescing.
- 世界音效最多八路；每位玩家另有两路主炮音效。世界音效不能抢占玩家射击，两位玩家不能互相抢占。世界池保留原优先级、同类一条、相同优先级不抢占；单人最多十路、双人最多十二路逻辑音效，环境循环另计。短释放尾音不占逻辑槽位。四席 ID 仅为底层预留，不开放四人玩法。
- World effects have eight voices, plus two protected main-gun voices per player. World effects cannot steal shots, and players cannot steal each other's shots. World priority, one-per-kind and equal-priority rejection remain. Public solo/two-player play uses at most ten/twelve logical voices, excluding looping ambience and brief release tails. Four seat IDs are core reserves, not enabled four-player gameplay.
- 55 ms 过滤按玩家独立计时，只有成功播放才更新；入关与 iOS 音频上下文重建清空计时。保留同一玩家基础炮/强化炮的重复音过滤，不承诺每颗弹丸都有独立声音。
- The 55 ms filter runs per player and advances only after successful playback. Stage entry and iOS context reconstruction reset clocks. Duplicate base/enhanced firing from one player stays filtered; individual projectiles do not each require a sound.
- 十二路同时播放的离线混音曾出现峰值 1.163；在原压缩器后加入两端共用的 0.8 固定输出增益，保留混音余量。同一测试峰值约 0.930，无越界采样。该余量令相同输入的音效输出降低约 1.94 dB；BGM 不变。音源、原始优先级、战斗射速与数值不变。
- A twelve-voice offline mix initially peaked at 1.163. A shared fixed 0.8 output gain after the existing compressor leaves headroom: the same fixture peaks near 0.930 with no out-of-range samples. Identical effect input is approximately 1.94 dB quieter; BGM is unchanged. Recordings, source priorities, combat firing rates and numeric rules are unchanged.

这是明确的现代混音扩展，不宣称复刻原作三路混音。M2.16 的“保留三路/Android 音效类不变”仅描述当时范围，本次用户已明确授权共用修复；其 iOS 防爆音和原生恢复逻辑继续保留。

This is an explicit modern mixing extension, not a claim of original three-voice fidelity. M2.16's three-slot/unchanged-Android scope describes that historical milestone; the user now authorizes shared fixes while preserving its iOS smoothing and native recovery.

## 验证 / Verification

新增回归涵盖持续爆炸与双人射击、公用实现继承、满池优先级、射击归属、失败请求计时、入关/上下文重置、尾音清理与离线混音余量。新增浏览器压力探针同时供 Android 真正打包 WebView 使用；iPhone/iPad 原生模拟器探针检查共用调度及双人射击，并继续检查 iOS 释放尾音和暂停设置静音。

Regressions cover dense combat/two-player shots, shared implementation inheritance, world-pool overflow, ownership, rejected-request clocks, stage/context reset, tail cleanup and offline mix headroom. The new browser stress probe also runs in packaged Android WebView. iPhone/iPad simulator probes exercise shared scheduling/two-player shots while retaining iOS release-tail and silent paused-settings checks.

发布验收结果待构建完成后补充。真机扬声器、蓝牙、最低系统硬件及用户设备的最终听感仍需复测；不得把调度测试写成全部手机已无漏音或爆音。

Release verification results will be recorded after builds finish. Physical speakers, Bluetooth, minimum-OS hardware and the user's listening experience remain unverified; scheduling tests do not certify every device as free of missing sounds or crackles.
