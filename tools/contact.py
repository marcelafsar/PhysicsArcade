# Contact sheets: python tools/contact.py <outDir> <png> <png> ...  (12 per sheet, labelled)
import sys, os
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
TW, TH, COLS = 420, 270, 4
for s in range(0, len(files), 12):
    chunk = files[s:s + 12]
    rows = (len(chunk) + COLS - 1) // COLS
    sheet = Image.new('RGB', (TW * COLS, (TH + 18) * rows), (30, 26, 34))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(chunk):
        im = Image.open(f).convert('RGB'); im.thumbnail((TW, TH))
        x, y = (i % COLS) * TW, (i // COLS) * (TH + 18)
        sheet.paste(im, (x, y + 18)); d.text((x + 4, y + 3), os.path.basename(f)[:-4], fill=(255, 230, 180))
    sheet.save(os.path.join(out, f'sheet_{s // 12:02d}.png'))
