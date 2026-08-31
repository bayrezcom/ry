# Brand assets

`icon.svg`, `mark.svg` and `mark-mono.svg` are the source artwork for the app
icon, the Android adaptive-icon foreground, the themed (monochrome) icon and
the splash mark. They are original geometry — two overlapping speech bubbles,
one carrying an RTL line of text and one an LTR line — drawn in the BR purple/
blue palette. No third-party or trademarked artwork is used.

## Regenerating the PNGs

The PNGs in `assets/` are generated from these SVGs:

```bash
npm install --no-save sharp
node assets/brand/render-icons.mjs .
```

Outputs:

| File | Size | Purpose |
| --- | --- | --- |
| `assets/icon.png` | 1024×1024 | iOS/Android app icon |
| `assets/favicon.png` | 48×48 | Web favicon |
| `assets/android-icon-foreground.png` | 1024×1024 | Adaptive icon foreground (mark inside the 66% safe zone) |
| `assets/android-icon-background.png` | 1024×1024 | Adaptive icon background (solid `#4A2461`) |
| `assets/android-icon-monochrome.png` | 1024×1024 | Android themed icon |
| `assets/splash-icon.png` | 512×512 | Splash mark |

## Replacing with final artwork

This is a production-usable placeholder, not a finished identity. To swap in
final artwork, either replace the SVGs here and re-run the command above, or
drop finished PNGs at the paths in the table and leave the SVGs untouched. No
code references the artwork directly — only `app.json` does.
