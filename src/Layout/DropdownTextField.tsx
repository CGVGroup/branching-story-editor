import React from "react";
import { InputGroup, Dropdown, ButtonGroup, Form } from "react-bootstrap";

function DropdownTextField(props: {
    label: string,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    defaultValue: string,
    choices: string[],
}) {
    const textWidth = "20%";

    return <InputGroup>
        <Dropdown as={ButtonGroup}>
            <InputGroup.Text style={{width: textWidth}}>{props.label}:</InputGroup.Text>
            <Form.Control
                value={props.value === "" ? props.defaultValue : props.value}
                readOnly
                style={{pointerEvents: "none"}} />
            <Dropdown.Toggle variant="secondary" style={{ width: "2.5em" }} />
            <Dropdown.Menu style={{ maxWidth: "20em", overflow: "hidden" }}>
                <Dropdown.Item eventKey={""}>{props.defaultValue}</Dropdown.Item>
                <Dropdown.Divider />
                {props.choices.map(choice =>
                    <Dropdown.Item eventKey={choice} key={choice} onClick={() => props.setValue(choice)}>{choice}</Dropdown.Item>)}
            </Dropdown.Menu>
        </Dropdown>
    </InputGroup>
}

export default DropdownTextField;