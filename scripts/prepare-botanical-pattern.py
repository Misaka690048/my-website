"""Prepare theme PNGs without redrawing, resampling or changing alpha.

Run: python3 scripts/prepare-botanical-pattern.py
Requires Pillow for this local asset-preparation step only.
"""
from pathlib import Path
from shutil import copy2
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / '背景.png'
DESTINATION = ROOT / 'src/assets/ornaments'

def main():
    DESTINATION.mkdir(parents=True, exist_ok=True)
    original = Image.open(SOURCE).convert('RGBA')
    alpha = original.getchannel('A')
    if alpha.getextrema()[0] == 255:
        raise ValueError('The source must have a genuine transparent background.')
    light = DESTINATION / 'botanical-pattern-light.png'
    dark = DESTINATION / 'botanical-pattern-dark.png'
    copy2(SOURCE, light)
    recolored = Image.new('RGBA', original.size, (242, 242, 242, 0))
    recolored.putalpha(alpha)
    recolored.save(dark, optimize=True)
    assert Image.open(dark).getchannel('A').tobytes() == alpha.tobytes()
    assert Image.open(light).size == Image.open(dark).size == original.size
    print(f'Prepared {light.name} and {dark.name}: {original.size}, identical alpha.')

if __name__ == '__main__':
    main()
