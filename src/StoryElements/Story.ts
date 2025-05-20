import {v4 as uuidv4} from "uuid";
import { getIncomers, Node, ReactFlowJsonObject } from "@xyflow/react";
import { CharacterElement, LocationElement, ObjectElement, StoryElementType, StoryElement } from "./StoryElement.ts";
import Scene from "./Scene.ts";
import Choice from "./Choice.ts";
import { NodeType } from "../Flow/StoryNode.tsx";
import { sendToLLM } from "../Misc/LLM.ts";

type SerializedStory = {
    characters: [string, CharacterElement][],
    objects: [string, ObjectElement][],
    locations: [string, LocationElement][],
    flow: ReactFlowJsonObject,
    title: string,
    summary: string,
    notes: string
}

class Story {
    characters: Map<string, CharacterElement>;
    objects: Map<string, ObjectElement>;
    locations: Map<string, LocationElement>;
    flow: ReactFlowJsonObject;
    title: string;
    summary: string;
    notes: string;

    constructor(
        characters: CharacterElement[] | [string, CharacterElement][] = [],
        objects: ObjectElement[] | [string, ObjectElement][] = [],
        locations: LocationElement[] | [string, LocationElement][] = [],
        flow: ReactFlowJsonObject = {nodes: [], edges: [], viewport: {x: 0, y: 0, zoom: 1}},
        title?: string,
        summary?: string,
        notes?: string
    ) {
        this.characters = new Map();
        characters.forEach(char => Array.isArray(char) ? this.characters.set(char[0], char[1]) : this.characters.set(uuidv4(), char));
        this.objects = new Map();
        objects.forEach(obj => Array.isArray(obj) ? this.objects.set(obj[0], obj[1]) : this.objects.set(uuidv4(), obj));
        this.locations = new Map();
        locations.forEach(loc => Array.isArray(loc) ? this.locations.set(loc[0], loc[1]) : this.locations.set(uuidv4(), loc));
        this.flow = flow;
        this.title = title ?? "Storia senza titolo";
        this.summary = summary ?? "";
        this.notes = notes ?? "";
    }

    clone(): Story {
        return new Story(
            [...this.characters.entries()],
            [...this.objects.entries()],
            [...this.locations.entries()],
            this.flow,
            this.title,
            this.summary,
            this.notes); 
    }

    canAddElement(element: StoryElement): boolean {
        const map = this.getElementMapByType(element.type);
        return ![...map.values()].some(el => el.name === element.name);
    }

