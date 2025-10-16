import { getConnectedEdges, getOutgoers, Node, ReactFlowJsonObject } from "@xyflow/react";
import { StoryElementType, StoryElement, SmartSerializedStoryElement, smartSerializeStoryElement, StoryElementTypeArray } from "./StoryElement.ts";
import Scene, { SmartSerializedScene } from "./Scene.ts";
import Choice, { SmartSerializedChoice } from "./Choice.ts";
import { Info } from "../Flow/InfoNode.tsx";
import { NodeType, storyNodeClassNames } from "../Flow/StoryNode.tsx";
import { sendToLLM } from "../Misc/LLM.ts";
import { getElementFromDB } from "../Misc/DB.ts";
import { getAllOutgoers, getPreviousSceneNode } from "../Misc/GraphUtils.ts";
import { TextsLoadingInfo } from "../Layout/Components/GeneratingTextsDialog.tsx";

/**
 * LLM configuration for the Story.
 */
type StorySettingsType = {
	model: string,
	prompt: string,
	mainCharacter: string
}

/**
 * Complete info for saving to JSON.
 */
type SerializedStory = {
	elements: string[],
	residentElements: StoryElement[],
	flow: ReactFlowJsonObject,
	title: string,
	summary: string,
	notes: string,
	settings: StorySettingsType
}

/**
 * Useful info for the exported JSON.
 */
type SmartSerializedStory = {
	title: string,
	summary: string,
	notes: string,
	dbElements: string[],
	localElements: SmartSerializedStoryElement[],
	nodes: SmartSerializedNode[]
}

type SmartSerializedNode = {
	type: string,
	name: string,
	contents: SmartSerializedScene & {next: string} | SmartSerializedChoice | Info & {next: string},
}

/**
 * Data for a Story.
 * @param elements unsorted list of all {@link StoryElement}s, both from the catalog and local to the Story
 * @param flow {@link ReactFlowJsonObject} containing all Nodes, Edges and everything related to ReactFlow
 * @param title title of the Story
 * @param summary summary of the Story
 * @param notes notes for the Story
 * @param settings LLM settings for the Story
 */
class Story {
	elements: StoryElement[];
	flow: ReactFlowJsonObject;
	title: string;
	summary: string;
	notes: string;
	settings: StorySettingsType;

	constructor(
		elements?: string[],
		residentElements?: StoryElement[],
		flow: ReactFlowJsonObject = {nodes: [], edges: [], viewport: {x: 0, y: 0, zoom: 1}},
		title?: string,
		summary?: string,
		notes?: string,
		settings?: StorySettingsType,
	) {
		this.elements = elements?.map(id => getElementFromDB(id)).concat(residentElements ?? []) ?? [];
		this.flow = {...flow, nodes: flow.nodes.map(node => {
			switch (node.type) {
				case (NodeType.scene):
					return {...node, data: {...node.data, scene: Scene.from(node.data.scene as Scene)}};
				case (NodeType.choice):
					return {...node, data: {...node.data, choice: Choice.from(node.data.choice as Choice)}};
				default:
					return node;
			}
		})};
		this.title = title ?? "Storia senza titolo";
		this.summary = summary ?? "";
		this.notes = notes ?? "";
		this.settings = settings ?? {model: "", prompt: "", mainCharacter: ""}
	}

	clone(): Story {
		return new Story(
			[],
			this.elements,
			this.flow,
			this.title,
			this.summary,
			this.notes,
			this.settings,
		); 
	}

	canAddElement(element: StoryElement): boolean {
		return !this.elements.some(el =>
			el.id === element.id &&
			el.name === element.name &&
			el.elementType === element.elementType);
	}

	addElement(element: StoryElement) {
		if (!this.canAddElement(element)) return false;
		this.elements.push(element);
		return true;
	}
	
	setElement(id: string, newElement: StoryElement) {
		this.elements = this.elements.map(element => element.id === id ? newElement : element);
	}

	deleteElement(id: string) {
		this.elements = this.elements.filter(element => element.id !== id)
	}

	getElements(): StoryElement[] {
		return [...this.elements];
	}
  
	getElementsByType(type: StoryElementType): StoryElement[] {
		return this.elements.filter(element => element.elementType === type);
	}

	getElement(id: string): StoryElement | undefined {
		return this.elements.find(element => element.id === id);
	}

	getElementByName(name: string): StoryElement | undefined {
		return this.elements.find(element => element.name === name);
	}

	getNode(id: string): Node | undefined {
		return this.flow.nodes.find(node => node.id === id);
	}

