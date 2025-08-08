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

export enum NodeType {
    scene = "sceneNode",
    choice = "choiceNode",
    info = "infoNode"
}

export enum EdgeType {
    button = "buttonEdge"
}

export const storyNodeTypes = {sceneNode: SceneNode, choiceNode: ChoiceNode, infoNode: InfoNode};
export const storyNodeClassNames = {sceneNode: "scene", choiceNode: "choice", infoNode: "info"};
export const storyNodeColorArray = {sceneNode: "yellow", choiceNode: "violet", infoNode: "teal"}
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
export type InfoNodeProps =
    StoryNodeProps & 
    StoryNodeFunctionProps & {
        info: Info;
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
export type InfoNodeObject = StoryNodeObject & {
    data: InfoNodeProps;
    type: NodeType.info
};

export type SceneNodeType = Node<
    SceneNodeProps,
    "SceneNode"
>;
export type ChoiceNodeType = Node<
    ChoiceNodeProps,
    "ChoiceNode"
>;
export type InfoNodeType = Node<
    InfoNodeProps,
    "InfoNode"
>;

export function deleteStoryNode(rfInstance: ReactFlowInstance, id: string) {
    rfInstance.deleteElements({nodes: [rfInstance.getNode(id)!]})
};

export function changeStoryNodeName(rfInstance: ReactFlowInstance, id: string, name: string) {
    rfInstance.updateNodeData(id, {label: name}, {replace: false})
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

export function createNewInfoNode(
    id: string,
    onClickEdit: () => void,
    label?: string,
    position?: XYPosition,
    data?: InfoNodeProps
): InfoNodeObject {
    return {
        id: id ?? uuidv4(),
        position: position ?? { x: 0, y: 0 },
        data: {
            label: label ?? data?.label ?? "Approfondimento senza nome",
            info: {
                title: data?.info.title ?? "",
                text: data?.info.text ?? ""
            },
            onClickEdit: onClickEdit,
        },
        type: NodeType.info
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