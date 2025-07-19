import { useCallback, useEffect, useMemo, useState } from "react";
import { getConnectedEdges } from "@xyflow/react";
import { ActionIcon, ActionIconGroup, Button, Group, Stack, TextInput } from "@mantine/core";
import { debounce } from "throttle-debounce";
import Story from "../StoryElements/Story.tsx";
import Choice from "../StoryElements/Choice.ts";

function ChoiceEditor(props: {
    story: Story,
    nodeId: string,
    choice: Choice,
    setChoice: (choice: Choice) => void,
    onChoiceMoved: (oldIdx: number, newIdx: number) => void,
    onChoiceDeleted: (idx: number) => void,
    onClickEditNode: (id: string) => void,
    readOnly?: boolean
}) {
    const [localChoice, setLocalChoice] = useState(Choice.from(props.choice));

    const addNewChoice = useCallback(() => {
        setLocalChoice(choice => choice.cloneAndAddChoice());
    }, []);

    const deleteChoice = useCallback((index: number) => {
        setLocalChoice(choice => choice.cloneAndDeleteAtIndex(index));
        props.onChoiceDeleted(index);
    }, [props.onChoiceDeleted]);

    const setChoiceText = useCallback((idx: number, text: string) => {
        setLocalChoice(choice => choice.cloneAndSetChoiceText(idx, text)); 
    }, []);

    const setTitle = useCallback((title: string) => {
        setLocalChoice(choice => choice.cloneAndSetTitle(title));
    }, []);

    const moveChoiceDown = useCallback((index: number) => {
        setLocalChoice(choice => choice.cloneAndMoveChoice(index, index + 1));
        props.onChoiceMoved(index, index + 1);
    }, [props.onChoiceMoved]);
    
    const moveChoiceUp = useCallback((index: number) => {
        setLocalChoice(choice => choice.cloneAndMoveChoice(index, index - 1));
        props.onChoiceMoved(index, index - 1);
    }, [props.onChoiceMoved]);

    const handleSave = useCallback(debounce(250, (localChoice: Choice) => {
        props.setChoice(localChoice);
    }), []);

    const nextSceneIds = useMemo(() => {
        const thisNode = props.story.getNode(props.nodeId)!;
        const outgoingEdges = getConnectedEdges([thisNode], props.story.flow.edges).filter(edge => edge.source === thisNode.id);
        return localChoice.choices.map((_, idx) => outgoingEdges.find(edge => edge.sourceHandle === `source-${idx}`)?.target ?? null);
    }, [localChoice])

    useEffect(() => handleSave(localChoice), [handleSave, localChoice]);

    return (
        <Stack gap={2}>
            <TextInput
                defaultValue={localChoice.title}
                onChange={e => setTitle(e.currentTarget.value)}
                size="lg"
                placeholder="Nessun interrogativo"
                label="Interrogativo"/>
            {localChoice.choices.map((choice, choiceIndex, choices) => 
                <Group key={choiceIndex} className={choice.wrong ? "wrong-choice" : ""}>
                    <TextInput
                        value={choice.text}
                        size="md"
                        onChange={e => setChoiceText(choiceIndex, e.target.value)}
                        disabled={props.readOnly}
                        label={`Scelta ${choiceIndex + 1}`}
                        style={{flexGrow: 1}}/>
                    {!props.readOnly &&
                        <ActionIconGroup>
                            <ActionIcon onClick={() => deleteChoice(choiceIndex)} title="Elimina" size="lg">
                                <i className="bi bi-trash" aria-label="delete" /> 
                            </ActionIcon>
                            <ActionIcon
                                onClick={() => props.onClickEditNode(nextSceneIds[choiceIndex]!)}
                                title="Apri scena successiva"
                                disabled={nextSceneIds[choiceIndex] === null} size="lg">
                                <i className="bi bi-box-arrow-up-right" aria-label="open" /> 
                            </ActionIcon>
                            <ActionIcon onClick={() => moveChoiceUp(choiceIndex)} disabled={choiceIndex === 0} title="Sposta su" size="lg">
                                <i className="bi bi-chevron-up" aria-label="move up" /> 
                            </ActionIcon>
                            <ActionIcon onClick={() => moveChoiceDown(choiceIndex)} disabled={choiceIndex === choices.length - 1} title="Sposta giù" size="lg">
                                <i className="bi bi-chevron-down" aria-label="move down" /> 
                            </ActionIcon>
                        </ActionIconGroup>
                    }
                </Group>
            )}
            {!props.readOnly &&
                <Button size="xl" variant="subtle" onClick={addNewChoice} title="Aggiungi Scelta">
                    <i className="bi bi-plus-square-dotted" style={{display: "block", fontSize:"xxx-large"}} />
                </Button>
            }
        </Stack>
    );
}

export default ChoiceEditor;