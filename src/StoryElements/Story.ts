import { getIncomers, Node, ReactFlowJsonObject } from "@xyflow/react";
import { StoryElementType, StoryElement } from "./StoryElement.ts";
import Scene from "./Scene.ts";
import Choice from "./Choice.ts";
import { NodeType } from "../Flow/StoryNode.tsx";
import { sendToLLM } from "../Misc/LLM.ts";
import { getElementFromDB } from "../Misc/DB.ts";

type SerializedStory = {
    elements: string[],
    residentElements: StoryElement[],
    flow: ReactFlowJsonObject,
    title: string,
    summary: string,
    notes: string
}

class Story {
    elements: StoryElement[];
    flow: ReactFlowJsonObject;
    title: string;
    summary: string;
    notes: string;

    constructor(
        elements?: string[],
        residentElements?: StoryElement[],
        flow: ReactFlowJsonObject = {nodes: [], edges: [], viewport: {x: 0, y: 0, zoom: 1}},
        title?: string,
        summary?: string,
        notes?: string
    ) {
        this.elements = elements?.map(id => getElementFromDB(id)).concat(residentElements ?? []) ?? [];
        this.flow = flow;
        this.title = title ?? "Storia senza titolo";
        this.summary = summary ?? "";
        this.notes = notes ?? "";
    }

    clone(): Story {
        return new Story(
            [],
            this.elements,
            this.flow,
            this.title,
            this.summary,
            this.notes
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

    getNode(id: string): Node | undefined {
        return this.flow.nodes.find(node => node.id === id);
    }

    getScene(id: string): Scene | undefined {
        return this.getNode(id)?.data.scene as Scene
    }

    getNodes(): Node[] {
        return this.flow.nodes;
    }

    serialize(): SerializedStory {
        return {
            elements: this.elements.filter(element => !element.resident).map(element => element.id),
            residentElements: this.elements.filter(element => element.resident),
            flow: this.flow,
            title: this.title,
            summary: this.summary,
            notes: this.notes
        }
    }

    static deserialize(obj: SerializedStory): Story {
        return new Story(obj.elements, obj.residentElements, obj.flow, obj.title, obj.summary, obj.notes);
    }

    toJSON(): string {
        return JSON.stringify(this.serialize());
    }

    static fromJSON(json: string): Story {
        return this.deserialize(JSON.parse(json));
    }

    async sendToLLM(id: string): Promise<Story> {
        const node = this.getNode(id);
        if (!node) return this;
        let payload: Object = {
            title: this.title,
            characters: this.getElementsByType(StoryElementType.character),
            objects: this.getElementsByType(StoryElementType.object),
            locations: this.getElementsByType(StoryElementType.location),
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
                location: this.getElement(scene.details.backgroundIds[StoryElementType.location][0]) ?? "",
                characters: this.getElementsByType(StoryElementType.character).map(char => {
                    const str = char.name;
                    if (char.description) str.concat(` - Descrizione: ${char.description}`)
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