#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 avatars/ 里的 56 张原图拼成雪碧图，并把 base64 灌进 index.html。

用法：python3 tools/build_avatars.py
依赖：pillow（pip install pillow）

约定：
  - avatars/<槽位名>.png|jpg|webp，槽位名见 SLOTS
  - 每张裁成正方形（默认取高度的 72%、上边留 5%，让脸占满一点），缩到 128px
  - 8 列 × 7 行拼成 1024×896 的 WebP（q80），再写进 index.html 的 AV_SHEET
  - 缺图的位置留空（游戏里会退回首字圆牌），不会报错
"""
import base64, io, os, re, sys, glob
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, 'avatars')
HTML = os.path.join(ROOT, 'index.html')

SLOTS = ([f'{g}{b}_0{i}' for g in ('m','f') for b in (1,2,3,4) for i in range(1,7)]
         + ['x_monk_01','x_monk_02','x_dao_01','x_dao_02','x_beg_01','x_mask_01','x_mask_02','x_gov_01'])
# 上面的顺序要和 index.html 里的 AV_SLOTS 完全一致
COLS, ROWS, CELL, QUALITY = 8, 7, 128, 80
DEFAULT_CROP = (0.72, 0.05)          # (边长占高度的比例, 上边留白比例)
OVERRIDE = {'x_mask_02': (0.88, 0.02),   # 斗笠太宽，裁松一点
            'm4_02':     (0.78, 0.04)}   # 长须老者

def find(slot):
    for ext in ('png','jpg','jpeg','webp'):
        p = os.path.join(SRC, f'{slot}.{ext}')
        if os.path.exists(p): return p
    return None

def cell(path, slot):
    im = Image.open(path).convert('RGB')
    frac, top = OVERRIDE.get(slot, DEFAULT_CROP)
    W, H = im.size
    s = int(H * frac)
    x = max(0, (W - s) // 2)
    y = max(0, min(int(H * top), H - s))
    return im.crop((x, y, x + s, y + s)).resize((CELL, CELL), Image.LANCZOS)

def main():
    sheet = Image.new('RGB', (COLS*CELL, ROWS*CELL), (239, 229, 207))
    got = miss = 0
    for i, slot in enumerate(SLOTS):
        p = find(slot)
        if not p:
            miss += 1; print('  缺图:', slot); continue
        sheet.paste(cell(p, slot), ((i % COLS)*CELL, (i // COLS)*CELL))
        got += 1
    buf = io.BytesIO()
    sheet.save(buf, 'WEBP', quality=QUALITY, method=6)
    data = buf.getvalue()
    b64 = base64.b64encode(data).decode()
    print(f'拼好 {got} 张（缺 {miss} 张），雪碧图 {len(data)//1024}KB，base64 {len(b64)//1024}KB')

    html = io.open(HTML, encoding='utf-8').read()
    m = re.search(r"const AV_SHEET='data:image/webp;base64,([A-Za-z0-9+/=]*)';", html)
    if not m:
        print('!! index.html 里找不到 AV_SHEET'); sys.exit(1)
    html = html[:m.start(1)] + b64 + html[m.end(1):]
    io.open(HTML, 'w', encoding='utf-8').write(html)
    print('已写回 index.html，现在', os.path.getsize(HTML)//1024, 'KB')

if __name__ == '__main__':
    main()
