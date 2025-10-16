import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Node } from "@xyflow/react";
import { ActionIcon, Anchor, AppShell, Center, CloseButton, Grid, Group, Tabs, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals, openConfirmModal } from "@mantine/modals";
import StoryFlowChartEditor from "../../Flow/StoryFlowChartEditor.tsx";
import StoryElements from "../StoryElements.tsx";
import Story from "../../StoryElements/Story.ts";
import Scene from "../../StoryElements/Scene.ts";
import SceneEditor from "./SceneEditor.tsx";
import Choice from "../../StoryElements/Choice.ts";
import ChoiceEditor from "./ChoiceEditor.tsx";
import { Info } from "../../Flow/InfoNode.tsx";
import InfoEditor from "./InfoEditor.tsx";
import StoryTexts from "../StoryTexts.tsx";
import { NodeType, storyNodeClassNames, storyNodeColorArray } from "../../Flow/StoryNode.tsx";
// @ts-ignore
import {ReactComponent as AiPen} from "../../img/ai-pen.svg";
import classes from "../GrowColumn.module.css";
import GeneratingTextsDialog, { TextsLoadingInfo } from "../Components/GeneratingTextsDialog.tsx";
import StorySettings from "../StorySettings.tsx";

const defaultTab = "structure";

/**
 * Main container of the App. Manages Header, Aside, Tabs and main content for all editors.
 */
