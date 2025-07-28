import { v4 as uuidv4 } from "uuid";

export enum StoryElementType {
    character = 0,
    object = 1,
    location = 2
}

export const StoryElementTypeArray = [StoryElementType.character, StoryElementType.object, StoryElementType.location];

export const StoryElementTypeDictionary = {
    eng: {
        singular: ["character", "object", "location"],
        plural: ["characters", "objects", "locations"]
    },
    ita: {
        singular: ["personaggio", "oggetto", "luogo"],
        plural: ["personaggi", "oggetti", "luoghi"]
    }
}

export const StoryElementTypeMentions = ["character-mention", "object-mention", "location-mention"];

export const StoryElementColorArray = ["orange", "blue", "green"];

export const noElementsText = StoryElementTypeDictionary.ita.plural.map(typeText => `Non sono presenti ${typeText} in questa storia`);
export const shortNoElementsText = StoryElementTypeDictionary.ita.singular.map(typeText => `Nessun ${typeText}`);
export const noMatchingElementsText = StoryElementTypeDictionary.ita.singular.map(typeText => `Nessun ${typeText} corrisponde alla ricerca`);

export type StoryElement = {
    id: string;
    name: string;
    type: string;
    dating: string[];
    description: string;
    assets: string[];
    resident: boolean;
    elementType: StoryElementType;
}

export type SmartSerializedStoryElement = Omit<CharacterElement | ObjectElement | LocationElement, "elementType" | "resident">

export type CharacterElement = StoryElement & {
    elementType: StoryElementType.character
};

export type ObjectElement = StoryElement & {
    materials: string[];
    origin: string;
    elementType: StoryElementType.object;
}

export type LocationElement = StoryElement & {
    elementType: StoryElementType.location;
}

export function createNewElement(type: StoryElementType) {
    const newElement: StoryElement = {
        id: uuidv4(),
        name: "",
        type: "",
        dating: [],
        description: "",
        assets: [],
        resident: true,
        elementType: type
    }
    switch (type){
        case (StoryElementType.character):
            newElement.name = "Nuovo Personaggio";
            return newElement as CharacterElement;
        
        case (StoryElementType.object):
            newElement.name = "Nuovo Oggetto";
            (newElement as ObjectElement).materials = [];
            (newElement as ObjectElement).origin = "";
            return newElement as ObjectElement;
        
        case (StoryElementType.location):
            newElement.name = "Nuovo Luogo";
            return newElement as LocationElement;
    }
}

export function smartSerializeStoryElement(element: StoryElement): SmartSerializedStoryElement {
    const {resident, elementType, ...filtered} = element;
    return filtered;
}