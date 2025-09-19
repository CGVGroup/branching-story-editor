import { v4 as uuidv4 } from "uuid";

/**
 * Enum for the possible types of StoryElements.
 * 
 * Being numerical values, they can be used to index arrays.
 * 
 * They are always found in this order. Whenever there is a tuple/array of exactly 3 elements, it's one for each StoryElementType.
 */
export enum StoryElementType {
	character = 0,
	object = 1,
	location = 2
}

// Below follow some utility arrays to more easily iterate on StoryElementTypes or access constant strings with an index

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

/**
 * The common composing fields for all StoryElements ({@link CharacterElement}s, {@link ObjectElement}s and {@link LocationElement}s). 
 * 
 * **IMPORTANT!** The {@link StoryElement.type `type`} field refers to the element's "historical" type (occupation if character, kind of object if object, etc.).
 * The field for the element's StoryElementType is {@link StoryElement.elementType `elementType`}.
 */
export interface StoryElement {
	id: string;
	catalogueNumber: string;
	name: string;
	type: string;
	dating: string[];
	description: string;
	cover: string[];
	resident: boolean;
	elementType: StoryElementType;
};

export interface CharacterElement extends StoryElement {
	elementType: StoryElementType.character
};

export interface ObjectElement extends StoryElement {
	materials: string[];
	origin: string;
	elementType: StoryElementType.object;
}

export interface LocationElement extends StoryElement {
	origin: string;
	elementType: StoryElementType.location;
}

export type SmartSerializedStoryElement = {elementType: string} & Omit<CharacterElement | ObjectElement | LocationElement, "elementType" | "resident">;

export function createNewElement(type: StoryElementType) {
	const newElement: StoryElement = {
		id: uuidv4(),
		catalogueNumber: "",
		name: "",
		type: "",
		dating: [],
		description: "",
		cover: [],
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
			(newElement as LocationElement).origin = "";
			return newElement as LocationElement;
	}
}

/**
 * Useful info for the exported JSON.
 * - {@link StoryElement.resident `resident`} is removed, as only local elements are saved in detail
 * - {@link StoryElement.elementType `elementType`} is replaced with its corresponding string
 */
export function smartSerializeStoryElement(element: StoryElement): SmartSerializedStoryElement {
	const {resident, elementType, ...filtered} = element;
	return {elementType: StoryElementTypeDictionary.eng.singular[element.elementType], ...filtered};
}