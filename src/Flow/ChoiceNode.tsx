import React, { useState } from "react";
import { Handle, NodeProps, NodeToolbar, Position } from "@xyflow/react";
import { Button, ButtonGroup, Col, InputGroup } from "react-bootstrap";
import { ChoiceDetails, ChoiceNodeType, StoryNode } from "./StoryNode.tsx";
import { LabeledHandle } from "./LabeledHandle.tsx";
import DynamicTextField from "../Layout/DynamicTextField.tsx";

function ChoiceNode(props: NodeProps<ChoiceNodeType>) {
  const [choices, setChoices] = useState<ChoiceDetails[]>(props.data.choices);

  const handleDelete = () => {
    setChoices([]);
    props.data.onClickDelete();
  }

  const handleSubmitChoiceName = (name: string) => {
    props.data.onChoiceNameChanged(name);
  }

  return (
    <StoryNode selected={props.selected} className="choice">
      <Handle type="target" position={Position.Left} />
      <Col className="px-0">
        <DynamicTextField
          initialValue={props.data.label}
          focusOnDoubleClick={true}
          onSubmit={handleSubmitChoiceName}
          isInvalid={label => label === ""}
          baseProps={{
            id: "name",
            className: "name",
            size: "sm",
          }} />
        {choices.length > 0 && 
          choices.map((choice, idx) =>
            <div key={idx}>
              {idx > 0 && <hr className="my-1"/>}
              <LabeledHandle
                type="source"
                title={choice.title}
                position={Position.Right}
                id={`source-${idx}`}
                handleClassName={choice.wrong ? "wrong-choice" : "right-choice"}/>
            </div> 
          )
        }
      </Col>
      <NodeToolbar isVisible={props.selected}>
        <InputGroup>
          <ButtonGroup>
            <Button variant="secondary" onClick={() => props.data.onClickEdit()}>
              <i className="bi bi-pencil" aria-label="edit" />
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <i className="bi bi-trash3" aria-label="delete" />
            </Button>
          </ButtonGroup>
        </InputGroup>
      </NodeToolbar>
    </StoryNode>
  );
}

export default ChoiceNode;
