# Hollow Circuit — Character Lab

Open `index.html` in a browser. No build or dependencies are required. Optional web server: `python -m http.server 8080` from this folder, then visit http://localhost:8080.

Select Nova or Vesper to independently customize adult avatars. Appearance controls skin, hair and accent color. Equipment controls suit class and armor. Simulation shows restraint penalties. Save roster persists both characters and their equipped restraints in browser local storage; randomization affects only the selected character's appearance. Older saved wrist/ankle/stasis previews migrate to the new equipment system.

The restraint lab includes 12 items: four each of rope, leather, and steel, with one item per wrists/ankles/arms/legs slot. Each has application and escape difficulty, AP cost, and multiple penalties. Knot, tightening, buckle, padlock, latch, and double lock modify those ratings; only compatible methods appear. All ratings are fictional simulator mechanics.

Select a target; the other avatar acts as the applying character. Each attempt rolls 1–100 against the displayed chance. Both success and failure consume the listed AP. Escapes cost 2 AP. Refill AP restores the shared six-point trial budget without changing loadouts. Release controls are free lab overrides. Trial conditions, AP and the six-event log reset on reload.

Application chance: `clamp(round(100 - difficulty + conditionBonus - actorDexterityPenalty * 0.4), 5, 95)`. Alert has no bonus; distracted adds 15; staggered adds 30. Escape chance: `clamp(round(100 - escapeDifficulty - targetDexterityPenalty * 0.25), 5, 90)`. Penalties add across slots and cap at 85% per attribute. Movement modifies suit speed; dexterity modifies checks. Evasion and energy recovery expose derived performance values for future combat; they do not yet drive dodge or regeneration events. Combat turns, elimination, and dungeon exploration are not implemented.

`restraints.js` is a standalone rules engine and catalog, usable in browser or Node. `app.js` handles the interface, save migration, and SVG layers: platform, hair-back, body, face, hair-front, outfit, equipment, restraints. All outfits use the same 300 × 450 coordinate system. Restraint overlays use separate material art with lock markers for secured items. Add entries to the catalog to extend the system.

Run `node --test restraints.test.js` for deterministic checks of every compatible item/method pair, success/failure boundaries, stacking, slot conflicts, AP costs, escape, migration, and UI save/load integration. No dependencies required.

Artwork is procedural SVG. Google Fonts are optional; system fonts work offline.
