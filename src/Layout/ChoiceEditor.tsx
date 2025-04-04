import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Col, Collapse, Form, InputGroup } from "react-bootstrap";
import { debounce } from "throttle-debounce";
import { ChoiceDetails } from "../Flow/StoryNode.tsx";
import PromptArea from "./PromptArea.tsx";
import Story from "../StoryElements/Story.tsx";

function ChoiceEditor(props: {
    story: Story,
    choices: ChoiceDetails[],
    setChoices: (choices: ChoiceDetails[]) => void,
    readOnly?: boolean
}) {
    const [localChoices, setLocalChoices] = useState(props.choices);

    const textWidth = "25%";

    const addNewChoice = useCallback(() => {
        setLocalChoices(choices => [...choices, {title: "", choice: "", consequence: "", wrong: false}]);
    }, []);

    const deleteChoice = useCallback((index: number) => {
        setLocalChoices(choices => choices.filter((_, idx) => idx !== index));
    }, []);

    const setChoice = useCallback((idx: number, choice: ChoiceDetails) => {
        setLocalChoices(choices => choices.map((c, cIdx) => idx === cIdx ? choice : c)); 
    }, []);

    const moveChoiceRight = useCallback((index: number) => {
        setLocalChoices(choices => {[choices[index], choices[index+1]] = [choices[index+1], choices[index]]; return [...choices]});
    }, []);
    
    const moveChoiceLeft = useCallback((index: number) => {
        setLocalChoices(choices => {[choices[index-1], choices[index]] = [choices[index], choices[index-1]]; return [...choices]});
    }, []);

    const handleSave = useCallback(debounce(250, (localChoices: ChoiceDetails[]) => {
        props.setChoices(localChoices);
    }), []);

    useEffect(() => handleSave(localChoices), [handleSave, localChoices]);

    return (
        <Col>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5em"}}>
                {localChoices.map((choice, choiceIndex, choices) => 
                    <Card key={choiceIndex} className={choice.wrong ? "wrong-choice" : ""}>
                        <Card.Header className="d-flex align-items-center">
                            <InputGroup className="flex-grow-1">
                                <InputGroup.Text>    
                                    <Card.Title className="m-0">
                                        {`Scelta ${choiceIndex + 1}:`}
                                    </Card.Title>
                                </InputGroup.Text>
                                <Form.Control
                                    value={choice.title}
                                    onChange={e => setChoice(choiceIndex, {...localChoices[choiceIndex], title: e.target.value})}
                                    disabled={props.readOnly} />
                                {!props.readOnly &&
                                    <>
                                        <Button variant="danger" onClick={() => deleteChoice(choiceIndex)} title="Elimina">
                                            <i className="bi bi-trash" aria-label="delete" /> 
                                        </Button>
                                        <Button variant="secondary" onClick={() => moveChoiceLeft(choiceIndex)} disabled={choiceIndex === 0} title="Sposta a sinistra">
                                            <i className="bi bi-chevron-left" aria-label="move left" /> 
                                        </Button>
                                        <Button variant="secondary" onClick={() => moveChoiceRight(choiceIndex)} disabled={choiceIndex === choices.length - 1} title="Sposta a destra">
                                            <i className="bi bi-chevron-right" aria-label="move right" /> 
                                        </Button>
                                    </>
                                }
                            </InputGroup>
                        </Card.Header>
                        <Card.Body style={{overflowY:"auto"}}>
                            <Form onSubmit={e => e.preventDefault()}>
                                <InputGroup>
                                    <InputGroup.Text style={{width:textWidth}}>Scelta giusta:</InputGroup.Text>
                                    <Button
                                        variant={choice.wrong ? "danger" : "success"}
                                        onClick={() => setChoice(choiceIndex, {...localChoices[choiceIndex], wrong: !localChoices[choiceIndex].wrong})}
                                        disabled={props.readOnly}>
                                        {choice.wrong ? <i className="bi bi-x-lg"/> : <i className="bi bi-check-lg"/>}
                                    </Button>
                                </InputGroup>
                                <div style={{height:"5em"}}>
                                    <PromptArea
                                        initialText={choice.choice}
                                        story={props.story}
                                        setText={(text: string) => setChoice(choiceIndex, {...localChoices[choiceIndex], choice: text})}
                                        readOnly={props.readOnly} />
                                </div>
                                <Collapse in={choice.wrong}>
                                    <InputGroup>
                                        <InputGroup.Text style={{width:textWidth}}>Conseguenza:</InputGroup.Text>
                                        <Form.Control
                                            as="textarea"
                                            value={choice.consequence}
                                            onChange={e => setChoice(choiceIndex, {...localChoices[choiceIndex], consequence: e.target.value})}
                                            disabled={props.readOnly} />
                                    </InputGroup>
                                </Collapse>
                            </Form>
                        </Card.Body>
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
            </div>
        </Col>
    );
}

export default ChoiceEditor;