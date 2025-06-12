import { useCallback, useContext, useEffect, useState } from "react";
import { Button, ButtonGroup, Col, Collapse, Container, ProgressBar, Row, Spinner, Tab, Tabs } from "react-bootstrap";
import { useNavigate, useParams } from "react-router";
import { debounce } from "throttle-debounce";
import StoryFlowChartEditor from "../Flow/StoryFlowChartEditor.tsx";
import StoryElements from "./StoryElements.tsx";
import Story from "../StoryElements/Story.ts";
import DynamicTextField from "./DynamicTextField.tsx";
import saveToDisk from "../Misc/SaveToDisk.ts";
import Scene from "../StoryElements/Scene.ts";
import SceneEditor from "./SceneEditor.tsx";
import Choice from "../StoryElements/Choice.ts";
import ChoiceEditor from "./ChoiceEditor.tsx";
import StoryTexts from "./StoryTexts.tsx";
import { NodeType } from "../Flow/StoryNode.tsx";
import { ModalContents } from "./GenericModal.tsx";
// @ts-ignore
import {ReactComponent as AiPen} from "../img/ai-pen.svg";
import { ChosenModelContext } from "../App.tsx";

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

	const [loading, setLoading] = useState(false);
	const [loadingPercentage, setLoadingPercentage] = useState(0);
	const [chosenModel, _] = useContext(ChosenModelContext)!;

	const navigate = useNavigate();

	const handleTitleChange = useCallback((title: string) => {
		document.title = title;
		setLocalStory(story => story.cloneAndSetTitle(title));
	}, []);

	const onSceneEdited = useCallback((id: string, newScene: Scene) => {
		setLocalStory(story => story.cloneAndSetScene(id, newScene));
	}, []);

	const onChoiceMoved = useCallback((id: string, oldIdx: number, newIdx: number) => {
		setLocalStory(story => {
			const node = story.getNode(id);
			if (!node) return story;
			const oldHandle = `source-${oldIdx}`;
			const newHandle = `source-${newIdx}`;
			
			return story.cloneAndSetFlow({...story.flow, edges: story.flow.edges.map(edge => {
				if (edge.source !== node.id) return edge;
				if (edge.sourceHandle === oldHandle) return {...edge, sourceHandle: newHandle}
				if (edge.sourceHandle === newHandle) return {...edge, sourceHandle: oldHandle}
				return edge;
			})});
		});
	}, []);

	const onChoiceEdited = useCallback((id: string, newChoice: Choice) => {
		setLocalStory(story => story.cloneAndSetChoice(id, newChoice));
	}, []);

	const onChoiceDeleted = useCallback((id: string, idx: number) => {
		setLocalStory(story => {
			const node = story.getNode(id);
			if (!node) return story;
			return story.cloneAndSetFlow({...story.flow, edges: story.flow.edges.filter(edge => 
				edge.source !== node.id || edge.sourceHandle !== `source-${idx}`)
			})
		});
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
						localStory.getNode(a)?.data.label as string)?.localeCompare(
						localStory.getNode(b)?.data.label as string));
		});
		setCurrentTab(id);
	}, [localStory]);

	const onConfirmGenerateAll = useCallback(async () => {
		setLoading(true);
		setLoadingPercentage(0);
		for await (const {done, progress, newStory} of localStory.sendStoryToLLM(chosenModel)) {
			setLoadingPercentage(progress);
			if (done) setLocalStory(newStory);
		}
		setLoading(false);
	}, [localStory, chosenModel]);

	const onClickGenerateAll = useCallback(() => {
		props.setModal({
			title: "Generare i testi per tutta la storia?",
			body: "Eventuali testi già presenti verranno sovrascritti.",
			okText: "Continua",
			okProps: {variant:"primary", onClick: () => onConfirmGenerateAll()},
			cancelText: "Annulla",
			cancelProps: {variant: "secondary"}
		});
	}, [onConfirmGenerateAll]);

	const handleSave = useCallback(debounce(250, (id: string, localStory: Story) => {
		props.setStory(id, localStory);
	}), []);

	// Applies fixed width to StoryElements (allows collapsing parent without rearranging children)
	useEffect(() => {
		const element = document.getElementById("story-elements-holder")!;
		const computedStyle = getComputedStyle(element);
		setStoryElementsWidth(element.clientWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight) - 1);
	}, []);

	// Keeps page title updated with story title
	useEffect(() => {document.title = localStory.title}, [localStory.title]);

	useEffect(() => handleSave(id!, localStory), [handleSave, id, localStory]);

	return (
		<Container className="h-100" fluid>
			<Row style={{alignItems: "center", height: "10%"}}>
				<Col xs={2}>
					<ButtonGroup size="lg" className="flex-wrap">
						<Button variant="tertiary" onClick={() => navigate("/stories")} title="Torna a tutte le storie">
							<i className="bi bi-house" aria-label="home" />
						</Button>
						<Button variant="tertiary" onClick={() => saveToDisk(localStory.toJSON(), `${localStory.title}.story`, "application/json")} title="Scarica">
							<i className="bi bi-download" aria-label="download" />
						</Button>
						<Button
							variant={"tertiary"}
							title={`${sideTab ? "Nascondi" : "Mostra"} menu laterale`}
							onClick={() => setSideTab(s => !s)}>
							{sideTab ? <i className="bi bi-layout-sidebar" aria-label="sidebar not shown"/> : <i className="bi bi-layout-sidebar-inset" aria-label="sidebar shown"/>}
						</Button>
						<Button
							variant={"tertiary"}
							title={"Genera tutti i testi"}
							onClick={onClickGenerateAll}>
							{loading ? <Spinner size="sm" /> : <AiPen/>}
						</Button>
					</ButtonGroup>
				</Col>
				<Col className="pe-0">
					{loading ? 
						<ProgressBar now={loadingPercentage} striped animated/>
					:
						<DynamicTextField
							initialValue={localStory.title}
							onSubmit={handleTitleChange}
							baseProps={{
								id: "story-title",
								className: "story-title",
								size: "lg"
							}} />
					}
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
							title={
								<h4 style={{margin: "0"}}>
									<i className="bi bi-diagram-2" style={{display:"inline-block", marginInline: "0.5em", transform: "rotate(-90deg)"}} />
								</h4>}
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
									onClickOpenScene={onClickEditNode}
									onChoiceMoved={onChoiceMoved}
									onChoiceDeleted={onChoiceDeleted}
									onClickEditNode={onClickEditNode}
									/>
							</Row>
						</Tab>
						{openNodes.map(nodeId => {
							const node = localStory.getNode(nodeId);
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
											nodeId={nodeId}
											scene={node.data.scene as Scene}
											setScene={newScene => onSceneEdited(nodeId, newScene)}
											setModal={props.setModal}/>}
									{node.type === NodeType.choice &&
										<ChoiceEditor 
											story={localStory}
											nodeId={nodeId}
											choice={node.data.choice as Choice}
											setChoice={newChoice => onChoiceEdited(nodeId, newChoice)}
											onChoiceMoved={(oldIdx, newIdx) => onChoiceMoved(nodeId, oldIdx, newIdx)}
											onChoiceDeleted={idx => onChoiceDeleted(nodeId, idx)}
											onClickEditNode={onClickEditNode}
										/>
									}
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