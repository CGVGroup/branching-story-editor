import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { ReactFlow } from "@xyflow/react";
import Story from "../StoryElements/Story.ts";
import { storyEdgeTypes, storyNodeTypes } from "./StoryNode.tsx";

function StoryFlowChartViewer (props: {
  story: Story,
  storyId: string,
}) {  
  const nodeTypes = useMemo(() => storyNodeTypes, []);
  const edgeTypes = useMemo(() => storyEdgeTypes, []);

  return (
    <ReactFlow key={props.storyId}
      nodes={props.story.flow.nodes.map(node => {return {...node, selected: false, data: {...node.data, indirectSelected: false}}}) ?? []}
      edges={props.story.flow.edges.map(edge => {return {...edge, selected: false, animated: false}}) ?? []}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnDoubleClick={false}
      fitView
      fitViewOptions={{minZoom: 0, padding: 0.025}} />
  );
};

export default StoryFlowChartViewer;