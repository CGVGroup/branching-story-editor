import { useCallback, useContext, useEffect, useState } from "react";
import { Button, Card, Col, Form, InputGroup } from "react-bootstrap";
import { debounce } from 'throttle-debounce';
import Select from "react-select";
import Story from "../StoryElements/Story.ts";
import { SceneDetails as SceneDetailsType} from "../StoryElements/Scene.ts";
import { StoryElementType } from "../StoryElements/StoryElement.ts";
import { SceneDetailsEnumsContext } from "../App.tsx";
import DropdownField from "./DropdownField.tsx";
import { ChipList } from "./ElementChip.tsx";
import BackgroundElementsModal from "./BackgroundElementsModal.tsx";
import { storyElementTabsArray } from "./StoryElements.tsx";

function SceneDetails(props: {
	story: Story,
	details: SceneDetailsType,
	setDetails: (newDetails: SceneDetailsType) => void,
}) {
	const [title, setTitle] = useState(props.details.title);
	const [summary, setSummary] = useState(props.details.summary);
	const [time, setTime] = useState(props.details.time);
	const [weather, setWeather] = useState(props.details.weather);
	const [tones, setTones] = useState(props.details.tones);
	const [value, setValue] = useState(props.details.value);
	const [backgroundCharacters, setBackgroundCharacters] = useState(new Set(props.details.backgroundIds[StoryElementType.character]));
	const [backgroundObjects, setBackgroundObjects] = useState(new Set(props.details.backgroundIds[StoryElementType.object]));
	const [backgroundLocations, setBackgroundLocations] = useState(new Set(props.details.backgroundIds[StoryElementType.location]));

	const [backgroundsModal, setBackgroundsModal] = useState(false);

	const sceneDetailsChoices = useContext(SceneDetailsEnumsContext)!;

	const textWidth = "20%";

	const handleSave = useCallback(debounce(250, (
		title: string,
		summary: string,
		time: string,
		weather: string,
		tones: string[],
		value: string,
		backgroundCharacters: Set<string>,
		backgroundObjects: Set<string>,
		backgroundLocations: Set<string>
	) => {
		props.setDetails({
			title: title,
			summary: summary,
			time: time,
			weather: weather,
			tones: tones,
			value: value,
			backgroundIds: [Array.from(backgroundCharacters), Array.from(backgroundObjects), Array.from(backgroundLocations)]
		});
	}), []);

	useEffect(() => handleSave(title, summary, time, weather, tones, value, backgroundCharacters, backgroundObjects, backgroundLocations)
	, [handleSave, title, summary, time, weather, tones, value, backgroundCharacters, backgroundObjects, backgroundLocations]);

	return (
		<Card>
			<BackgroundElementsModal
				show={backgroundsModal}
				setShow={setBackgroundsModal}
				story={props.story}
				selectedCharacters={backgroundCharacters}
				setSelectedCharacters={setBackgroundCharacters}
				selectedObjects={backgroundObjects}
				setSelectedObjects={setBackgroundObjects}
				selectedLocation={backgroundLocations}
				setSelectedLocation={setBackgroundLocations}
				noElementTexts={storyElementTabsArray.map(element => element.noElementsText)}/>
			<Card.Header>
				<h4>Dettagli scena</h4>
			</Card.Header>
			<Card.Body>
				<Form>
					<InputGroup>
						<InputGroup.Text style={{ width: textWidth }}>Titolo:</InputGroup.Text>
						<Form.Control
							value={title}
							onChange={e => setTitle(e.target.value)} />
					</InputGroup>
					<InputGroup>
						<InputGroup.Text style={{ width: textWidth }}>Riassunto:</InputGroup.Text>
						<Form.Control
							as="textarea"
							style={{ maxHeight: "10em" }}
							value={summary}
							onChange={e => setSummary(e.target.value)} />
					</InputGroup>
					<hr />
					<DropdownField
						label="Orario:"
						value={time}
						setValue={setTime}
						defaultValue="Nessun Orario"
						labelWidth={textWidth}
						choices={sceneDetailsChoices.time} />
					<DropdownField
						label="Meteo:"
						value={weather}
						setValue={setWeather}
						defaultValue="Nessun Meteo"
						labelWidth={textWidth}
						choices={sceneDetailsChoices.weather} />
					<InputGroup style={{textAlign: "left"}}>
						<InputGroup.Text style={{width: textWidth}}>{"Toni:"}</InputGroup.Text>
						<Select
							placeholder={"Nessun Tono"}
							value={tones.map(tone => {return {label: tone, value: tone}})}
							options={sceneDetailsChoices.tone.map(tone => {return {label: tone, value: tone}})}
							onChange={tones => {setTones(tones.map(tone => tone.value))}}
							closeMenuOnSelect={false}
							isMulti
							styles={{container: (styles) => {return {...styles, width: `calc(100% - ${textWidth})`}}}} />
					</InputGroup>
					<DropdownField
						label="Valore:"
						value={value}
						setValue={setValue}
						defaultValue="Nessun Valore"
						labelWidth={textWidth}
						choices={sceneDetailsChoices.value} />
					<hr/>
					<InputGroup>
						<InputGroup.Text style={{ width: textWidth, overflow: "hidden" }}>Sfondo:</InputGroup.Text>
						{backgroundCharacters.size || backgroundObjects.size || backgroundLocations.size ?
							<Col className="px-2">
								{!!backgroundCharacters.size && <ChipList 
									values={backgroundCharacters}
									setValues={setBackgroundCharacters}
									allValues={props.story.getElementsByType(StoryElementType.character)}
									className="character-mention"
									noElementsText="Nessun Personaggio" />}
								{!!backgroundObjects.size && <ChipList 
									values={backgroundObjects}
									setValues={setBackgroundObjects}
									allValues={props.story.getElementsByType(StoryElementType.object)}
									className="object-mention"
									noElementsText="Nessun Oggetto" />}
								{!!backgroundLocations.size && <ChipList 
									values={backgroundLocations}
									setValues={setBackgroundLocations}
									allValues={props.story.getElementsByType(StoryElementType.location)}
									className="location-mention"
									noElementsText="Nessun Luogo" />}
							</Col>
						:
							<Form.Control disabled defaultValue="Nessun Elemento di Sfondo" style={{backgroundColor: "transparent", opacity: "66%"}}/>}
						<Button
							onClick={() => setBackgroundsModal(true)}
							title="Modifica elementi di sfondo"
							variant="secondary">
							<i className="bi bi-pencil" aria-label="edit" />
						</Button>
					</InputGroup>
					
				</Form>
			</Card.Body>
		</Card>
	);
}

export default SceneDetails;