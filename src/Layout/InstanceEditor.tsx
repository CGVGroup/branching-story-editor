import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Accordion, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import Scene from "../StoryElements/Scene.ts";
import ChoiceEditor from "./ChoiceEditor.tsx";
import { ChoiceDetails, ChoiceNodeProps, SceneNodeProps } from "../Flow/StoryNode.tsx";
import Template from "../StoryElements/Template.ts";
import Story from "../StoryElements/Story.ts";
import PromptArea from "./PromptArea.tsx";
import StoryElements from "./StoryElements.tsx";

function InstanceEditor(props: {
    stories: Map<string, Template>,
    setInstance: (id: string, index: number, newStory: Story) => void
}) {
    const { id, index } = useParams();
    const [localInstance, setLocalInstance] = useState<Story>(props.stories.get(id!)!.instances[Number.parseInt(index!)].instance);
    const [fullTexts, setFullTexts] = useState<string[]>(localInstance.flow.nodes.map(node => (node.data.scene as Scene)?.fullText));
    const [loadings, setLoadings] = useState<boolean[]>(new Array(fullTexts.length).fill(false));
    const [timer, setTimer] = useState<NodeJS.Timeout>();
    
    const onFullTextEdited = useCallback((index: number, newText: string) => {
        setFullTexts(fullTexts => fullTexts.map((ft, idx) => idx === index ? newText : ft));
    }, []);

    const sendToLLM = useCallback(async (id: number) => {
        setLoadings(loadings => loadings.map((l, idx) => idx === id ? true : l));
        const response = await fetch("http://127.0.0.1:5000");
        if (response.ok) {
            const responseText = await response.text();
            setFullTexts(fullTexts => fullTexts.map((ft, idx) => idx === id ? responseText : ft));
        }
        setLoadings(loadings => loadings.map((l, idx) => idx === id ? false : l));
        /*const xhr = new XMLHttpRequest();
        //xhr.open("POST", "http://127.0.0.1:5000/", true);
        //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.open("GET", "http://127.0.0.1:5000/", true);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                setLoadings(loadings => loadings.map((l, idx) => idx === id ? false : l));
                setFullTexts(fullTexts => fullTexts.map((ft, idx) => idx === id ? xhr.responseText : ft));
            }
          };
        xhr.send(`prompt=${(localInstance.flow.nodes[id].data.scene as Scene).prompt}`);
        */
    }, []);

    const onSceneEdited = useCallback((id: string, newScene: Scene) => {
		setLocalInstance(instance => instance.cloneAndSetScene(id, newScene));
	}, []);

    const onChoiceEdited = useCallback((id: string, newChoice: ChoiceDetails[]) => {
        setLocalInstance(instance => instance.cloneAndSetChoice(id, newChoice));
    }, []);

    useEffect(() => {
        if (timer) {
            clearTimeout(timer);
        }
        setTimer(setTimeout(() => {
            props.setInstance(id!, Number.parseInt(index!), localInstance);
        }, 250));
    }, [localInstance]);

    useEffect(() => {
        //setLocalInstance(localInstance => localInstance.flow.nodes.map())
    }, [fullTexts])

    return (
        <Card className="h-100 w-100">
            <Card.Header>
                <h4>
                    {props.stories.get(id!)?.template.title} - {props.stories.get(id!)?.instances[Number.parseInt(index!)].title}
                </h4>
            </Card.Header>
            <Card.Body style={{height:"90%"}}>
                <Row className="h-100">
                    <Col className="h-100" xs={3}>
                        <Card className="h-50">
                            <Card.Header>
                                <h5>Scene</h5>
                            </Card.Header>
                            <Card.Body className="h-100" style={{overflowY:"auto"}}>
                                {localInstance.flow.nodes.map(node => {
                                    if (node.type === "sceneNode") {
                                        const data = node.data as SceneNodeProps
                                        return <><a href="#">{`${data.label}${data.scene?.details.title ? " - " : ""}${data.scene?.details.title}`}</a><br/></>
                                    } else if (node.type === "choiceNode") {
                                        const data = node.data as ChoiceNodeProps;
                                        return <><a href="#">{`${data.label}${data.choices?.length > 0 ? " - " : ""}${data.choices.map(choice => choice.title).join(" / ")}`}</a><br/></>
                                    }
                                })}
                            </Card.Body>
                        </Card>
                        <Card className="h-50">
                            <Card.Body className="h-100" style={{overflowY:"auto"}}>
                                <StoryElements story={props.stories.get(id!)!.instances[Number.parseInt(index!)].instance} readOnly />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col className="h-100" style={{overflowY:"auto"}}>
                        <Accordion>
                            {localInstance.flow.nodes
                            .sort((n1, n2) => n1.position.x - n2.position.x)
                            .map((node, idx) => {
                                if (node.type === "sceneNode") {
                                    const data = node.data as SceneNodeProps
                                    return <Accordion.Item eventKey={node.id} key={idx}>
                                        <Accordion.Header>
                                            {`${data.label}${data.scene?.details.title ? " - " : ""}${data.scene?.details.title}`} 
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <Row style={{height:"10em"}}>
                                                <Col>
                                                    <PromptArea story={localInstance} initialText={data.scene?.prompt} readOnly/>
                                                </Col>
                                                <Col xs={1} style={{alignContent:"center"}}>
                                                    <Button onClick={() => sendToLLM(idx)} disabled={loadings[idx]}>
                                                        {loadings[idx] ? 
                                                            <Spinner size="sm"/>
                                                        :
                                                            <i className="bi bi-send" />
                                                        }
                                                    </Button>
                                                </Col>
                                                <Col>
                                                    <Form.Control
                                                        as="textarea"
                                                        value={fullTexts[idx]}
                                                        className="full-text"
                                                        style={{height:"100%", width:"100%"}}
                                                        onChange={e => onFullTextEdited(idx, e.target.value)}
                                                        disabled={loadings[idx]} >
                                                    </Form.Control>
                                                </Col>
                                            </Row>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                } else if (node.type === "choiceNode") {
                                    const data = node.data as ChoiceNodeProps;
                                    return <Accordion.Item eventKey={node.id} key={idx}>
                                        <Accordion.Header>
                                            {`${data.label}${data.choices?.length > 0 ? " - " : ""}${data.choices.map(choice => choice.title).join(" / ")}`}
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <ChoiceEditor
                                                key={idx}
                                                story={localInstance}
                                                choices={node.data.choices as ChoiceDetails[]}
                                                setChoices={newChoice => onChoiceEdited(node.id, newChoice)}
                                                readOnly />
                                        </Accordion.Body>
                                    </Accordion.Item>
                                }
                            })}
                        </Accordion>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    )
}

export default InstanceEditor;