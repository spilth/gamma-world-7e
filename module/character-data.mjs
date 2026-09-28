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
  }
}
