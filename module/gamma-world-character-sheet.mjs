const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class GammaWorldCharacterSheet extends HandlebarsApplicationMixin(
  ActorSheetV2,
) {
  static DEFAULT_OPTIONS = {
    classes: ["gamma-world-7e", "sheet", "actor"],
    position: { width: 400, height: 400 },
    window: { resizable: true },
    form: { submitOnChange: true },
  };

  static PARTS = {
    body: {
      template: "systems/gamma-world-7e/templates/actor/character-sheet.hbs",
      scrollable: [""],
    },
  };

  #dragDrop = [
    new foundry.applications.ux.DragDrop.implementation({
      dropSelector: ".origin-slot",
      permissions: { drop: () => this.isEditable },
      callbacks: { drop: this._onDropOrigin.bind(this) },
    }),
  ];

  _onRender(context, options) {
    super._onRender(context, options);
    this.#dragDrop.forEach((dd) => dd.bind(this.element));
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;

    context.primaryOrigin = this.actor.system.primaryOrigin
      ? (await fromUuid(this.actor.system.primaryOrigin))?.name
      : null;

    context.secondaryOrigin = this.actor.system.secondaryOrigin
      ? (await fromUuid(this.actor.system.secondaryOrigin))?.name
      : null;

    return context;
  }

  async _onDropOrigin(event) {
    const data =
      foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (data.type !== "Item") return;

    const item = await Item.fromDropData(data);
    if (!item || item.type !== "origin") return;

    const slot = event.target.closest(".origin-slot")?.dataset.originSlot;
    if (!slot) return;

    await this.actor.update({ [`system.${slot}`]: item.uuid });
  }
}
