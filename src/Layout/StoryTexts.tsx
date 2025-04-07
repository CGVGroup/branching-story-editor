import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Accordion, Button, Card, Col, FloatingLabel, Form, Row, Spinner } from "react-bootstrap";
import { debounce } from "throttle-debounce";
import Scene from "../StoryElements/Scene.ts";
import ChoiceEditor from "./ChoiceEditor.tsx";
import { ChoiceDetails, ChoiceNodeProps, SceneNodeProps } from "../Flow/StoryNode.tsx";
import Story from "../StoryElements/Story.ts";
import PromptArea from "./PromptArea.tsx";
import { sendToLLM } from "../Misc/LLM.ts";

function StoryTexts(props: {
    story: Story,
    setStory: (newStory: Story) => void,
    onClickOpenScene: (id: string) => void,
}) {
    const [localStory, setLocalStory] = useState<Story>(props.story.clone());
    const [loadings, setLoadings] = useState<boolean[]>(new Array(localStory.flow.nodes.length).fill(false));
    
    const onFullTextEdited = useCallback((id: string, newText: string) => {
        setLocalStory(story => {
            const scene = story.getSceneById(id)!;
            return story.cloneAndSetScene(id, new Scene(scene.details, scene.prompt, newText));
    })}, []);
    
    const onPromptTextEdited = useCallback((id: string, newPrompt: string) => {
        setLocalStory(story => {
            const scene = story.getSceneById(id)!;
            return story.cloneAndSetScene(id, new Scene(scene.details, newPrompt, scene.fullText));
    })}, []);
    
    const onChoiceEdited = useCallback((id: string, newChoice: ChoiceDetails[]) => {
        setLocalStory(story => {
            return story.cloneAndSetChoice(id, newChoice);
    })}, []);

    const onSendButtonClicked = useCallback(async (id: string) => {
        const index = localStory.getAllNodes().findIndex(node => node.id === id);
        setLoadings(loadings => loadings.map((loading, idx) => idx === index ? true : loading));
        const response = await sendToLLM("");
        /*if (response.ok) {
            const responseText = await response.text();
            onFullTextEdited(id, responseText);
            }*/
        onFullTextEdited(id, response);
        setLoadings(loadings => loadings.map((loading, idx) => idx === index ? false : loading));
    }, [localStory, onFullTextEdited]);

    const handleSave = useCallback(debounce(250, (localStory: Story) => 
        props.setStory(localStory)
    ), []);

    const accordionElements = useMemo(() => 
        localStory.flow.nodes.length > 0 ?
            localStory.flow.nodes
            .sort((n1, n2) => n1.position.x - n2.position.x)
            .map((node, idx) => {
                const id = node.id;
                if (node.type === "sceneNode") {
                    const data = node.data as SceneNodeProps;
                    return (
                        <Accordion.Item eventKey={id} key={idx}>
                            <Accordion.Header>
                                {`${data.label}${data.scene?.details.title ? " - " : ""}${data.scene?.details.title}`} 
                            </Accordion.Header>
                            <Accordion.Body>
                                <Row style={{height:"10em"}}>
                                    <Col xs={4}>
                                        <PromptArea
                                            story={localStory}
                                            initialText={data.scene?.prompt}
                                            setText={(text: string) => onPromptTextEdited(id, text)} />
                                    </Col>
                                    <Col xs={1} style={{alignContent:"center"}}>
                                        <Button onClick={() => props.onClickOpenScene(id)} title="Vai alla scena">
                                            <i className="bi bi-box-arrow-up-right" />
                                        </Button>
                                        <Button variant="secondary" onClick={() => onSendButtonClicked(id)} disabled={loadings[idx]} title="Invia all'IA">
                                            {loadings[idx] ? 
                                                <Spinner size="sm"/>
                                            :
                                                <i className="bi bi-send" />
                                            }
                                        </Button>
                                    </Col>
                                    <Col>
                                        <FloatingLabel className="h-100 w-100" label="Testo completo:">
                                            <Form.Control
                                                as="textarea"
                                                value={data.scene?.fullText}
                                                className="full-text"
                                                placeholder="Testo Completo"
                                                style={{height:"100%", width:"100%"}}
                                                onChange={e => onFullTextEdited(id, e.target.value)}
                                                disabled={loadings[idx]} >
                                            </Form.Control>
                                        </FloatingLabel>
                                    </Col>
                                </Row>
                            </Accordion.Body>
                        </Accordion.Item>
                    );
                } else if (node.type === "choiceNode") {
                    const data = node.data as ChoiceNodeProps;
                    return <Accordion.Item eventKey={id} key={idx} className="choice">
                        <Accordion.Header>
                            {`${data.label}${data.choices?.length > 0 ? " - " : ""}${data.choices.map(choice => choice.title).join(" / ")}`}
                        </Accordion.Header>
                        <Accordion.Body>
                            <ChoiceEditor
                                key={idx}
                                story={localStory}
                                choices={node.data.choices as ChoiceDetails[]}
                                setChoices={newChoice => onChoiceEdited(id, newChoice)} />
                        </Accordion.Body>
                    </Accordion.Item>
                }
                return <></>
            }
        )
    :
        <Accordion.Item eventKey="no-stories">
            Nessuna Scena nella Storia
        </Accordion.Item>
    , [localStory, loadings, onChoiceEdited, onFullTextEdited, onPromptTextEdited, onSendButtonClicked, props.onClickOpenScene]);

    useEffect(() => handleSave(localStory), [handleSave, localStory]);

    return (
        <Card className="h-100" style={{overflowY:"auto"}}>
            <Accordion flush>
                {accordionElements}
            </Accordion>
        </Card>
    )
}

export default StoryTexts;