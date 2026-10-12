import { GammaWorldCharacterSheet } from "./gamma-world-character-sheet.mjs";
import { GammaWorldOriginSheet } from "./gamma-world-origin-sheet.mjs";
import { GammaWorldPowerSheet } from "./gamma-world-power-sheet.mjs";
import { OriginData } from "./origin-data.mjs";
import { PowerData } from "./power-data.mjs";
import { CharacterData } from "./character-data.mjs";
import { Origins } from "./origins.mjs";
import { Powers } from "./powers.mjs";
import { PowerTypes } from "./power-types.mjs";

Hooks.once("init", () => {
  console.log("Gamma World 7E | Initializing system...");

  Object.assign(CONFIG.Actor.dataModels, {
    character: CharacterData,
  });

  Object.assign(CONFIG.Item.dataModels, {
    origin: OriginData,
    power: PowerData,
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

  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Item,
    "gamma-world-7e",
    GammaWorldPowerSheet,
    { types: ["power"], makeDefault: true },
  );
});

// Color power entries by type in compendium lists, like the book's power cards.
Hooks.on("renderCompendium", async (app, html) => {
  if (app.collection.documentName !== "Item") return;
  const index = await app.collection.getIndex({
    fields: ["system.powerType"],
  });
  for (const element of html.querySelectorAll("[data-entry-id]")) {
    const powerType = index.get(element.dataset.entryId)?.system?.powerType;
    if (powerType) element.classList.add(`power-${powerType}`);
  }
});

Hooks.once("ready", async () => {
  if (!game.user.isGM) return;

  await syncPack("gamma-world-7e.origins", "origin", Origins);
  await syncPack(
    "gamma-world-7e.powers",
    "power",
    Powers.map((power) => ({
      ...power,
      folder: [power.system.origin],
      // Novice, Utility, then Expert within each Origin's folder.
      sort: Object.keys(PowerTypes).indexOf(power.system.powerType) + 1,
    })),
  );
});

// Keep a compendium in sync with its data file, matching by name so existing
// entries keep their IDs and Characters' links to them survive. An entry's
// optional `folder` is a path of folder names, created as needed and sorted
// manually, and its optional `sort` orders it within that folder.
async function syncPack(packId, type, entries) {
  const pack = game.packs.get(packId);
  const existing = await pack.getDocuments();
  const byName = new Map(existing.map((doc) => [doc.name, doc]));

  const changed = entries.filter((entry) => {
    const doc = byName.get(entry.name);
    if (!doc) return true;
    const folder = findFolder(pack, entry.folder);
    if (folder === undefined || (folder && folder.sorting !== "m")) return true;
    if ((doc._source.folder ?? null) !== (folder?.id ?? null)) return true;
    if (entry.sort !== undefined && doc.sort !== entry.sort) return true;
    return Object.entries(entry.system).some(
      ([key, value]) =>
        JSON.stringify(doc.system[key]) !== JSON.stringify(value),
    );
  });

  const names = new Set(entries.map((entry) => entry.name));
  const toDelete = existing
    .filter((doc) => !names.has(doc.name))
    .map((doc) => doc.id);

  if (!changed.length && !toDelete.length) return;

  const { locked } = pack;
  await pack.configure({ locked: false });

  const toCreate = [];
  const toUpdate = [];
  for (const entry of changed) {
    const data = {
      name: entry.name,
      type,
      system: entry.system,
      folder: (await createFolder(pack, entry.folder))?.id ?? null,
    };
    if (entry.sort !== undefined) data.sort = entry.sort;
    const doc = byName.get(entry.name);
    if (doc) toUpdate.push({ _id: doc.id, ...data });
    else toCreate.push(data);
  }

  const options = { pack: pack.collection };
  await Item.createDocuments(toCreate, options);
  await Item.updateDocuments(toUpdate, options);
  await Item.deleteDocuments(toDelete, options);
  console.log(
    `Gamma World 7E | Synced ${pack.metadata.label}: ` +
      `${toCreate.length} created, ${toUpdate.length} updated, ` +
      `${toDelete.length} deleted`,
  );

  await pack.configure({ locked });
}

// Returns the folder at `path`, null for the top level, or undefined if any
// folder along the path doesn't exist yet.
function findFolder(pack, path = []) {
  let parent = null;
  for (const name of path) {
    parent = childFolder(pack, parent, name);
    if (!parent) return undefined;
  }
  return parent;
}

async function createFolder(pack, path = []) {
  let parent = null;
  for (const name of path) {
    const folder = childFolder(pack, parent, name);
    if (folder && folder.sorting !== "m") await folder.update({ sorting: "m" });
    parent =
      folder ??
      (await Folder.create(
        { name, type: "Item", folder: parent?.id ?? null, sorting: "m" },
        { pack: pack.collection },
      ));
  }
  return parent;
}

function childFolder(pack, parent, name) {
  return pack.folders.find(
    (folder) =>
      folder.name === name &&
      (folder._source.folder ?? null) === (parent?.id ?? null),
  );
}
