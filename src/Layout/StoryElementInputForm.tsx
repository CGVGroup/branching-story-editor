import { FloatingLabel, Form } from "react-bootstrap";
import { StoryElementType, StoryElement, ObjectElement } from "../StoryElements/StoryElement.ts";
import { useContext } from "react";
import { DbFields } from "../App.tsx";
import Select from "react-select";

function StoryElementInputForm(props: {
    type: StoryElementType,
    element: StoryElement,
    setElement: (e: any) => void
}) {
    const elementDetailsChoices = useContext(DbFields);
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
            <FloatingLabel label="Tipo:">
                <Form.Control
                    value={props.element.type}
                    placeholder="Tipo"
                    onChange={e => props.setElement({...props.element, type: e.target.value})}/>
            </FloatingLabel>
            <div style={{zIndex:"2000", textAlign:"left"}}>
                <Select
                placeholder={"Datazioni"}
                value={props.element.dating.map(d => {return {label: d, value: d}})}
                closeMenuOnSelect={false}
                options={elementDetailsChoices.datazioni}
                onChange={values => {props.setElement({...props.element, dating: values.map(v => v.value)})}}
                isMulti
                styles={{menu: (styles) => {return {...styles, zIndex: "2000"}}}}/>
                </div>
            <FloatingLabel label="Descrizione:">
                <Form.Control
                    value={props.element.description}
                    placeholder="Descrizione"
                    onChange={e => props.setElement({...props.element, description: e.target.value})}/>
            </FloatingLabel>
        </>
    );
    switch (props.type) {
        case StoryElementType.character:
            return(commonFields);
        case StoryElementType.object:
            return(
                <>
                    {commonFields}
                    <hr />
                    <div style={{zIndex:"2100", textAlign:"left"}}>
                        <Select
                            placeholder={"Materiali"}
                            value={(props.element as ObjectElement).materials.map(m => {return {label: m, value: m}})}
                            closeMenuOnSelect={false}
                            options={elementDetailsChoices.materiali}
                            onChange={values => props.setElement({...props.element, materials: values.map(v => v.value)})}
                            isMulti />
                    </div>
                    <FloatingLabel label="Origine:">
                        <Form.Control
                            value={(props.element as ObjectElement).origin}
                            placeholder="Origine"
                            onChange={e => props.setElement({...(props.element as ObjectElement), origin: e.target.value})}/>
                    </FloatingLabel>
                </>
            );
        case StoryElementType.location:
            return(commonFields);    
        default:
            throw new TypeError(props.type + " is not a valid type");
    }
}

export default StoryElementInputForm;