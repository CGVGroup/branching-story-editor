type SceneDetails = {
    title: string;
    summary: string;
    time: string;
    weather: string;
    tone: string;
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
            tone: details?.tone ?? "",
            value: details?.value ?? "",
            backgroundIds: details?.backgroundIds ?? [[], [], []],
        }
        this.prompt = prompt ?? "";
        this.fullText = fullText ?? "";
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