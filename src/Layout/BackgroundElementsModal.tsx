import React from "react";
import { Modal, Row, Col, ListGroup, Form } from "react-bootstrap";
import { StoryElementType, StoryElement } from "../StoryElements/StoryElement.ts";
import Story from "../StoryElements/Story.ts";

function ElementList (props: {
        allElements: Map<string, StoryElement>,
        selected: Set<string>,
        setSelected: React.Dispatch<React.SetStateAction<Set<string>>>,
        checkboxType: "checkbox" | "radio",
        noElementsText: string
}) {
    return <ListGroup>
        <Form.Check
            type="radio"
            label={props.noElementsText}
            id={`radio-${encodeURI(props.noElementsText)}`}
            checked={props.selected.size === 0}
            onChange={() => props.setSelected(new Set())}/>
        {props.allElements.size > 0 && <hr/>}
        {Array.from(props.allElements)
            .sort((a, b) => {
                if (props.selected.has(a[0]) && !props.selected.has(b[0])) return -1;
                if (!props.selected.has(a[0]) && props.selected.has(b[0])) return 1;
                return a[1].name.localeCompare(b[1].name);})
            .map(([id, element]) =>
            <Form.Check
                key={id}
                type={props.checkboxType}
                label={element.name}
                id={props.checkboxType + "-" + id}
                checked={props.selected.has(id)}
                onChange={e => {
                    if (props.checkboxType === "checkbox") {
                        props.setSelected(bg => {
                            if (e.target.checked) {bg.add(id); return new Set(bg)}
                            else {bg.delete(id); return new Set(bg)}
                        });
                    } else {
                        if (e.target.checked) props.setSelected(new Set([id]));
                    }
                }}
            />)
        }
    </ListGroup>
}

function BackgroundElementsModal(props: {
    show: boolean,
    setShow: React.Dispatch<React.SetStateAction<boolean>>,
    story: Story,
    selectedCharacters: Set<string>,
    setSelectedCharacters: React.Dispatch<React.SetStateAction<Set<string>>>,
    selectedObjects: Set<string>,
    setSelectedObjects: React.Dispatch<React.SetStateAction<Set<string>>>,
    selectedLocation: Set<string>,
    setSelectedLocation: React.Dispatch<React.SetStateAction<Set<string>>>,
    noElementTexts: string[]
}) {
    return (
        <Modal
            show={props.show}
            centered
            scrollable
            size="lg"
            onHide={() => props.setShow(false)}
            >
            <Modal.Header closeButton>
                <Modal.Title>Elementi di Sfondo</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col style={{maxHeight:"75vh", overflowY:"auto"}}>
                        <ElementList
                            allElements={props.story.characters}
                            selected={props.selectedCharacters}
                            setSelected={props.setSelectedCharacters}
                            checkboxType="checkbox"
                            noElementsText={props.noElementTexts[StoryElementType.character]}/>
                    </Col>
                    <Col style={{maxHeight:"75vh", overflowY:"auto"}}>
                        <ElementList
                            allElements={props.story.objects}
                            selected={props.selectedObjects}
                            setSelected={props.setSelectedObjects}
                            checkboxType="checkbox"
                            noElementsText={props.noElementTexts[StoryElementType.object]}/>
                    </Col>
                    <Col style={{maxHeight:"75vh", overflowY:"auto"}}>
                        <ElementList
                            allElements={props.story.locations}
                            selected={props.selectedLocation}
                            setSelected={props.setSelectedLocation}
                            checkboxType="radio"
                            noElementsText={props.noElementTexts[StoryElementType.location]}/>
                    </Col>
                </Row>
            </Modal.Body>
        </Modal>
    );
};

export default BackgroundElementsModal;