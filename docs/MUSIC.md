# 原版 BGM 对应核对（M2.2）

用户提供并要求使用 `audio/` 新增的 20 个 MP3。内容去重后为 18 首，发布副本保持字节一致、文件名使用 ASCII。音源说明：由本地 music.glb 的 MIDI/MIDS 经 FluidSynth 2.6.1 和 Windows gm.dls 渲染，44100 Hz 立体声；合成器和音色库影响实际音色，不宣称与所有旧电脑运行环境完全一致。授权来源为用户说明，不属于 MIT 代码许可。

关卡对应来自 `ds.exe` 的 **0x42564a–0x425696** 跳转表，音乐加载索引来自 **0x41f700**，不是根据文件名顺序推测。用户指出的前三关与程序结果一致。

| 关卡 | 用户提供文件 | 原资源 |
|---|---|---|
| 1 | 背景音乐05_相位.mp3 | MDS_PHASER |
| 2 | 背景音乐06_慢速火箭.mp3 | MDS_SLOWRKET |
| 3 | 背景音乐07.mp3 | MDS_8GALS |
| 4 | 背景音乐08.mp3 | MDS_PHATTY |
| 5 | 背景音乐09.mp3 | MDS_BLIP |
| 6 | 背景音乐04_过关.mp3 | MDS_ENDLEV |
| 7 | 背景音乐12_重击.mp3 | MDS_SMACK |
| 8 | 背景音乐17.mp3 | MDS_SPACTOUT |
| 9 | 背景音乐06_慢速火箭.mp3 | MDS_SLOWRKET |
| 10 | 背景音乐14.mp3 | MDS_SIMP |
| 11 | 背景音乐07.mp3 | MDS_8GALS |
| 12 | 背景音乐15_小行星.mp3 | MDS_ASTEROID |
| 13 | 背景音乐09.mp3 | MDS_BLIP |
| 14 | 背景音乐13_节奏.mp3 | MDS_PACE |
| 15 | 背景音乐11.mp3 | MDS_SPACEBL |
| 16 | 背景音乐16.mp3 | MDS_DAVIS_C |
| 17 | 背景音乐19_跃迁.mp3 | MDS_WARP |
| 18 | 背景音乐18_不妙.mp3 | MDS_NO_GOOD |

第 9/11/13 关分别重复第 2/3/5 关曲目。“背景音乐04_过关”实际用于第 6 关，不把中文译名当成触发场景。主菜单使用 INTRO，结算使用短曲 8GALVAMP（原作进入状态 6 时在 0x415f27 选择索引 7）。HANGER 资源保留，独立的原版机库动画尚未复现。

菜单、关卡、结算播放压缩 MP3，不把约 90 MB 的整套音乐展开为常驻 PCM。M2.10 起 iOS 使用 AVAudioPlayer，避免已复现的 WKWebView 本地媒体加载停滞；Android/浏览器使用单一 HTMLAudioElement。音乐和音效独立开关/音量，暂停续播、后台暂停、语音压低音乐。原生主菜单应用保存的偏好后主动播放，受浏览器策略限制时在用户操作后重试。保持已有用户的音乐开关偏好，新安装默认开启。曲尾使用完整文件循环，用户提供的自然收尾被保留；未承诺原 MIDI 的无缝采样级循环。

Menu, stage and result music use compressed MP3 without retaining the entire roughly 90 MB collection as decoded PCM. From M2.10, iOS uses AVAudioPlayer to avoid reproduced WKWebView local-media loading stalls; Android/browser use one HTMLAudioElement. Music and effects retain independent enable/volume settings, pause/resume, background suspension and speech ducking. Native menus attempt playback after applying saved preferences; browser gesture handlers retry when autoplay is restricted. Existing preferences are preserved and new installs enable music. Complete-file looping retains the supplied natural ending; sample-accurate original MIDI loops are not claimed.

全部 18 个独立文件已由浏览器媒体解码器验证时长和可播放状态。完整文件/来源哈希与逐关代码地址见 [music-manifest.json](music-manifest.json)。重建导入：`python tools/import-music.py`，只读本地原作，复制用户提供 MP3，不修改输入目录。
