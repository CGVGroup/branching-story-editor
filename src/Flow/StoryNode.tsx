import { v4 as uuidv4 } from "uuid";
import React from "react";
import { Node, ReactFlowInstance, XYPosition } from "@xyflow/react";
import { Flex } from "@mantine/core";
import Scene from "../StoryElements/Scene.ts";
import Choice from "../StoryElements/Choice.ts";
import SceneNode from "./SceneNode.tsx";
import ChoiceNode from "./ChoiceNode.tsx";
import ButtonEdge from "./ButtonEdge.tsx";

export enum NodeType {
    scene = "sceneNode",
    choice = "choiceNode"
}

export enum EdgeType {
    button = "buttonEdge"
}

export const storyNodeTypes = {sceneNode: SceneNode, choiceNode: ChoiceNode};
export const storyEdgeTypes = {buttonEdge: ButtonEdge}

export type StoryNodeFunctionProps = {
    onClickEdit: () => void;
}

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

export type StoryNodeObject = {
    id: string;
    position: XYPosition
}

export type SceneNodeObject = StoryNodeObject & {
    data: SceneNodeProps;
    type: NodeType.scene
};
export type ChoiceNodeObject = StoryNodeObject & {
    data: ChoiceNodeProps;
    type: NodeType.choice
};

export type SceneNodeType = Node<
    SceneNodeProps,
    "SceneNode"
>;
export type ChoiceNodeType = Node<
    ChoiceNodeProps,
    "ChoiceNode"
>;

export function deleteStoryNode(rfInstance: ReactFlowInstance, id: string) {
    rfInstance.setNodes(nodes => nodes.filter(node => node.id !== id));
};

export function changeStoryNodeName(rfInstance: ReactFlowInstance, id: string, name: string) {
    rfInstance.setNodes(nodes => nodes.map(
        node => node.id === id ?
            {...node, data: {...node.data, label: name}}
        :
            node
    ));
};

export function createNewSceneNode(
    id: string,
    onClickEdit: () => void,
    label?: string,
    position?: XYPosition,
    data?: SceneNodeProps
): SceneNodeObject {
    return {
        id: id ?? uuidv4(),
        position: position ?? { x: 0, y: 0 },
        data: {
            label: label ?? data?.label ?? "Scena senza nome",
            scene: data?.scene ? Scene.from(data.scene) : new Scene(),
            onClickEdit: onClickEdit,
        },
        type: NodeType.scene
    };
}

export function createNewChoiceNode(
    id: string,
    onClickEdit: () => void,
    label?: string,
    position?: XYPosition,
    data?: ChoiceNodeProps
): ChoiceNodeObject {
    return {
        id: id ?? uuidv4(),
        position: position ?? { x: 0, y: 0 },
        data: {
            label: label ?? data?.label ?? "Scelta senza nome",
            choice: data?.choice ? Choice.from(data.choice) : new Choice(),
            onClickEdit: onClickEdit,
        },
        type: NodeType.choice
    };
}

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
StoryNode.displayName = "StoryNode";