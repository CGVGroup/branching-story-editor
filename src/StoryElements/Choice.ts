import StoryFlowChartEditor from "../Flow/StoryFlowChartEditor.tsx";

/**
 * Data for a single choice of a Choice Node.
 * @param text the action/decision associated with the choice
 * @param wrong whether the branch eventually leads back to this choice (automatically set, see {@link StoryFlowChartEditor}'s `onConnect`, `onNodesChange`, `onEdgesChange`)
 */
type ChoiceDetails = {
	text: string;
	wrong: boolean;
}

/**
 * Useful info for the exported JSON.
 */
type SmartSerializedChoice = {
	title: string,
	choices: {
		text: string,
		wrong: boolean,
		next: string
	}[]
}
/**
 * Contains all data for a Choice Node.
 * 
 * Intended to be used in conjunction with {@link React.useState useState}, most manipulations involve cloning.
 * @param title question of the choice
 * @param choices ordered array of {@link ChoiceDetails}
 */
class Choice {
	title: string;
	choices: ChoiceDetails[];

	constructor(
		title?: string,
		choices?: ChoiceDetails[]
	) {
		this.title = title ?? "";
		this.choices = choices ? [...choices] : [{text: "A", wrong: false}, {text: "B", wrong: false}];
	}

	clone(): Choice {
		return new Choice(this.title, this.choices);
	}

	cloneAndSetTitle(title: string) {
		const cloned = this.clone();
		cloned.title = title;
		return cloned;
	}

	cloneAndSetChoice(index: number, choice: ChoiceDetails) {
		const cloned = this.clone();
		cloned.choices[index] = choice;
		return cloned;
	}

	cloneAndSetChoices(choices: ChoiceDetails[]) {
		const cloned = this.clone();
		cloned.choices = choices;
		return cloned;
	}

	cloneAndSetChoiceText(index: number, text: string) {
		return this.cloneAndSetChoice(index, {text: text, wrong: this.choices[index].wrong});
	}
	cloneAndSetChoiceWrong(index: number, wrong: boolean) {
		return this.cloneAndSetChoice(index, {text: this.choices[index].text, wrong: wrong});
	}

	cloneAndAddChoice(choice?: ChoiceDetails) {
		return this.cloneAndSetChoice(this.choices.length, choice ?? {text: "", wrong: false});
	}

	cloneAndMoveChoice(oldIdx: number, newIdx: number) {
		const cloned = this.clone();
		[cloned.choices[oldIdx], cloned.choices[newIdx]] = [cloned.choices[newIdx], cloned.choices[oldIdx]];
		return cloned;
	}

	cloneAndDeleteAtIndex(index: number) {
		if (index >= this.choices.length) return this;
		const cloned = this.clone();
		cloned.choices = cloned.choices.filter((_, idx) => idx !== index);
		return cloned;
	}
	
	smartSerialize(): SmartSerializedChoice {
		return {
			title: this.title,
			choices: this.choices.map(choice => {return {
				text: choice.text,
				wrong: choice.wrong,
				next: ""
			}})
		}
	}

	toJson(): string {  //Renamed to lowercase to avoid JSON.stringify from using this
		return JSON.stringify(this);
	}

	static from(choice: Choice) {
		return new Choice(choice.title, choice.choices);
	}
	
	static fromJSON(json: string) {
		try {
			return new Choice(...JSON.parse(json));
		} catch (e) {
			throw new Error("Failed to parse JSON file: " + e);
		}
	}

	/**
	 * Fancy wrapper for string.split("-").
	 * 
	 * Assumes handle names as the default "source-{index}" or "target-{index}".
	 */
	static getIndexFromHandleName(handleName: string) {
		return Number.parseInt(handleName.split("-")[1]);
	}
}

export default Choice;
export {type ChoiceDetails, type SmartSerializedChoice};