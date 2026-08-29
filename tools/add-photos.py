#!/usr/bin/env python3
"""
Add photos to the front-page gallery strip.

Usage
-----
1. Put your photos in  images/  — name each file for the caption you want:

       images/Crete.jpg          -> caption "Crete"
       images/Dublin Pub.jpeg    -> caption "Dublin Pub"
       images/santorini_dusk.jpg -> caption "Santorini Dusk"

   (You can drag them straight into the images/ folder on github.com via
   "Add file -> Upload files".)

2. Run:

       python3 tools/add-photos.py            # do it
       python3 tools/add-photos.py --dry-run  # just say what it would do

It will:
  * shrink any oversized photo to the gallery's 900px width, in place,
    honouring the EXIF rotation your phone recorded;
  * add a gallery entry to index.html for any photo not already used
    somewhere on the site;
  * leave everything already in place alone, so it is safe to re-run.

To keep a photo in images/ but OUT of the gallery, list its filename in
images/.gallery-ignore (one per line). Otherwise this script would add it
back the next time it runs.

Requires Pillow:  pip install Pillow
"""

import argparse
import html
import pathlib
import re
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is not installed. Run:  pip install Pillow")

ROOT       = pathlib.Path(__file__).resolve().parent.parent
IMAGES     = ROOT / "images"
INDEX      = ROOT / "index.html"
MAX_WIDTH  = 900          # every gallery image is 900px wide
JPEG_Q     = 82
SUFFIXES   = {".jpg", ".jpeg", ".png"}
INDENT     = "      "
IGNORE     = ".gallery-ignore"   # filenames to keep out of the gallery

# Anything matching this is a straight-off-the-camera name, not a caption.
CAMERA_NAME = re.compile(r"^(IMG|DSC|DSCN|PXL|P|MVIMG)[-_]?\d+$", re.IGNORECASE)


def caption_from(stem: str) -> str:
    text = stem.replace("_", " ").replace("-", " ").strip()
    text = re.sub(r"\s+", " ", text)
    # Only impose title case on all-lowercase names; respect deliberate casing.
    return text.title() if text.islower() else text


def load_ignore() -> set:
    path = IMAGES / IGNORE
    if not path.is_file():
        return set()
    lines = path.read_text(encoding="utf-8").splitlines()
    return {ln.strip() for ln in lines if ln.strip() and not ln.startswith("#")}


def referenced_anywhere(name: str, pages: dict) -> bool:
    return any(name in body for body in pages.values())


def resize_in_place(path: pathlib.Path, dry_run: bool) -> str | None:
    """Shrink to MAX_WIDTH if wider. Returns a description, or None if untouched."""
    with Image.open(path) as im:
        before_size = im.size
        if before_size[0] <= MAX_WIDTH:
            return None
        before_bytes = path.stat().st_size
        if dry_run:
            h = round(before_size[1] * MAX_WIDTH / before_size[0])
            return (f"{before_size[0]}x{before_size[1]} -> {MAX_WIDTH}x{h} "
                    f"({before_bytes/1024:.0f}KB)")
        out = ImageOps.exif_transpose(im).convert("RGB")
        h = round(out.size[1] * MAX_WIDTH / out.size[0])
        out = out.resize((MAX_WIDTH, h), Image.LANCZOS)
        out.save(path, "JPEG", quality=JPEG_Q, optimize=True, progressive=True)
    after = path.stat().st_size
    return (f"{before_size[0]}x{before_size[1]} -> {MAX_WIDTH}x{h}  "
            f"{before_bytes/1024:.0f}KB -> {after/1024:.0f}KB")


def gallery_entry(rel: str, caption: str) -> str:
    safe_src = html.escape(rel, quote=True)
    safe_cap = html.escape(caption)
    return (f'{INDENT}<div class="gallery-strip-item" data-src="{safe_src}">'
            f'<img src="{safe_src}" alt="{safe_cap}" loading="lazy" />'
            f'<div class="gallery-caption">{safe_cap}</div></div>\n')


def main() -> int:
    ap = argparse.ArgumentParser(description="Add photos to the gallery strip.")
    ap.add_argument("--dry-run", action="store_true",
                    help="report what would change without writing anything")
    args = ap.parse_args()

    if not IMAGES.is_dir() or not INDEX.is_file():
        return print(f"Run this from the repo — expected {IMAGES} and {INDEX}.") or 1

    pages = {p.name: p.read_text(encoding="utf-8")
             for p in ROOT.glob("*.html")}
    index_html = pages["index.html"]

    photos = sorted(p for p in IMAGES.iterdir()
                    if p.suffix.lower() in SUFFIXES and not p.name.startswith("."))

    ignored = load_ignore()
    resized, added, warnings, skipped = [], [], [], []

    for photo in photos:
        if photo.name in ignored:
            skipped.append(photo.name)
            continue

        in_gallery = f'data-src="images/{photo.name}"' in index_html
        used_elsewhere = referenced_anywhere(photo.name, pages) and not in_gallery

        # Images used outside the strip (the Our Story portrait, say) are shown
        # much larger than a 380px thumbnail, so the 900px rule doesn't apply.
        if used_elsewhere:
            continue

        note = resize_in_place(photo, args.dry_run)
        if note:
            resized.append(f"{photo.name}: {note}")

        if in_gallery:
            continue  # already in the strip — nothing more to do

        caption = caption_from(photo.stem)
        if CAMERA_NAME.match(photo.stem):
            warnings.append(
                f'{photo.name} still has its camera name, so its caption reads '
                f'"{caption}". Rename the file to the caption you want and re-run.')
        added.append((f"images/{photo.name}", caption))

    if added and not args.dry_run:
        marker = "    </div>\n  </div>\n\n  <!-- Weekend Schedule -->"
        if marker not in index_html:
            return print("Could not find the end of the gallery in index.html. "
                         "Has the markup changed? Nothing was written.") or 1
        block = "".join(gallery_entry(src, cap) for src, cap in added)
        index_html = index_html.replace(marker, block + marker, 1)
        INDEX.write_text(index_html, encoding="utf-8")

    verb = "Would resize" if args.dry_run else "Resized"
    if resized:
        print(f"{verb}:")
        for line in resized:
            print(f"  {line}")
    verb = "Would add" if args.dry_run else "Added to the gallery"
    if added:
        print(f"{verb}:")
        for src, cap in added:
            print(f'  {src}  ->  "{cap}"')
    if warnings:
        print("\nHeads up:")
        for w in warnings:
            print(f"  ! {w}")
    if skipped:
        print(f"Skipped (listed in images/{IGNORE}): {', '.join(skipped)}")
    if not resized and not added:
        print("Nothing to do — every photo is already sized and in the gallery.")
    elif not args.dry_run:
        print("\nNow commit:  git add -A && git commit -m 'Add photos' && git push")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
