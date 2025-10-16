import { useContext, useMemo } from "react";
import { Select, Stack } from "@mantine/core";
import Story, { StorySettingsType } from "../StoryElements/Story.ts";
import { ModelListContext, PromptListContext } from "../App.tsx";
import { noElementsText, noMatchingElementsText, shortNoElementsText, StoryElementType } from "../StoryElements/StoryElement.ts";

function StorySettings(props: {
    story: Story,
    setSettings: (settings: StorySettingsType) => void
}) {    
    const models = useContext(ModelListContext)!;
    const prompts = useContext(PromptListContext)!;

    const allCharacters = useMemo(() => 
        props.story.getElementsByType(StoryElementType.character)
            .map(element => {return {value: element.id, label: element.name}})
    , [props.story]);

    return (
        <Stack p="xs">
            <Select
                label="LLM"
                allowDeselect={false}
                defaultValue={props.story.settings.model}
                onChange={model => props.setSettings({...props.story.settings, model: model!})}
                data={models}/>
            <Select
                label="Prompt"
                allowDeselect={false}
                defaultValue={props.story.settings.prompt}
                onChange={prompt => props.setSettings({...props.story.settings, prompt: prompt!})}
                data={prompts}/>
            <Select
                label="Protagonista"
                value={props.story.settings.mainCharacter}
                onChange={mainCharacter => props.setSettings({...props.story.settings, mainCharacter: mainCharacter!})}
                data={allCharacters}
                placeholder={props.story.settings.mainCharacter ? undefined : shortNoElementsText[StoryElementType.character]}
                nothingFoundMessage={allCharacters.length === 0 ? noElementsText[StoryElementType.character] : noMatchingElementsText[StoryElementType.character]}
                searchable
                clearable/>
        </Stack>
    );
}

export default StorySettings;