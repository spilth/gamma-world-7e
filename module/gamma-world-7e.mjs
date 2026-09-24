class CharacterData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {};
    }
}

Hooks.once("init", () => {
    console.log("Gamma World 7E | Initializing system...");

    Object.assign(CONFIG.Actor.dataModels, {
        character: CharacterData
    })
});
