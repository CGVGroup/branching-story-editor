import { createContext } from "react";
import { TreeNodeData } from "@mantine/core";
import { CharacterElement, ObjectElement, LocationElement, StoryElementType, StoryElement, StoryElementTypeDictionary, StoryElementTypeArray } from "../StoryElements/StoryElement.ts";
import { SceneDetails } from "../StoryElements/Scene.ts"
import Story, { SerializedStory } from "../StoryElements/Story.ts";

/**
 * Utility type to keep track of the differences between {@link DBSchema backend} and {@link DBType frontend} DBs.
 */
type DBStoryElement<T extends StoryElement> = Omit<T, "id" | "resident" | "elementType"> & {models: string[]};

/**
 * Schema of the DB served by the backend.
 */
type DBSchema = {
	characters: {[id: string]: DBStoryElement<CharacterElement>},
	objects: {[id: string]: DBStoryElement<ObjectElement>},
	locations: {[id: string]: DBStoryElement<LocationElement>},
};

/**
 * Schema of the DB loaded in memory and utilized by the frontend.
 */
type DBType = [
	{[id: string]: CharacterElement},
	{[id: string]: ObjectElement},
	{[id: string]: LocationElement},
];

/**
 * Holds all the possible enumerations that the fields of {@link SceneDetails} can have.
 */
export type SceneDetailsEnums = {
  time: string[],
  weather: string[],
  tone: string[],
  value: string[]
};

/**
 * Holds all the possible enumerations that the fields of {@link CharacterElement}, {@link ObjectElement} or {@link LocationElement} can have.
 */
export type Taxonomies = {
	characters: TaxonomyElement[],
	objects: TaxonomyElement[],
	locations: TaxonomyElement[],
	materials: TaxonomyElement[],
	areas: TaxonomyElement[],
	periods: TaxonomyElement[],
}

/**
 * Internal type to keep a recursive data structure for {@link Taxonomies}.
 */
type TaxonomyElement = {
	name: string,
	children: TaxonomyElement[]
};

export let DB: DBType | null = null;
export const DBContext = createContext<Object | null>(null);

export const DB_URL = "/db";
export const MODELS_URL = "/models";
export const PROMPTS_URL = "/prompts";
export const ENUMS_URL = "/enums";
export const TAXONOMIES_URL = "/taxonomies";
export const STORIES_URL = "/stories";

/**
 * If not yet initialized, fetches the DB from the backend, initializes the {@link DB DB object} and returns it.
 */
export async function getAll() {
	if (DB) return DB;
	const response = await fetch(DB_URL);
	if (!response.ok) {
		throw Error(`Could not contact DB: ${response.status}`);
	}
	const parsedDB = await response.json() as DBSchema;
	
	DB = [{}, {}, {}];
	for (const type of StoryElementTypeArray) {
		const elementsOfType = parsedDB[StoryElementTypeDictionary.eng.plural[type] as keyof DBSchema];
		for (const id of Object.keys(elementsOfType)) {
			const {models, ...fieldsToKeep} = elementsOfType[id];
			DB[type][id] = {
				...fieldsToKeep,
				id: id,
				resident: false,
				elementType: type
			} as CharacterElement | ObjectElement | LocationElement;
		}
	}
	return DB;
}

export function getElementFromDB(id: string): StoryElement {
	if (DB === null) throw new Error("DB is not initialized yet");

	for (const type of StoryElementTypeArray) {
		const element = DB[type][id];
		if (element) return element;
	}
	throw new Error("Element is not in DB");
}

export function searchDB(type: StoryElementType, search: string): StoryElement[] {
	if (DB === null) throw new Error("DB is not initialized yet");

	if (!search) return Object.values(DB[type]);

	return Object.values(DB[type])
		.filter((element: StoryElement) => [element.name, element.type, element.catalogueNumber]
			.some(property => property.toLocaleLowerCase().includes(search.toLocaleLowerCase())));
}

export async function getModels(): Promise<string[]> {
	const response = await fetch(MODELS_URL);
	if (!response.ok) {
		throw Error(`Could not fetch model list: ${response.status}`);
	}
	const models = await response.json() as string[];
	return models;
}

export async function getPrompts(): Promise<string[]> {
	const response = await fetch(PROMPTS_URL);
	if (!response.ok) {
		throw Error(`Could not fetch prompt list: ${response.status}`);
	}
	const prompts = await response.json() as string[];
	return prompts;
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

export async function getStories(username: string): Promise<Map<string, Story>> {
	const response = await fetch(`${STORIES_URL}/${username}`);
	if (!response.ok) {
		throw Error(`Could not fetch stories for ${username}: ${response.status}`);
	}
	const parsedStories = await response.json() as [string, object][];
	return new Map(parsedStories.map(([id, story]) => [id, Story.deserialize(story as SerializedStory)]));
}

export async function saveStory(username: string, id: string, story: object, serializedStory: object): Promise<string> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", "/save", true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
				resolve("La storia è stata salvata.");
			}
			if (xhr.status !== 200) {
				console.error(xhr.responseText)
				reject(new Error(`Errore nel salvataggio: ${xhr.status} - ${xhr.statusText}`))
			}
		};
		xhr.onerror = () => reject(new Error("Errore nel salvataggio"));
		const payload = {
			username: username,
			id: id,
			story: story,
			serialized_story: serializedStory
		};
		xhr.send(JSON.stringify(payload));
	});
}

export async function deleteStory(username: string, id: string) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", "/delete", true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
				resolve("La storia è stata cancellata.");
			}
			if (xhr.status !== 200) {
				console.error(xhr.responseText)
				reject(new Error(`Errore nella cancellazione: ${xhr.status} - ${xhr.statusText}`))
			}
		};
		xhr.onerror = () => reject(new Error("Errore nella cancellazione"));
		const payload = {
			username: username,
			id: id,
		};
		xhr.send(JSON.stringify(payload));
	})
}

/**
 * Recursively converts an array of {@link TaxonomyElement}s to a {@link TreeNodeData Mantine Tree-compatible format}.
 * @param taxonomies the taxonomies to convert
 * @returns a new array with the converted data
 */
export function taxonomyToTree(taxonomies: TaxonomyElement[]): TreeNodeData[] {
	const leaves: TreeNodeData[] = [];
	for (const entry of taxonomies) {
		if (entry.children.length === 0) {
			leaves.push({label: entry.name, value: entry.name});
		} else {
			const nestedLeaves = taxonomyToTree(entry.children);
			leaves.push({label: entry.name, value: entry.name, children: nestedLeaves});
		}
	}
	return leaves;
}