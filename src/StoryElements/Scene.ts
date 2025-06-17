type SceneDetails = {
    title: string;
    summary: string;
    time: string;
    weather: string;
    tones: string[];
    value: string;
    backgroundIds: [string[], string[], string[]];
}

class Scene {
    details: SceneDetails;
    prompt: string;
    fullText: string;

    constructor(
        details?: Partial<SceneDetails>,
        prompt?: string,
        fullText?: string
    ) {
        this.details = {
            title: details?.title ?? "",
            summary: details?.summary ?? "",
            time: details?.time ?? "",
            weather: details?.weather ?? "",
            tones: details?.tones ?? [],
            value: details?.value ?? "",
            backgroundIds: details?.backgroundIds ?? [[], [], []],
        };
        this.prompt = prompt ?? "";
        this.fullText = fullText ?? "";
    }

    clone(): Scene {
        return new Scene(this.details, this.prompt, this.fullText);
    }

    cloneAndSetDetails(details: SceneDetails): Scene {
        const cloned = this.clone();
        cloned.details = details;
        return cloned;
    }
    cloneAndSetPrompt(prompt: string): Scene {
        const cloned = this.clone();
        cloned.prompt = prompt;
        return cloned;
    }
    cloneAndSetFullText(fullText: string): Scene {
        const cloned = this.clone();
        cloned.fullText = fullText;
        return cloned;
    }

    toJson(): string {  //Renamed to lowercase to avoid JSON.stringify from using this
        return JSON.stringify(this);
    }

    static from(scene: Scene) {
        return new Scene(scene.details, scene.prompt, scene.fullText);
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
export {type SceneDetails};