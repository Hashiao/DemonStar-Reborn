# Fidelity status

[简体中文](FIDELITY.md) · [English](FIDELITY.en.md)

Current milestone: **M2.6, trilingual UI and bilingual project maintenance**. This is not a verified complete 1:1 port. Restore the original 18 stages before developing stages 19–25.

| Area | Current status |
|---|---|
| Campaign | 18 original maps, 8,368 placements and 387 definitions retain numeric HP, speed, scores, paths, guns and drop metadata. Original frame-by-frame timing is not fully verified. |
| Enemies and bosses | Original gun delay, bursts, aim, angles, speed and finite cycles drive attacks. Stage-one stars, three blue laser volleys, snapshot meteor aim, accelerated spinners, corrected fighter, fixed turrets and asteroid frames are restored. Boss transformations, parts, invisibility and some special attacks remain incomplete. |
| Player | Paired default guns; four starting lives, 16 energy and three bombs. Six-tier weapons, 16 pickup types, color cycles, same-color upgrades, switching resets, full-power overflow, death drops, missiles and persistent side/rear upgrades. Superweapon propagation and special interactions need further verification. |
| Damage and time | Fixed 35ms simulation; original wall-clock speed remains uncalibrated. Enemy shots follow four difficulty branches, collisions use width brackets and deal 305 damage to enemies. No extra ordinary-hit invulnerability; critical surviving hits downgrade colored weapons. Collision shapes and some enemy-fire difficulty factors remain approximate. Bosses retain doubled base HP. |
| Art and presentation | Imagegen redraws preserve original designs. Player banking/flames, projectile tiers, carrier launch, impacts, explosions and eligible ground wrecks are present. Door timing, six-keyframe blasts, eight shared wreck families and unredrawn enemies remain approximations. |
| Stage bonuses | Remaining bombs ×1000, medals ×2000, awarded once; death/stage changes reset medals. Award timing is adapted for mobile. Difficulty-specific between-stage health/ammo replenishment is not implemented. |
| Audio | Authorized MP3 copies with source/hash manifests, original 18-stage BGM indices and three-voice effect priorities. Original-speaker A/B audition and full timing are incomplete. W_PULSE is absent from authorized MP3 sources. |
| Languages | Simplified Chinese, independently worded shared Traditional Chinese and English. Native first-run selection, saved override, instant settings switching and accessibility translation. English radio remains; regional native-speaker review is not claimed. |
| Mobile | Bounded left stick and A/B controls, multitouch, pause/background input release and responsive portrait/landscape layouts. Resizing preserves the stage. Foldable sizes are simulated, not physically tested. |
| Other modes | Single-player only; original co-op, networking, map editor and full checkpoint continuation are not implemented. |

M2.4 authorized the verified incoming-damage corrections. Base enemy HP, player weapon damage and existing superweapon budgets remain frozen. M2.6 changes language and documentation, not those mechanics.

Next work: calibrate original runtime timing; verify special projectile, boss-part and drop/chain behavior; replace shared art; check superweapon interactions; and test Android 10/iOS 12 on actual supported devices. Deployment targets are not minimum-system verification. Historical evidence remains in [M2.4 research](M2_4_RESEARCH.md), [M2.5 research](M2_5_RESEARCH.md) and earlier original-combat documents in their original language.
