import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { debounce } from "throttle-debounce";
import { Accordion, ActionIcon, Center, Grid, LoadingOverlay, Textarea } from "@mantine/core";
import Story from "../StoryElements/Story.ts";
import Choice from "../StoryElements/Choice.ts";
import ChoiceEditor from "./Editors/ChoiceEditor.tsx";
import { ChoiceNodeProps, InfoNodeProps, NodeType, SceneNodeProps } from "../Flow/StoryNode.tsx";
import PromptArea from "./Components/PromptArea.tsx";
import { ChosenModelContext, ChosenPromptContext } from "../App.tsx";
import InfoEditor from "./Editors/InfoEditor.tsx";
import { Info } from "../Flow/InfoNode.tsx";
import classes from "./GrowColumn.module.css"

/**
 * A more concise display of the story. Nodes are ordered by increasing `x` coordinate. 
 */
function StoryTexts(props: {
	story: Story,
	setStory: (newStory: Story) => void,
	onSceneClickOpenScene: (id: string) => void,
	onChoiceMoved: (id: string, changes: number[]) => void,
	onChoiceDeleted: (id: string, idx: number) => void,
	onChoiceClickEditNode: (id: string) => void,
}) {
	const [localStory, setLocalStory] = useState<Story>(props.story.clone());
	const [loadings, setLoadings] = useState<boolean[]>(new Array(localStory.flow.nodes.length).fill(false));

	const [chosenModel, ] = useContext(ChosenModelContext)!;
	const [chosenPrompt, ] = useContext(ChosenPromptContext)!;
	
	const onFullTextEdited = useCallback((id: string, newText: string) => {
		setLocalStory(story => {
			const scene = story.getScene(id)!;
			return story.cloneAndSetScene(id, scene.cloneAndPushFullText(newText));
	})}, []);
	
	const onPromptTextEdited = useCallback((id: string, newPrompt: string) => {
		setLocalStory(story => {
			const scene = story.getScene(id)!;
			return story.cloneAndSetScene(id, scene.cloneAndSetPrompt(newPrompt));
	})}, []);
	
	const onChoiceEdited = useCallback((id: string, newChoice: Choice) => {
		setLocalStory(story => story.cloneAndSetChoice(id, newChoice))
	}, []);

	const onInfoEdited = useCallback((id: string, newInfo: Info) => {
		setLocalStory(story => story.cloneAndSetInfo(id, newInfo))
	}, []);

	const onSendButtonClicked = useCallback(async (id: string) => {
		const index = localStory.getNodes().findIndex(node => node.id === id);
		setLoadings(loadings => loadings.map((loading, idx) => idx === index ? true : loading));
		const sceneText = await props.story.sendSceneToLLM(id, chosenModel, chosenPrompt);
		if (sceneText) onFullTextEdited(id, sceneText);
		setLoadings(loadings => loadings.map((loading, idx) => idx === index ? false : loading));
	}, [localStory, chosenModel, onFullTextEdited, props.story]);

	const sortedNodes = useMemo(() => [...localStory.flow.nodes].sort((n1, n2) => n1.position.x - n2.position.x)
	, [localStory]);

	const handleSave = useCallback(debounce(250, (localStory: Story) => 
		props.setStory(localStory)
	), []);

	useEffect(() => handleSave(localStory), [handleSave, localStory]);

	return (
		<Accordion>
			{localStory.flow.nodes.length === 0 ?
				<Accordion.Item value="no-stories">
					Nessuna Scena nella Storia
				</Accordion.Item>
			:
				sortedNodes.map((node, idx) => {
					const id = node.id;
					switch (node.type) {
						case (NodeType.scene): {
							const data = node.data as SceneNodeProps;
							return (
								<Accordion.Item value={id} key={idx}>
									<Accordion.Control icon={<i className="bi bi-card-image"/>}>
										{`${data.label}${data.scene?.details.title ? " - " : ""}${data.scene?.details.title}`} 
									</Accordion.Control>
									<Accordion.Panel>
										<Grid>
											<Grid.Col span={4}>
												<PromptArea
													story={localStory}
													initialText={data.scene?.history.current.prompt}
													setText={(text: string) => onPromptTextEdited(id, text)} />
											</Grid.Col>
											<Grid.Col span={1} style={{alignContent:"center"}}>
												<Center>
													<ActionIcon.Group>
														<ActionIcon onClick={() => props.onSceneClickOpenScene(id)} title="Vai alla scena">
															<i className="bi bi-box-arrow-up-right" />
														</ActionIcon>
														<ActionIcon
															variant="light"
															onClick={() => onSendButtonClicked(id)}
															disabled={loadings[idx]}
															loading={loadings[idx]}
															title="Invia all'IA">
															<i className="bi bi-send" />
														</ActionIcon>
													</ActionIcon.Group>    
												</Center>
											</Grid.Col>
											<Grid.Col span={7} pos="relative">
												<LoadingOverlay visible={loadings[idx]}/>
												<Textarea
													h="100%"
													label="Testo completo"
													placeholder="Testo completo"
													value={data.scene?.history.current.fullText}
													onChange={e => onFullTextEdited(id, e.target.value)}
													disabled={loadings[idx]}
													className={classes.growcol}
													styles={{
														wrapper: {flexGrow: 1},
														input: {height: "100%"}
													}}>
												</Textarea>
											</Grid.Col>
										</Grid>
									</Accordion.Panel>
								</Accordion.Item>
							);
						}
						case(NodeType.choice): {
							const data = node.data as ChoiceNodeProps;
							return (
								<Accordion.Item value={id} key={idx} className="choice">
									<Accordion.Control icon={<i className="bi bi-patch-question"/>}>
										{`${data.label} - ${data.choice.title ? data.choice.title : data.choice.choices.map(choice => choice.text).join(" / ")}`}
									</Accordion.Control>
									<Accordion.Panel>
										<ChoiceEditor
											key={idx}
											story={localStory}
											nodeId={node.id}
											choice={data.choice}
											setChoice={newChoice => onChoiceEdited(id, newChoice)}
											onChoiceMoved={changes => props.onChoiceMoved(node.id, changes)}
											onChoiceDeleted={idx => props.onChoiceDeleted(node.id, idx)}
											onClickEditNode={props.onChoiceClickEditNode}/>
									</Accordion.Panel>
								</Accordion.Item>
							);
						}
						case(NodeType.info): {
							const data = node.data as InfoNodeProps;
							return (
								<Accordion.Item value={id} key={idx} className="info">
									<Accordion.Control icon={<i className="bi bi-info-circle"/>}>
										{`${data.label}${data.info?.title ? " - " : ""}${data.info?.title}`} 
									</Accordion.Control>
									<Accordion.Panel>
										<InfoEditor
											key={idx}
											nodeId={node.id}
											info={data.info}
											setInfo={newInfo => onInfoEdited(id, newInfo)}/>
									</Accordion.Panel>
								</Accordion.Item>
							);
						}
						default:
							return <></>
					}
				})
			}
		</Accordion>
	);
}

export default StoryTexts;