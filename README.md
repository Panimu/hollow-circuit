# Hollow Circuit — Character Lab

Open `index.html` in a browser. No build or dependencies are required. Optional web server: `python -m http.server 8080` from this folder, then visit http://localhost:8080.

Select Nova or Vesper to independently customize adult avatars. Appearance controls skin, hair and accent color. Equipment controls suit class and armor. Simulation shows restraint penalties. Save roster persists both characters and their equipped restraints in browser local storage; randomization affects only the selected character's appearance. Older saved wrist/ankle/stasis previews migrate to the new equipment system.

The restraint lab includes 54 items: 18 each of rope, leather, and steel. Slots cover toes, feet, ankles, lower leg, knees, upper leg, waist, chest, shoulders, arms, elbows, wrists, hands, fingers, neck, face, mouth, and head. Paired slots cover both sides; each slot accepts one item. Body-region and slot filters narrow the catalog; empty loadout slots have a Browse equipment shortcut. Each has application and escape difficulty, AP cost, and multiple penalties. Knot, tightening, buckle, padlock, latch, and double lock modify those ratings; only compatible methods appear. All ratings are fictional simulator mechanics.

Select a target; the other avatar acts as the applying character. Each attempt rolls 1–100 against the displayed chance. Both success and failure consume the listed AP. Escapes cost 2 AP. Refill AP restores the shared six-point trial budget without changing loadouts. Release controls are free lab overrides. Trial conditions, AP and the six-event log reset on reload.

Application chance: `clamp(round(100 - difficulty + conditionBonus - actorDexterityPenalty * 0.4 - actorFocusPenalty * 0.2), 5, 95)`. Alert has no bonus; distracted adds 15; staggered adds 30. Escape chance: `clamp(round(100 - escapeDifficulty - targetDexterityPenalty * 0.25 - targetFocusPenalty * 0.15), 5, 90)`. Penalties add across slots and cap at 85% per attribute. Movement modifies suit speed; dexterity and focus modify checks. Evasion, energy recovery, and communication expose derived performance values for future combat and voice-command abilities; they do not yet drive dodge or regeneration events. Combat turns, elimination, and dungeon exploration are not implemented.

`restraints.js` is a standalone rules engine and catalog, usable in browser or Node. `app.js` handles the interface, save migration, and SVG layers: platform, hair-back, body, face, hair-front, outfit, equipment, restraints. All outfits use the same 300 × 450 coordinate system. Restraint overlays use separate material art with lock markers for secured items. Slot metadata defines display labels, body regions, and SVG anchors. Add a slot definition and catalog options to extend the system. Old `*-legs` IDs migrate to `*-lower-leg`; existing appearance and securing methods are preserved. Saves use version 3, while both earlier save formats remain readable.

Run `node --test restraints.test.js` for deterministic checks of every compatible item/method pair, success/failure boundaries, stacking, slot conflicts, AP costs, escape, migration, and UI save/load integration. No dependencies required.

Artwork is procedural SVG. Google Fonts are optional; system fonts work offline.
