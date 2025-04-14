import React from "react";
import { Handle, NodeProps, NodeToolbar, Position } from "@xyflow/react";
import { Button, ButtonGroup, Col, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { ChoiceNodeType, StoryNode } from "./StoryNode.tsx";
import { LabeledHandle } from "./LabeledHandle.tsx";
import DynamicTextField from "../Layout/DynamicTextField.tsx";

function ChoiceNode(props: NodeProps<ChoiceNodeType>) {
  const handleDelete = () => {
    props.data.onClickDelete();
  }

  const handleSubmitChoiceName = (name: string) => {
    props.data.onChoiceNameChanged(name);
  }

  return (
    <StoryNode selected={props.selected || props.data.indirectSelected} className="choice">
      <Handle type="target" position={Position.Left} />
      <Col className="w-100 px-0">
        <div className="w-100 px-1">
          <DynamicTextField
            initialValue={props.data.label}
            focusOnDoubleClick={true}
            onSubmit={handleSubmitChoiceName}
            isInvalid={label => label === ""}
            baseProps={{
              id: "name",
              className: "name",
              size: "sm",
              style: {marginBottom: "0.5em"}
            }} />
        </div>
        {props.data.choices.length > 0 && 
          props.data.choices.map((choice, idx) =>
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
      <NodeToolbar isVisible={props.selected && !props.data.indirectSelected} className="nodrag nopan">
        <InputGroup>
          <ButtonGroup>
            <Button variant="secondary" onClick={props.data.onClickEdit} title="Modifica">
              <i className="bi bi-pencil" aria-label="edit" />
            </Button>
            <OverlayTrigger
              key={"delete"}
              placement={"right"}
              trigger="focus"
              overlay={<Tooltip>
                <ButtonGroup vertical>
                  <Button variant="danger" onClick={handleDelete} title="Conferma">
                    <i className="bi bi-check-lg" aria-label="edit" />
                  </Button>
                  <Button variant="secondary" title="Annulla">
                    <i className="bi bi-x-lg" aria-label="delete" />
                  </Button>
                </ButtonGroup>
              </Tooltip>}>
                <Button variant="danger" title="Elimina">
                  <i className="bi bi-trash3" aria-label="delete" />
                </Button>
            </OverlayTrigger>
          </ButtonGroup>
        </InputGroup>
      </NodeToolbar>
    </StoryNode>
  );
}

export default ChoiceNode;
