import { Handle, NodeProps, NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import { Button, ButtonGroup, Col, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { changeStoryNodeName, ChoiceNodeType, deleteStoryNode, StoryNode } from "./StoryNode.tsx";
import { LabeledHandle } from "./LabeledHandle.tsx";
import DynamicTextField from "../Layout/DynamicTextField.tsx";
import Choice from "../StoryElements/Choice.ts";

function ChoiceNode(props: NodeProps<ChoiceNodeType>) {
  const rfInstance = useReactFlow();
  
  const handleDelete = () => {
    deleteStoryNode(rfInstance, props.id);
  }

  const handleSubmitChoiceName = (name: string) => {
    changeStoryNodeName(rfInstance, props.id, name);
  }

  const handleSubmitChoiceTitle = (title: string) => {
    rfInstance.setNodes(nodes => nodes.map(
      node => node.id === props.id ?
        {...node,
          data: {
            ...node.data,
            choice: {
              ...(node.data.choice as Choice),
              title: title
            }
          }
        }
      :
        node
    ));
  }

  return (
    <StoryNode selected={props.selected} indirectSelected={props.data.indirectSelected} className="choice">
      <Handle type="target" position={Position.Left} />
      <Col className="w-100 px-0">
        <div className="w-100 px-1 mb-1">
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
            }}/>
          <DynamicTextField
            initialValue={props.data.choice?.title}
            focusOnDoubleClick={true}
            onSubmit={handleSubmitChoiceTitle}
            baseProps={{
              id: "title",
              className: "title",
              size: "sm",
              placeholder: "Nessun interrogativo",
            }}/>
        </div>
        {props.data.choice.choices.length > 0 && 
          props.data.choice.choices.map((choice, idx) =>
            <div key={idx}>
              {idx > 0 && <hr className="my-1"/>}
              <LabeledHandle
                type="source"
                title={choice.text}
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
