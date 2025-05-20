import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Form, InputGroup, Stack } from "react-bootstrap";
import { debounce } from "throttle-debounce";
import Story from "../StoryElements/Story.tsx";
import Choice, { ChoiceDetails } from "../StoryElements/Choice.ts";
import DynamicTextField from "./DynamicTextField.tsx";
import { getConnectedEdges, getOutgoers } from "@xyflow/react";

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
        const thisNode = props.story.getNodeById(props.nodeId)!;
        const outgoingEdges = getConnectedEdges([thisNode], props.story.flow.edges).filter(edge => edge.source === thisNode.id);
        return localChoice.choices.map((_, idx) => outgoingEdges.find(edge => edge.sourceHandle === `source-${idx}`)?.target ?? null);
    }, [localChoice])

    useEffect(() => handleSave(localChoice), [handleSave, localChoice]);

    return (
        <Col>
            <Stack gap={2}>
                <DynamicTextField
                    initialValue={localChoice.title}
                    onSubmit={setTitle}
                    baseProps={{
                        id: "title",
                        size: "lg",
                        placeholder: "Nessun interrogativo"
                    }}/>
                {localChoice.choices.map((choice, choiceIndex, choices) => 
                    <Card key={choiceIndex} className={choice.wrong ? "wrong-choice" : ""}>
                        <Card.Header className="d-flex align-items-center">
                            <InputGroup className="flex-grow-1">
                                <InputGroup.Text>    
                                    <Card.Title className="m-0">
                                        {`Scelta ${choiceIndex + 1}:`}
                                    </Card.Title>
                                </InputGroup.Text>
                                <Form.Control
                                    value={choice.text}
                                    onChange={e => setChoiceText(choiceIndex, e.target.value)}
                                    disabled={props.readOnly} />
                                {!props.readOnly &&
                                    <>
                                        <Button variant="danger" onClick={() => deleteChoice(choiceIndex)} title="Elimina">
                                            <i className="bi bi-trash" aria-label="delete" /> 
                                        </Button>
                                        <Button variant="primary"
                                            onClick={() => props.onClickEditNode(nextSceneIds[choiceIndex]!)}
                                            title="Apri scena successiva"
                                            disabled={nextSceneIds[choiceIndex] === null}>
                                            <i className="bi bi-box-arrow-up-right" aria-label="open" /> 
                                        </Button>
                                        <Button variant="secondary" onClick={() => moveChoiceUp(choiceIndex)} disabled={choiceIndex === 0} title="Sposta su">
                                            <i className="bi bi-chevron-up" aria-label="move up" /> 
                                        </Button>
                                        <Button variant="secondary" onClick={() => moveChoiceDown(choiceIndex)} disabled={choiceIndex === choices.length - 1} title="Sposta giù">
                                            <i className="bi bi-chevron-down" aria-label="move down" /> 
                                        </Button>
                                    </>
                                }
                            </InputGroup>
                        </Card.Header>
                    </Card>
                )}
                {!props.readOnly &&
                    <Button variant="light" onClick={addNewChoice}>
                        <Col>
                            <i className="bi bi-plus-square-dotted" style={{display: "block", fontSize:"xxx-large"}} />
                            Aggiungi Scelta
                        </Col>
                    </Button>
                }
            </Stack>
        </Col>
    );
}

export default ChoiceEditor;