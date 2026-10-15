# Hollow Circuit — Character Lab

Open `index.html` in a browser, or run `python -m http.server 8080` and visit http://localhost:8080. No build or dependencies are required. GitHub Pages publishes `main`; asset URLs are versioned with each release.

## Illustrated studio (0.12)

Nine headgear designs bring the studio to **65 equipment designs**. The **Headgear** shortcuts beneath each avatar fit a ward helmet, fabric mask or resonance faceplate; **Head close-up** zooms into the face and toggles back to the full figure. All variants are available through the Head and Mouth slot filters.

`head-equipment.js` adds Scout, Sentinel and Prism enclosed helmets; Scout, Ranger and Runewoven fabric masks; and Resonance, Ceramic hush and Prism counterspell faceplates. Each has a distinct front design, material shading, effects and application/removal ratings. Fit assembly uses base ratings; Synchronize module adds 10 application difficulty, 16 removal difficulty, 1 nominal AP and 4 focus penalty. The studio remains a free fitting/rules preview.

Helmets and fabric masks occupy head, face, mouth and neck together. They hide the hair layer and show the original eyes through aligned openings; the selected hairstyle and color remain saved and reappear on removal. Replacing any covered slot removes the entire assembly. Faceplates cover only the mouth and preserve hair. Scout helmets and Scout/Ranger fabric masks allow spoken spells; Sentinel/Prism helmets, Runewoven masks and all three faceplates block them. Nonverbal spells remain available. These states persist through save/reload.

Run `node --test restraints.test.js illustrated-avatar.test.js spellcasting.test.js dungeon-equipment.test.js head-equipment.test.js`. `node headgear.browser.test.cjs` checks all nine designs, slot conflicts, casting, hair restoration, saving, head close-up and mobile layout. The browser checks accept `STUDIO_TEST_URL` for live deployment verification.

All 18 equipment slots have at least three dedicated options (not counting whole-body coverage toward this minimum). **Browse equipment slot** filters by every location an item covers. Quick-fit shortcuts reset the filter so their selected item remains visible. Selecting a new item shows its description, coverage, method ratings and penalties before fitting.

`dungeon-equipment.js` adds 33 armor/simulator modules: three dedicated silhouettes each for toes, feet, knees, shoulders, arms, elbows, hands, fingers, neck, face and head. Composite pieces use curved pads/plates, alloy pieces use articulated plates, and prism pieces use angular projections/sensors. Each of the 33 has separately authored SVG geometry, dimensional shading, slot-specific placement and an inspectable detail view. Pairs render on both sides; feet/toes and upper arms/elbows remain independently equipable. The front-docked modules do not use wrapping straps. Other slot designs and silence equipment remain available.

Docking uses the base rating; calibration adds 10 application difficulty, 15 removal difficulty, 1 nominal AP and 3 focus penalty. Every design has its own slot-dependent effects and variant ratings. Ratings are preview values; fitting is free. Saved setups retain the selected module and method. Multi-slot replacement remains atomic, and ordinary face/head/neck modules do not silence spoken spells. Pelvic clothing zones in the older lab are not equipment slots in this studio.

Run `node --test restraints.test.js illustrated-avatar.test.js spellcasting.test.js dungeon-equipment.test.js`. With Playwright/Edge available, `node equipment.browser.test.cjs` checks all slot filters, every new design, all three outfits, save/reload, overlapping voice-visor replacement, independent avatars and mobile layout. It supports the same `STUDIO_TEST_URL` override as `studio.browser.test.cjs`.

Three arcane silence items are available in the equipment menu and each character's **Spellcasting check** panel: Whisper seal (mouth), Echo filter (mouth), and Null voice visor (mouth + face). These are floating magical projections rendered as SVG effects. Their distinct application/dispel ratings and focus penalties are design values; attuning or reinforcing a rune changes these ratings.

