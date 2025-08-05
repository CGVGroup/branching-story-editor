import UndoStack from "../Misc/UndoStack.ts";
import Story from "./Story.ts";
import { StoryElementType } from "./StoryElement.ts";

type SceneDetails = {
    title: string;
    summary: string;
    time: string;
    weather: string;
    tones: string[];
    value: string;
    backgroundIds: [string[], string[], string];
}

type HistoryElement = {
    prompt: string;
    fullText: string;
}

type SmartSerializedScene = {
    title: string,
    time: string,
    weather: string,
    ids: string[],
    backgroundIds: {
        characters: string[],
        objects: string[],
        location: string
    },
    prompt: string,
    fullText: string
}

class Scene {
    details: SceneDetails;
    history: UndoStack<HistoryElement>;

    constructor(
        details?: Partial<SceneDetails>,
        history?: UndoStack<HistoryElement>
    ) {
        this.details = {
            title: details?.title ?? "",
            summary: details?.summary ?? "",
            time: details?.time ?? "",
            weather: details?.weather ?? "",
            tones: details?.tones ?? [],
            value: details?.value ?? "",
            backgroundIds: details?.backgroundIds ?? [[], [], ""],
        };
        if (history === undefined) {
            this.history = new UndoStack([{prompt: "", fullText: ""}])
        } else {
            this.history = new UndoStack(history.stack, history.index);
        }
    }

    clone(): Scene {
        return new Scene(this.details, this.history);
    }

    cloneAndSetDetails(details: SceneDetails): Scene {
        const cloned = this.clone();
        cloned.details = details;
        return cloned;
    }
    cloneAndSetPrompt(prompt: string): Scene {
        const cloned = this.clone();
        cloned.history.set({prompt: prompt, fullText: cloned.history.current.fullText});
        return cloned;
    }
    cloneAndSetFullText(fullText: string): Scene {
        const cloned = this.clone();
        cloned.history.set({prompt: cloned.history.current.prompt, fullText: fullText});
        return cloned;
    }

    cloneAndPushFullText(fullText: string): Scene {
        const cloned = this.clone();
        cloned.history.push({prompt: cloned.history.current.prompt, fullText: fullText});
        return cloned;
    }

    cloneAndUndo(): Scene {
        const cloned = this.clone();
        cloned.history.undo();
        return cloned;
    }

    cloneAndRedo(): Scene {
        const cloned = this.clone();
        cloned.history.redo();
        return cloned;
    }

    serialize() {
        return {details: this.details, history: this.history.serialize()}
    }

    smartSerialize(story: Story): SmartSerializedScene {
        const [matchAll, , , ] = story.getMatchRegExps();
        return {
            title: this.details.title,
            time: this.details.time,
            weather: this.details.weather,
            ids: [...new Set(this.history.current.prompt.match(matchAll))].map(name => story.getElementByName(name.split("@")[1])!.id),
            backgroundIds: {
                characters: this.details.backgroundIds[StoryElementType.character],
                objects: this.details.backgroundIds[StoryElementType.object],
                location: this.details.backgroundIds[StoryElementType.location]
            },
            prompt: this.history.current.prompt,
            fullText: this.history.current.fullText
        }
    }

    toJson(): string {  //Renamed to lowercase to avoid JSON.stringify from using this
        return JSON.stringify(this.serialize());
    }

    static from(scene: Scene) {
        return new Scene(scene.details, scene.history);
    }
    
    static fromJSON(json: string) {
        try {
            return new Scene(...JSON.parse(json));
        } catch (ex) {
            throw new Error("Failed to parse JSON file: " + ex);
        }
    }
}

export default Scene;
export {type SceneDetails, type SmartSerializedScene};