# DemonStar 4.04 format research

The importer reads the user's local installation. It never copies executable code, audio or original imagery to the web application. `campaign.js` contains numerical gameplay records and sprite identifiers. The source archive SHA-256 values are included for reproducibility. Original intellectual property is not relicensed by the code license.

## Confirmed file structures

- GLB: `GLB2.0`, count at byte 8, 28-byte directory entries from byte 12: flags / offset / size (little-endian u32), then 16-byte NUL-terminated name. Preserve duplicate names.
- `SHIPDEFS_DAT`: 4-byte count followed by **387 × 2688-byte** records.
- `game1.glb`: **18** `AS_…` records. Map header: 16-byte backdrop name, u32 mode, u32 event count. Every event is 8 little-endian signed integers (32 bytes). Total **8,368** events.
- Map event words 0/1: X / scroll position. Word 2 is the stable definition ID. Word 3 is an editor cache index and is stale in some original maps, notably 3–5. Resolve word 2 against definition ID, **never trust word 3**. All original event words are preserved. Runtime uses stable Y ordering.
- Def sprite names rebind saved resource handles, matching the original loader at 0x402909. Saved handles are not stable across archive loading order.

## Object records

| Offset | Field | Evidence / status |
|---|---|---|
| 0 | sprite name, 16 bytes | archive lookup and loader |
| 16 | stable ID, u32 | map ID lookup |
| 20 | saved resource handle | rebound by name in loader |
| 24 | movement mode, u32 | spawn switch at 0x40F46F |
| 28 | health, u16 | loaded to live health at 0x40F396 |
| 30 | entry speed, i16 | 0x40F37A |
| 32 | later speed, i16 | path speed change at 0x410948 |
| 36 | score, u32 | data retained; scoring behavior reimplemented |
| 40 | object flags, u32 | bit 0 marks a boss; original boss spawn doubles base HP at 0x40F402–43F |
| 50 | gun count, u16 | gun copy at 0x40F05F |
| 54 | path point count, u16 | path termination at 0x410996 |
| 76 | path flags, u32 | loop/exit handling at 0x41099F |
| 80 | speed / loop node, i16 | 0x410934 and 0x410AC8 |
| 88 | up to 60 gun slots, 36 bytes each | gun update 0x40F770–9F2 |
| 2368 | relative path points, i16 X/Y | spawn / movement at 0x40F619 and 0x4109D8–B0B |

Gun slots preserve all 18 signed 16-bit words. The interpreter implements initial delay, inter-shot delay, burst cooldown, burst count, 2048-unit angle, angular step, aiming, speed, arc/gap counters and total burst cycles. Projectile type IDs are preserved, while their special behaviors are incomplete (see FIDELITY.md).

The sprite research utility recognizes uncompressed indexed images and scanline span images. Palettes use 6-bit channels. Original image output remains under ignored `.local/reference/` and is used only for visual reference.

## Reproduction

```sh
python tools/import-campaign.py "/path/to/your/DemonStar"
node --test tests/core.test.mjs
```

This research is not a claim that every original behavior is understood. In particular, timing, difficulty effects, player weapon constants, exact hitboxes, map option bits and special enemy projectiles still need original-runtime comparison.
