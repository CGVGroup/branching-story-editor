import React, { useMemo } from "react";
import { RichTextareaHandle } from "rich-textarea";
import { Combobox, ComboboxOptionProps, ScrollArea, Tabs } from "@mantine/core";
import { shortNoElementsText, StoryElement, StoryElementType, StoryElementTypeArray, StoryElementTypeDictionary, StoryElementTypeMentions } from "../StoryElements/StoryElement.ts";
import { storyElementTabsArray } from "./StoryElements.tsx";

function PromptAreaMenu(props: {
    allElements: StoryElement[],
    search: string,
    maxElementsShown: number,
    onClick: (id: string) => void,
    promptAreaRef: React.RefObject<RichTextareaHandle>
}) {
    const searchFiltered = useMemo(() => {
        if (!props.search) return props.allElements; 
        return props.allElements.filter(element =>
            element.name.toLowerCase().includes(props.search.toLowerCase()))
    }, [props.allElements, props.search]);

    if (props.allElements.length === 0) {
        return <Combobox.Options>
            <Combobox.Empty>
                Non sono presenti elementi nella storia attuale
            </Combobox.Empty>
        </Combobox.Options>
    }
    if (searchFiltered.length === 0) {
        return <Combobox.Options>
            <Combobox.Empty>
                Nessuna corrispondenza
            </Combobox.Empty>
        </Combobox.Options>
    }
    
    const searchAndTypeFiltered = StoryElementTypeArray.map(type => searchFiltered.filter(element => element.elementType === type));
    
    if (searchFiltered.length <= props.maxElementsShown) {
        return (
            <Combobox.Options>
                {searchAndTypeFiltered.map((filtered, idx) => {
                    if (filtered.length > 0) return (
                        <Combobox.Group
                            key={idx}
                            label={StoryElementTypeDictionary.ita.plural[filtered[0].elementType]}
                            style={{textTransform: "capitalize"}}>
                            {filtered.map(element => 
                                <ComboboxElementOption
                                    element={element}
                                    onClick={() => props.onClick(element.id)}/>
                            )}
                        </Combobox.Group>
                    )
                    else return <React.Fragment key={idx}></React.Fragment>
                })}
            </Combobox.Options>
        );
    }
    return (
        <Tabs defaultValue={StoryElementType.character.toString()} onChange={() => props.promptAreaRef?.current?.focus()}>
            <Tabs.List grow>
                {storyElementTabsArray.map(tab => 
                    <Tabs.Tab
                        key={tab.type}
                        value={tab.type.toString()}
                        color={tab.color}
                        style={{fontSize:"0.5em"}}>
                        {tab.tabContents}
                    </Tabs.Tab>
                )}
            </Tabs.List>
            {storyElementTabsArray.map(tab => 
                <Tabs.Panel key={tab.type} value={tab.type.toString()} keepMounted={false}>
                    {searchAndTypeFiltered[tab.type].length ? 
                        <ScrollArea.Autosize>
                            {searchAndTypeFiltered[tab.type]
                                .map(element => 
                                    <ComboboxElementOption
                                        element={element}
                                        onClick={() => props.onClick(element.id)}/>
                            )}
                        </ScrollArea.Autosize>
                    :
                        <Combobox.Empty>{shortNoElementsText[tab.type]}</Combobox.Empty>
                    }
                </Tabs.Panel>
            )}
        </Tabs>
    )
}

function ComboboxElementOption(
	props: {element: StoryElement} &
	Omit<ComboboxOptionProps, "value">
) {
	return (
		<Combobox.Option
			key={props.element.id}
			value={props.element.name}
			onClick={props.onClick}
			style={{ fontStyle: props.element.resident ? "italic" : undefined }}
			className={StoryElementTypeMentions[props.element.elementType]}
			{...props}>
			{props.element.name}
		</Combobox.Option>
	);
}


export default PromptAreaMenu;