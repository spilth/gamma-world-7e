import { Abilities } from "./abilities.mjs";
import { Origins } from "./origins.mjs";
import { Skills } from "./skills.mjs";

const { DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class GammaWorldCharacterSheet extends HandlebarsApplicationMixin(
  ActorSheetV2,
) {
  static DEFAULT_OPTIONS = {
    classes: ["gamma-world-7e", "sheet", "actor"],
    position: { width: 600, height: 860 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rollOrigins: GammaWorldCharacterSheet.#onRollOrigins,
      openOrigin: GammaWorldCharacterSheet.#onOpenOrigin,
    },
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
      ? await fromUuid(this.actor.system.primaryOrigin)
      : null;

    context.secondaryOrigin = this.actor.system.secondaryOrigin
      ? await fromUuid(this.actor.system.secondaryOrigin)
      : null;

    context.skills = Object.entries(this.actor.system.skills).map(
      ([key, skill]) => ({
        ...skill,
        label: Skills[key].label,
        ability: Abilities[skill.ability].slice(0, 3),
      }),
    );

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

    const { primaryOrigin, secondaryOrigin } = {
      ...this.actor.system,
      [slot]: item.uuid,
    };
    await this.#setOrigins(primaryOrigin, secondaryOrigin);
  }

  // Page 59: 18 in the primary origin's ability and 16 in the secondary's,
  // or 20 if both origins share the same ability. Roll 3d6 for the rest, in
  // order. Page 60: +4 to each origin's skills, plus +4 to a skill rolled on
  // a d10. Until both origins are set, abilities and skills reset to defaults.
  async #setOrigins(primaryOrigin, secondaryOrigin) {
    const { fields } = this.actor.system.schema;
    const abilities = fields.abilities.getInitialValue();
    const originSkillBonuses = fields.originSkillBonuses.getInitialValue();
    let level1Skill = "";

    const primaryData = (await fromUuid(primaryOrigin))?.system;
    const secondaryData = (await fromUuid(secondaryOrigin))?.system;
    const primary = primaryData?.ability;
    const secondary = secondaryData?.ability;
    if (primary && secondary) {
      for (const key of Object.keys(abilities)) {
        if (key === primary) {
          abilities[key] = primary === secondary ? 20 : 18;
        } else if (key === secondary) {
          abilities[key] = 16;
        } else {
          abilities[key] = (await new Roll("3d6").evaluate()).total;
        }
      }

      for (const key of [...primaryData.skills, ...secondaryData.skills]) {
        originSkillBonuses[key] += 4;
      }
      const skillRoll = (await new Roll("1d10").evaluate()).total;
      level1Skill = Object.keys(Skills)[skillRoll - 1];
    }

    await this.actor.update({
      "system.primaryOrigin": primaryOrigin,
      "system.secondaryOrigin": secondaryOrigin,
      "system.abilities": abilities,
      "system.originSkillBonuses": originSkillBonuses,
      "system.level1Skill": level1Skill,
    });
  }

  static async #onRollOrigins() {
    const { primaryOrigin, secondaryOrigin } = this.actor.system;
    if (primaryOrigin || secondaryOrigin) {
      const confirmed = await DialogV2.confirm({
        window: { title: "Roll Origins" },
        content: "<p>This will replace your current Origins. Are you sure?</p>",
      });
      if (!confirmed) return;
    }

    // The Character Origin Table maps 1-20 to the first 20 Origins in order.
    // If the second roll matches the first, the secondary is Engineered Human.
    const primaryRoll = (await new Roll("1d20").evaluate()).total;
    const secondaryRoll = (await new Roll("1d20").evaluate()).total;
    const primaryName = Origins[primaryRoll - 1].name;
    const secondaryName =
      secondaryRoll === primaryRoll
        ? "Human, Engineered"
        : Origins[secondaryRoll - 1].name;

    const index = await game.packs.get("gamma-world-7e.origins").getIndex();
    const uuidFor = (name) => index.find((entry) => entry.name === name)?.uuid;

    await this.#setOrigins(uuidFor(primaryName), uuidFor(secondaryName));
  }

  static async #onOpenOrigin(event, target) {
    const slot = target.closest(".origin-slot")?.dataset.originSlot;
    const uuid = slot && this.actor.system[slot];
    if (!uuid) return;

    const origin = await fromUuid(uuid);
    origin?.sheet.render(true);
  }
}
