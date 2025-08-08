import { Handle, NodeProps, NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import { ActionIcon, Flex, Menu, Stack } from "@mantine/core";
import { isNotEmpty } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import DynamicTextField from "../Layout/Components/DynamicTextField.tsx";
import { changeStoryNodeName, deleteStoryNode, InfoNodeType, NodeType, StoryNode, storyNodeColorArray } from "./StoryNode.tsx";

export type Info = {
  title: string,
  text: string
}

function InfoNode(props: NodeProps<InfoNodeType>) {
  const rfInstance = useReactFlow();

  const [locked, lockedHandler] = useDisclosure(true);
  
  const handleDelete = () => {
    deleteStoryNode(rfInstance, props.id);
  }

  const handleSubmitInfoName = (name: string) => {
    changeStoryNodeName(rfInstance, props.id, name);
  }

  const handleSubmitInfoTitle = (title: string) =>
    rfInstance.updateNodeData(props.id, node => {return {info: {...(node.data.info as Info), title: title}}}, {replace: false});

  return (
    <StoryNode selected={props.selected} indirectSelected={props.data.indirectSelected} className="info">
      <Flex direction="column" px={0}>
        <ActionIcon
          pos="absolute"
          right="-0.5em"
          top="-0.5em"
          size="xs"
          variant="subtle"
          radius="md"
          onClick={lockedHandler.toggle}>
          {locked ? <i className="bi bi-lock"/> : <i className="bi bi-unlock"/>}
        </ActionIcon>
        <Stack gap="xs" px="xs">
          <DynamicTextField
            initialValue={props.data.label}
            validate={value => isNotEmpty("Il nome dell'approfondimento non può essere vuoto")(value) || (rfInstance.getNodes().some(node => node.data.label === value) ? "Esiste già un nodo con questo nome" : null)}
            onSubmit={handleSubmitInfoName}
            locked={locked}
            lockedHandler={lockedHandler}
            baseProps={{className: "name"}}/>
          <DynamicTextField
            initialValue={props.data.info?.title}
            onSubmit={handleSubmitInfoTitle}
            locked={locked}
            lockedHandler={lockedHandler}
            baseProps={{className: "title", placeholder: "Nessun Titolo"}}/>
        </Stack>
      </Flex>
      <Handle type="target" position={Position.Left}/>
      <Handle type="source" position={Position.Right}/>
      <NodeToolbar isVisible={props.selected && !props.data.indirectSelected} className="nodrag nopan nowheel">
        <ActionIcon.Group>
          <ActionIcon onClick={props.data.onClickEdit} color={storyNodeColorArray[NodeType.info]} variant="light" title="Modifica">
            <i className="bi bi-pencil" aria-label="edit" />
          </ActionIcon>
          <Menu position="right">
            <Menu.Target>
              <ActionIcon color="red" variant="light" title="Elimina">
                <i className="bi bi-trash3" aria-label="delete" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown p={0}>
              <Menu.Item component="button" color="red" onClick={handleDelete} title="Conferma">
                  <i className="bi bi-check-lg" aria-label="yes" /> 
              </Menu.Item>
              <Menu.Item component="button" color="gray" closeMenuOnClick title="Annulla">
                <i className="bi bi-x-lg" aria-label="no" /> 
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </ActionIcon.Group>
      </NodeToolbar>
    </StoryNode>
  );
}

export default InfoNode;
