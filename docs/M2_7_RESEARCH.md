# M2.7 出击、气罐、血条与蓝色激光 / Launch, tanker, bars and blue laser

## 简体中文

本轮以本地 DemonStar 4.04 程序、原始图形边界、此前用户提供录像的开场截图和用户最新反馈为依据。原始图片与程序只留在忽略目录，不发布。基础 HP、普通武器伤害表和关卡编排未调整。

| 项目 | 证据与问题 | 修复 |
|---|---|---|
| 母舰过慢 | `0x418010` 的演出更新下移 3，旧版错误地直接套到 35ms 战斗节拍，含舱门约 7.98 秒；参考录像母舰离场更快 | 演出按约 60Hz 和显示高度校准，含舱门约 3.71 秒；位移插值保持流畅。暂停冻结、出场后广播和战斗计时不变。该墙钟时长是录像节奏校准，未称为原机逐帧实测值。 |
| 首关气罐瘦长 | `S_SPTNKRA` 原画布 48×88，实心边界 `(2,0)–(46,87)`，即 44×87；旧代码把整格方形 atlas 拉成高矩形，再次压窄了带留白的气罐 | 沿用已有高清重绘，只紧裁切并映射至 44×87 可见比例，保留既有 1.1 绘制倍数；实际显示约 48.4×95.7。基础 HP 700 和碰撞尺寸未改。未声称新增七帧气罐动画。 |
| 血条范围/默认 | 旧单开关按宽或高≥48显示，并同时控制 Boss；与用户要求的血量门槛不符 | 独立普通/Boss 开关。普通以开局两架掉火力球的 `S_ENEMY14`、ID17、基础 HP905 为门槛，比较最大 HP，受伤不使条消失；排除地物和 Boss。默认普通关闭、Boss 开启；旧单开关一次性迁移到新默认，之后独立保存。 |
| 蓝色炸弹 | `0x427820` 加载 `S_BPULSEA–D`，`0x427990` 将其贴在主机 `(x−20,y−32)`，它是护罩；61号弹模板 `0x42c73b–0x42c7c3` 绑定 `S_ESHOT6L2A–D`、模式4；`0x428ed0` 将蓝色小块每隔5像素铺到主机前方；`0x428e70` 扫描首个敌人 | 紫色四帧闪电罩随主角移动，另画四帧粗蓝光束；光束跟随炮口、截到前方最近的可命中目标，不再把护罩当圆环发射。结束/死亡/换关清理瞬态；暂停冻结。 |

**纠正 M2.2 的错误解释**：之前只看到了 `S_BPULSE` 的环形资源，没有继续追到独立弹型模板和绘制分支，因此“61号弹是连续环形脉冲流”的结论错误。本轮以新的调用链证据更正，旧 Release 保持不变。

护罩的紫色依据用户对实际游戏的描述和本轮视觉要求；原始静态参考呈电蓝轮廓，绘制函数还带混合参数11，本轮没有把11擅自解释为调色板色号。新图集由内置 imagegen 参考原形重绘，见 [ART_M2_7.md](ART_M2_7.md)。

数值边界：蓝炮继续使用已有 4 秒、每4个35ms步一次720伤害预算，共29次。原程序有153计数、低于128后每5步发射，以及扫描函数75伤害等另行待核数值，本轮未悄悄替换它们。光束的即时命中、跟随与最近目标截止会改变命中过程，但没有调低 Boss HP；持续瞄准可耗尽首关现有16000 HP。碰撞仍采用当前圆形目标近似；高清光束宽度按12/10/8/5显示，不能称为完整逐像素移植。

## English

This pass uses the local DemonStar4.04 executable, original visible sprite bounds, opening frames from the previously supplied video, and the user's latest feedback. Original pixels and binaries remain local and ignored. Base HP, ordinary weapon damage tables and campaign placements are unchanged.

- **Launch:** `0x418010` advances the presentation by3 pixels. Applying that directly to35ms combat ticks made the previous sequence about7.98s. Presentation is now calibrated near60Hz with height scaling, taking about3.71s including doors. Interpolation is smooth; pause, post-launch radio and combat clocks are preserved. This is a video-paced calibration, not a claim of measured original frame timing.
- **Tanker:** `S_SPTNKRA` has a48×88 canvas and44×87 visible bounds. The previous whole-cell stretch compressed the already-padded HD art. A tight crop now maps to the original visible proportions, retaining the existing1.1 display scale (about48.4×95.7). Its700HP and collision geometry are unchanged. Seven-frame tanker animation is not claimed.
- **Health bars:** regular and boss bars now have independent settings. The regular threshold is905 maximum HP, taken from ID17/S_ENEMY14, the opening pair that drops weapon orbs. Current HP does not determine eligibility, so damage cannot make the bar disappear. Scenery and bosses are excluded from this renderer path. Defaults are regular off, boss on. Legacy combined settings migrate once to these defaults; later choices persist independently.
- **Blue superweapon:** `0x427820/0x427990` bind S_BPULSEA–D to a player-centered aura. Projectile61 instead binds S_ESHOT6L2A–D in mode4 (`0x42c73b–0x42c7c3`). The renderer (`0x428ed0`) tiles it upward at5-pixel intervals, and `0x428e70` scans to the first enemy. The remake now draws a player-following violet electrical sheath and a separate thick blue beam ending at the nearest eligible target. It no longer launches the aura as travelling rings. Pause and transient-state cleanup are covered.

**M2.2 correction:** the earlier interpretation stopped at the ring-shaped aura asset and missed the separate projectile template/rendering branch. Its claim that projectile61 was a stream of rings was incorrect. This evidence supersedes that interpretation without replacing old releases.

Violet follows the user's description and requested appearance. The static original reference is blue and the draw call includes blend parameter11; no claim is made that11 itself is a palette color index. The new atlas is redrawn with built-in imagegen; see [art provenance](ART_M2_7.md).

Numeric limits remain explicit: the blue weapon retains the previous4-second duration and720 damage per four35ms steps,29 applications. The original153 counter, firing every five steps below128, and75-damage scan require separate numerical reconciliation and were not silently substituted. Following the player, instant ray hits and nearest-target blocking change hit application, without lowering boss HP. Sustained aim can deplete the existing first boss's16000HP. Target collision remains the current circular approximation; HD beam widths12/10/8/5 are presentation values, not a complete pixel-exact port.
