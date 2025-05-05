import React from "react";
import { Button, ButtonGroup, InputGroup, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { Handle, NodeProps, NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import DynamicTextField from "../Layout/DynamicTextField.tsx";
import { changeStoryNodeName, deleteStoryNode, SceneNodeType, StoryNode } from "./StoryNode.tsx";
import Scene from "../StoryElements/Scene.ts";

function SceneNode(props: NodeProps<SceneNodeType>) {
  const rfInstance = useReactFlow();
  
  const handleDelete = () => {
    deleteStoryNode(rfInstance, props.id);
  }

  const handleSubmitSceneName = (name: string) => {
    changeStoryNodeName(rfInstance, props.id, name);
  }

  const handleSubmitSceneTitle = (title: string) => {
    rfInstance.setNodes(nodes => nodes.map(
      node => node.id === props.id ?
        {...node,
          data: {
            ...node.data,
            scene: {
              ...(node.data.scene as Scene),
              details: {
                ...(node.data.scene as Scene).details,
                title: title
              }
            }
          }
        }
      :
        node
    ));
  }

  return (
    <StoryNode selected={props.selected} indirectSelected={props.data.indirectSelected} className="scene">
      <Stack className="px-1" gap={1}>
        <DynamicTextField 
          initialValue={props.data.label}
          focusOnDoubleClick={true}
          onSubmit={handleSubmitSceneName}
          isInvalid={label => label === ""}
          baseProps={{
            id: "name",
            className: "name",
            size: "sm",
            style: {maxWidth: "100%"}
          }}/>
        <DynamicTextField
          initialValue={props.data.scene?.details.title}
          focusOnDoubleClick={true}
          onSubmit={handleSubmitSceneTitle}
          baseProps={{
            id: "title",
            className: "title",
            size: "sm",
            placeholder: "Nessun Titolo",
          }}/>
      </Stack>
      <Handle type="target" position={Position.Left}/>
      <Handle type="source" position={Position.Right}/>
      <NodeToolbar isVisible={props.selected && !props.data.indirectSelected} className="nodrag nopan">
        <InputGroup>
          {props.data.scene?.details.summary && 
            <InputGroup.Text className="story-node-summary">
              {props.data.scene.details.summary}
            </InputGroup.Text>
          }
          <ButtonGroup vertical={!!props.data.scene?.details.summary}>
            <Button variant="secondary" onClick={props.data.onClickEdit} title="Modifica">
              <i className="bi bi-pencil" aria-label="edit" />
            </Button>
            <OverlayTrigger
                key={"delete"}
                placement={"right"}
                trigger="focus"
                overlay={
                  <Tooltip>
                    <ButtonGroup vertical>
                      <Button variant="danger" onClick={handleDelete} title="Conferma">
                        <i className="bi bi-check-lg" aria-label="edit" /> 
                      </Button>
                      <Button variant="secondary" title="Annulla">
                        <i className="bi bi-x-lg" aria-label="delete" /> 
                      </Button>
                    </ButtonGroup>
                  </Tooltip>}>
              <Button variant="danger"title="Elimina">
                <i className="bi bi-trash3" aria-label="delete" />
              </Button>
            </OverlayTrigger>
          </ButtonGroup>
        </InputGroup>
      </NodeToolbar>
    </StoryNode>
  );
}

export default SceneNode;
