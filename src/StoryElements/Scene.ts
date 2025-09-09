import UndoStack from "../Misc/UndoStack.ts";
import Story from "./Story.ts";
import { StoryElementType } from "./StoryElement.ts";

/**
 * All miscellaneous details of a Scene that are not Prompt and Full Text. 
 */
type SceneDetails = {
	title: string;
	summary: string;
	time: string;
	weather: string;
	tones: string[];
	value: string;
	backgroundIds: [string[], string[], string];
}

/**
 * One item of the editor's {@link UndoStack}.
 */
type HistoryElement = {
	prompt: string;
	fullText: string;
}

/**
 * Useful info for the exported JSON.
 */
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

/**
 * Contains all data for a Scene Node.
 * 
 * Intended to be used in conjunction with {@link React.useState useState}, most manipulations involve cloning.
 * @param details {@link SceneDetails} for the Scene
 * @param history {@link UndoStack} containing all previous {prompt, fullText} pairs
 */
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
			ids: [...new Set(this.history.current.prompt.match(matchAll))].filter(name => name.length > 0).map(name => story.getElementByName(name.split("@")[1])!.id),
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