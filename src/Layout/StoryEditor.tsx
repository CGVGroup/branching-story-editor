import React, { useCallback, useEffect, useState } from "react";
import { Button, ButtonGroup, Col, Collapse, Container, Row, Tab, Tabs } from "react-bootstrap";
import { useNavigate, useParams } from "react-router";
import StoryFlowChartEditor from "../Flow/StoryFlowChartEditor.tsx";
import StoryElements from "./StoryElements.tsx";
import Story from "../StoryElements/Story.ts";
import DynamicTextField from "./DynamicTextField.tsx";
import saveToDisk from "../Misc/SaveToDisk.ts";
import Scene from "../StoryElements/Scene.ts";
import SceneEditor from "./SceneEditor.tsx";
import { ChoiceDetails, NodeType } from "../Flow/StoryNode.tsx";
import ChoiceEditor from "./ChoiceEditor.tsx";
import StoryTexts from "./StoryTexts.tsx";

function StoryEditor(props: {
	stories: Map<string, Story>,
	setStory: (id: string, newStory: Story) => void,
}) {
	const { id } = useParams();

	const [localStory, setLocalStory] = useState(props.stories.get(id!)?.clone() ?? new Story());
	const [openNodes, setOpenNodes] = useState<string[]>([]);
	const [currentTab, setCurrentTab] = useState<string>();

	const [sideTab, setSideTab] = useState(true);
	const [storyElementsWidth, setStoryElementsWidth] = useState(0);

	const [dirty, setDirty] = useState(false);

	const navigate = useNavigate();

	const handleTitleChange = useCallback((title: string) => {
		setDirty(true);
		setLocalStory(story => story.cloneAndSetTitle(title));
	}, []);

	const handleSave = useCallback((id: string) => {
		props.setStory(id, localStory);
		setDirty(false);
	}, [props.setStory, localStory]);

	const onSceneEdited = useCallback((id: string, newScene: Scene) => {
		setLocalStory(story => story.cloneAndSetScene(id, newScene));
	}, []);

	const onChoiceEdited = useCallback((id: string, newChoice: ChoiceDetails[]) => {
		setLocalStory(story => story.cloneAndSetChoice(id, newChoice));
	}, []);

	const onClickTabClose = useCallback((id: string) => {
		setOpenNodes(openNodes => openNodes?.filter(nodeId => nodeId !== id));
		if (currentTab === id) setCurrentTab(undefined);
	}, [currentTab]);

	const onClickEditNode = useCallback((id: string) => {
		if (!openNodes.some(nodeId => nodeId === id))
			setOpenNodes(ids => 
				[...ids, id].sort(
					(a, b) => (
						localStory.getNodeById(a)?.data.label as string)?.localeCompare(
						localStory.getNodeById(b)?.data.label as string))
			);
		setCurrentTab(id);
	}, [openNodes, localStory]);

	// Applies fixed width to StoryElements (allows collapsing parent without rearranging children)
	useEffect(() => {
		const element = document.getElementById("story-elements-holder")!;
		const computedStyle = getComputedStyle(element);
		setStoryElementsWidth(element.clientWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight));
	}, []);

	return (
		<Container className="h-100" fluid>
			<Row style={{alignItems: "center", height: "10%"}}>
				<Col xs={2}>
					<ButtonGroup size="lg">
						<Button variant="tertiary" onClick={() => navigate("/stories")}>
							<i className="bi bi-house" />
						</Button>
						<Button variant={dirty ? "primary" : "tertiary"} onClick={() => handleSave(id!)}>
							<i className="bi bi-floppy" />
						</Button>
						<Button variant="tertiary" onClick={() => saveToDisk(localStory.toJSON(), `${localStory.title}.story`, "application/json")}>
							<i className="bi bi-download" />
						</Button>
					</ButtonGroup>
				</Col>
				<Col>
					<DynamicTextField
						initialValue={localStory.title}
						onSubmit={handleTitleChange}
						baseProps={{
							id: "story-title",
							className: "story-title",
							size: "lg"
						}} />
				</Col>
			</Row>
			
			<Row style={{height: "90%"}}>
				<Collapse in={sideTab} dimension="width">
					<Col xs={2} className="h-100 px-0 custom-tabs" style={{overflow:"hidden"}} id={"story-elements-holder"}>
						<div className="h-100" style={{width: `${storyElementsWidth}px`, display: "flex", flexDirection: "column"}}>
							<StoryElements
								story={localStory}
								setStory={story => { setDirty(true); setLocalStory(story) }}
								readOnly={false} />
						</div>
					</Col>
				</Collapse>
				<Col className="pe-0 custom-tabs d-flex flex-column h-100" style={{position:"relative"}}>
					<Button
						size="lg"
						onClick={() => setSideTab(s => !s)}
						style={{position:"absolute", left:"-1em", top:"5%", zIndex:"10"}}>
						<i className="bi bi-person-lines-fill" />
					</Button>
					<Tabs
						activeKey={currentTab}
						onSelect={k => setCurrentTab(k ?? "structure")}
						navbarScroll
						variant="underline">
						<Tab
							eventKey="structure"
							title={<div className="custom-nav-link">Struttura</div>}
							unmountOnExit>
							<Row className="w-100 h-100 gx-0">
								<StoryFlowChartEditor
									story={localStory}
									setStory={story => { setDirty(true); setLocalStory(story) }}
									onClickEditNode={onClickEditNode}/>
							</Row>
						</Tab>
						<Tab
							eventKey="texts"
							title={<div className="custom-nav-link">Testi</div>}
							unmountOnExit>
							<Row className="w-100 h-100 gx-0">
								<StoryTexts
									story={localStory}
									setStory={story => { setDirty(true); setLocalStory(story) }}
									onClickOpenScene={(id: string) => onClickEditNode(id)}/>
							</Row>
						</Tab>
						{openNodes?.map(nodeId => {
							const node = localStory.getNodeById(nodeId)!;
							let className: string;
							switch (node.type) {
								case (NodeType.scene):
								default:
									className = "scene";
								break;
								case (NodeType.choice):
									className = "choice";
								break;
							} 
							return (
							<Tab eventKey={nodeId} key={nodeId} title={
								<div className="custom-nav-link">
									{node.data.label as string}
									<i className="bi bi-x-lg close-button" onClick={(e) => {e.preventDefault(); e.stopPropagation(); onClickTabClose(nodeId)}} style={{pointerEvents:"all"}} />
								</div>}
								tabClassName={className}
								unmountOnExit>
								{node.type === NodeType.scene &&
									<SceneEditor
										story={localStory}
										setStory={setLocalStory}
										scene={node.data.scene as Scene}
										setScene={newScene => onSceneEdited(nodeId, newScene)}/>}
								{node.type === NodeType.choice &&
									<ChoiceEditor 
										story={localStory}
										choices={node.data.choices as ChoiceDetails[]}
										setChoices={newChoice => onChoiceEdited(nodeId, newChoice)} />}
							</Tab>
							)}
						)}
					</Tabs>
				</Col>
			</Row>
		</Container>
	);
}

export default StoryEditor;