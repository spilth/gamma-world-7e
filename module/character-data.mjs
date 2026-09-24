export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { StringField } = foundry.data.fields;
    return {
      primaryOrigin: new StringField({ required: false, blank: true }),
      secondaryOrigin: new StringField({ required: false, blank: true }),
    };
  }
}
