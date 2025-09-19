import { v4 as uuidv4 } from "uuid";
import React from "react";
import { Node, ReactFlowInstance, XYPosition } from "@xyflow/react";
import { Flex } from "@mantine/core";
import Scene from "../StoryElements/Scene.ts";
import Choice from "../StoryElements/Choice.ts";
import SceneNode from "./SceneNode.tsx";
import ChoiceNode from "./ChoiceNode.tsx";
import ButtonEdge from "./ButtonEdge.tsx";
import InfoNode, { Info } from "./InfoNode.tsx";
import StoryEditor from "../Layout/Editors/StoryEditor.tsx";

/**
 * Enum for the possibile types of Node.
 * 
 * They are mapped to strings, so they can index dictionaries with fields of the (**exact**) same name.
 */
export enum NodeType {
	scene = "sceneNode",
	choice = "choiceNode",
	info = "infoNode"
}

export enum EdgeType {
	button = "buttonEdge"
}

// Below follow some utility dictionaries to access components and constant strings via the NodeType enum

export const storyNodeTypes = {sceneNode: SceneNode, choiceNode: ChoiceNode, infoNode: InfoNode};
export const storyEdgeTypes = {buttonEdge: ButtonEdge}
export const storyNodeTypeDictionary = {sceneNode: "Scena", choiceNode: "Scelta", infoNode: "Approfondimento"};
export const storyNodeClassNames = {sceneNode: "scene", choiceNode: "choice", infoNode: "info"};
export const storyNodeColorArray = {sceneNode: "yellow", choiceNode: "violet", infoNode: "teal"}

/**
 * Utility type for function properties that are common to all Custom Nodes and that need to be passed from above.
 * 
 * `onClickEdit` opens a new tab in {@link StoryEditor}, so the callback needs to be passed during the factory method ({@link createNewStoryNode}).
 * 
 * For example, the callback for {@link SceneNode}'s `handleDelete` need not be passed, as all data can be accessed from inside the component.
 */
export type StoryNodeFunctionProps = {
	onClickEdit: () => void;
}

/**
 * Utility type for properties that are common to all Custom Nodes.
 * @param label the name shown in the first text box of the Node
 * @param indirectSelected keeps track of adjacency to a selected node
 */
export type StoryNodeProps = {
	label: string;
	indirectSelected?: boolean;
}

export type SceneNodeProps =
	StoryNodeProps &
	StoryNodeFunctionProps & {
		scene: Scene;
	};
export type ChoiceNodeProps =
	StoryNodeProps & 
	StoryNodeFunctionProps & {
		choice: Choice;
	};
export type InfoNodeProps =
	StoryNodeProps & 
	StoryNodeFunctionProps & {
		info: Info;
	};

// Types used for NodeProps generics
export type SceneNodeType = Node<SceneNodeProps, "SceneNode">;
export type ChoiceNodeType = Node<ChoiceNodeProps, "ChoiceNode">;
export type InfoNodeType = Node<InfoNodeProps, "InfoNode">;

interface SceneNodeObject extends Node {
	data: SceneNodeProps;
	type: NodeType.scene;
};
interface ChoiceNodeObject extends Node {
	data: ChoiceNodeProps;
	type: NodeType.choice;
};
interface InfoNodeObject extends Node {
	data: InfoNodeProps;
	type: NodeType.info;
};

/**
 * Deletes a Node given its id.
 * @param rfInstance {@link ReactFlowInstance}
 * @param id id of the Node to delete
 */
export function deleteStoryNode(rfInstance: ReactFlowInstance, id: string) {
	rfInstance.deleteElements({nodes: [rfInstance.getNode(id)!]});
};

/**
 * Changes the name of a Node given its id.
 * @param rfInstance {@link ReactFlowInstance}
 * @param id id of the Node to change
 * @param name new name
 */
export function changeStoryNodeName(rfInstance: ReactFlowInstance, id: string, name: string) {
	rfInstance.updateNodeData(id, {label: name}, {replace: false});
};

/**
 * Checks if the name of a Node is unique in the given flow.
 * @param rfInstance {@link ReactFlowInstance}
 * @param id id of the Node to check
 * @param name name to check
 */
export function checkNodeNameUnique(rfInstance: ReactFlowInstance, id: string, name: string) {
	return rfInstance.getNodes().some(node => node.data.label === name && node.id !== id);
}

/**
 * Factory method to create an empty Node.
 */
export function createNewStoryNode(
	type: NodeType,
	id?: string,
	onClickEdit?: () => void,
	label?: string,
	position?: XYPosition,
	data?: SceneNodeProps | ChoiceNodeProps | InfoNodeProps
): SceneNodeObject | ChoiceNodeObject | InfoNodeObject {
	let baseData = {
		id: id ?? uuidv4(),
		position: position ?? { x: 0, y: 0 },
		type: type
	};

	switch (type) {
		case NodeType.scene:
			data = data as SceneNodeProps;
			return {
				...baseData,
				data: {
					label: label ?? data?.label ?? "Scena senza nome",
					scene: data?.scene ? Scene.from(data.scene) : new Scene(),
					onClickEdit: onClickEdit ?? (() => {}),
				}
			} as SceneNodeObject;
		
		case NodeType.choice:
			data = data as ChoiceNodeProps;
			return {
				...baseData,
				data: {
					label: label ?? data?.label ?? "Scelta senza nome",
					choice: data?.choice ? Choice.from(data.choice) : new Choice(),
					onClickEdit: onClickEdit ?? (() => {}),
				}
			} as ChoiceNodeObject;
		
		case NodeType.info:
			data = data as InfoNodeProps;
			return {
				...baseData,
				data: {
					label: label ?? data?.label ?? "Approfondimento senza nome",
					info: {
						title: data?.info.title ?? "",
						text: data?.info.text ?? ""
					},
					onClickEdit: onClickEdit ?? (() => {}),
				}
			} as InfoNodeObject;
	}
}

/**
 * Base component for all custom Nodes.
 */
export const StoryNode = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {selected?: boolean, indirectSelected?: boolean}
>(({ className, selected, indirectSelected, ...props }, ref) => (
  <Flex
	ref={ref}
	px={0}
	py={2}
	className={`story-node ${className ?? ""} ${selected ? "shadow selected" : ""} ${indirectSelected ? "indirect-selected" : ""}`}
	tabIndex={0}
	{...props}
  />
));