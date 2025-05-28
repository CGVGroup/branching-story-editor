import { createContext } from "react";
import { CharacterElement, ObjectElement, LocationElement, StoryElementType, StoryElement, StoryElementTypeDictionary, StoryElementTypeArray } from "../StoryElements/StoryElement.ts";

type DBSchema = {
    personaggi: Omit<CharacterElement, "resident" | "elementType">[],
    oggetti: Omit<ObjectElement, "resident" | "elementType">[],
    luoghi: Omit<LocationElement, "resident" | "elementType">[],
}

export let DB: DBSchema | null = null;
export const DB_URL = "http://127.0.0.1:5000/db";

export const DbContext = createContext<Object | null>(null);

export async function getAll() {
    const response = await fetch(DB_URL);
    if (!response.ok) {
        throw Error(`Could not contact DB: ${response.status}`);
    }
    DB = await response.json() as DBSchema;
    console.log(DB);
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
        console.log(StoryElementTypeDictionary.eng.plural[type])
        searchArray = DB[StoryElementTypeDictionary.eng.plural[type]] as StoryElement[];
    } else {
        searchArray = StoryElementTypeDictionary.eng.plural.map(type => DB![type]).flat();
    }
    return searchArray.filter(element => Object.values(element).some(value => value.toString().toLocaleLowerCase().includes(search.toLocaleLowerCase())));
}