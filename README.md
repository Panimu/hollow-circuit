# Hollow Circuit — Character Lab

Open `index.html` in a browser. No build or dependencies are required. Optional web server: `python -m http.server 8080` from this folder, then visit http://localhost:8080.

Select Nova or Vesper to independently customize adult avatars. Appearance controls skin, hair and accent color. Equipment controls suit class and armor. Simulation previews nonlethal holographic restraints. Save roster persists both characters in browser local storage; randomization affects only the selected character's appearance.

The SVG renderer in `app.js` uses named layers: platform, hair-back, body, face, hair-front, outfit, equipment, restraints. All outfits use the same 300 × 450 coordinate system. Add equipment artwork inside its matching layer; add choices to `allowed` and character defaults. The character state is independent of the renderer and can later be driven by combat. Guard and speed are illustrative derived stats; there is no combat or dungeon simulation yet.

Artwork is procedural SVG. Google Fonts are optional; system fonts work offline.
