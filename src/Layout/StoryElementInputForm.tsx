import { useContext, useMemo } from "react";
import { FloatingLabel, Form } from "react-bootstrap";
import Select from "react-select";
import { StoryElementType, StoryElement, ObjectElement, StoryElementTypeDictionary } from "../StoryElements/StoryElement.ts";
import { TaxonomiesContext } from "../App.tsx";
import { taxonomyToMultioption } from "../Misc/DB.ts";
import DropdownField from "./DropdownField.tsx";

function StoryElementInputForm(props: {
    type: StoryElementType,
    element: StoryElement,
    setElement: (e: any) => void
}) {
    const elementDetailsChoices = useContext(TaxonomiesContext)!;

    const datingMultioptions = useMemo(() => {
        const options = taxonomyToMultioption(elementDetailsChoices.periods);
        return options[0].map((label, idx) => {return {label: label, value: options[1][idx]}});
    }, []);
    const materialMultioptions = useMemo(() => {
        const options = taxonomyToMultioption(elementDetailsChoices.materials);
        return options[0].map((label, idx) => {return {label: label, value: options[1][idx]}});
    }, []);
    const typeOptions = useMemo(() => {
        const options = taxonomyToMultioption(elementDetailsChoices[StoryElementTypeDictionary.eng.plural[props.type]]);
        return options[1];
    }, [props.type]);
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
            <DropdownField
                value={props.element.type}
                setValue={value => props.setElement({...props.element, type: value})}
                defaultValue="Nessun Tipo"
                choices={typeOptions} />
            <div style={{textAlign:"left"}}>
                <Select
                    placeholder={"Datazioni"}
                    value={props.element.dating.map(d => {return {label: d, value: d}})}
                    closeMenuOnSelect={false}
                    options={datingMultioptions}
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
                            options={materialMultioptions}
                            onChange={values => props.setElement({...props.element, materials: values.map(v => v.value)})}
                            isMulti
                            styles={{menu: (styles) => {return {...styles, zIndex: "2000"}}}}/>
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