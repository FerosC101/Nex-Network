# Brand sources

This folder holds the scripts that generate the shipped brand assets in
`public/`. The **source masters they read are deliberately not in git** — they
total ~212 MB, and GitHub warns above 50 MB per file, so committing them would
bloat every clone permanently.

Ask the Nex team for these and drop them in here to regenerate anything:

| File | Size | Needed by |
| --- | --- | --- |
| `nex_logo_only.blend` | 56 MB | `export_logo_glb.py`, `render_still.py` |
| `Nex.blend` | 75 MB | full rebrand project (reference) |
| `NEX VIDEO REBRAND.mp4` | 81 MB | re-encoding `public/nex-rebrand.mp4` |

Everything the site actually serves is committed under `public/`, so the app
builds and runs without any of the above.

## Regenerating assets

```bash
# The 3D models (see the script headers — they encode the export gotchas)
blender -b brand/nex_logo_only.blend --python brand/export_logo_glb.py -- \
    Curve.009 public/nex-logo.glb /tmp/preview.png

# The transparent fallback stills, rendered from the .glb not the .blend
blender -b --python brand/render_still.py -- \
    public/nex-logo.glb public/nex-mark-3d.png 900 900
blender -b --python brand/render_still.py -- \
    public/nex-wordmark.glb public/nex-wordmark-3d.png 720 900

# The web video: 70MB master -> 3.4MB, +faststart for progressive playback
ffmpeg -i "brand/NEX VIDEO REBRAND.mp4" -vf scale=1280:-2 -c:v libx264 -crf 27 \
    -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart \
    -c:a aac -b:a 96k public/nex-rebrand.mp4
```
