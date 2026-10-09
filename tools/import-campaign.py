"""Import factual gameplay records from a user's own DemonStar 4.04 installation.

No executable code, music, images or original archives are copied into the output.
Documented fields: docs/FORMAT.md. Unknown fields remain explicit, not invented.
"""
import argparse
import hashlib
import json
import runpy
import struct
from pathlib import Path

api = runpy.run_path(str(Path(__file__).with_name('inspect-original.py')))
read_glb = api['read_glb']


def import_campaign(directory):
    archives = {1: read_glb(directory / 'Game.glb'), 2: read_glb(directory / 'game2.glb'), 3: read_glb(directory / 'Game3.glb')}
    data = next(e['data'] for e in archives[1] if e['name'] == 'SHIPDEFS_DAT')
    count = struct.unpack_from('<I', data)[0]
    assert len(data) == 4 + count * 2688
    sprites = {}
    for entries in archives.values():
        for entry in entries:
            sprites.setdefault(entry['name'].upper(), entry)
    definitions = []
    for i in range(count):
        rec = data[4 + i * 2688:4 + (i + 1) * 2688]
        u16 = lambda off: struct.unpack_from('<H', rec, off)[0]
        s16 = lambda off: struct.unpack_from('<h', rec, off)[0]
        u32 = lambda off: struct.unpack_from('<I', rec, off)[0]
        # Original loader 0x402909 rebinds saved handles by the 16-byte name.
        sprite_name = rec[:16].split(b'\0')[0].decode()
        sprite = sprites[sprite_name.upper()]
        width, height = struct.unpack_from('<II', sprite['data'])
        gun_count, path_count = u16(50), u16(54)
        assert gun_count <= 60 and path_count <= 80
        guns = []
        for g in range(gun_count):
            words = list(struct.unpack_from('<18h', rec, 88 + g * 36))
            guns.append(words)
        definitions.append({
            'index': i, 'id': u32(16), 'sprite': sprite['name'], 'width': width, 'height': height,
            'mode': u32(24), 'hp': u16(28), 'speed': s16(30), 'exitSpeed': s16(32),
            'score': u32(36), 'flags': u32(40), 'pathFlags': u32(76), 'speedNode': s16(80),
            'path': [list(struct.unpack_from('<hh', rec, 2368 + k * 4)) for k in range(path_count)],
            'guns': guns,
        })
    by_id = {d['id']: d['index'] for d in definitions}
    assert len(by_id) == len(definitions)
    levels = []
    for e in read_glb(directory / 'game1.glb'):
        if not e['name'].startswith('AS_'):
            continue
        raw = e['data']
        n = struct.unpack_from('<I', raw, 20)[0]
        assert len(raw) == 24 + n * 32
        events = [list(struct.unpack_from('<8i', raw, 24 + k * 32)) for k in range(n)]
        assert all(row[2] in by_id for row in events)
        # Preserve archive order, including editor records with an earlier Y.
        # Runtime makes a stable sorted view without mutating these records.
        levels.append({'id': len(levels) + 1, 'background': raw[:16].split(b'\0')[0].decode(), 'mode': struct.unpack_from('<I', raw, 16)[0], 'events': events})
    assert len(levels) == 18
    return {'schema': 1, 'sourceVersion': 'DemonStar 4.04 local registered copy',
            'sourceHashes': {n: hashlib.sha256((directory / n).read_bytes()).hexdigest() for n in ['Game.glb', 'game1.glb', 'game2.glb']},
            'definitions': definitions, 'byId': by_id, 'levels': levels}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=Path)
    parser.add_argument('--out', type=Path, default=Path('web/js/campaign.js'))
    args = parser.parse_args()
    result = import_campaign(args.directory)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text('/* Gameplay records transcribed from local reference. See docs/FORMAT.md. */\n' + 'globalThis.DemonStarCampaign=' + json.dumps(result, separators=(',', ':')) + ';\n', encoding='utf-8')
    print(f"Imported {len(result['levels'])} maps, {sum(len(s['events']) for s in result['levels'])} placements and {len(result['definitions'])} definitions.")
