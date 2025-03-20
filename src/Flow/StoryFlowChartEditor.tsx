import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { debounce } from "throttle-debounce";
import React, { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { Button, Row } from "react-bootstrap";
import { ReactFlow, Controls, Background, applyNodeChanges, Panel, ReactFlowInstance, Edge, NodeChange, Node, addEdge, Connection, EdgeChange, applyEdgeChanges, MarkerType } from "@xyflow/react";
import Story from "../StoryElements/Story.ts";
import Scene from "../StoryElements/Scene.ts";
import { ChoiceNodeProps, createNewChoiceNode, createNewSceneNode, NodeType, SceneNodeProps, storyNodeTypes } from "./StoryNode.tsx";

function StoryFlowChartEditor (props: {
  story: Story,
  setStory: React.Dispatch<React.SetStateAction<Story>>,
  onClickEditNode: (id: string) => void,
}) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance>();

  const flowRef = useRef(null);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nodes => applyNodeChanges(changes, nodes));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(edges => applyEdgeChanges(changes, edges));
  }, []);
  
  const onConnect = useCallback((connection: Connection) =>
    setEdges(eds => addEdge({ ...connection, markerEnd: {type: MarkerType.ArrowClosed, width: 20, height: 20} }, eds),
  ), []);

  const onClickEdit = useCallback((id: string) => {
    props.onClickEditNode(id);
  }, [props.onClickEditNode]);

  const onClickDelete = useCallback((nodeId: string) => {
    setNodes(nodes => nodes.filter(
      node => node.id !== nodeId
    ));
  }, []);

  const onSceneNameChanged = useCallback((id: string, newName: string) => {
    setNodes(nodes => nodes.map(
      node => node.id === id ? {...node, data: {...node.data, label: newName}} : node));
  }, []);
  
  const onSceneTitleChanged = useCallback((id: string, newTitle: string) => {
    setNodes(nodes => nodes.map(
      node => node.id === id ?
          {...node,
          data: {
            ...node.data,
            scene: {
              ...(node.data.scene as Scene),
              details: {
                ...(node.data.scene as Scene).details,
                title: newTitle
              }
            }
          }
        }
      : node)
  )}, []);

  const addNewNode = useCallback((type: NodeType = NodeType.scene) => {
    const id = uuidv4();
    const maxLabel = nodes
      .filter(node => node.type === type)
      .map(node => Number.parseInt((node.data.label as string).match(/(\d+$)/)?.pop() ?? ""))
      .reduce((max, n) => {
        if (!max || n > max) return n;
        return max;}, 0) + 1;

    const position = 
      (rfInstance && flowRef.current) ? 
        rfInstance.screenToFlowPosition({
          x: (flowRef.current as Element).getBoundingClientRect().width/2,
          y: (flowRef.current as Element).getBoundingClientRect().height/2})
        :
        {x: 0, y: 0};

    let newNode: Node;
    
    switch (type) {
      case NodeType.scene:
      default:
        newNode = createNewSceneNode(
          id,
          {onClickEdit: () => onClickEdit(id),
          onClickDelete: () => onClickDelete(id),
          onSceneNameChanged: (name: string) => onSceneNameChanged(id, name),
          onSceneTitleChanged: (title: string) => onSceneTitleChanged(id, title)},
          "Scena " + maxLabel,
          position);
      break;
      case NodeType.choice:
        newNode = createNewChoiceNode(
          id,
          {onClickEdit: () => onClickEdit(id),
            onClickDelete: () => onClickDelete(id),
            onChoiceNameChanged: (name: string) => onSceneNameChanged(id, name)},
          "Scelta " + maxLabel,
          position);
      break;
    }
    setNodes(nodes => [...nodes, newNode]);
  }, [rfInstance, flowRef, nodes, setNodes, onClickEdit, onClickDelete, onSceneNameChanged, onSceneTitleChanged]);

  const addExistingNode = useCallback((node: Node) => {
    let newNode: Node;
    switch (node.type) {
      case NodeType.scene:
      default:
        newNode = createNewSceneNode(
          node.id,
          {onClickEdit: () => onClickEdit(node.id),
          onClickDelete: () => onClickDelete(node.id),
          onSceneNameChanged: (name: string) => onSceneNameChanged(node.id, name),
          onSceneTitleChanged: (title: string) => onSceneTitleChanged(node.id, title)},
          undefined,
          node.position,
          node.data as SceneNodeProps);
      break;
      case NodeType.choice:
        newNode = createNewChoiceNode(
          node.id,
          {onClickEdit: () => onClickEdit(node.id),
          onClickDelete: () => onClickDelete(node.id),
          onChoiceNameChanged: (name: string) => onSceneNameChanged(node.id, name)},
          undefined,
          node.position,
          node.data as ChoiceNodeProps);
      break;
    }
    setNodes(nodes => [...nodes, newNode]);
        
  }, [onClickEdit, onClickDelete, onSceneNameChanged, onSceneTitleChanged])

  const handleInit = useCallback((rfInstance: ReactFlowInstance) => {
    props.story.flow.nodes.forEach(node => addExistingNode(node));
    setEdges(props.story.flow.edges);
    rfInstance.fitView();
    setRfInstance(rfInstance);
  }, [props.story, addExistingNode]);

  const handleSave = useCallback(debounce(250, () => {
    if (rfInstance)
      props.setStory(story => story.cloneAndAddFlow({nodes: nodes, edges: edges, viewport: rfInstance.getViewport()}));
  }), [nodes, edges, rfInstance]);

  useEffect(() => handleSave(), [handleSave]);
  
  const nodeTypes = useMemo(() => storyNodeTypes, []);

  return (
    <Row className="gx-0 h-100">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={handleInit}
        deleteKeyCode={['Backspace', 'Delete']}
        style={{ border: "1px solid black" }}
        className="gx-0 h-100"
        ref={flowRef}
        minZoom={0.2}
        fitView >
        <Panel position="top-right">
          <Button variant="primary" onClick={() => addNewNode(NodeType.scene)}>
              {"Aggiungi Scena "}
              <i className="bi bi-plus-square"/>
          </Button>
          <Button variant="primary" onClick={() => addNewNode(NodeType.choice)}>
              {"Aggiungi Scelta "}
              <i className="bi bi-plus-square"/>
          </Button>
        </Panel>
        <Controls />
        <Background />
      </ReactFlow>
    </Row>
  );
};

export default StoryFlowChartEditor;