	getScene(id: string): Scene | undefined {
		return this.getNode(id)?.data.scene as Scene
	}

	getNodes(): Node[] {
		return this.flow.nodes;
	}

	cloneAndAddElement(element: StoryElement): Story {
		const cloned = this.clone();
		cloned.addElement(element);
		return cloned;
	}

	cloneAndSetFlow(flow: ReactFlowJsonObject): Story {
		const cloned = this.clone();
		cloned.flow = flow;
		return cloned;
	}

	cloneAndSetScene(id: string, scene: Scene): Story {
		const cloned = this.clone();
		cloned.flow.nodes.find(node => node.id === id)!.data.scene = scene;
		return cloned;
	}

	cloneAndSetChoice(id: string, choice: Choice): Story {
		const cloned = this.clone();
		cloned.getNode(id)!.data.choice = choice;
		return cloned;
	}
	
	cloneAndSetInfo(id: string, info: Info): Story {
		const cloned = this.clone();
		cloned.getNode(id)!.data.info = info;
		return cloned;
	}

	cloneAndSetElement(id: string, element: StoryElement): Story {
		const cloned = this.clone();
		cloned.setElement(id, element);
		return cloned;
	}

	cloneAndSetTitle(title: string): Story {
		const cloned = this.clone();
		cloned.title = title;
		return cloned;
	}

	cloneAndSetSummary(summary: string): Story {
		const cloned = this.clone();
		cloned.summary = summary;
		return cloned;
	}

	cloneAndSetNotes(notes: string): Story {
		const cloned = this.clone();
		cloned.notes = notes;
		return cloned;
	}

	cloneAndSetSettings(settings: StorySettingsType): Story {
		const cloned = this.clone();
		cloned.settings = settings;
		return cloned;
	}

	cloneAndDeleteElement(id: string): Story {
		const cloned = this.clone();
		cloned.deleteElement(id);
		return cloned;
	}

	/**
	 * Get RegExps to match for any element in the Story and for any element of each {@link StoryElementType}.
	 * @returns [MatchAll, MatchCharacters, MatchObjects, MatchLocations]
	 */
	getMatchRegExps(): [RegExp, RegExp, RegExp, RegExp] {
		const allSorted = [...this.elements].sort((a, b) => b.name.length - a.name.length); //Match longest first
		const matchArray = [allSorted, ...StoryElementTypeArray.map(type => allSorted.filter(element => element.elementType === type))];
		return matchArray.map(array =>
			array.length === 0 ? /^$/ : new RegExp("(" + array.map(element => `@${element.name}`).join("|") + ")", "g")) as [RegExp, RegExp, RegExp, RegExp];
	}

	serialize(): SerializedStory {
		return {
			title: this.title,
			summary: this.summary,
			notes: this.notes,
			elements: this.elements.filter(element => !element.resident).map(element => element.id),
			residentElements: this.elements.filter(element => element.resident),
			flow: {...this.flow, nodes: this.flow.nodes.map(node => {
				switch (node.type) {
					case (NodeType.scene):
						return {...node, data: {...node.data, scene: (node.data.scene as Scene).serialize()}};
					default:
						return node;
				}
			})},
			settings: this.settings
		}
	}

	/**
	 * Formats Story data to use with other programs.
	 * 
	 * - Elements from the catalogue are kept as their ID,
	 * - Elements local to the Story are {@link smartSerializeStoryElement smartSerialized}
	 * - Nodes from the Flow are converted to their SmartSerialized version and get a new field for their next connected Node(s)
	 */
	smartSerialize(): SmartSerializedStory {
		return {
			title: this.title,
			summary: this.summary,
			notes: this.notes,
			dbElements: this.elements.filter(element => element.resident === false).map(element => element.id),
			localElements: this.elements.filter(element => element.resident === true).map(element => smartSerializeStoryElement(element)),
			nodes: this.flow.nodes.map(node => {
				let contents: SmartSerializedScene & {next: string} | SmartSerializedChoice | Info & {next: string};
				switch (node.type) {
					case (NodeType.scene):
						contents = {...(node.data.scene as Scene).smartSerialize(this),
							next: getOutgoers(node, this.flow.nodes, this.flow.edges)?.[0]?.data.label as string ?? ""}
					break;
					case (NodeType.choice):
						contents = (node.data.choice as Choice).smartSerialize();
						const edges = getConnectedEdges([node], this.flow.edges)
							.filter(edge => edge.source === node.id);
						for (const edge of edges) {
							contents.choices[Choice.getIndexFromHandleName(edge.sourceHandle!)].next = this.getNode(edge.target)?.data.label as string;
						}
					break;
					case (NodeType.info):
						contents = {...(node.data.info as Info),
							next: getOutgoers(node, this.flow.nodes, this.flow.edges)?.[0]?.data.label as string ?? ""}
					break;
				}
				return {
					type: storyNodeClassNames[node.type as NodeType],
					name: node.data.label as string,
					contents: contents!
				}
			})
		}
	}

