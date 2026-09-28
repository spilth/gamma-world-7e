import { Abilities } from "./abilities.mjs";

export class OriginData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { StringField } = foundry.data.fields;
    return {
      ability: new StringField({
        required: false,
        blank: true,
        choices: Abilities,
      }),
      summary: new StringField({ required: false, blank: true }),
      description: new StringField({ required: false, blank: true }),
      appearance: new StringField({ required: false, blank: true }),
    };
  }
}
