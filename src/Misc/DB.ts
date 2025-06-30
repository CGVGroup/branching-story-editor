import { createContext } from "react";
import { CharacterElement, ObjectElement, LocationElement, StoryElementType, StoryElement, StoryElementTypeDictionary, StoryElementTypeArray } from "../StoryElements/StoryElement.ts";

type DBSchema = {
    characters: Omit<CharacterElement, "resident" | "elementType">[],
    objects: Omit<ObjectElement, "resident" | "elementType">[],
    locations: Omit<LocationElement, "resident" | "elementType">[],
}

export type SceneDetailsEnums = {
  time: string[],
  weather: string[],
  tone: string[],
  value: string[]
}

type TaxonomyElement = {
    name: string,
    children: TaxonomyElement[]
};

export type Taxonomies = {
    characters: TaxonomyElement[],
    objects: TaxonomyElement[],
    locations: TaxonomyElement[],
    materials: TaxonomyElement[],
    areas: TaxonomyElement[],
    periods: TaxonomyElement[],
}

export let DB: DBSchema | null = null;
export const DB_URL = "/db";
export const MODELS_URL = "/models";
export const ENUMS_URL = "/enums";
export const TAXONOMIES_URL = "/taxonomies";

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

export async function getTaxonomies(): Promise<Taxonomies> {
    const response = await fetch(TAXONOMIES_URL);
    if (!response.ok) {
        throw Error(`Could not fetch taxonomies: ${response.status}`);
    }
    const taxonomies = await response.json() as Taxonomies;
    return taxonomies;
}

export function taxonomyToMultioption(taxonomies: TaxonomyElement[], nesting?: number) {
    const labels: string[] = [];
    const values: string[] = [];
    const index = nesting ?? 0;
    for (const entry of taxonomies) {
        if (entry.children.length === 0) {
            labels.push(entry.name);
            values.push(entry.name);
        } else {
            const [nestedLabels, nestedValues] = taxonomyToMultioption(entry.children, index + 1);
            labels.push(...nestedLabels);
            values.push(...nestedValues);
        }
    }
    return [labels, values];
}