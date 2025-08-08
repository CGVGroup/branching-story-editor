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
		rfInstance.deleteElements({edges: [rfInstance.getEdge(id)!]})
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
						w={5}
						h={5}
						color="gray"
						className="nodrag nopan"
						style={{
							position: "absolute",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							fontSize: "1em",
							pointerEvents: "all",
							zIndex: "1000",
							transformOrigin: "center",
							transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
							opacity: "50%"}}>
						<i className='bi bi-x'/>
					</ActionIcon>}
			</EdgeLabelRenderer>
		</>
	);
}