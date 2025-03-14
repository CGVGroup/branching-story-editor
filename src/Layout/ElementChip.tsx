import React from "react";
import { Card, Row } from "react-bootstrap";
import { StoryElement } from "../StoryElements/StoryElement.ts";

function ElementChip(props: {
    name: string,
    onRemove?: () => void,
    className?: string,
    style?: React.CSSProperties
}) {
    return (
        <Card className={props.className} style={props.style}>
            {props.name}
            {props.onRemove && 
                <i className="bi bi-x-lg close-button" onClick={props.onRemove} />
            }
        </Card>
    );
};

function ChipList(props: {
    values: Set<string>,
    setValues: React.Dispatch<React.SetStateAction<Set<string>>>,
    allValues: Map<string, StoryElement>,
    className: string,
    noElementsText: string
}) {
    return (
        <Row className="g-0">
            {props.values.size > 0 ?
                [...props.values.values()].map(id =>
                    <ElementChip
                        name={props.allValues.get(id)?.name ?? "?"}
                        key={id}
                        onRemove={() => props.setValues(bg => {bg.delete(id); return new Set(bg);})}
                        className={"mention-chip " + props.className}/>
                )
            :
                <ElementChip
                    name={props.noElementsText}
                    className={"mention-chip " + props.className}
                    style={{opacity: "0.6"}}/>
            }
        </Row>
    );
}


export {ElementChip, ChipList};