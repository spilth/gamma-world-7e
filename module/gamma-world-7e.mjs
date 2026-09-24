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

  const pack = game.packs.get("gamma-world-7e.origins");
  const index = await pack.getIndex();

  if (index.size > 0) return;

  await pack.configure({ locked: false });

  const items = Origins.map((origin) => ({
    name: origin.name,
    type: "origin",
    system: origin.system,
  }));

  await Item.createDocuments(items, { pack: "gamma-world-7e.origins" });
  console.log(`Gamma World 7E | Seeded ${items.length} Origins`);

  await pack.configure({ locked: true });
});