`spellcasting.js` checks whether a spell needs a spoken incantation. An active silence item blocks Ember word and Ward chant completely, independently of the Communication percentage; Focus pulse is nonverbal and remains available. Removing silence restores casting eligibility immediately. Equipped runes and activation methods survive saving/reloading. The **Check selected spell** button exercises this rule without spending AP, dealing damage or advancing combat. These new items are studio-only; the older simulation lab is unchanged. Run `node --test restraints.test.js illustrated-avatar.test.js spellcasting.test.js` to include the casting checks.

Open [studio.html](https://panimu.github.io/hollow-circuit/studio.html) for the approved soft anime artwork as an interactive paper doll. Nova and Vesper are 20-year-old adult avatars. Each supports four skin tones, two hairstyles, five hair colours and three complete outfits: streetwear, athletic one-piece swimsuit and full-coverage latex catsuit. There are no glasses or jewellery. Complete outfits are cosmetic; they do not use the older lab's per-garment bonuses.

The original 20 physical equipment designs are: rope, leather and steel variants of anatomical wrist cuffs, ankle restraints, paired thigh straps, tapered calf sleeves, waist belts and torso harnesses, plus a leather monoglove armbinder and a cinched full-length leg sheath. Each region has its own generated silhouette and material treatment; the old shared band sprites are no longer used. Quick-fit buttons beneath each avatar demonstrate the three major designs.

The monoglove occupies shoulders, chest, arms, elbows, wrists, hands and fingers, and switches all three outfits to authored arms-behind artwork. Its front suspension harness is visible on the avatar. A labelled rear **item** inset opens a larger view of the single closed sleeve; this is an equipment illustration, not a rear character view. The leg sheath covers upper thighs, knees, calves, ankles, feet and toes. Its joined casing and shared straps hold both legs together, replacing the underlying leg/foot artwork while preserving exposed hands. It combines with the arms-behind pose; clearing restores the relaxed stance.

Equipment uses two depth passes. Complete rear surfaces draw before the opaque avatar/clothing, which naturally hides return loops and back rims. Per-family front-surface masks draw the visible straps, faces and buckles above the clothing, with restrained contact shadows. Front order is deterministic, so a wrist chain stays in front of thigh straps regardless of equip order. The source PNGs are not edited by the compositor.

`fitted-equipment.js` owns studio coverage, conflicts and atlas placement, reusing the existing engine's material methods and ratings. The armbinder and sheaths use the legacy arm-sleeve/boot-wrap IDs and ratings with expanded studio coverage. Fitting removes every overlapping item as a whole, costs no AP and does not run application/escape checks. Random restraints adds three compatible pieces and includes a major design. Old upper-arm bands migrate to the monoglove with a compatible securing method. The procedural simulation lab is unchanged.

Clear restores the relaxed pose; random look, reset, face/torso zoom and independent editing are available. Save both characters persists to a separate versioned local-storage key, leaving the simulation lab save intact.

`illustrated-avatar.js` composes original transparent PNG assets using SVG clipping, colour masks and positioning. Generated source images are preserved in `assets/illustrated`; `fitted-prompts-v2.json` records the built-in image-generation prompts for the atlases, garments and arm poses. `cinched-sheath-prompt-v3.json` records the joined leg-sheath edit. Atlas cropping happens at render time; source PNGs are unmodified. The illustrated character supports front standing, arms behind, legs together in the sheath, and their combination. Illustrated rear and kneeling poses are not supported yet. Individual pieces within an outfit cannot yet be mixed.

Run `node --test restraints.test.js illustrated-avatar.test.js spellcasting.test.js`. Studio checks cover appearance/save validation, multi-slot replacement, pose restoration, retained hand coverage, all 120 appearance combinations, independent SVG IDs, and compatible random fittings. With Playwright and Edge installed, `node studio.browser.test.cjs` checks controls, saving/reloading, quick fits, outfit changes, overlays, and mobile overflow. Set `STUDIO_TEST_URL` to validate a deployed page. Screenshots go to the ignored `test-results` directory.

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
