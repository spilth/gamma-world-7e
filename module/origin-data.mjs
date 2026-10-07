import { Abilities } from "./abilities.mjs";
import { Skills } from "./skills.mjs";

export class OriginData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { ArrayField, StringField } = foundry.data.fields;
    return {
      ability: new StringField({
        required: false,
        blank: true,
        choices: Abilities,
      }),
      skills: new ArrayField(new StringField({ choices: Object.keys(Skills) })),
      summary: new StringField({ required: false, blank: true }),
      description: new StringField({ required: false, blank: true }),
      appearance: new StringField({ required: false, blank: true }),
    };
  }
}
