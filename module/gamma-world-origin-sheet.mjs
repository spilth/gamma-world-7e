import { Abilities } from "./abilities.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class GammaWorldOriginSheet extends HandlebarsApplicationMixin(
  ItemSheetV2,
) {
  static DEFAULT_OPTIONS = {
    classes: ["gamma-world-7e", "sheet", "item", "origin"],
    position: { width: 400, height: 400 },
    window: { resizable: true },
  };

  static PARTS = {
    body: {
      template: "systems/gamma-world-7e/templates/item/origin-sheet.hbs",
      scrollable: [""],
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.ability = Abilities[this.item.system.ability];
    return context;
  }
}
