"""Build a display-only EB Garamond WOFF using system HarfBuzz and Python zlib.

Run: python3 scripts/prepare-display-font.py [../EBGaramond[wght].ttf]
HarfBuzz handles glyph/layout subsetting and weight-axis restriction.
WOFF packaging follows https://www.w3.org/TR/WOFF/ (unmodified SFNT tables).
This is an offline maintenance helper, not a website/build dependency.
"""
import ctypes as c
import ctypes.util
from pathlib import Path
import struct
import sys
import zlib

ROOT = Path(__file__).resolve().parents[1]
RANGES = [(0x20, 0x17F), (0x300, 0x36F), (0x2000, 0x206F)]


def library(name):
    path = ctypes.util.find_library(name)
    if not path:
        raise SystemExit(f'Missing system library: {name}')
    return c.CDLL(path)


def bind(lib, name, args, result):
    fn = getattr(lib, name)
    fn.argtypes, fn.restype = args, result
    return fn


def subset(source):
    hb, sub = library('harfbuzz'), library('harfbuzz-subset')
    ptr = c.c_void_p
    blob = bind(hb, 'hb_blob_create_from_file_or_fail', [c.c_char_p], ptr)(str(source).encode())
    if not blob:
        raise SystemExit(f'Cannot read font: {source}')
    face = bind(hb, 'hb_face_create', [ptr, c.c_uint], ptr)(blob, 0)
    settings = bind(sub, 'hb_subset_input_create_or_fail', [], ptr)()
    chars = bind(sub, 'hb_subset_input_unicode_set', [ptr], ptr)(settings)
    add_range = bind(hb, 'hb_set_add_range', [ptr, c.c_uint, c.c_uint], None)
    for first, last in RANGES:
        add_range(chars, first, last)
    # Retain copyright, license text and license URL alongside normal names.
    names = bind(sub, 'hb_subset_input_set', [ptr, c.c_uint], ptr)(settings, 4)
    for name_id in (0, 13, 14):
        add_range(names, name_id, name_id)
    restrict = bind(sub, 'hb_subset_input_set_axis_range',
                    [ptr, ptr, c.c_uint, c.c_float, c.c_float, c.c_float], c.c_int)
    if not restrict(settings, face, int.from_bytes(b'wght', 'big'), 500, 650, 600):
        raise SystemExit('Cannot restrict the weight axis')
    result = bind(sub, 'hb_subset_or_fail', [ptr, ptr], ptr)(face, settings)
    if not result:
        raise SystemExit('Font subsetting failed')
    out_blob = bind(hb, 'hb_face_reference_blob', [ptr], ptr)(result)
    length = c.c_uint()
    address = bind(hb, 'hb_blob_get_data', [ptr, c.POINTER(c.c_uint)], ptr)(out_blob, c.byref(length))
    data = c.string_at(address, length.value)
    for lib, name, obj in [(hb, 'hb_blob_destroy', out_blob), (hb, 'hb_face_destroy', result),
                           (sub, 'hb_subset_input_destroy', settings), (hb, 'hb_face_destroy', face),
                           (hb, 'hb_blob_destroy', blob)]:
        bind(lib, name, [ptr], None)(obj)
    return data


def woff(sfnt):
    if sfnt[:4] != b'\x00\x01\x00\x00':
        raise SystemExit('Expected a single TrueType font')
    count = struct.unpack_from('>H', sfnt, 4)[0]
    directory, payload = bytearray(), bytearray()
    offset = 44 + count * 20
    total_size = 12 + count * 16
    for index in range(count):
        tag, checksum, source_offset, length = struct.unpack_from('>4sIII', sfnt, 12 + index * 16)
        table = sfnt[source_offset:source_offset + length]
        compressed = zlib.compress(table, 9)
        stored = compressed if len(compressed) < length else table
        directory += struct.pack('>4sIIII', tag, offset, len(stored), length, checksum)
        payload += stored
        padding = (-len(stored)) % 4
        payload += b'\0' * padding
        offset += len(stored) + padding
        total_size += (length + 3) & ~3
    header = struct.pack('>4sI I H H I H H I I I I I', b'wOFF', 0x10000,
                         offset, count, 0, total_size, 1, 0, 0, 0, 0, 0, 0)
    return header + directory + payload


if __name__ == '__main__':
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / 'EBGaramond[wght].ttf'
    target = ROOT / 'src/assets/fonts/eb-garamond-latin-500-650.woff'
    sfnt = subset(source)
    target.write_bytes(woff(sfnt))
    print(f'{source.stat().st_size:,} source bytes → {len(sfnt):,} subset bytes → {target.stat().st_size:,} WOFF bytes')
