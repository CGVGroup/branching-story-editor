import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react';
import { Button } from 'react-bootstrap';
 
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
				<div
					className="nodrag nopan"
					style={{
						position: "absolute",
						pointerEvents: "all",
						zIndex: "1000",
						transformOrigin: "center",
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`}}>
					{selected && 
						<Button
							onClick={onEdgeClick}
							variant="secondary"
							className="story-edge-button">
							<i className='bi bi-x'/>
						</Button>}
				</div>
			</EdgeLabelRenderer>
		</>
	);
}