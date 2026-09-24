class CharacterData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {};
    }
}

const {HandlebarsApplicationMixin} = foundry.applications.api;
const {ActorSheetV2} = foundry.applications.sheets;

class GammaWorldCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ["gamma-world-7e", "sheet", "actor"],
        position: {width: 400, height: 400},
        form: {submitOnChange: true}
    };

    static PARTS = {
        body: {
            template: "systems/gamma-world-7e/templates/actor/character-sheet.hbs"
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.actor = this.actor;
        return context;
    }
}

Hooks.once("init", () => {
    console.log("Gamma World 7E | Initializing system...");

    Object.assign(CONFIG.Actor.dataModels, {
        character: CharacterData
    })

    foundry.applications.apps.DocumentSheetConfig.registerSheet(
        foundry.documents.Actor,
        "gamma-world-7e",
        GammaWorldCharacterSheet,
        {
            types: ["character"],
            makeDefault: true
        }
    );
});
