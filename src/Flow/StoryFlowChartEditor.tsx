import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { debounce } from "throttle-debounce";
import React, { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { Button, Card, Stack } from "react-bootstrap";
import { ReactFlow, Controls, Background, applyNodeChanges, Panel, ReactFlowInstance, Edge, NodeChange, Node, addEdge, Connection, EdgeChange, applyEdgeChanges, Viewport, MarkerType} from "@xyflow/react";
import Story from "../StoryElements/Story.ts";
import { ChoiceNodeProps, createNewChoiceNode, createNewSceneNode, EdgeType, NodeType, SceneNodeProps, storyEdgeTypes, storyNodeTypes } from "./StoryNode.tsx";

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

  const setNodeProperties = useCallback((check: (node: Node) => boolean, properties: Partial<Node>) => {
    setNodes(nodes => nodes.map(node => check(node) ? {...node, ...properties, data: {...node.data, ...properties.data}} : node ));
  }, [])
  const setEdgeProperties = useCallback((check: (edge: Edge) => boolean, properties: Partial<Edge>) => {
    setEdges(edges => edges.map(edge => check(edge) ? {...edge, ...properties} : edge));
  }, [])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nodes => applyNodeChanges(changes, nodes));
    //New node added
    changes.filter(change => change.type === "dimensions").forEach(change => {
      setNodeProperties(node => node.id === change.id, {selected: false, data: {indirectSelected: false}})
      setEdgeProperties(_ => true, {animated: false});
    });
    changes.filter(change => change.type === "select").forEach(change => {  
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
    });
  }, [rfInstance]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(edges => applyEdgeChanges(changes, edges));
    changes.filter(change => change.type === "remove").forEach(change => {
      if (rfInstance) {
        setNodeProperties(
          node => node.id === rfInstance.getEdge(change.id)?.source || node.id === rfInstance.getEdge(change.id)?.target,
          {selected: false, data: {indirectSelected: false}});
      }
    });
    changes.filter(change => change.type === "select").forEach(change => {
      const timeout = change.selected ? 50 : 0;
      setTimeout(() => {
        if (rfInstance) {
          setEdgeProperties(edge => edge.id === change.id, {animated: change.selected});
          setNodeProperties(
            node => node.id === rfInstance.getEdge(change.id)?.source || node.id === rfInstance.getEdge(change.id)?.target,
            {data: {indirectSelected: change.selected}});
        }
      }, timeout);
    });
  }, [rfInstance]);

  const onViewportChange = useCallback((newViewport: Viewport) => {
    setViewport(newViewport);
  }, []);

  const onPaneClick = useCallback(() => {
    setNodeProperties(_ => true, {selected: false, data: {indirectSelected: false}});
    setEdgeProperties(_ => true, {animated: false});
  }, []);
  
  const onConnect = useCallback((connection: Connection) => {
    setEdges(edges => addEdge(connection, edges));
    if (rfInstance) {
      if (rfInstance.getNode(connection.source)?.selected)
        setNodeProperties(node => node.id === connection.target, {data: {indirectSelected: true}});
      
      if (rfInstance.getNode(connection.target)?.selected)
        setNodeProperties(node => node.id === connection.source, {data: {indirectSelected: true}});
    }
  }, []);

  const onClickEdit = useCallback((id: string) => {
    props.onClickEditNode(id);
  }, [props.onClickEditNode]);

  const addNewNode = useCallback((type: NodeType = NodeType.scene) => {
    const id = uuidv4();
    const maxLabel = nodes
      .filter(node => node.type === type)
      .map(node => Number.parseInt((node.data.label as string).match(/(\d+$)/)?.pop() ?? ""))
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

    let newNode: Node;
    
    switch (type) {
      case NodeType.scene:
      default:
        newNode = createNewSceneNode(
          id,
          () => onClickEdit(id),
          "Scena " + maxLabel,
          position);
      break;
      case NodeType.choice:
        newNode = createNewChoiceNode(
          id,
          () => onClickEdit(id),
          "Scelta " + maxLabel,
          position);
      break;
    }
    newNode.selected = true;
    setNodes(nodes => [...nodes, newNode]);
  }, [flowRef, nodes, setNodes, onClickEdit]);

  const addExistingNode = useCallback((node: Node) => {
    let newNode: Node;
    switch (node.type) {
      case NodeType.scene:
      default:
        newNode = createNewSceneNode(
          node.id,
          () => onClickEdit(node.id),
          undefined,
          node.position,
          node.data as SceneNodeProps);
      break;
      case NodeType.choice:
        newNode = createNewChoiceNode(
          node.id,
          () => onClickEdit(node.id),
          undefined,
          node.position,
          node.data as ChoiceNodeProps);
      break;
    }
    newNode.selected = false;
    newNode.data.indirectSelected = false;
    setNodes(nodes => [...nodes, newNode]);
  }, [onClickEdit]);

  const handleInit = useCallback((rfInstance: ReactFlowInstance) => {
    props.story.flow.nodes.forEach(node => addExistingNode(node));
    setEdges(props.story.flow.edges);
    setViewport(props.story.flow.viewport);
    setRfInstance(rfInstance);
  }, [props.story, addExistingNode]);

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
    <Card className="p-0 h-100">
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
        className="gx-0 h-100"
        ref={flowRef}
        minZoom={0.2} >
        <Panel position="top-right">
          <Stack direction="vertical" gap={1}>
            <Button variant="primary" size="lg" onClick={() => addNewNode(NodeType.scene)} title="Aggiungi Scena">
                <i className="bi bi-textarea" aria-label="scene"/>
            </Button>
            <Button variant="primary" size="lg" onClick={() => addNewNode(NodeType.choice)} title="Aggiungi Scelta">
                <i className="bi bi-question-square" aria-label="choice"/>
            </Button>
          </Stack>
        </Panel>
        <Controls />
        <Background />
      </ReactFlow>
    </Card>
  );
};

export default StoryFlowChartEditor;
