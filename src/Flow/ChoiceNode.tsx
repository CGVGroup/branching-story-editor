import { Handle, NodeProps, NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import { ActionIcon, Center, Divider, Flex, Menu, Stack } from "@mantine/core";
import { isNotEmpty } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { changeStoryNodeName, ChoiceNodeType, deleteStoryNode, NodeType, StoryNode, storyNodeColorArray } from "./StoryNode.tsx";
import { LabeledHandle } from "./LabeledHandle.tsx";
import DynamicTextField from "../Layout/Components/DynamicTextField.tsx";
import Choice from "../StoryElements/Choice.ts";

function ChoiceNode(props: NodeProps<ChoiceNodeType>) {
  const rfInstance = useReactFlow();

  const [locked, lockedHandler] = useDisclosure(true);
  
  const handleDelete = () => {
    deleteStoryNode(rfInstance, props.id);
  }

  const handleSubmitChoiceName = (name: string) => {
    changeStoryNodeName(rfInstance, props.id, name);
  }

  const handleSubmitChoiceTitle = (title: string) =>
    rfInstance.updateNodeData(props.id, node => {return {choice: (node.data.choice as Choice).cloneAndSetTitle(title)}}, {replace: false});

  return (
    <StoryNode selected={props.selected} indirectSelected={props.data.indirectSelected} className="choice">
      <Handle type="target" position={Position.Left} />
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
          <Center>
            <Stack px="xs" gap="xs">
              <DynamicTextField
                initialValue={props.data.label}
                validate={value => isNotEmpty("Il nome della scelta non può essere vuoto")(value) || (rfInstance.getNodes().some(node => node.data.label === value) ? "Esiste già un nodo con questo nome" : null)}
                onSubmit={handleSubmitChoiceName}
                locked={locked}
                lockedHandler={lockedHandler}
                baseProps={{className: "name"}}/>
              <DynamicTextField
                initialValue={props.data.choice?.title}
                onSubmit={handleSubmitChoiceTitle}
                locked={locked}
                lockedHandler={lockedHandler}
                baseProps={{className: "title", placeholder: "Nessun Titolo"}}/>
            </Stack>
          </Center>
        {props.data.choice.choices.length > 0 && 
          props.data.choice.choices.map((choice, idx) =>
            <div key={idx}>
              {idx > 0 && <Divider my={0.5} color="gray" size="xs"/>}
              <LabeledHandle
                type="source"
                title={choice.text}
                position={Position.Right}
                id={`source-${idx}`}
                handleClassName={choice.wrong ? "wrong-choice" : "right-choice"}/>
            </div> 
          )
        }
      </Flex>
      <NodeToolbar isVisible={props.selected && !props.data.indirectSelected} className="nodrag nopan">
        <ActionIcon.Group>
          <ActionIcon onClick={props.data.onClickEdit} color={storyNodeColorArray[NodeType.choice]} variant="light" title="Modifica">
            <i className="bi bi-pencil" aria-label="edit" />
          </ActionIcon>
          <Menu position="right">
            <Menu.Target>
              <ActionIcon color="red" variant="light" title="Elimina">
                <i className="bi bi-trash3" aria-label="delete" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown p={0}>
              <Menu.Item
                component="button"
                color="red"
                onClick={handleDelete}
                title="Conferma">
                    <i className="bi bi-check-lg" aria-label="yes" /> 
                </Menu.Item>
                <Menu.Item
                  component="button"
                  color="gray"
                  title="Annulla"
                  closeMenuOnClick>
                  <i className="bi bi-x-lg" aria-label="no" /> 
                </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </ActionIcon.Group>
      </NodeToolbar>
    </StoryNode>
  );
}

export default ChoiceNode;
