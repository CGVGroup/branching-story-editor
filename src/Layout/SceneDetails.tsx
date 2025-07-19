import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { debounce } from 'throttle-debounce';
import { Avatar, Divider, Fieldset, Group, MultiSelect, Select, SimpleGrid, Stack, Text, Textarea, TextInput } from "@mantine/core";
import Story from "../StoryElements/Story.ts";
import { SceneDetails as SceneDetailsType} from "../StoryElements/Scene.ts";
import { noElementsText, noMatchingElementsText, StoryElementType, StoryElementTypeArray } from "../StoryElements/StoryElement.ts";
import { SceneDetailsEnumsContext } from "../App.tsx";

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
	const [backgroundCharacters, setBackgroundCharacters] = useState(props.details.backgroundIds[StoryElementType.character]);
	const [backgroundObjects, setBackgroundObjects] = useState(props.details.backgroundIds[StoryElementType.object]);
	const [backgroundLocation, setBackgroundLocation] = useState(props.details.backgroundIds[StoryElementType.location]);

	const sceneDetailsChoices = useContext(SceneDetailsEnumsContext)!;

	const renderOptions = useCallback(({ option }) => {
		const element = props.story.getElement(option.value)!;
		return ( 
			<Group gap="sm">
				<Avatar size={36} radius="xl" />
				<div>
					<Text size="sm" fs={element.resident ? "italic" : undefined}>{element.name}</Text>
					<Text size="xs" opacity={0.5}>
						{element.type}
						{element.type && element.description && " - "}
						{element.description}
					</Text>
				</div>
			</Group>
		);
	}, [props.story]);

	const allOptions = useMemo(() => 
		StoryElementTypeArray.map(
			type => props.story.getElementsByType(type)
				.map(element => {return {value: element.id, label: element.name}}))
	, [props.story]);

	const handleSave = useCallback(debounce(250, (
		title: string,
		summary: string,
		time: string,
		weather: string,
		tones: string[],
		value: string,
		backgroundCharacters: string[],
		backgroundObjects: string[],
		backgroundLocation: string
	) => {
		props.setDetails({
			title: title,
			summary: summary,
			time: time,
			weather: weather,
			tones: tones,
			value: value,
			backgroundIds: [Array.from(backgroundCharacters), Array.from(backgroundObjects), backgroundLocation]
		});
	}), []);

	useEffect(() => handleSave(title, summary, time, weather, tones, value, backgroundCharacters, backgroundObjects, backgroundLocation)
	, [handleSave, title, summary, time, weather, tones, value, backgroundCharacters, backgroundObjects, backgroundLocation]);

	return (
		<Fieldset legend="Dati Scena">
			<Stack gap="xs">
				<TextInput
					label="Titolo"
					value={title}
					onChange={e => setTitle(e.target.value)} />
				<Textarea
					label="Riassunto"
					maxRows={5}
					style={{ maxHeight: "10em" }}
					value={summary}
					onChange={e => setSummary(e.target.value)}/>
				<Divider label="Dettagli"/>
				<SimpleGrid cols={2}>
					<Select
						label="Orario"
						placeholder="Nessun Orario"
						value={time}
						onChange={time => setTime(time ?? "")}
						data={sceneDetailsChoices.time}
						clearable/>
					<Select
						label="Meteo"
						placeholder="Nessun Meteo"
						value={weather}
						onChange={weather => setWeather(weather ?? "")}
						data={sceneDetailsChoices.weather}
						clearable/>
					<MultiSelect
						label="Tono"
						placeholder={tones.length ? undefined : "Nessun Tono"}
						value={tones}
						onChange={tones => setTones(tones ?? [""])}
						data={sceneDetailsChoices.tone}
						clearable/>
					<Select
						label="Valore:"
						placeholder="Nessun Valore"
						value={value}
						onChange={value => setValue(value ?? "")}
						defaultValue="Nessun Valore"
						data={sceneDetailsChoices.value}
						clearable/>
				</SimpleGrid>
				<Divider label="Elementi di Sfondo"/>
				<MultiSelect
					label="Personaggi"
					value={backgroundCharacters}
					onChange={chars => setBackgroundCharacters(chars ?? [])}
					data={props.story.getElementsByType(StoryElementType.character).map(element => {return {value: element.id, label: element.name}})}
					placeholder={backgroundCharacters.length ? undefined : "Nessun Personaggio"}
					renderOption={renderOptions}
					nothingFoundMessage={allOptions[StoryElementType.character].length === 0 ? noElementsText(StoryElementType.character) : noMatchingElementsText(StoryElementType.character)}
					hidePickedOptions
					searchable/>
				<MultiSelect
					label="Oggetti"
					value={backgroundObjects}
					onChange={obj => setBackgroundObjects(obj ?? [])}
					data={allOptions[StoryElementType.object]}
					placeholder={backgroundObjects.length ? undefined : "Nessun Oggetto"}
					renderOption={renderOptions}
					nothingFoundMessage={allOptions[StoryElementType.object].length === 0 ? noElementsText(StoryElementType.object) : noMatchingElementsText(StoryElementType.object)}
					hidePickedOptions
					searchable/>
				<Select
					label="Luogo"
					value={backgroundLocation}
					onChange={loc => setBackgroundLocation(loc ?? "")}
					data={allOptions[StoryElementType.location]}
					placeholder={backgroundObjects.length ? undefined : "Nessun Luogo"}
					renderOption={renderOptions}
					nothingFoundMessage={allOptions[StoryElementType.location].length === 0 ? noElementsText(StoryElementType.location) : noMatchingElementsText(StoryElementType.location)}
					clearable
					searchable/>
			</Stack>
		</Fieldset>
	);
}

export default SceneDetails;