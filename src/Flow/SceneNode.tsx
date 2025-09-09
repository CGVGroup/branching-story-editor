import { Handle, NodeProps, NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import { ActionIcon, Button, Flex, Group, Menu, Stack, Textarea } from "@mantine/core";
import { isNotEmpty } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import DynamicTextField from "../Layout/Components/DynamicTextField.tsx";
import { changeStoryNodeName, deleteStoryNode, NodeType, SceneNodeType, StoryNode, storyNodeColorArray } from "./StoryNode.tsx";
import Scene from "../StoryElements/Scene.ts";

function SceneNode(props: NodeProps<SceneNodeType>) {
	const rfInstance = useReactFlow();

	const [locked, lockedHandler] = useDisclosure(true);
	
	const handleDelete = () => {
		deleteStoryNode(rfInstance, props.id);
	}

	const handleSubmitSceneName = (name: string) => {
		changeStoryNodeName(rfInstance, props.id, name);
	}

	const handleSubmitSceneTitle = (title: string) =>
		rfInstance.updateNodeData(props.id, node => {return {scene: (node.data.scene as Scene).cloneAndSetDetails(
			{...(node.data.scene as Scene).details, title: title}
		)}}, {replace: false});

	return (
		<StoryNode selected={props.selected} indirectSelected={props.data.indirectSelected} className="scene">
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
						validate={value =>
							isNotEmpty("Il nome della scena non può essere vuoto")(value) ||
							(rfInstance.getNodes().some(node => node.data.label === value) ? "Esiste già un nodo con questo nome" : null)}
						onSubmit={handleSubmitSceneName}
						locked={locked}
						lockedHandler={lockedHandler}
						baseProps={{className: "name"}}/>
					<DynamicTextField
						initialValue={props.data.scene?.details.title}
						onSubmit={handleSubmitSceneTitle}
						locked={locked}
						lockedHandler={lockedHandler}
						baseProps={{className: "title", placeholder: "Nessun Titolo"}}/>
				</Stack>
			</Flex>
			<Handle type="target" position={Position.Left}/>
			<Handle type="source" position={Position.Right}/>
			<NodeToolbar isVisible={props.selected && !props.data.indirectSelected} className="nodrag nopan nowheel">
				<Group>
					{props.data.scene?.details.summary && 
						<Textarea className="story-node-summary" value={props.data.scene.details.summary} readOnly/>
					}
					<ActionIcon.Group orientation={`${props.data.scene?.details.summary ? "vertical" : "horizontal"}`}>
						<ActionIcon onClick={props.data.onClickEdit} color={storyNodeColorArray[NodeType.scene]} variant="light" title="Modifica">
							<i className="bi bi-pencil" aria-label="edit" />
						</ActionIcon>
						<Menu position="right" closeOnItemClick>
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
				</Group>
			</NodeToolbar>
		</StoryNode>
	);
}

export default SceneNode;