    addElement(element: StoryElement) {
        if (!this.canAddElement(element)) return false;
        const map = this.getElementMapByType(element.type);
        switch (element.type) {
            case StoryElementType.character:
                const char = element as CharacterElement;
                map.set(uuidv4(), new CharacterElement(char.name, char.bio, char.objective, char.notes));
            break;
            case StoryElementType.object:
                const obj = element as ObjectElement;
                map.set(uuidv4(), new ObjectElement(obj.name, obj.use, obj.notes));
            break;
            case StoryElementType.location:
                const loc = element as LocationElement;
                map.set(uuidv4(), new LocationElement(loc.name, loc.purpose, loc.notes));
            break;
        }
        return true;
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
        cloned.getNodeById(id)!.data.choice = choice;
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

    cloneAndDeleteElement(id: string): Story {
        const cloned = this.clone();
        cloned.deleteElement(id);
        return cloned;
    }

    setElement(id: string, element: StoryElement) {
        const iter = this.getElementMapByType(element.type);
        iter.set(id, element);
    }

    deleteElement(id: string) {
        if (this.characters.delete(id)) return;
        if (this.objects.delete(id)) return;
        if (this.locations.delete(id)) return;
    }

    getAllElements(): StoryElement[] {
        return new Array<StoryElement>().concat(
            [...this.characters.values()],
            [...this.objects.values()],
            [...this.locations.values()]);
    }

    getAllElementsMap(): Map<string, StoryElement> {
        return new Map(new Array<[string, StoryElement]>().concat(
            [...this.getElementMapByType(StoryElementType.character)],
            [...this.getElementMapByType(StoryElementType.object)],
            [...this.getElementMapByType(StoryElementType.location)]));
    }
  
    getElementMapByType(type: StoryElementType): Map<string, StoryElement> {
        switch (type) {
            case StoryElementType.character:
                return this.characters;
            case StoryElementType.object:
                return this.objects;
            case StoryElementType.location:
                return this.locations;
        }
    }

    getElementIteratorByType(type: StoryElementType): MapIterator<StoryElement> {
        return this.getElementMapByType(type).values();
    }

    getElementById(id: string): StoryElement | undefined {
        return this.characters.get(id) ?? this.objects.get(id) ?? this.locations.get(id);
    }

    getNodeById(id: string): Node | undefined {
        return this.flow.nodes.find(node => node.id === id);
    }

    getSceneById(id: string): Scene | undefined {
        return this.getNodeById(id)?.data.scene as Scene
    }

    getAllNodes(): Node[] {
        return this.flow.nodes;
    }

    serialize(): SerializedStory {
        return {
            characters: Array.from(this.characters.entries()),
            objects: Array.from(this.objects.entries()),
            locations: Array.from(this.locations.entries()),
            flow: this.flow,
            title: this.title,
            summary: this.summary,
            notes: this.notes
        }
    }

    static deserialize(obj: SerializedStory): Story {
        return new Story(obj.characters, obj.objects, obj.locations, obj.flow, obj.title, obj.summary, obj.notes);
    }

    toJSON(): string {
        return JSON.stringify(this.serialize());
    }

    static fromJSON(json: string): Story {
        return this.deserialize(JSON.parse(json));
    }

    async sendToLLM(id: string): Promise<Story> {
        const node = this.getNodeById(id);
        if (!node) return this;
        let payload: Object = {
            title: this.title,
            characters: [...this.characters.values()],
            objects: [...this.objects.values()],
            locations: [...this.locations.values()],
            is_choice: node.type === NodeType.choice,
        }
        
        if (node.type === NodeType.choice) {
            payload["choices"] = [...node.data.choices as string[]]
        } else {
            const scene = node.data.scene as Scene;
            payload = {...payload,
                prompt: scene.prompt,
                time: scene.details.time,
                tone: scene.details.tone,
                weather: scene.details.weather,
                location: this.getElementById(scene.details.backgroundIds[StoryElementType.location][0]) ?? "",
                characters: [...this.characters.values()].map(char => {
                    const str = char.name;
                    if (char.bio) str.concat(` - Descrizione: ${char.bio}`)
                    if (char.objective) str.concat(` - Obiettivo: ${char.objective}`)
                    return str}).join("\n")
            }
        }
        
        const incomers = getIncomers(node, this.flow.nodes, this.flow.edges)
        if (incomers.length === 1 && incomers[0].type === NodeType.scene) {
            payload["previous_scene"] = (incomers[0].data.scene as Scene).fullText;
        }

        console.log(payload);
        sendToLLM(payload).then(res => {
            const response = JSON.parse(res);
            if (response?.length) {
                response.forEach(({content, id}) => {
                    const correspondingNode = this.flow.nodes.find(node => node.data.label === id);
                    if (correspondingNode && correspondingNode.type === NodeType.scene)
                        (correspondingNode.data.scene as Scene).fullText = content;
                });
            }
        }).catch(e => console.error(e));
        return this.clone();
    }

    /*async sendToLLM(): Promise<Story> {
        const sceneNodes = this.flow.nodes.filter(node => node.type === NodeType.scene);
        await Promise.all(
			sceneNodes.map(
				node => new Promise(resolve => 
					resolve(this.sendSceneToLLM(node.id)))
                    .then(fullText => {
                        const newScene = Scene.from(node.data.scene as Scene);
                        newScene.fullText = (fullText as string);
                        console.log(newScene)
                        return this.cloneAndSetScene(node.id, newScene);
                    })
            )
        );
        return this.clone();
    }

    sendSceneToLLM(id: string): Promise<string> {
        return sendToLLM((this.getSceneById(id)!).prompt);
    }*/
}

export default Story;
export {SerializedStory};