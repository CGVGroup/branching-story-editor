import { v4 as uuidv4 } from "uuid";
import React from "react";
import { Node, XYPosition } from "@xyflow/react";
import Scene from "../StoryElements/Scene.ts";
import SceneNode from "./SceneNode.tsx";
import ChoiceNode from "./ChoiceNode.tsx";

export enum NodeType {
    scene = "sceneNode",
    choice = "choiceNode"
}

export const storyNodeTypes = {sceneNode: SceneNode, choiceNode: ChoiceNode};

export type ChoiceDetails = {
    title: string;
    choice: string;
    consequence: string;
    wrong: boolean;
};

export type SceneFunctionProps = {
    onClickEdit: () => void;
    onClickDelete: () => void;
    onSceneNameChanged: (name: string) => void
    onSceneTitleChanged: (title: string) => void
}
export type ChoiceFunctionProps = {
    onClickEdit: () => void;
    onClickDelete: () => void;
    onChoiceNameChanged: (name: string) => void
};

export type SceneNodeProps = {
    label: string;
    scene?: Scene;
} & SceneFunctionProps;
export type ChoiceNodeProps = {
    label: string;
    choices: ChoiceDetails[];
} & ChoiceFunctionProps;

export type SceneNodeObject = {
    id: string;
    position: XYPosition
    data: SceneNodeProps;
    type: NodeType.scene
};
export type ChoiceNodeObject = {
    id: string;
    position: XYPosition
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

export function createNewSceneNode(
    id: string,
    callbacks: SceneFunctionProps,
    label?: string,
    position?: XYPosition,
    data?: SceneNodeProps
): SceneNodeObject {
    return {
        id: id ?? uuidv4(),
        position: position ?? { x: 0, y: 0 },
        data: {
            label: label ?? data?.label ?? "Scena senza nome",
            scene: data?.scene ?? new Scene(undefined),
            onClickEdit: callbacks.onClickEdit,
            onClickDelete: callbacks.onClickDelete,
            onSceneNameChanged: callbacks.onSceneNameChanged,
            onSceneTitleChanged: callbacks.onSceneTitleChanged
        },
        type: NodeType.scene
    };
}

export function createNewChoiceNode(
    id: string,
    callbacks: ChoiceFunctionProps,
    label?: string,
    position?: XYPosition,
    data?: ChoiceNodeProps
): ChoiceNodeObject {
    return {
        id: id ?? uuidv4(),
        position: position ?? { x: 0, y: 0 },
        data: {
            label: label ?? data?.label ?? "Scelta senza nome",
            choices: data?.choices ?? [{title: "A", choice: "", consequence: "", wrong: false}, {title: "B", choice: "", consequence: "", wrong: false}],
            onClickEdit: callbacks.onClickEdit,
            onClickDelete: callbacks.onClickDelete,
            onChoiceNameChanged: callbacks.onChoiceNameChanged,
        },
        type: NodeType.choice
    };
}

export const StoryNode = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {selected?: boolean}
>(({ className, selected, ...props }, ref) => (
  <div
    ref={ref}
    className={`story-node px-0 py-2 ${className ?? ""} ${selected ? "shadow selected" : ""}`}
    style={{display: "flex", position: "relative"}}
    tabIndex={0}
    {...props}
  ></div>
));
StoryNode.displayName = "StoryNode";