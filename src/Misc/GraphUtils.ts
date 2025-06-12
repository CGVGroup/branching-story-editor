import { getOutgoers, Node, ReactFlowJsonObject } from "@xyflow/react";

export default function getAllOutgoers(flow: ReactFlowJsonObject, node: Node, stoppingCriterion?: (node: Node) => boolean): Set<Node> {
    const ret: Set<Node> = new Set();
    if (stoppingCriterion?.(node)) return ret;
    ret.add(node);
    const outgoers = getOutgoers(node, flow.nodes, flow.edges);
    for (const outgoer of outgoers) {
        getAllOutgoers(flow, outgoer, stoppingCriterion).forEach(elem => ret.add(elem));
    }
    return ret;
}