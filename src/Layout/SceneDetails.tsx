import React, { useCallback, useContext, useState } from "react";
import { Button, Card, Col, Form, InputGroup, ListGroup, Modal, Row } from "react-bootstrap";
import Story from "../StoryElements/Story.ts";
import { SceneDetails as SceneDetailsType} from "../StoryElements/Scene.ts";
import { StoryElementType } from "../StoryElements/StoryElement.ts";
import { SceneDetailsContext } from "../App.tsx";
import DropdownTextField from "./DropdownTextField.tsx";
import { ChipList, ElementChip } from "./ElementChip.tsx";
import BackgroundElementsModal from "./BackgroundElementsModal.tsx";

function SceneDetails(props: {
	story: Story,
	details: SceneDetailsType,
	setDetails: (newDetails: SceneDetailsType) => void,
}) {
	const [title, setTitle] = useState(props.details.title);
	const [summary, setSummary] = useState(props.details.summary);
	const [time, setTime] = useState(props.details.time);
	const [weather, setWeather] = useState(props.details.weather);
	const [tone, setTone] = useState(props.details.tone);
	const [value, setValue] = useState(props.details.value);
	const [backgroundCharacters, setBackgroundCharacters] = useState(new Set(props.details.backgroundIds[StoryElementType.character]));
	const [backgroundObjects, setBackgroundObjects] = useState(new Set(props.details.backgroundIds[StoryElementType.object]));
	const [backgroundLocations, setBackgroundLocations] = useState(new Set(props.details.backgroundIds[StoryElementType.location]));

	const [backgroundsModal, setBackgroundsModal] = useState(false);

	const sceneDetailsChoices = useContext(SceneDetailsContext);

	const textWidth = "20%";

	const handleSave = useCallback(() => {
		props.setDetails({
			title: title,
			summary: summary,
			time: time,
			weather: weather,
			tone: tone,
			value: value,
			backgroundIds: [Array.from(backgroundCharacters), Array.from(backgroundObjects), Array.from(backgroundLocations)]})
	}, [title, summary, time, weather, tone, value, backgroundCharacters, backgroundObjects, backgroundLocations]);

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
				noElementTexts={["Nessun Personaggio", "Nessun Oggetto", "Nessun Luogo"]}/>
			<Card.Header>
				<h4>Dettagli scena</h4>
			</Card.Header>
			<Card.Body>
				<Form onBlur={handleSave}>
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
					<DropdownTextField
						label="Orario"
						value={time}
						setValue={setTime}
						defaultValue="Nessun Orario"
						choices={sceneDetailsChoices.time} />
					<DropdownTextField
						label="Meteo"
						value={weather}
						setValue={setWeather}
						defaultValue="Nessun Meteo"
						choices={sceneDetailsChoices.weather} />
					<DropdownTextField
						label="Tono"
						value={tone}
						setValue={setTone}
						defaultValue="Nessun Tono"
						choices={sceneDetailsChoices.tone} />
					<DropdownTextField
						label="Valore"
						value={value}
						setValue={setValue}
						defaultValue="Nessun Valore"
						choices={sceneDetailsChoices.value} />
					<hr/>
					<InputGroup>
						<InputGroup.Text style={{ width: textWidth }}>Sfondo:</InputGroup.Text>
						<Col className="px-2">
							<ChipList 
								values={backgroundCharacters}
								setValues={setBackgroundCharacters}
								allValues={props.story.characters}
								className="character-mention"
								noElementsText="Nessun Personaggio" />
							<ChipList 
								values={backgroundObjects}
								setValues={setBackgroundObjects}
								allValues={props.story.objects}
								className="object-mention"
								noElementsText="Nessun Oggetto" />
							<ChipList 
								values={backgroundLocations}
								setValues={setBackgroundLocations}
								allValues={props.story.locations}
								className="location-mention"
								noElementsText="Nessun Luogo" />
						</Col>
						<Button onClick={() => setBackgroundsModal(true)}>
							<i className="bi bi-pencil" />
						</Button>
					</InputGroup>
					
				</Form>
			</Card.Body>
		</Card>
	);
}

export default SceneDetails;