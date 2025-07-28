import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { debounce } from "throttle-debounce";
import { ActionIcon, Anchor, AppShell, Button, Center, CloseButton, Divider, Grid, Group, Modal, Tabs, Text, TextInput, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import StoryFlowChartEditor from "../Flow/StoryFlowChartEditor.tsx";
import StoryElements from "./StoryElements.tsx";
import Story from "../StoryElements/Story.ts";
import saveToDisk from "../Misc/SaveToDisk.ts";
import Scene from "../StoryElements/Scene.ts";
import SceneEditor from "./SceneEditor.tsx";
import Choice from "../StoryElements/Choice.ts";
import ChoiceEditor from "./ChoiceEditor.tsx";
import { Info } from "../Flow/InfoNode.tsx";
import InfoEditor from "./InfoEditor.tsx";
import StoryTexts from "./StoryTexts.tsx";
import { NodeType, storyNodeClassNames, storyNodeColorArray } from "../Flow/StoryNode.tsx";
import { ChosenModelContext } from "../App.tsx";
// @ts-ignore
import {ReactComponent as AiPen} from "../img/ai-pen.svg";
import classes from "../GrowColumn.module.css";

const defaultTab = "structure";

function StoryEditor(props: {
	stories: Map<string, Story>,
	setStory: (id: string, newStory: Story) => void,
}) {
	const { id } = useParams();

	const [localStory, setLocalStory] = useState(props.stories.get(id!)?.clone() ?? new Story());
	const [openNodes, setOpenNodes] = useState<string[]>([]);
	const [currentTab, setCurrentTab] = useState<string>(defaultTab);

	const [sideTab, {toggle: toggleSideTab}] = useDisclosure(true);

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
			});
		});
	}, []);

	const onInfoEdited = useCallback((id: string, newInfo: Info) => {
		setLocalStory(story => story.cloneAndSetInfo(id, newInfo))
	}, []);

	const onClickTabClose = useCallback((id: string) => {
		setOpenNodes(openNodes => openNodes.filter(nodeId => nodeId !== id));
		if (currentTab === id) setCurrentTab(defaultTab);
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

	const handleSave = useCallback(debounce(250, (id: string, localStory: Story) => {
		props.setStory(id, localStory);
	}), []);

	const onRequestAllTexts = useCallback(() => {
		modals.openConfirmModal({
			title: <Title order={4}>Generare i testi per tutta la storia?</Title>,
			children: "Eventuali testi già presenti verranno sovrascritti.",
			labels: { confirm: "Continua", cancel: "Annulla" },
			onConfirm: onConfirmGenerateAll,
		})
	}, [onConfirmGenerateAll]);

	// Keeps page title updated with story title
	useEffect(() => {document.title = localStory.title}, [localStory.title]);

	useEffect(() => handleSave(id!, localStory), [handleSave, id, localStory]);

	return (
		<AppShell
			header={{ height: "10vh" }}
			navbar={{ width: "17vw", breakpoint: "sm", collapsed: {desktop: !sideTab} }}
			classNames={{main: classes.growcol}}>
			<AppShell.Header>
				<Grid styles={{inner: {alignItems: "center"}}}>
					<Grid.Col span={2}>
						<Center>
							<ActionIcon.Group>
								<ActionIcon
									size="xl"
									variant="light"
									onClick={() => navigate("/stories")} title="Torna a tutte le storie">
									<i className="bi bi-house" aria-label="home" />
								</ActionIcon>
								<ActionIcon
									size="xl"
									variant="light"
									//onClick={() => saveToDisk(localStory.toJSON(), `${localStory.title}.story`, "application/json")} title="Scarica">
									onClick={() => console.log(localStory.smartSerialize())} title="Scarica">
									<i className="bi bi-download" aria-label="download" />
								</ActionIcon>
								<ActionIcon
									size="xl"
									variant="light"
									title={`${sideTab ? "Nascondi" : "Mostra"} menu laterale`}
									onClick={toggleSideTab}>
									{sideTab ? <i className="bi bi-layout-sidebar" aria-label="sidebar not shown"/> : <i className="bi bi-layout-sidebar-inset" aria-label="sidebar shown"/>}
								</ActionIcon>
								<ActionIcon
									size="xl"
									variant="light"
									title={"Genera tutti i testi"}
									onClick={onRequestAllTexts}
									loading={loading}>
									<AiPen/>
								</ActionIcon>
							</ActionIcon.Group>
						</Center>
					</Grid.Col>
					<Grid.Col span={10}>
						<TextInput
							styles={{input: {textAlign:"center", fontSize:"xx-large"}}}
							size="xl"
							defaultValue={localStory.title}
							onChange={e => handleTitleChange(e.currentTarget.value)}/>
					</Grid.Col>
				</Grid>
			</AppShell.Header>
			<AppShell.Navbar p="sm">
				<StoryElements
					story={localStory}
					setStory={story => setLocalStory(story)}
					readOnly={false} />
			</AppShell.Navbar>
			<AppShell.Main>
				<Tabs
					keepMounted={false}
					value={currentTab}
					onChange={tab => setCurrentTab(tab ?? defaultTab)}
					classNames={{root: classes.growcol, panel: classes.growcol}}
					styles={{tab: {padding: "0.5rem"}}}>
					<Tabs.List>
						<Tabs.Tab value="structure">
							<Text size="xl">
								<i className="bi bi-diagram-2" style={{display:"inline-block", marginInline: "0.5em", transform: "rotate(-90deg)"}} />
							</Text>
						</Tabs.Tab>
						<Tabs.Tab value="texts">
							<Text size="xl">
								<i className="bi bi-list-ol" style={{marginInline: "0.5em"}} />
							</Text>
						</Tabs.Tab>
						{openNodes.map(nodeId => {
							const node = localStory.getNode(nodeId);
							if (node === undefined || node.type === undefined) return null;
							return (
								<Tabs.Tab
									component={Anchor}
									key={nodeId}
									value={nodeId}
									rightSection={
										<CloseButton
											className="close-button"
											onClick={e => {
												e.preventDefault();
												e.stopPropagation();
												onClickTabClose(nodeId)
											}}
											title="Chiudi"/>}
									color={storyNodeColorArray[node.type!]}
									className={storyNodeClassNames[node.type!]}
									style={{textDecoration: "none"}}
									styles={{tabSection: {margin: 0}}}>
									{node.data.label as string}
								</Tabs.Tab>
							);
						})}
					</Tabs.List>
					<Tabs.Panel value="structure" h="100%">
						<StoryFlowChartEditor
							story={localStory}
							setStory={story => setLocalStory(story)}
							onClickEditNode={onClickEditNode}/>
					</Tabs.Panel>
					<Tabs.Panel value="texts">
						<StoryTexts
							story={localStory}
							setStory={story => setLocalStory(story)}
							onClickOpenScene={onClickEditNode}
							onChoiceMoved={onChoiceMoved}
							onChoiceDeleted={onChoiceDeleted}
							onClickEditNode={onClickEditNode}/>
					</Tabs.Panel>
					{openNodes.map(nodeId => {
						const node = localStory.getNode(nodeId);
						if (node === undefined) return null;
						return (
							<Tabs.Panel key={nodeId} value={nodeId} style={{overflowY: "auto"}}>
								{node.type === NodeType.scene &&
									<SceneEditor
										story={localStory}
										setStory={setLocalStory}
										nodeId={nodeId}
										scene={node.data.scene as Scene}
										setScene={newScene => onSceneEdited(nodeId, newScene)}/>}
								{node.type === NodeType.choice &&
									<ChoiceEditor 
										story={localStory}
										nodeId={nodeId}
										choice={node.data.choice as Choice}
										setChoice={newChoice => onChoiceEdited(nodeId, newChoice)}
										onChoiceMoved={(oldIdx, newIdx) => onChoiceMoved(nodeId, oldIdx, newIdx)}
										onChoiceDeleted={idx => onChoiceDeleted(nodeId, idx)}
										onClickEditNode={onClickEditNode}/>}
								{node.type === NodeType.info &&
									<InfoEditor 
										nodeId={nodeId}
										info={node.data.info as Info}
										setInfo={newInfo => onInfoEdited(nodeId, newInfo)}/>}
							</Tabs.Panel>
						);
					})}
				</Tabs>
			</AppShell.Main>
		</AppShell>
	);
}

export default StoryEditor;