import React from "react";
import { InputGroup, Form } from "react-bootstrap";

function DropdownField(props: {
    label?: string,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    defaultValue: string,
    labelWidth?: string,
    choices: string[],
}) {
    return <InputGroup>
        {props.label && props.labelWidth &&
            <InputGroup.Text style={{width: props.labelWidth}}>{props.label}</InputGroup.Text>}
        <Form.Select
            value={props.value === "" ? props.defaultValue : props.value}
            onChange={e => props.setValue(e.target.value)}>
            <option label={props.defaultValue}>{""}</option>
            {props.choices.map((choice, idx) => 
                <option key={idx}>{choice}</option>
            )}
        </Form.Select>
    </InputGroup>
}

export default DropdownField;