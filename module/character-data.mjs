import { Skills } from "./skills.mjs";

export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { NumberField, SchemaField, StringField } = foundry.data.fields;
    const abilityField = () =>
      new NumberField({ required: true, integer: true, min: 0, initial: 10 });
    return {
      primaryOrigin: new StringField({ required: false, blank: true }),
      secondaryOrigin: new StringField({ required: false, blank: true }),
      abilities: new SchemaField({
        str: abilityField(),
        con: abilityField(),
        dex: abilityField(),
        int: abilityField(),
        wis: abilityField(),
        cha: abilityField(),
      }),
      skillBonuses: new SchemaField(
        Object.fromEntries(
          Object.keys(Skills).map((key) => [
            key,
            new NumberField({ required: true, integer: true, initial: 0 }),
          ]),
        ),
      ),
    };
  }

  // Page 59: each ability modifier is half the score minus 10, rounded down.
  prepareDerivedData() {
    this.abilityModifiers = Object.fromEntries(
      Object.entries(this.abilities).map(([key, score]) => [
        key,
        Math.floor((score - 10) / 2),
      ]),
    );

    // Page 60: a skill uses its key ability's modifier plus any bonuses.
    this.skills = Object.fromEntries(
      Object.entries(Skills).map(([key, { ability }]) => [
        key,
        this.abilityModifiers[ability] + this.skillBonuses[key],
      ]),
    );
  }
}
