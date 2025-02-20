import React, { memo, useState } from "react";
import { Button, ButtonGroup, Col, InputGroup } from "react-bootstrap";
import { Handle, NodeProps, NodeToolbar, Position } from "@xyflow/react";
import Scene from "../StoryElements/Scene.ts";
import DynamicTextField from "../Layout/DynamicTextField.tsx";
import { SceneNodeType, StoryNode } from "./StoryNode.tsx";

function SceneNode(props: NodeProps<SceneNodeType>) {
  const [scene, setScene] = useState<Scene | undefined>(undefined);

  const handleDelete = () => {
    setScene(undefined);
    props.data.onClickDelete();
  }

  const handleSubmitSceneName = (name: string) => {
    props.data.onSceneNameChanged(name);
  }

  const handleSubmitSceneTitle = (title: string) => {
    props.data.onSceneTitleChanged(title);
  }

  return (
    <StoryNode selected={props.selected} className="scene">
      <Col>
        <DynamicTextField 
          initialValue={props.data.label}
          focusOnDoubleClick={true}
          onSubmit={handleSubmitSceneName}
          isInvalid={label => label === ""}
          baseProps={{
            className: "name",
            size: "sm",
          }}/>
        <DynamicTextField
          initialValue={props.data.scene?.details.title}
          focusOnDoubleClick={true}
          onSubmit={handleSubmitSceneTitle}
          baseProps={{
            className: "title",
            size: "sm",
            placeholder: "Nessun Titolo",
          }}/>
      </Col>
      <Handle type="target" position={Position.Left}/>
      <Handle type="source" position={Position.Right}/>
      <NodeToolbar isVisible={props.selected}>
        <InputGroup>
          {props.data.scene?.details.summary && 
            <InputGroup.Text className="story-node-summary">
              {props.data.scene.details.summary}
            </InputGroup.Text>
          }
          <ButtonGroup vertical={!!props.data.scene?.details.summary}>
            <Button variant="secondary" onClick={() => props.data.onClickEdit(scene, setScene)}>
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

export default SceneNode;
