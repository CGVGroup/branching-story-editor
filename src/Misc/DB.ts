import { createContext } from "react";
import { CharacterElement, ObjectElement, LocationElement, StoryElementType, StoryElement, StoryElementTypeDictionary, StoryElementTypeArray } from "../StoryElements/StoryElement.ts";

type DBSchema = {
    characters: Omit<CharacterElement, "resident" | "elementType">[],
    objects: Omit<ObjectElement, "resident" | "elementType">[],
    locations: Omit<LocationElement, "resident" | "elementType">[],
}

export let DB: DBSchema | null = null;
export const DB_URL = "/db";
export const MODELS_URL = "/models";
export const ENUMS_URL = "/enums";

export const DbContext = createContext<Object | null>(null);

export async function getAll() {
    if (DB) return DB;
    const response = await fetch(DB_URL);
    if (!response.ok) {
        throw Error(`Could not contact DB: ${response.status}`);
    }
    DB = await response.json() as DBSchema;
    return DB;
}

export function getElementFromDB(id: string): StoryElement {
    if (DB === null) throw new Error("DB is not initialized yet");
    for (const type of StoryElementTypeArray) {
        const element = DB[StoryElementTypeDictionary.eng.plural[type]].find((elem: StoryElement) => elem.id === id);
        if (element) return {...element, resident: false, elementType: type};
    }
    throw new Error("Element is not in DB");
}

export function searchDB(search: string, type?: StoryElementType): StoryElement[] {
    if (DB === null) throw new Error("DB is not initialized yet");
    let searchArray: StoryElement[];
    if (type !== undefined) {
        searchArray = DB[StoryElementTypeDictionary.eng.plural[type]]
            .map((element: Omit<StoryElement, "resident" | "elementType">) => {return {...element, resident: false, elementType: type}});
    } else {
        searchArray = StoryElementTypeDictionary.eng.plural.map(type => DB![type]).flat();
    }
    if (!search) return searchArray;
    return searchArray.filter(element => Object.values(element).some(value => value.toString().toLocaleLowerCase().includes(search.toLocaleLowerCase())));
}

export async function getModels(): Promise<string[]> {
    const response = await fetch(MODELS_URL);
    if (!response.ok) {
        throw Error(`Could not fetch model list: ${response.status}`);
    }
    const models = await response.json() as string[];
    return models;
}

export async function getEnums(): Promise<Object> {
    const response = await fetch(ENUMS_URL);
    if (!response.ok) {
        throw Error(`Could not fetch enums: ${response.status}`);
    }
    const enums = await response.json() as Object;
    return enums;
}