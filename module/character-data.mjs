import { Skills } from "./skills.mjs";

export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { NumberField, SchemaField, StringField } = foundry.data.fields;
    const abilityField = () =>
      new NumberField({ required: true, integer: true, min: 0, initial: 10 });
    return {
      level: new NumberField({
        required: true,
        integer: true,
        min: 1,
        initial: 1,
      }),
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
      originSkillBonuses: new SchemaField(
        Object.fromEntries(
          Object.keys(Skills).map((key) => [
            key,
            new NumberField({ required: true, integer: true, initial: 0 }),
          ]),
        ),
      ),
      level1Skill: new StringField({
        required: false,
        blank: true,
        choices: Object.keys(Skills),
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

    // Page 60: a skill adds your level, its key ability's modifier, and any
    // bonuses.
    this.skills = Object.fromEntries(
      Object.entries(Skills).map(([key, { ability }]) => {
        const abilityBonus = this.abilityModifiers[ability];
        const originBonus = this.originSkillBonuses[key];
        const level1Bonus = this.level1Skill === key ? 4 : 0;
        const levelBonus = this.level;
        return [
          key,
          {
            ability,
            abilityBonus,
            originBonus,
            level1Bonus,
            levelBonus,
            total: abilityBonus + originBonus + level1Bonus + levelBonus,
          },
        ];
      }),
    );
  }
}
