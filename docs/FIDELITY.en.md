# Fidelity status

[简体中文](FIDELITY.md) · [English](FIDELITY.en.md)

Current milestone: **M2.9, campaign prototypes and enemy-projectile mappings**. This is not a verified complete 1:1 port. Restore the original 18 stages before developing stages 19–25.

| Area | Current status |
|---|---|
| Campaign | 18 original maps, 8,368 placements and 387 definitions retain numeric HP, speed, scores, paths, guns and drop metadata. Original frame-by-frame timing is not fully verified. |
| Enemies and bosses | Original gun delay, bursts, aim, angles, speed and finite cycles drive attacks. Stage-one stars, three blue laser volleys, snapshot meteor aim, accelerated spinners, corrected fighter, fixed turrets and asteroid frames are restored. Boss transformations, parts, invisibility and some special attacks remain incomplete. |
| Player | Paired default guns; four starting lives, 16 energy and three bombs. Six-tier weapons, 16 pickup types, color cycles, same-color upgrades, switching resets, full-power overflow, death drops, missiles and persistent side/rear upgrades. Superweapon propagation and special interactions need further verification. |
| Damage and time | Fixed 35ms simulation; original wall-clock speed remains uncalibrated. Enemy shots follow four difficulty branches, collisions use width brackets and deal 305 damage to enemies. No extra ordinary-hit invulnerability; critical surviving hits downgrade colored weapons. Collision shapes and some enemy-fire difficulty factors remain approximate. Bosses retain doubled base HP. |
| Art and presentation | Explicit mappings cover 251 prototypes and visible renders of all 244 used names. Add 213 named redraw/ore-fleck mappings, removing generic enemy/scenery fallbacks; fifteen actual enemy-shot types use named frames and original visible sizes. Preserve player banking/flames, existing frame atlases, launch, impacts and weapon tiers. Some new headings/rotation use single-pose redraws; complete animations, shadows, wreck details and launch wall-clock timing remain approximate. |
| Stage bonuses | Remaining bombs ×1000, medals ×2000, awarded once; death/stage changes reset medals. Award timing is adapted for mobile. Difficulty-specific between-stage health/ammo replenishment is not implemented. |
| Audio | Authorized MP3 copies with source/hash manifests, original 18-stage BGM indices and three-voice effect priorities. Original-speaker A/B audition and full timing are incomplete. W_PULSE is absent from authorized MP3 sources. |
| Languages | Simplified Chinese, independently worded shared Traditional Chinese and English. Native first-run selection, saved override, instant settings switching and accessibility translation. English radio remains; regional native-speaker review is not claimed. |
| Mobile | Bounded left stick and A/B controls, multitouch, pause/background input release and responsive portrait/landscape layouts. Resizing preserves the stage. Foldable sizes are simulated, not physically tested. |
| Other modes | Single-player only; original co-op, networking, map editor and full checkpoint continuation are not implemented. |

M2.4 authorized the verified incoming-damage corrections. Base enemy HP, player weapon damage and existing superweapon budgets remain frozen. M2.7 changes blue-laser propagation while preserving its old numeric budget.

Next work: calibrate original runtime timing; verify special projectile, boss-part and drop/chain behavior; verify full animations, shadows and wreck detail; check superweapon interactions; and test Android 10/iOS 12 on actual supported devices. Deployment targets are not minimum-system verification. Historical evidence remains in [M2.4 research](M2_4_RESEARCH.md), [M2.5 research](M2_5_RESEARCH.md) and earlier original-combat documents in their original language.

M2.7 corrects the earlier ring interpretation: S_BPULSEA–D surrounds the player; projectile 61 uses tiled S_ESHOT6L2A–D laser art. The beam follows the player and stops at the nearest eligible target. The old 4-second, 720-per-four-tick budget remains; original duration counters and scan damage are not substituted. Violet follows user feedback; original blend parameters are not fully decoded. Regular bars require maximum HP ≥905 and are independent of boss bars; only boss bars default on. See [M2.7 research](M2_7_RESEARCH.md).

M2.8 restores thin 4×8 homing missiles, eight units per tick, original turn steps/post-turn alignment, retained locks with cyclic reacquisition and a 101-tick fuse. Yellow pairs, three blue lengths composing six tiers, six red widths and decelerating 3×4 auxiliary pellets are corrected. Base HP, player damage tables and superweapon budgets are unchanged. Spawn-ID cycling differs from original 128-slot reuse; collision, trails and HD silhouettes remain approximate, and magnetic steering is unverified. See [M2.8 evidence](M2_8_RESEARCH.md) and [recording reference](REFERENCE_VIDEO.md).
