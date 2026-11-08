"""Regenerate the self-hosted poetry font. Requires Debian libharfbuzz-subset0.
Run from any directory: python3 scripts/subset-poetry-font.py [ZhuqueFangsong-Regular.ttf] [extra-text.txt]
The default source is the user's extracted v0.212 release in ../references.
This is a maintenance helper, not a build-time dependency.
"""
import ctypes as c
import ctypes.util
import json
from html.parser import HTMLParser
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else root.parent / 'references/zhuque-v0.212/ZhuqueFangsong-Regular.ttf'
poems = json.loads((root / 'src/data/poems.json').read_text())
text = '《》·' + ''.join(poem[field] for poem in poems for field in ('text', 'author', 'work'))

# Share one font resource between poetry and deliberately marked quotations.
# Scan literal HTML quotations in Markdown/Astro. For dynamically generated
# quotations, pass their rendered text as the optional second file argument.
class Quotations(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == 'blockquote':
            classes = dict(attrs).get('class', '') or ''
            if self.depth or 'quoted' in classes.split():
                self.depth += 1

    def handle_endtag(self, tag):
        if tag == 'blockquote' and self.depth:
            self.depth -= 1

    def handle_data(self, data):
        if self.depth:
            self.parts.append(data)

for path in sorted((root / 'src').rglob('*')):
    if path.suffix in ('.md', '.mdx', '.astro'):
        parser = Quotations()
        parser.feed(path.read_text())
        text += ''.join(parser.parts)
if len(sys.argv) > 2:
    text += Path(sys.argv[2]).read_text()
# Formatting whitespace is not a required visible glyph.
text = ''.join(char for char in text if char not in '\n\r\t')
hb = c.CDLL(ctypes.util.find_library('harfbuzz'))
subset = c.CDLL(ctypes.util.find_library('harfbuzz-subset'))

def bind(lib, name, args, result):
    fn = getattr(lib, name)
    fn.argtypes, fn.restype = args, result
    return fn

ptr = c.c_void_p
blob_create = bind(hb, 'hb_blob_create_from_file_or_fail', [c.c_char_p], ptr)
face_create = bind(hb, 'hb_face_create', [ptr, c.c_uint], ptr)
input_create = bind(subset, 'hb_subset_input_create_or_fail', [], ptr)
unicode_set = bind(subset, 'hb_subset_input_unicode_set', [ptr], ptr)
set_add = bind(hb, 'hb_set_add', [ptr, c.c_uint], None)
subset_face = bind(subset, 'hb_subset_or_fail', [ptr, ptr], ptr)
face_blob = bind(hb, 'hb_face_reference_blob', [ptr], ptr)
blob_data = bind(hb, 'hb_blob_get_data', [ptr, c.POINTER(c.c_uint)], ptr)
blob = blob_create(str(source).encode())
if not blob:
    raise SystemExit(f'Cannot read font: {source}')
face = face_create(blob, 0)
settings = input_create()
# Preserve the upstream copyright, license and license URL in the web subset.
name_ids = bind(subset, 'hb_subset_input_set', [ptr, c.c_uint], ptr)(settings, 4)  # HB_SUBSET_SETS_NAME_ID
for name_id in (0, 13, 14):
    set_add(name_ids, name_id)
chars = unicode_set(settings)
for char in set(text):
    set_add(chars, ord(char))
result = subset_face(face, settings)
if not result:
    raise SystemExit('Font subsetting failed')
# Check the actual output, including author names, long titles and punctuation.
coverage = bind(hb, 'hb_set_create', [], ptr)()
bind(hb, 'hb_face_collect_unicodes', [ptr, ptr], None)(result, coverage)
has_char = bind(hb, 'hb_set_has', [ptr, c.c_uint], c.c_int)
missing = sorted(char for char in set(text) if not has_char(coverage, ord(char)))
bind(hb, 'hb_set_destroy', [ptr], None)(coverage)
if missing:
    raise SystemExit('Missing poetry glyphs: ' + ''.join(missing))
out_blob = face_blob(result)
length = c.c_uint()
data = c.string_at(blob_data(out_blob, c.byref(length)), length.value)
target = root / 'src/assets/fonts/poetry-zhuque.ttf'
target.write_bytes(data)
print(f'{target.name}: {len(set(text))} characters, {len(data):,} bytes')
for name, obj, lib in [('hb_blob_destroy',out_blob,hb), ('hb_face_destroy',result,hb), ('hb_subset_input_destroy',settings,subset), ('hb_face_destroy',face,hb), ('hb_blob_destroy',blob,hb)]:
    bind(lib, name, [ptr], None)(obj)
