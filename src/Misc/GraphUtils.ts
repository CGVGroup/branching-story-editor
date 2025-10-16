import { getIncomers, getOutgoers, Node, ReactFlowJsonObject } from "@xyflow/react";
import { NodeType } from "../Flow/StoryNode.tsx";

/**
 * Recursively (DFS) gets all Nodes that are connected to all branches of a given node until a stopping criterion is met. 
 * @param flow the {@link ReactFlowJsonObject} to search
 * @param node the starting node
 * @param stoppingCriterion a function that accepts a node and returns whether to include it and recurse or stop recursing
 * @returns an unordered set of Nodes
 */
export function getAllOutgoers(flow: ReactFlowJsonObject, node: Node, stoppingCriterion?: (node: Node) => boolean): Set<Node> {
	const workingSet: Set<Node> = new Set();
	getAllOutgoersRecursive(flow, node, workingSet, stoppingCriterion);
	return workingSet;
}

function getAllOutgoersRecursive(flow: ReactFlowJsonObject, node: Node, workingSet: Set<Node>, stoppingCriterion?: (node: Node) => boolean) {
	if (stoppingCriterion?.(node) || workingSet?.has(node)) return;
	workingSet.add(node);
	getOutgoers(node, flow.nodes, flow.edges)
		.forEach(outgoer => getAllOutgoersRecursive(flow, outgoer, workingSet, stoppingCriterion));
}

export function getPreviousSceneNode(flow: ReactFlowJsonObject, node: Node): Node | null {
	let incomers = getIncomers(node, flow.nodes, flow.edges);

	while (incomers.length === 1) {
		switch (incomers[0].type) {
			case NodeType.scene:
				return incomers[0];
			case NodeType.choice:
				return null;
			case NodeType.info:
				incomers = getIncomers(incomers[0], flow.nodes, flow.edges);
				break;
		}
	}
	return null;
}