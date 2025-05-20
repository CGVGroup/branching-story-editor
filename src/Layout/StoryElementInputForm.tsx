import { FloatingLabel, Form } from "react-bootstrap";
import { CharacterElement, LocationElement, ObjectElement, StoryElementType, StoryElement } from "../StoryElements/StoryElement.ts";

function StoryElementInputForm(props: {
    type: StoryElementType,
    element: StoryElement,
    setElement: (e: any) => void
}) {
    const commonFields = (
        <>
            <FloatingLabel label="Nome:">
                <Form.Control
                    value={props.element.name}
                    placeholder="Nome"
                    onChange={e => props.setElement({...props.element, name: e.target.value})}
                    isInvalid={props.element.name.length === 0}
                    autoFocus />
            </FloatingLabel>
        </>
    );
    const commonNotes = (
        <FloatingLabel label="Note:">
            <Form.Control
                value={props.element.notes}
                placeholder="Note"
                onChange={e => props.setElement({...props.element, notes: e.target.value})} />
        </FloatingLabel>
    );
    switch (props.type) {
        case StoryElementType.character:
            return(
                <>
                    {commonFields}
                    <hr />
                    <FloatingLabel label="Bio:">
                        <Form.Control
                            value={(props.element as CharacterElement).bio}
                            placeholder="Bio"
                            onChange={e => props.setElement({...props.element, bio: e.target.value})} />
                    </FloatingLabel>
                    <FloatingLabel label="Obiettivo:">
                        <Form.Control
                            value={(props.element as CharacterElement).objective}
                            placeholder="Obiettivo"
                            onChange={e => props.setElement({...props.element, objective: e.target.value})} />
                    </FloatingLabel>
                    <hr />
                    {commonNotes}
                </>
            );
        case StoryElementType.object:
            return(
                <>
                    {commonFields}
                    <hr />
                    <FloatingLabel label="Funzione:">
                        <Form.Control
                            value={(props.element as ObjectElement).use}
                            placeholder="Funzione"
                            onChange={e => props.setElement({...props.element, use: e.target.value})} />
                    </FloatingLabel>
                    <hr />
                    {commonNotes}
                </>
            );
        case StoryElementType.location:
            return(
                <>
                    {commonFields}
                    <hr />
                    <FloatingLabel label="Scopo:">
                        <Form.Control
                            value={(props.element as LocationElement).purpose}
                            placeholder="Scopo"
                            onChange={e => props.setElement({...props.element, purpose: e.target.value})} />
                    </FloatingLabel>
                    <hr />
                    {commonNotes}
                </>
            );    
        default:
            throw new TypeError(props.type + " is not a valid type");
    }
}

export default StoryElementInputForm;