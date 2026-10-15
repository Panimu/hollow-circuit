# Hollow Circuit — Character Lab

Open `index.html` in a browser, or run `python -m http.server 8080` and visit http://localhost:8080. No build or dependencies are required. GitHub Pages publishes `main`; asset URLs are versioned with each release.

## Illustrated studio (0.7)

Open [studio.html](https://panimu.github.io/hollow-circuit/studio.html) for the approved soft anime artwork as an interactive front-standing paper doll. Nova and Vesper are 20-year-old adult avatars. Each supports four skin tones, two hairstyles, five hair colours and three complete outfits: streetwear, athletic one-piece swimsuit and full-coverage latex catsuit. There are no glasses or jewellery. Complete outfits are cosmetic; they do not use the older lab's per-garment bonuses.

The studio fits 18 items across wrists, ankles, arms, lower legs, waist and chest, using existing restraint catalog and method ratings. Fitting replaces equipment in the same location, costs no AP and does not run application/escape checks. Random restraints adds three compatible items. Clear, random look, reset, face/torso zoom and independent editing are available. Save both characters persists to a separate versioned local-storage key, leaving the simulation lab save intact.

`illustrated-avatar.js` composes original transparent PNG assets using SVG clipping, colour masks and positioning. Generated source images are preserved in `assets/illustrated`; prompt files record provenance. This is a front-standing fitting preview. The original pose/simulation lab remains available with its larger catalog and procedural renderer. Illustrated rear, kneeling and arms-behind poses are not supported yet. Individual pieces within an outfit cannot yet be mixed.

Run `node --test restraints.test.js illustrated-avatar.test.js`. Studio checks cover appearance/save validation, equipment replacement, all 120 appearance combinations, independent SVG IDs, and compatible random fittings.

## Avatars and poses

Nova and Vesper are adult avatars with independent appearance, equipment, clothing, and pose settings. `avatar.js` draws an articulated SVG figure with shared joint anchors for limbs, clothing, and restraint layers. The renderer supports front/rear views, standing, legs together, arms behind, kneeling, and kneeling with arms behind. In Automatic mode, boot assemblies bring legs together, arm sleeves place arms behind, and training frames set a supported kneeling pose. Kneeling takes precedence over leg positioning; arm and leg constraints combine. Manual pose controls are visual previews and do not change stats. Rear views expose equipment hidden behind the torso and rear clothing panels.

## Clothing

`wardrobe.js` provides 42 normal garments across 21 clothing zones: the 18 restraint locations plus overall pelvic, front, and rear coverage. Pelvic coverage is clothing-only; no genital restraint mechanics exist. The opaque simulator suit always remains underneath. Each zone offers a reinforced garment and a lightweight trial garment. Wearing a garment replaces clothing in that clothing zone without removing restraints.

Reinforced garments reduce application chance by 6 percentage points on matching coverage and impose a 3% performance penalty. Trial garments increase application chance by 5 points, improve the relevant performance stat by 2%, and add 3% to potential clear rewards. Clothing protection stacks once per garment and caps at ±25 points; reward bonuses cap at +30%. Pelvic coverage affects nearby waist/upper-leg application checks. The wardrobe explicitly lists affected restraint slots. Rewards preview a 100-credit clear; credits are not awarded until dungeon clears are implemented.

## Restraints

`restraints.js` contains 69 items: 23 each of rope, leather, and steel, across toes, feet, ankles, lower leg, knees, upper leg, waist, chest, shoulders, arms, elbows, wrists, hands, fingers, neck, face, mouth, and head. Feet are distinct from toes and ankles. Paired slots cover both sides of the body.

Multi-slot items include boots, arm sleeves, torso rigs, sensor hoods/helmets, and kneeling training frames. The catalog's `slots` array defines all occupied locations; `slot` is only the primary display/sort location. Filters match any covered location. Every covered slot must be free. Conflicts reject application before rolling or spending AP. An equipped item is stored once, applies its modifiers once, and releases all occupied slots on successful escape or lab release. Save validation keeps the first valid item in input order and rejects later overlapping items in full.

Knots, tightening, buckles, padlocks, latches, and double locks modify application difficulty, escape difficulty, action cost, and debuffs. All ratings are fictional simulator mechanics. Head equipment uses simulated focus and communication effects.

## Trial rules

The other avatar attempts application to the selected target. Each roll is 1–100 and succeeds at or below the displayed chance. Both success and failure spend the stated AP. Escape costs 2 AP. The lab shares a six-point budget; Refill AP replenishes it without removing equipment. Release is a free lab override.

Application chance: `clamp(round(100 - difficulty + conditionBonus - actorDexterityPenalty * 0.4 - actorFocusPenalty * 0.2 - targetClothingProtection), 5, 95)`. Alert adds 0; distracted adds 15; staggered adds 30.

Escape chance: `clamp(round(100 - escapeDifficulty - targetDexterityPenalty * 0.25 - targetFocusPenalty * 0.15), 5, 90)`.

Restraint penalties and clothing bonuses combine, capped at an 85% penalty or 20% bonus per attribute. Movement affects suit speed; dexterity and focus affect checks. Evasion, recovery, and communication expose performance values for future combat events. Dungeon exploration, combat turns, elimination, voice-command abilities, and credit awards are not implemented yet.

## Saving and verification

Save roster persists both avatars, clothing, restraints, pose preference and view in browser local storage (schema version 5). Previous saves remain readable; old `*-legs` IDs migrate to `*-lower-leg`. Trial AP, condition, filters, and log reset on reload. Unknown saved values are discarded.

Run `node --test restraints.test.js`. Tests cover all item/method combinations, overlap conflicts, atomic application, costs, escape boundaries, clothing modifiers and caps, save migration, material/slot filters, automatic poses, finite SVG coordinates, front/rear garment layers, and independent avatar state. Browser QA covers desktop/mobile layouts and deployed asset loading.

The original lab uses procedural SVG; the illustrated studio uses generated PNG layers composited with SVG. Google Fonts are optional; system fonts work offline.


### Quick visual testing

Use **Random restraints** beneath either avatar to replace that character's restraint loadout with 3–5 compatible items and securing methods. The preview switches to automatic posing, with standing, legs together, arms behind, kneeling, and combined poses available across rolls. Clothing, appearance, front/rear view, and trial AP are preserved. **Clear** releases that avatar's restraints. These are free lab previews; use the restraint lab for application rolls. Save roster to retain a random loadout.

Build 0.6 adds dimensional material shading, finer facial features and hair strands, tailored clothing seams, and detailed boots and armor.