function StoryEditor(props: {
	stories: Map<string, Story>,
	setStory: (id: string, newStory: Story) => void,
}) {
	const { id } = useParams();

	const [localStory, setLocalStory] = useState(props.stories.get(id!)?.clone() ?? new Story());
	const [openNodes, setOpenNodes] = useState<string[]>([]);
	const [currentTab, setCurrentTab] = useState<string>(defaultTab);
	const [dirty, setDirty] = useState(false);

	const [sideTab, {toggle: toggleSideTab}] = useDisclosure(true);
	const [aside, {open: openAside, close: closeAside, toggle: toggleAside}] = useDisclosure(false);

	const [loading, setLoading] = useState(false);
	const [currentLoadingInfo, setCurrentLoadingInfo] = useState<TextsLoadingInfo>({current: 0, total: 0, currentScene: ""});

	const navigate = useNavigate();

	const handleTitleChange = useCallback((title: string) => {
		setLocalStory(story => story.cloneAndSetTitle(title));
	}, []);

	const onSceneEdited = useCallback((id: string, newScene: Scene) => {
		setLocalStory(story => story.cloneAndSetScene(id, newScene));
	}, []);

	/**
	 * Reassigns source handles for edges so that they keep their association with their choice even when choices are rearranged.
	 * @param id {@link Node.id id} of the node
	 * @param changes an array of numbers representing the index of each choice before the change took place
	 * @example
	 * const initialOrder = [0, 1, 2, 3];
	 * // 3 gets moved to the head, shifting all other handles
	 * const changes = [3, 0, 1, 2];
	 */
	const onChoiceMoved = useCallback((id: string, changes: number[]) => {
		setLocalStory(story => {
			const node = story.getNode(id);
			if (!node) return story;
			
			return story.cloneAndSetFlow({...story.flow, edges: story.flow.edges.map(edge => {
				if (edge.source !== node.id) return edge;
				for (let i = 0 ; i < changes.length; i++) {
					if (i == changes[i]) continue;
					if (edge.sourceHandle == `source-${changes[i]}`) return {...edge, sourceHandle: `source-${i}`}
				}
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

	const checkStorySettings = useCallback((story: Story) => {
		if (story.settings.model && story.settings.prompt && story.settings.mainCharacter) {
			return true
		}
		modals.openConfirmModal({
			title: <Text size="lg">Impostazioni di generazione non valide</Text>,
			children: <Text>Assegna ogni campo nelle impostazioni della Storia (<i className="bi bi-gear"/>)</Text>,
			cancelProps: {style: {display: "none"}},
			confirmProps: {variant: "light", color: "red"},
			labels: { confirm: "Ok", cancel: ""},
			onConfirm: () => openAside()
		});
		return false;
	}, []);

	const generateMultipleScenes = useCallback(async (startId?: string) => {
		setLoading(true);
		for await (const {done, progress, newStory, error} of localStory.sendStoryToLLM(startId)) {
			setCurrentLoadingInfo(progress);
			if (done) {
				if (!error) 
					setLocalStory(newStory);
				else {
					modals.openConfirmModal({
						title: <Text size="lg">Errore nella generazione</Text>,
						children: error,
						cancelProps: {style: {display: "none"}},
						confirmProps: {variant: "light", color: "red"},
						labels: { confirm: "Ok", cancel: ""},
					});
					break;
				}
			}
		}
		setLoading(false);
	}, [localStory]);


	const onRequestAllTexts = useCallback((story: Story) => {
		if (!checkStorySettings(story)) return;
		modals.openConfirmModal({
			title: <Text size="lg">Generare i testi per tutta la storia?</Text>,
			children: "Per ogni scena sarà possibile ritornare ai testi precedenti.",
			labels: { confirm: "Continua", cancel: "Annulla" },
			onConfirm: generateMultipleScenes,
		})
	}, [generateMultipleScenes]);

	const onSceneRequestedNewText = useCallback(async (story: Story, nodeId: string, alsoFollowing?: boolean) => {
		if (!checkStorySettings(story)) return;
		if (alsoFollowing) await generateMultipleScenes(nodeId)
		else {
			try {
				await story.sendSceneToLLM(nodeId);
			} catch (error) {
				modals.openConfirmModal({
					title: <Text size="lg">Errore di generazione</Text>,
					children: error as string,
					cancelProps: {style: {display: "none"}},
					confirmProps: {variant: "light", color: "red"},
					labels: { confirm: "Ok", cancel: ""},
				});
			}
		}
	}, [checkStorySettings, generateMultipleScenes]);
	
	const handleSave = useCallback((id: string, localStory: Story) => {
		props.setStory(id, localStory);
		setDirty(false);
	}, []);

	const onClickHome = useCallback(() => {
		if (!dirty || window.confirm("Sono presenti modifiche non salvate. Uscire da questa storia?")) {
			navigate("/stories");
		}
	}, [dirty]);

	// Keeps page title updated with story title
	useEffect(() => {document.title = `${localStory.title}${dirty ? " *" : ""}`}, [localStory.title, dirty]);

	// Sets dirty upon change to localStory
	useEffect(() => {if (!dirty) setDirty(true)}, [localStory])

	// Triggers pop-up if dirty is set
	useEffect(() => {
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			if (dirty) e.preventDefault(); // Triggers the pop-up
		}
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [dirty]);
			
	return (
		<AppShell
			header={{ height: "10vh" }}
			navbar={{ width: "17vw", breakpoint: "sm", collapsed: {desktop: !sideTab} }}
			aside={{ width: "15vw", breakpoint: "sm", collapsed: {desktop: !aside} }}
			classNames={{main: classes.growcol}}>
			<AppShell.Header>
				<Grid styles={{inner: {alignItems: "center"}}} px="xs">
					<Grid.Col span={2}>
						<Center>
							<ActionIcon.Group>
								<ActionIcon
									size="xl"
									variant="light"
									title="Torna a tutte le storie"
									onClick={onClickHome}>
									<i className="bi bi-house" aria-label="home" />
								</ActionIcon>
								<ActionIcon
									size="xl"
									variant="light"
									title="Salva"
									onClick={() => handleSave(id!, localStory)}>
										<i className={dirty ? "bi bi-floppy-fill" : "bi bi-floppy"} aria-label="save" />
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
									title="Genera tutti i testi"
									onClick={() => onRequestAllTexts(localStory)}
									loaderProps={{size: "xs"}}
									loading={loading}>
									<AiPen/>
								</ActionIcon>
							</ActionIcon.Group>
						</Center>
					</Grid.Col>
					<Grid.Col span={10}>
						<Group>
							<TextInput
								size="xl"
								defaultValue={localStory.title}
								onChange={e => handleTitleChange(e.currentTarget.value)}
								style={{flexGrow: "1"}}
								styles={{input: {textAlign:"center", fontSize:"xx-large"}}}/>
							<ActionIcon
								size="xl"
								onClick={toggleAside}
								variant={aside ? "filled" : "light"}>
								<i className="bi bi-gear" />
							</ActionIcon>
						</Group>
					</Grid.Col>
				</Grid>
			</AppShell.Header>
			<AppShell.Navbar p="sm">
				<StoryElements
					story={localStory}
					setStory={story => setLocalStory(story)}
					readOnly={false} />
			</AppShell.Navbar>
			<AppShell.Aside>
				<CloseButton onClick={closeAside}/>
				<StorySettings story={localStory} setSettings={settings => setLocalStory(story => story.cloneAndSetSettings(settings))}/>
			</AppShell.Aside>
			<AppShell.Main>
				<GeneratingTextsDialog loading={loading} {...currentLoadingInfo}/>
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
									color={storyNodeColorArray[node.type as NodeType]}
									className={storyNodeClassNames[node.type as NodeType]}
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
							onSceneClickOpenScene={onClickEditNode}
							onChoiceMoved={onChoiceMoved}
							onChoiceDeleted={onChoiceDeleted}
							onChoiceClickEditNode={onClickEditNode}
							sendToLLM={(id: string) => onSceneRequestedNewText(localStory, id, false)}/>
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
										scene={node.data.scene as Scene}
										setScene={newScene => onSceneEdited(nodeId, newScene)}
										sendToLLM={alsoFollowing => onSceneRequestedNewText(localStory, node.id, alsoFollowing)}/>}
								{node.type === NodeType.choice &&
									<ChoiceEditor 
										story={localStory}
										nodeId={nodeId}
										choice={node.data.choice as Choice}
										setChoice={newChoice => onChoiceEdited(nodeId, newChoice)}
										onChoiceMoved={changes => onChoiceMoved(nodeId, changes)}
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