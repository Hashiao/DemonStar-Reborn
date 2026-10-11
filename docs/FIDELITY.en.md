# Fidelity status

[简体中文](FIDELITY.md) · [English](FIDELITY.en.md)

Current milestone: **M2.17, difficulty-aware waves and spawn positions**. This is not a verified complete 1:1 port. Restore the original 18 stages before developing stages 19–25.

| Area | Current status |
|---|---|
| Campaign | 18 original maps, 8,368 placements and 387 definitions retain numeric HP, speed, scores, paths, guns and drop metadata. Original frame-by-frame timing is not fully verified. |
| Enemies and bosses | Original gun delay, bursts, aim, angles, speed and finite cycles drive attacks. Stage-one stars, three blue laser volleys, snapshot meteor aim, accelerated spinners, corrected fighter, fixed turrets and asteroid frames are restored. Original flags distinguish in-place Boss explosions from sideways/upward deaths, with nine damaged hulls and initial/final multi-point blasts; six-keyframe fireballs and debris remain approximate. Boss transformations, parts, invisibility and some special attacks remain incomplete. |
| Player | Paired default guns; four starting lives, 16 energy and three bombs. User-requested capacity is eighteen rather than the original six, with unchanged automatic supply thresholds. Six-tier weapons, 16 pickup types, color cycles, same-color upgrades, switching resets, full-power overflow, death drops, missiles and persistent side/rear upgrades. Superweapon propagation and special interactions need further verification. |
| Damage and time | Fixed 35ms simulation; original wall-clock speed remains uncalibrated. Enemy shots follow four difficulty branches, collisions use width brackets and deal 305 damage to enemies. No extra ordinary-hit invulnerability; critical surviving hits downgrade colored weapons. Collision shapes and some enemy-fire difficulty factors remain approximate. Bosses retain doubled base HP. |
| Art and presentation | Explicit mappings cover 251 prototypes and visible renders of all 244 used names. Add 213 named redraw/ore-fleck mappings, removing generic enemy/scenery fallbacks; fifteen actual enemy-shot types use named frames and original visible sizes. Preserve player banking/flames, existing frame atlases, launch, impacts and weapon tiers. Some new headings/rotation use single-pose redraws; complete animations, shadows, wreck details and launch wall-clock timing remain approximate. |
| Stage bonuses | Remaining bombs ×1000, medals ×2000, awarded once; death/stage changes reset medals. Award timing is adapted for mobile. Difficulty-specific between-stage health/ammo replenishment is not implemented. |
| Audio | Authorized MP3 copies with source/hash manifests, original 18-stage BGM indices and three-voice effect priorities. Original-speaker A/B audition and full timing are incomplete. W_PULSE is absent from authorized MP3 sources. |
| Languages | Simplified Chinese, independently worded shared Traditional Chinese and English. Native first-run selection, saved override, instant settings switching and accessibility translation. English radio remains; regional native-speaker review is not claimed. |
| Mobile | Fixed/floating sticks, follow-finger movement, digital tilt, optional double-tap bombing, eight-way pads, keyboard/mouse/controller assignment/remapping, independent two-player touch, pause/background input release, native haptic preferences, stage checkpoints and responsive portrait/landscape layouts. Resizing preserves the stage. Foldable sizes are simulated, not physically tested. |
| Other modes | Same-device two-player play, native Android/iOS two-player LAN and stage-entry saves/loads are implemented. Menus/rooms cap at two; P3/P4 remain protocol/core reserves. Two native Android processes and two iOS simulators are verified; physical hotspots and native Android–iOS device pairs remain untested. The map editor and arbitrary battle-frame continuation are not implemented. |

M2.4 authorized the verified incoming-damage corrections. Base enemy HP, player weapon damage and existing superweapon budgets remain frozen. M2.7 changes blue-laser propagation while preserving its old numeric budget.

Next work: calibrate original runtime timing; verify special projectile, boss-part and drop/chain behavior; verify full animations, shadows and wreck detail; check superweapon interactions; and test Android 10/iOS 12 on actual supported devices. Deployment targets are not minimum-system verification. Historical evidence remains in [M2.4 research](M2_4_RESEARCH.md), [M2.5 research](M2_5_RESEARCH.md) and earlier original-combat documents in their original language.

M2.7 corrects the earlier ring interpretation: S_BPULSEA–D surrounds the player; projectile 61 uses tiled S_ESHOT6L2A–D laser art. The beam follows the player and stops at the nearest eligible target. The old 4-second, 720-per-four-tick budget remains; original duration counters and scan damage are not substituted. Violet follows user feedback; original blend parameters are not fully decoded. Regular bars require maximum HP ≥905 and are independent of boss bars; only boss bars default on. See [M2.7 research](M2_7_RESEARCH.md).

M2.8 restores thin 4×8 homing missiles, eight units per tick, original turn steps/post-turn alignment, retained locks with cyclic reacquisition and a 101-tick fuse. Yellow pairs, three blue lengths composing six tiers, six red widths and decelerating 3×4 auxiliary pellets are corrected. Base HP, player damage tables and superweapon budgets are unchanged. Spawn-ID cycling differs from original 128-slot reuse; collision, trails and HD silhouettes remain approximate, and magnetic steering is unverified. See [M2.8 evidence](M2_8_RESEARCH.md) and [recording reference](REFERENCE_VIDEO.md).

M2.10 retains red P1/blue P2 and the classic icon HUD: P2 sits bottom-right, with its blue ship left of the energy bar and bombs above. Results use battlefield player panels and three icon reward rows; both platforms share a pixel-redrawn launcher icon. Native iOS BGM timing verifies startup, pause/resume, enable/mute and volume. The eighteen-stage, HP and damage tables are unchanged. Animation, timing and hardware limitations above still preclude full-fidelity claims. See the [development record](M2_10_DEVELOPMENT.md), [presentation evidence](M2_10_PRESENTATION.md) and [device checklist](M2_10_DEVICE_CHECKLIST.md).

