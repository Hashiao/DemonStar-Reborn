"""Read-only DemonStar 4.04 GLB inspection. Outputs stay in ignored .local/reference.

This is a format research tool, not an original-asset redistribution tool.
"""
import argparse
import json
import struct
from pathlib import Path


def read_glb(path):
    data = Path(path).read_bytes()
    if data[:6] != b'GLB2.0':
        raise ValueError('Not a GLB2.0 archive')
    count = struct.unpack_from('<I', data, 8)[0]
    if 12 + count * 28 > len(data):
        raise ValueError('Truncated archive index')
    result = []
    for index in range(count):
        flags, offset, size, raw_name = struct.unpack_from('<III16s', data, 12 + index * 28)
        if size and offset + size > len(data):
            raise ValueError('Archive entry out of bounds')
        name = raw_name.split(b'\0')[0].decode('ascii', errors='replace')
        result.append({'index': index, 'name': name, 'flags': flags, 'data': data[offset:offset + size]})
    return result


def decode_sprite(data, palette):
    from PIL import Image
    w, h, kind = struct.unpack_from('<III', data)
    if not (0 < w <= 4096 and 0 < h <= 4096):
        raise ValueError('Invalid image dimensions')
    if kind == 1:
        image = Image.frombytes('P', (w, h), data[12:12 + w * h])
        image.putpalette(palette)
        return image.convert('RGBA')
    raw, alpha = bytearray(w * h), bytearray(w * h)
    offsets = struct.unpack_from('<' + str(h) + 'I', data, 12)
    for row, start in enumerate(offsets):
        if start < 12 + h * 4:
            continue
        end = offsets[row + 1] if row < h - 1 and offsets[row + 1] else len(data)
        cur = start
        while cur + 12 <= end:
            x, y, length = struct.unpack_from('<III', data, cur)
            cur += 12
            if x + length > w or y >= h or length > w or cur + length > end:
                break
            raw[y * w + x:y * w + x + length] = data[cur:cur + length]
            alpha[y * w + x:y * w + x + length] = b'\xff' * length
            cur += length
    image = Image.frombytes('P', (w, h), bytes(raw))
    image.putpalette(palette)
    image = image.convert('RGBA')
    image.putalpha(Image.frombytes('L', (w, h), bytes(alpha)))
    return image


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=Path)
    parser.add_argument('--out', type=Path, default=Path('.local/reference'))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    archives = {name: read_glb(args.directory / name) for name in ['Game.glb', 'game1.glb', 'game2.glb', 'Game3.glb']}
    main = {e['name']: e['data'] for e in archives['Game.glb']}
    palette = [min(255, v * 4) for v in main['palette']]
    for name, entries in archives.items():
        (args.out / (name + '.index.json')).write_text(json.dumps([{'index': e['index'], 'name': e['name'], 'size': len(e['data'])} for e in entries], indent=2), encoding='utf-8')
        for entry in entries:
            if entry['name'].startswith('B_BACK') and len(entry['data']) == 192012:
                decode_sprite(entry['data'], palette).save(args.out / (entry['name'] + '.png'))
    ship_data = main['SHIPDEFS_DAT']
    count = struct.unpack_from('<I', ship_data)[0]
    assert len(ship_data) == 4 + count * 2688
    definitions = []
    for i in range(count):
        record = ship_data[4 + i * 2688:4 + (i + 1) * 2688]
        definitions.append({'index': i, 'name': record[:16].split(b'\0')[0].decode(), 'id': struct.unpack_from('<I', record, 16)[0], 'words': list(struct.unpack_from('<1336H', record, 16))})
    (args.out / 'definitions-raw.json').write_text(json.dumps(definitions, indent=2), encoding='utf-8')
    (args.out / 'SHIPDEFS_DAT.bin').write_bytes(ship_data)
    levels = []
    for entry in archives['game1.glb']:
        if not entry['name'].startswith('AS_'):
            continue
        raw = entry['data']
        count = struct.unpack_from('<I', raw, 20)[0]
        assert len(raw) == 24 + count * 32
        levels.append({'id': len(levels) + 1, 'name': entry['name'], 'background': raw[:16].split(b'\0')[0].decode(), 'mode': struct.unpack_from('<I', raw, 16)[0], 'events': [list(struct.unpack_from('<8i', raw, 24 + i * 32)) for i in range(count)]})
    (args.out / 'levels-raw.json').write_text(json.dumps(levels, indent=2), encoding='utf-8')
    print(f'Inspected {len(levels)} original maps and {len(definitions)} object definitions.')
