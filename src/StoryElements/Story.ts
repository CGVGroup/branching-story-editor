import { getConnectedEdges, getIncomers, getOutgoers, Node, ReactFlowJsonObject } from "@xyflow/react";
import { StoryElementType, StoryElement, SmartSerializedStoryElement, smartSerializeStoryElement, StoryElementTypeArray } from "./StoryElement.ts";
import Scene, { SmartSerializedScene } from "./Scene.ts";
import Choice, { SmartSerializedChoice } from "./Choice.ts";
import { Info } from "../Flow/InfoNode.tsx";
import { NodeType, storyNodeClassNames } from "../Flow/StoryNode.tsx";
import { sendToLLM } from "../Misc/LLM.ts";
import { getElementFromDB } from "../Misc/DB.ts";
import getAllOutgoers from "../Misc/GraphUtils.ts";
import { TextsLoadingInfo } from "../Layout/Components/GeneratingTextsDialog.tsx";

type SerializedStory = {
    elements: string[],
    residentElements: StoryElement[],
    flow: ReactFlowJsonObject,
    title: string,
    summary: string,
    notes: string
}

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

    getMatchRegExps(): [RegExp, RegExp, RegExp, RegExp] {
        const allSorted = [...this.elements].sort((a, b) => b.name.length - a.name.length);
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
            })}
        }
    }

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
                    type: storyNodeClassNames[node.type!],
                    name: node.data.label as string,
                    contents: contents!
                }
            })
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

    async sendSceneToLLM(id: string, model: string): Promise<string | null> {
        const node = this.getNode(id);
        if (!node || node.type === NodeType.choice) return null;
        
        let payload: Object = {
            title: this.title,
            characters: this.getElementsByType(StoryElementType.character),
            objects: this.getElementsByType(StoryElementType.object),
            locations: this.getElementsByType(StoryElementType.location),
            is_choice: node.type === NodeType.choice,
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
                if (char.description) str = str.concat(` - Descrizione: ${char.description}`)
                return str}).join("\n"),
        };
        
        const incomers = getIncomers(node, this.flow.nodes, this.flow.edges)
        if (incomers.length === 1 && incomers[0].type === NodeType.scene) {
            payload["previous_scene"] = (incomers[0].data.scene as Scene).history.current.fullText;
        } else {
            payload["previous_scene"] = ""
        }

        return sendToLLM(payload, model).then(res => {
            return JSON.parse(res);
        }).catch(err => {
            console.error(err);
            return null;
        });
    }

    async *sendStoryToLLM(model: string, startingNodeId?: string): AsyncGenerator<{done: boolean, progress: TextsLoadingInfo, newStory: Story}> {
        let processableNodes: Node[];
        if (startingNodeId) {
            processableNodes = Array.from(getAllOutgoers(this.flow, this.getNode(startingNodeId)!, node => node.type === NodeType.choice))
        } else {
            processableNodes = this.flow.nodes.filter(node => node.type === NodeType.scene);
        }
        let i = 0; 
        for (const node of processableNodes) {
            const scene = node.data.scene as Scene;
            yield {done: false, progress: {current: i, total: processableNodes.length, currentScene: node.data.label as string}, newStory: this}
            const fullText = await this.sendSceneToLLM(node.id, model);
            i++;
            if (fullText) scene.history.push({prompt: scene.history.current.prompt, fullText: fullText});
            yield {done: false, progress: {current: i, total: processableNodes.length, currentScene: node.data.label as string}, newStory: this};
        }
        yield {done: true, progress: {current: i, total: processableNodes.length, currentScene: ""}, newStory: this.clone()};
    }
}

export default Story;
export {SerializedStory};