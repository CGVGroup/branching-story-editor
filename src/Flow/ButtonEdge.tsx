import { ActionIcon } from '@mantine/core';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react';
 
export default function ButtonEdge({
	id,
	selected,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	markerEnd,
}: EdgeProps) {
	const rfInstance = useReactFlow();
	const [edgePath, labelX, labelY] = getBezierPath({sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition});
	
	const onEdgeClick = () => {
		rfInstance.setEdges(edges => edges.filter(edge => edge.id !== id));
	};
	
	return (
		<>
			<BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
			<EdgeLabelRenderer>
				{selected && 
					<ActionIcon
						onClick={onEdgeClick}
						radius="xl"
						p={0}
						className="story-edge-button nodrag nopan"
						style={{
							position: "absolute",
							pointerEvents: "all",
							zIndex: "1000",
							transformOrigin: "center",
							transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`}}>
						<i className='bi bi-x'/>
					</ActionIcon>}
			</EdgeLabelRenderer>
		</>
	);
}