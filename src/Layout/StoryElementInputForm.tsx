import React from "react";
import { Form, InputGroup } from "react-bootstrap";
import { CharacterElement, LocationElement, ObjectElement, StoryElementType, StoryElement } from "../StoryElements/StoryElement.ts";

function StoryElementInputForm(props: {
    type: StoryElementType,
    element: StoryElement,
    setElement: (e: any) => void
}) {
    const commonFields = (
        <>
            <InputGroup className="mb-2">
                <InputGroup.Text>Nome:</InputGroup.Text>
                <Form.Control
                    value={props.element.name}
                    onChange={e => props.setElement({...props.element, name: e.target.value})}
                    isInvalid={props.element.name.length === 0}
                    autoFocus />
            </InputGroup>
            <InputGroup className="mb-2">
                <InputGroup.Text>Variabile:</InputGroup.Text>
                <Form.Switch checked={props.element.isVariable} onChange={e => props.setElement({...props.element, isVariable: e.target.checked})} />
            </InputGroup>
        </>
    );
    const commonNotes = (
        <InputGroup className="mb-2">
            <InputGroup.Text>Note:</InputGroup.Text>
            <Form.Control
                value={props.element.notes}
                onChange={e => props.setElement({...props.element, notes: e.target.value})} />
        </InputGroup>
    );
    switch (props.type) {
        case StoryElementType.character:
            return(
                <>
                    {commonFields}
                    <hr />
                    <InputGroup className="mb-2">
                        <InputGroup.Text>Bio:</InputGroup.Text>
                        <Form.Control
                            value={(props.element as CharacterElement).bio}
                            onChange={e => props.setElement({...props.element, bio: e.target.value})} />
                    </InputGroup>
                    <InputGroup className="mb-2">
                        <InputGroup.Text>Obiettivo:</InputGroup.Text>
                        <Form.Control
                            value={(props.element as CharacterElement).objective}
                            onChange={e => props.setElement({...props.element, objective: e.target.value})} />
                    </InputGroup>
                    <hr />
                    {commonNotes}
                </>
            );
        case StoryElementType.object:
            return(
                <>
                    {commonFields}
                    <hr />
                    <InputGroup className="mb-2">
                        <InputGroup.Text>Funzione:</InputGroup.Text>
                        <Form.Control
                            value={(props.element as ObjectElement).use}
                            onChange={e => props.setElement({...props.element, use: e.target.value})} />
                    </InputGroup>
                    <hr />
                    {commonNotes}
                </>
            );
        case StoryElementType.location:
            return(
                <>
                    {commonFields}
                    <hr />
                    <InputGroup className="mb-2">
                        <InputGroup.Text>Scopo:</InputGroup.Text>
                        <Form.Control
                            value={(props.element as LocationElement).purpose}
                            onChange={e => props.setElement({...props.element, purpose: e.target.value})} />
                    </InputGroup>
                    <hr />
                    {commonNotes}
                </>
            );    
        default:
            throw new TypeError(props.type + " is not a valid type");
    }
}

export default StoryElementInputForm;