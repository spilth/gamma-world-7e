import { PowerTypes } from "./power-types.mjs";

export class PowerData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { StringField } = foundry.data.fields;
    return {
      origin: new StringField({ required: false, blank: true }),
      powerType: new StringField({
        required: false,
        blank: true,
        choices: PowerTypes,
      }),
      description: new StringField({ required: false, blank: true }),
    };
  }
}
