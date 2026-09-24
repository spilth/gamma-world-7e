class CharacterData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const {StringField} = foundry.data.fields;
        return {
            primaryOrigin: new StringField({required: false, blank: true}),
            secondaryOrigin: new StringField({required: false, blank: true})
        };
    }
}

class OriginData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const {StringField} = foundry.data.fields;
        return {
            summary: new StringField({required: false, blank: true}),
            description: new StringField({required: false, blank: true}),
            appearance: new StringField({required: false, blank: true})
        };
    }
}

const {HandlebarsApplicationMixin} = foundry.applications.api;
const {ActorSheetV2} = foundry.applications.sheets;
const {ItemSheetV2} = foundry.applications.sheets;

class GammaWorldCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ["gamma-world-7e", "sheet", "actor"],
        position: {width: 400, height: 400},
        window: {resizable: true},
        form: {submitOnChange: true}
    };

    static PARTS = {
        body: {
            template: "systems/gamma-world-7e/templates/actor/character-sheet.hbs",
            scrollable: [""]
        }
    };

    #dragDrop = [
        new foundry.applications.ux.DragDrop.implementation({
            dropSelector: ".origin-slot",
            permissions: {drop: () => this.isEditable},
            callbacks: {drop: this._onDropOrigin.bind(this)}
        })
    ];

    _onRender(context, options) {
        super._onRender(context, options);
        this.#dragDrop.forEach((dd) => dd.bind(this.element));
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.actor = this.actor;

        context.primaryOrigin = this.actor.system.primaryOrigin
            ? (await fromUuid(this.actor.system.primaryOrigin))?.name
            : null;

        context.secondaryOrigin = this.actor.system.secondaryOrigin
            ? (await fromUuid(this.actor.system.secondaryOrigin))?.name
            : null;

        return context;
    }

    async _onDropOrigin(event) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (data.type !== "Item") return;

        const item = await Item.fromDropData(data);
        if (!item || item.type !== "origin") return;

        const slot = event.target.closest(".origin-slot")?.dataset.originSlot;
        if (!slot) return;

        await this.actor.update({[`system.${slot}`]: item.uuid});
    }
}

class GammaWorldOriginSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ["gamma-world-7e", "sheet", "item", "origin"],
        position: {width: 400, height: 400},
        window: {resizable: true},
    };

    static PARTS = {
        body: {
            template: "systems/gamma-world-7e/templates/item/origin-sheet.hbs",
            scrollable: [""]
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.item = this.item;
        return context;
    }
}

const ORIGINS = [
    {
        name: "Android",
        system: {
            summary: "YOU WERE MADE, NOT BORN.",
            description: "Simulation of a living creature is implicit in your shape, though sometimes you forget to boot up your “pretend to breathe” subroutine. But are you a living being who has machine parts, or a machine who has living parts?",
            appearance: "Your metallic body parts draw attention before people notice one of your eyes is a flickering LED."
        }
    },
    {
        name: "Cockroach",
        system: {
            summary: "YOU’RE A MUTATED, SENTIENT BUG.",
            description: "You’re living proof that your kind can survive nuclear war. You collect stuff that smells good to you but that everyone else calls garbage. Some of that trash gives you valuable experience in salvaging Ancient machinery.",
            appearance: "You’re a huge cockroach! From a distance, your exoskeleton looks like a long coat. You’ve also got antennae, bug eyes, and spindly limbs.",
        }
    },
    {
        name: "Doppleganger",
        system: {
            summary: "Foo",
            description: "Bar",
            appearance: "Baz",
        }
    }
];

Hooks.once("init", () => {
    console.log("Gamma World 7E | Initializing system...");

    Object.assign(CONFIG.Actor.dataModels, {
        character: CharacterData
    })

    Object.assign(CONFIG.Item.dataModels, {
        origin: OriginData
    });

    foundry.applications.apps.DocumentSheetConfig.registerSheet(
        foundry.documents.Actor,
        "gamma-world-7e",
        GammaWorldCharacterSheet,
        {
            types: ["character"],
            makeDefault: true
        }
    );

    foundry.applications.apps.DocumentSheetConfig.registerSheet(
        foundry.documents.Item,
        "gamma-world-7e",
        GammaWorldOriginSheet,
        {types: ["origin"], makeDefault: true}
    );
});

Hooks.once("ready", async () => {
    if (!game.user.isGM) return;

    const pack = game.packs.get("gamma-world-7e.origins");
    const index = await pack.getIndex();

    if (index.size > 0) return;

    await pack.configure({locked: false});

    const items = ORIGINS.map((origin) => ({
        name: origin.name,
        type: "origin",
        system: origin.system
    }));

    await Item.createDocuments(items, {pack: "gamma-world-7e.origins"});
    console.log(`Gamma World 7E | Seeded ${items.length} Origins`);

    await pack.configure({locked: true});
});
