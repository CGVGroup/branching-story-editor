import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { ModalContents } from "./GenericModal.tsx";
import { debounce } from "throttle-debounce";

function StoryEditor(props: {
	stories: Map<string, Story>,
	setStory: (id: string, newStory: Story) => void,
	setModal: (contents: ModalContents) => void
}) {
	const { id } = useParams();

	const [localStory, setLocalStory] = useState(props.stories.get(id!)?.clone() ?? new Story());
	const [openNodes, setOpenNodes] = useState<string[]>([]);
	const [currentTab, setCurrentTab] = useState<string | null>(null);

	const [sideTab, setSideTab] = useState(true);
	const [storyElementsWidth, setStoryElementsWidth] = useState(0);

	const navigate = useNavigate();

	const handleTitleChange = useCallback((title: string) => {
		document.title = title;
		setLocalStory(story => story.cloneAndSetTitle(title));
	}, []);

	const onSceneEdited = useCallback((id: string, newScene: Scene) => {
		setLocalStory(story => story.cloneAndSetScene(id, newScene));
	}, []);

	const onChoiceEdited = useCallback((id: string, newChoice: ChoiceDetails[]) => {
		setLocalStory(story => story.cloneAndSetChoice(id, newChoice));
	}, []);

	const onClickTabClose = useCallback((id: string) => {
		setOpenNodes(openNodes => openNodes.filter(nodeId => nodeId !== id));
		if (currentTab === id) setCurrentTab(null);
	}, [currentTab]);

	const onClickEditNode = useCallback((id: string) => {
		setOpenNodes(ids => {
			if (ids.some(nodeId => nodeId === id)) return ids;
			else
				return [...ids, id].sort(
					(a, b) => (
						localStory.getNodeById(a)?.data.label as string)?.localeCompare(
						localStory.getNodeById(b)?.data.label as string));
		});
		setCurrentTab(id);
	}, [localStory]);

	const handleSave = useCallback(debounce(250, (id: string, localStory: Story) => {
		props.setStory(id, localStory);
	}), []);

	// Applies fixed width to StoryElements (allows collapsing parent without rearranging children)
	useEffect(() => {
		const element = document.getElementById("story-elements-holder")!;
		const computedStyle = getComputedStyle(element);
		setStoryElementsWidth(element.clientWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight));
	}, []);

	// Keeps page title updated with story title
	useEffect(() => {document.title = localStory.title}, [localStory.title]);

	useEffect(() => handleSave(id!, localStory), [handleSave, id, localStory]);

	useEffect(() => {
		const onBeforeUnload = (e: Event) => {
			e.preventDefault();
			return true;
		}
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, []);

	return (
		<Container className="h-100" fluid>
			<Row style={{alignItems: "center", height: "10%"}}>
				<Col xs={2}>
					<ButtonGroup size="lg">
						<Button variant="tertiary" onClick={() => {window.dispatchEvent(new Event("beforeunload")); navigate("/stories")}} title="Torna a tutte le storie">
							<i className="bi bi-house" aria-label="home" />
						</Button>
						<Button variant="tertiary" onClick={() => saveToDisk(localStory.toJSON(), `${localStory.title}.story`, "application/json")} title="Scarica">
							<i className="bi bi-download" aria-label="download" />
						</Button>
						<Button
							variant={"tertiary"}
							title={`${sideTab ? "Nascondi" : "Mostra"} menu laterale`}
							onClick={() => setSideTab(s => !s)}>
							<i className="bi bi-person-lines-fill" />
						</Button>
					</ButtonGroup>
				</Col>
				<Col className="pe-0">
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
								setStory={story => setLocalStory(story)}
								readOnly={false} />
						</div>
					</Col>
				</Collapse>
				<Col className="pe-0 custom-tabs d-flex flex-column h-100" style={{position:"relative", paddingLeft: sideTab ? undefined : "0px"}}>
					<Tabs
						activeKey={currentTab ?? "structure"}
						onSelect={k => setCurrentTab(k ?? "structure")}
						navbarScroll
						variant="underline">
						<Tab
							eventKey="structure"
							title={<h4 style={{margin: "0"}}><i className="bi bi-diagram-2" style={{marginInline: "0.5em"}} /></h4>}
							unmountOnExit>
							<Row className="w-100 h-100 gx-0">
								<StoryFlowChartEditor
									story={localStory}
									setStory={story => setLocalStory(story)}
									onClickEditNode={onClickEditNode}/>
							</Row>
						</Tab>
						<Tab
							eventKey="texts"
							title={<h4 style={{margin: "0"}}><i className="bi bi-list-ol" style={{marginInline: "0.5em"}} /></h4>}
							unmountOnExit>
							<Row className="w-100 h-100 gx-0">
								<StoryTexts
									story={localStory}
									setStory={story => setLocalStory(story)}
									onClickOpenScene={onClickEditNode}/>
							</Row>
						</Tab>
						{openNodes.map(nodeId => {
							const node = localStory.getNodeById(nodeId);
							if (node === undefined) return null;
							let className: string;
							switch (node.type) {
								case (NodeType.scene):
									className = "scene";
								break;
								case (NodeType.choice):
									className = "choice";
								break;
								default:
									return null;
							} 
							return (
								<Tab eventKey={nodeId} key={nodeId} title={
									<div className="custom-nav-link">
										{node.data.label as string}
										<i className="bi bi-x-lg close-button"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												onClickTabClose(nodeId)
											}}
											style={{pointerEvents:"all"}}
											title="Chiudi"/>
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