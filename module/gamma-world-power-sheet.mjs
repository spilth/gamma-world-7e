import { PowerTypes } from "./power-types.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class GammaWorldPowerSheet extends HandlebarsApplicationMixin(
  ItemSheetV2,
) {
  static DEFAULT_OPTIONS = {
    classes: ["gamma-world-7e", "sheet", "item", "power"],
    position: { width: 400, height: 300 },
    window: { resizable: true },
  };

  static PARTS = {
    body: {
      template: "systems/gamma-world-7e/templates/item/power-sheet.hbs",
      scrollable: [""],
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.powerType = PowerTypes[this.item.system.powerType];
    return context;
  }
}
