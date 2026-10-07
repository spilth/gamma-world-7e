import { GammaWorldCharacterSheet } from "./gamma-world-character-sheet.mjs";
import { GammaWorldOriginSheet } from "./gamma-world-origin-sheet.mjs";
import { OriginData } from "./origin-data.mjs";
import { CharacterData } from "./character-data.mjs";
import { Origins } from "./origins.mjs";

Hooks.once("init", () => {
  console.log("Gamma World 7E | Initializing system...");

  Object.assign(CONFIG.Actor.dataModels, {
    character: CharacterData,
  });

  Object.assign(CONFIG.Item.dataModels, {
    origin: OriginData,
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Actor,
    "gamma-world-7e",
    GammaWorldCharacterSheet,
    {
      types: ["character"],
      makeDefault: true,
    },
  );

  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Item,
    "gamma-world-7e",
    GammaWorldOriginSheet,
    { types: ["origin"], makeDefault: true },
  );
});

Hooks.once("ready", async () => {
  if (!game.user.isGM) return;

  // Keep the Origins compendium in sync with origins.mjs, matching by name so
  // existing entries keep their IDs and Characters' links to them survive.
  const pack = game.packs.get("gamma-world-7e.origins");
  const existing = await pack.getDocuments();
  const byName = new Map(existing.map((doc) => [doc.name, doc]));

  const toCreate = [];
  const toUpdate = [];
  for (const origin of Origins) {
    const doc = byName.get(origin.name);
    if (!doc) {
      toCreate.push({
        name: origin.name,
        type: "origin",
        system: origin.system,
      });
      continue;
    }
    const changed = Object.entries(origin.system).some(
      ([key, value]) =>
        JSON.stringify(doc.system[key]) !== JSON.stringify(value),
    );
    if (changed) toUpdate.push({ _id: doc.id, system: origin.system });
  }

  const names = new Set(Origins.map((origin) => origin.name));
  const toDelete = existing
    .filter((doc) => !names.has(doc.name))
    .map((doc) => doc.id);

  if (!toCreate.length && !toUpdate.length && !toDelete.length) return;

  const { locked } = pack;
  await pack.configure({ locked: false });

  const options = { pack: pack.collection };
  await Item.createDocuments(toCreate, options);
  await Item.updateDocuments(toUpdate, options);
  await Item.deleteDocuments(toDelete, options);
  console.log(
    `Gamma World 7E | Synced Origins: ${toCreate.length} created, ` +
      `${toUpdate.length} updated, ${toDelete.length} deleted`,
  );

  await pack.configure({ locked });
});