	static deserialize(obj: SerializedStory): Story {
		return new Story(obj.elements, obj.residentElements, obj.flow, obj.title, obj.summary, obj.notes, obj.settings);
	}

	toJSON(): string {
		return JSON.stringify(this.serialize());
	}

	static fromJSON(json: string): Story {
		return this.deserialize(JSON.parse(json));
	}
	/**
	 * Sends a single scene to the LLM and adds the new text to the Scene's history.
	 * 
	 * A `payload` is first created from Scene and Story data to fit the requirements of the prompt.
	 * @param id Scene id
	 */ 
	async sendSceneToLLM(id: string): Promise<void> {
		const node = this.getNode(id);
		if (!node || node.type !== NodeType.scene) throw new TypeError(`Il nodo ${node?.data?.label} non è un nodo di Scena.`);
		
		let payload: object = {
			title: this.title,
			characters: this.getElementsByType(StoryElementType.character),
			objects: this.getElementsByType(StoryElementType.object),
			locations: this.getElementsByType(StoryElementType.location),
		};
		
		const scene = node.data.scene as Scene;
		payload = {...payload,
			prompt: scene.history.current.prompt,
			time: scene.details.time,
			tones: scene.details.tones,
			weather: scene.details.weather,
			location: this.getElement(scene.details.backgroundIds[StoryElementType.location][0])?.name ?? "",
			characters: this.getElementsByType(StoryElementType.character).map(char => {
				let str = char.name;
				if (char.type) str = str.concat(` (${char.type})`);
				//if (char.description) str = str.concat(` - Descrizione: ${char.description}`);
				return str}).join("\n"),
			main_character: this.getElement(this.settings.mainCharacter)?.name ?? ""
		};
		
		const previousSceneNode = getPreviousSceneNode(this.flow, node);
		if (previousSceneNode) 
			payload = {...payload, previous_scene: (previousSceneNode.data.scene as Scene).history.current.fullText};
		else
			payload = {...payload, previous_scene: ""};

		const fullText = JSON.parse(await sendToLLM(payload, this.settings.model, this.settings.prompt));
		if (fullText) scene.history.push({prompt: scene.history.current.prompt, fullText: fullText});
		else throw new Error("Si è verificato un errore nella generazione del testo.");
	}

	/**
	 * Async generator to send multiple Scenes to the LLM and get info after each one is generated.
	 * 
	 * If called with `startingNodeId`, recursively sends all connected nodes until a Choice Node is hit for every branch, else sends all Scene Nodes.
	 * @param startingNodeId Node to start from or entire Story
	 * @returns `done` whether the entire generation is complete
	 * @returns `progress` {@link TextsLoadingInfo generation info}
	 * @returns `newStory` cloned Story object with all changes applied
	 */
	async *sendStoryToLLM(startingNodeId?: string): AsyncGenerator<{done: boolean, progress: TextsLoadingInfo, newStory: Story, error: string}> {
		let processableNodes: Node[];
		if (startingNodeId) {
			processableNodes = Array.from(getAllOutgoers(this.flow, this.getNode(startingNodeId)!, node => node.type === NodeType.choice));
		} else {
			processableNodes = this.flow.nodes.filter(node => node.type === NodeType.scene);
		}
		
		let i = 0; 
		let info = {done: false, progress: {current: i, total: processableNodes.length, currentScene: ""}, newStory: this, error: ""};
		try {
			for (const node of processableNodes) {
				yield info = {...info, progress: {current: i, total: processableNodes.length, currentScene: node.data.label as string}};
				await this.sendSceneToLLM(node.id);
				i++;
				yield info = {...info, progress: {current: i, total: processableNodes.length, currentScene: node.data.label as string}};
			}
			yield {...info, done: true, progress: {current: i, total: processableNodes.length, currentScene: ""}, newStory: this.clone()};
		} catch (error) {
			yield info = {...info, done: true, error: error as string};
		}
	}
}

export default Story;
export {StorySettingsType, SerializedStory};