M2.11: [iOS 长按与菜单修复 / iOS touch and menu fixes](M2_11_INPUT_MENU.md)。原作数据与上述还原边界未变。 / Original data and fidelity limitations above remain unchanged.

M2.12: [分类设置与可选三色规则 / Categorized settings and optional retained colors](M2_12_SETTINGS.md)。默认仍使用已核实原作规则，新增保留模式是用户要求的可选扩展，不宣称原作行为。 / Verified classic rules remain the default; retained colors are a user-requested optional extension, not claimed original behavior.

M2.13: [快速开局与操作规则 / Quick setup and control rules](M2_13_CONTROLS.md)。输入及状态显示改进，原作关卡、美术、HP/伤害参数未调整。 / Input and status improvements leave original stages, artwork and HP/damage tables unchanged.


## M2.14

- Tap a battlefield destination, release and keep travelling until arrival, under the existing speed limit. At most one player per shared device uses it.
- Digital tilt control adds an adjustable angular dead zone (10° default, 3–30° range), full-direction input beyond the threshold, and independent axis inversions. Confirm neutral at every run/stage start and resume; LAN resumes after both peers are ready.
- Shared-device play disables tilt and temporarily uses floating sticks without overwriting preferences. Missing or denied sensors also receive an explicit fallback.
- A physical 1.2-second hold in toggle-fire mode shows a 3-second hint once per hold across touch, keyboard, mouse and gamepad. Floating defaults, original HUD, color banks, firing lifecycle and accepted bomb behavior are retained.

Physical tilt feel, hotspots, Android–iOS hardware pairs and minimum-OS hardware remain untested. Emulator gravity and injected samples are not physical-device tilt validation. The IPA is unsigned and requires user signing. Public play remains solo/two-player; P3/P4 are protocol reserves. Full original-game 1:1 fidelity remains incomplete.


## M2.15

- Follow finger replaces persistent tap destinations: touch anywhere in the battlefield and move while held; release or cancel stops immediately under the existing mobility limits. One shared-device player maximum.
- A separate Double-tap bomb checkbox defaults off. Double-tap from the score area through energy/bomb HUD in solo or one-local-player LAN play; shared-device play disables it.
- Bomb capacity increases to 18 with classic typed icons, six per row and three rows maximum. Stage-save and network validation support it, while original automatic supply frequency and damage stay unchanged. Both LAN peers must use compatible versions.
- New tilt defaults use 6°, preserving saved values. Ordinary results accept a tap in blank space anywhere on screen for the next stage; LAN advancement remains host-only.
- Settings content scrolls independently with a persistent vertical scrollbar when overflowing and a fixed Back footer. Back/reset labels are shortened in all three languages.

194 engine/unit tests and 23 browser suites passed. Android Release/Debug builds, Lint (0 errors and 12 warnings each), API 37 native controls/localization/settings/follow release/double-tap bombing/motion bridge/app-pair TCP passed. [iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38111104820) passed iPhoneOS compilation, iOS 18.5 iPhone/iPad localization/music, follow release and double-tap bombing, sensor fallback, simulator-pair LAN and system long presses.

Physical tilt feel, hotspots, Android–iOS device pairs and minimum-OS hardware remain untested. Simulators and PointerEvent-disabled browser compatibility checks do not replace physical hardware. The IPA is unsigned and requires user signing. Public play remains solo/two-player; P3/P4 are protocol reserves. The 18-bomb capacity is a requested extension, not the original capacity; full 1:1 fidelity remains incomplete.


## M2.16

- Enable a dedicated audio adapter only on iOS, with short effect attacks/releases to reduce stealing and stop discontinuities.
- Prevent paused iOS dialogs from resuming battle effects and coalesce menu transitions so the old stage BGM is not resumed first.
- Native iOS BGM uses short fades and volume ramps, with interruption, headset-route and media-service-reset handling. Battle resumes through the existing resume/calibration flow.
- Android effect/music implementations and native source remain unchanged; only the package version advances. Both platforms retain original three-slot priorities, shot filtering, recordings and combat values.

202 engine/unit tests and 24 browser suites passed. An offline test signal's stop discontinuity falls from 0.5 to about 0.001302; this verifies envelopes, not physical-device listening quality. Android Release/Debug, Lint (0 errors and 12 warnings each), API 37 controls/localization/settings/native-pair LAN and original audio-class selection passed. [iOS CI](https://github.com/Hashiao/DemonStar-Reborn/actions/runs/38115128622) passed iPhoneOS compilation, real packaged WebKit effect release/silent paused settings on iOS 18.5 iPhone/iPad, native music clocks/volume, localization, simulator-pair LAN and system long presses.

This is an iOS-focused mitigation, not yet listening-tested on the user’s iPhone 18 Pro / iOS 27.0.1, Bluetooth headphones or actual system interruptions. Original three-slot priorities can still intentionally omit shots; elimination of every crackle/missing sound is not claimed. Physical hotspots, cross-platform device pairs and minimum-OS hardware remain untested. The IPA is unsigned and requires user signing; public play remains solo/two-player with P3/P4 reserved in the protocol.

## M2.17 waves and positions

Restore player/difficulty admission, original formation batches and birth offsets, side/scenery entry, mode-10 first targets and post-boss dispatch. Paused difficulty changes apply to future batches without resetting existing entities or replaying skipped rows. All 144 static ledger cases, every difficulty transition direction and LAN synchronization are covered by regressions; native frame-clock identity is not claimed. Supply ownership/sequences and stage replenishment remain later work. See [M2.17 details](M2_17_SPAWNS.md).
