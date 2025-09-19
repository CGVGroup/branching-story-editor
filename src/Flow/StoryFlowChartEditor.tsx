import "@xyflow/react/dist/style.css";
import React, { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { ReactFlow, ReactFlowJsonObject, Controls, Background, applyNodeChanges, Panel, ReactFlowInstance, Edge, NodeChange, Node, addEdge, Connection, EdgeChange, applyEdgeChanges, Viewport, MarkerType, getOutgoers, getConnectedEdges} from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { debounce } from "throttle-debounce";
import { ActionIcon, Stack } from "@mantine/core";
import Story from "../StoryElements/Story.ts";
import { ChoiceNodeProps, createNewStoryNode, EdgeType, InfoNodeProps, NodeType, SceneNodeProps, storyEdgeTypes, storyNodeColorArray, storyNodeTypeDictionary, storyNodeTypes } from "./StoryNode.tsx";
import Choice, { ChoiceDetails } from "../StoryElements/Choice.ts";

/**
 * The main component for the graph editor
 * @param story state for the Story
 * @param setStory setState for the Story
 * @param onClickEditNode callback to pass to every node
 */
function StoryFlowChartEditor (props: {
	story: Story,
	setStory: React.Dispatch<React.SetStateAction<Story>>,
	onClickEditNode: (id: string) => void,
}) {
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);
	const [viewport, setViewport] = useState<Viewport>({x: 0, y: 0, zoom: 1})
	const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>();

	const flowRef = useRef(null);

	/**
	 * Utility function to override Node properties.
	 * @param check a function that filters which Node(s) to edit
	 * @param properties the properties to override and their new values
	 */
	const setNodeProperties = useCallback((check: (node: Node) => boolean, properties: Partial<Node>) =>
		setNodes(nodes => nodes.map(node => check(node) ? {...node, ...properties, data: {...node.data, ...properties.data}} : node ))
	, []);

	/**
	 * Utility function to override Edge properties.
	 * @param check a function that filters which Edge(s) to edit
	 * @param properties the properties to override and their new values
	 */
	const setEdgeProperties = useCallback((check: (edge: Edge) => boolean, properties: Partial<Edge>) =>
		setEdges(edges => edges.map(edge => check(edge) ? {...edge, ...properties} : edge))
	, []);

	const onClickEdit = useCallback((id: string) => {
		props.onClickEditNode(id);
	}, [props.onClickEditNode]);

	/**
	 * Creates a new Node object and adds it to {@link nodes}.
	 * @param type {@link NodeType} of the Node to add
	 */
	const addNewNode = useCallback((type: NodeType) => {
		const id = uuidv4();
		const maxLabel = nodes
			.filter(node => node.type === type)
			.map(node => Number.parseInt((node.data.label as string).match(/(\d+$)/)?.pop() ?? "0"))
			.reduce((max, n) => {
				if (!max || n > max) return n;
				return max;}, 0) + 1;

		const boundingClientRect = flowRef.current ? (flowRef.current as Element).getBoundingClientRect() : null;

		const position =
			(rfInstance && boundingClientRect) ? 
				rfInstance.screenToFlowPosition({
					x: boundingClientRect.width/2,
					y: boundingClientRect.height/2})
				:
					{x: 0, y: 0};

		const newNode = createNewStoryNode(
			type,
			id,
			() => onClickEdit(id),
			`${storyNodeTypeDictionary[type]} ${maxLabel}`,
			position
		);
		newNode.selected = true;
		setNodes(nodes => [...nodes, newNode]);
	}, [flowRef, nodes, onClickEdit]);

	/**
	 * Creates a copy of an existing Node and adds it to {@link nodes}.
	 * @param node the existing node to copy
	 */
	const addExistingNode = useCallback((node: Node) => {
		const newNode = createNewStoryNode(
			node.type as NodeType,
			node.id,
			() => onClickEdit(node.id),
			undefined,
			node.position,
			node.data as SceneNodeProps | ChoiceNodeProps | InfoNodeProps);
		newNode.data.indirectSelected = false;
		(newNode as Node).selected = false;
		setNodes(nodes => [...nodes, newNode]);
	}, [onClickEdit]);

	// #region ReactFlow callbacks
	// See https://reactflow.dev/api-reference/react-flow

	/**
	 * Callback for all {@link NodeChange}s.
	 * 
	 * `case ("dimensions")` manages adding new nodes
	 * 
	 * `case ("remove")` manages removing nodes
	 * 
	 * `case ("select")` manages node selection
	 */
	const onNodesChange = useCallback((changes: NodeChange[]) => {
		setNodes(nodes => applyNodeChanges(changes, nodes));
		for (const change of changes) {
			switch (change.type) {
				case ("dimensions"):
					setNodeProperties(node => node.id !== change.id, {selected: false, data: {indirectSelected: false}})
					setEdgeProperties(() => true, {animated: false});
				break;
				case ("remove"):
					if (rfInstance) {
						const nodeConnections = rfInstance.getNodeConnections({type: "target", nodeId: change.id});
						nodeConnections.forEach(nc => {
							const sourceNode = rfInstance.getNode(nc.source)!;
							if (sourceNode.type === NodeType.choice && nc.sourceHandle) {
								const choiceIndex = Choice.getIndexFromHandleName(nc.sourceHandle!);
								const newChoice = (sourceNode.data.choice as Choice).cloneAndSetChoiceWrong(choiceIndex, false);
								setNodeProperties(node => node.id === sourceNode.id, {data: {choice: newChoice}})
							}
						});
					}
				break;
				case ("select"):
					const timeout = change.selected ? 50 : 0;
					setTimeout(() => {
						if (rfInstance) {
							const nodeConnections = rfInstance.getNodeConnections({nodeId: change.id});
							const outgoing = nodeConnections.filter(nc => nc.source === change.id).map(nc => nc.target);
							const incoming = nodeConnections.filter(nc => nc.target === change.id).map(nc => nc.source);
							setNodeProperties(node => outgoing.includes(node.id) || incoming.includes(node.id), {data: {indirectSelected: change.selected}});
							setEdgeProperties(edge => nodeConnections.map(conn => conn.edgeId).includes(edge.id), {animated: change.selected});
						}
					}, timeout);
				break;
				default:
				break;
			}
		}
	}, [rfInstance, setNodeProperties, setEdgeProperties]);

	/**
	 * Callback for all {@link EdgeChange}s (except for new connections, see {@link onConnect}).
	 * 
	 * `case ("remove")` manages edge removal (sets {@link ChoiceDetails.wrong} to `false`)
	 * 
	 * `case ("select")` manages edge selection
	 */
	const onEdgesChange = useCallback((changes: EdgeChange[]) => {
		setEdges(edges => applyEdgeChanges(changes, edges));
		if (!rfInstance) return;

		for (const change of changes) {
			switch (change.type) {
				case ("remove"):
					const edge = rfInstance.getEdge(change.id)!;
					setNodeProperties(
						node => node.id === edge.source || node.id === edge.target,
						{selected: false, data: {indirectSelected: false}});
					
					const snode = rfInstance.getNode(edge.source);
					const tnode = rfInstance.getNode(edge.target);
			
					if (!snode || !tnode || (snode.type !== NodeType.choice && tnode.type !== NodeType.choice)) return;
					
					let handle: string | null | undefined;
					let affectedNode: Node | undefined;
					
					if (snode.type === NodeType.choice) {
						handle = edge.sourceHandle;
						affectedNode = snode;
					}
					if (tnode.type === NodeType.choice) {
						handle = getConnectedEdges([snode], rfInstance.getEdges())
							.find(edge => edge.source === tnode.id && edge.target === snode.id)?.sourceHandle;
						affectedNode = tnode;
					}
					
					if (!handle || !affectedNode) return;
					
					const choiceIndex = Choice.getIndexFromHandleName(handle);
					const choice = (affectedNode.data.choice as Choice);
					
					if (choice.choices[choiceIndex].wrong) {
						const newChoice = choice.cloneAndSetChoiceWrong(choiceIndex, false);
						setNodeProperties(node => node.id === affectedNode.id, {data: {choice: newChoice}})
					}
				break;
				case ("select"):
					const timeout = change.selected ? 50 : 0;
					setTimeout(() => {
						setEdgeProperties(edge => edge.id === change.id, {animated: change.selected});
						setNodeProperties(
							node => node.id === rfInstance.getEdge(change.id)?.source || node.id === rfInstance.getEdge(change.id)?.target,
							{data: {indirectSelected: change.selected}});
					}, timeout);
				break;
				default:
				break;
			}
		}
	}, [rfInstance, setNodeProperties, setEdgeProperties]);

	const onViewportChange = useCallback((newViewport: Viewport) => {
		setViewport(newViewport);
	}, []);

	const onPaneClick = useCallback(() => {
		setNodeProperties(() => true, {selected: false, data: {indirectSelected: false}});
		setEdgeProperties(() => true, {animated: false});
	}, [setNodeProperties, setEdgeProperties]);
	
	/**
	 * Manages a new {@link Connection}.
	 * 
	 * Checks for any loops introduced by the new connection, and sets {@link ChoiceDetails.wrong} accordingly).
	 */
	const onConnect = useCallback((connection: Connection) => {
		setEdges(edges => addEdge(connection, edges));
		
		if (!rfInstance) return;
		
		const snode = rfInstance.getNode(connection.source);
		const tnode = rfInstance.getNode(connection.target);
		if (snode?.selected) setNodeProperties(node => node.id === connection.target, {data: {indirectSelected: true}});
		if (tnode?.selected) setNodeProperties(node => node.id === connection.source, {data: {indirectSelected: true}});
		
		if (!snode || !tnode || (snode.type !== NodeType.choice && tnode.type !== NodeType.choice)) return;

		let handle: string | null | undefined;
		let wrongChoice = false;
		let checkNode: Node | undefined;
		if (snode.type === NodeType.choice) {
			checkNode = snode;
			handle = connection.sourceHandle;
			wrongChoice = getOutgoers(tnode, rfInstance.getNodes(), rfInstance.getEdges()).some(node => node.id === snode.id);
		}
		if (tnode.type === NodeType.choice) {
			checkNode = tnode;
			handle = getConnectedEdges([snode], rfInstance.getEdges())
				.find(edge => edge.source === tnode.id && edge.target === snode.id)?.sourceHandle;
			wrongChoice = true;
		}

		if (!handle || !checkNode) return;

		const handleIndex = Choice.getIndexFromHandleName(handle);
		const newChoice = (checkNode.data.choice as Choice).cloneAndSetChoiceWrong(handleIndex, wrongChoice);
		setNodeProperties(node => node.id === checkNode.id, {data: {choice: newChoice}})
	}, [rfInstance, setNodeProperties]);

	/**
	 * Populates {@link nodes}, {@link edges} and {@link viewport} from an existing {@link ReactFlowJsonObject flow object},
	 * and saves the internal {@link ReactFlowInstance} of the <{@link ReactFlow}/> component to the Editor's {@link rfInstance rfInstance} state.
	 * @param rfInstance the internal ReactFlowInstance exposed by the <ReactFlow/> component  
	 */
	const handleInit = useCallback((rfInstance: ReactFlowInstance) => {
		props.story.flow.nodes.forEach(node => addExistingNode(node));
		setEdges(props.story.flow.edges);
		setViewport(props.story.flow.viewport);
		setRfInstance(rfInstance);
	}, [props.story, addExistingNode]);
	
	// #endregion

	const handleSave = useCallback(debounce(250, (
		nodes: Node[],
		edges: Edge[],
		viewport: Viewport
	) => {
		props.setStory(story => story.cloneAndSetFlow({nodes: nodes, edges: edges, viewport: viewport}));
	}), []);

	useEffect(() => handleSave(nodes, edges, viewport)
	, [handleSave, nodes, edges, viewport]);

	const nodeTypes = useMemo(() => storyNodeTypes, []);
	const edgeTypes = useMemo(() => storyEdgeTypes, []);

	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			viewport={viewport}
			nodeTypes={nodeTypes}
			edgeTypes={edgeTypes}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			onViewportChange={onViewportChange}
			onPaneClick={onPaneClick}
			onConnect={onConnect}
			onInit={handleInit}
			deleteKeyCode={['Backspace', 'Delete']}
			multiSelectionKeyCode={'Control'}
			defaultEdgeOptions={{type: EdgeType.button, markerEnd: {type: MarkerType.ArrowClosed, width: 20, height: 20}}}
			ref={flowRef}
			minZoom={0.2}
			style={{flexGrow: 1}}>
			<Panel position="top-right">
				<Stack gap="xs">
					<ActionIcon
						size="xl"
						onClick={() => addNewNode(NodeType.scene)}
						color={storyNodeColorArray[NodeType.scene]}
						variant="light"
						title="Aggiungi Scena">
						<i className="bi bi-textarea" aria-label="scene"/>
					</ActionIcon>
					<ActionIcon
						size="xl"
						onClick={() => addNewNode(NodeType.choice)}
						color={storyNodeColorArray[NodeType.choice]}
						variant="light"
						title="Aggiungi Scelta">
						<i className="bi bi-question-square" aria-label="choice"/>
					</ActionIcon>
					<ActionIcon
						size="xl"
						onClick={() => addNewNode(NodeType.info)}
						color={storyNodeColorArray[NodeType.info]}
						variant="light"
						title="Aggiungi Approfondimento">
						<i className="bi bi-info-square" aria-label="info"/>
					</ActionIcon>
				</Stack>
			</Panel>
			<Controls />
			<Background />
		</ReactFlow>
	);
};

export default StoryFlowChartEditor;