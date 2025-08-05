import React, { useCallback, useContext, useEffect, useState } from "react";
import { debounce } from 'throttle-debounce';
import { ActionIcon, Box, Fieldset, Grid, Group, LoadingOverlay, Menu, SimpleGrid, Stack, Text, Textarea, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import Story from "../../StoryElements/Story.ts";
import Scene, { SceneDetails as SceneDetailsType } from "../../StoryElements/Scene.ts";
import SceneDetails from "../SceneDetails.tsx";
import PromptArea from "../PromptArea.tsx";
import { ChosenModelContext } from "../../App.tsx";
// @ts-ignore
import {ReactComponent as AiPen} from "../../img/ai-pen.svg";
import classes from "../GrowColumn.module.css"

function SceneEditor(props: {
	story: Story,
	setStory: React.Dispatch<React.SetStateAction<Story>>,
	nodeId: string,
	scene: Scene,
	setScene: (newScene: Scene) => void,
}) {
	const [localScene, setLocalScene] = useState(Scene.from(props.scene));
	const [loading, setLoading] = useState(false);
	const [isManualEdit, setIsManualEdit] = useState(false);
	const [chosenModel] = useContext(ChosenModelContext)!;

	const handleSave = useCallback(debounce(250, (scene: Scene) => {
		props.setScene(scene);
	}), []);

	const handleEditDetails = useCallback((newDetails: SceneDetailsType) => {
		setLocalScene(scene => scene.cloneAndSetDetails(newDetails));
	}, []);

	const handleEditPrompt = useCallback((newPrompt: string) => {
		setLocalScene(scene => scene.cloneAndSetPrompt(newPrompt));
	}, []);
	
	const handleEditFullText = useCallback((newText: string) => {
		setLocalScene(scene => scene.cloneAndSetFullText(newText));
		setIsManualEdit(true);
	}, []);

	const onSendToLLM = useCallback(async () => {
		setLoading(true);
		const sceneText = await props.story.sendSceneToLLM(props.nodeId, chosenModel)
		if (sceneText) {
			setLocalScene(scene => scene.cloneAndPushFullText(sceneText));
		}
		setLoading(false);
	}, []);

	const onUndoButton = useCallback(() => {
		setLocalScene(scene => scene.cloneAndUndo());
	}, []);
	
	const onRedoButton = useCallback(() => {
		setLocalScene(scene => scene.cloneAndRedo());
	}, []);

	const onRequestNewText = useCallback(() => {
		modals.openConfirmModal({
			title: <Text size="lg">Richiedere un altro testo?</Text>,
			children: (
				<span>
					È possibile ritornare alle proposte precedenti e successive con i tasti <i className="bi bi-arrow-90deg-left"/> e <i className="bi bi-arrow-90deg-right"/>.
				</span>
			),
			labels: { confirm: "Sì", cancel: "No" },
			onConfirm: onSendToLLM
		})
	}, [onSendToLLM]);
	
	useEffect(() => handleSave(localScene), [handleSave, localScene]);

	return (
		<SimpleGrid cols={2} style={{flexGrow: 1}}>
			<Fieldset legend="Testo" className={classes.growcol}>
				<Stack h="100%" gap="xs">
					<Grid>
						<Grid.Col span={10} className={classes.growcol}>
							<PromptArea
								initialText={localScene.history.current.prompt}
								story={props.story}
								setText={handleEditPrompt} />
						</Grid.Col>
						<Grid.Col span={2} className={classes.growcol} style={{justifyContent: "center", alignContent: "center"}}>
							<Group wrap="nowrap" gap={0}>
								<ActionIcon onClick={onRequestNewText} loading={loading} title="Invia all'IA">
									<AiPen/>
								</ActionIcon>
								<Menu>
									<Menu.Target>
										<ActionIcon loading={loading}>
											<i className="bi bi-chevron-down"/>
										</ActionIcon>
									</Menu.Target> 
									<Menu.Dropdown>
										<Menu.Item
											onClick={async () => {
												for await(const {done, progress, newStory} of props.story.sendStoryToLLM(chosenModel, props.nodeId)) {
													if (done) props.setStory(newStory);
												}}}
											leftSection={<i className="bi bi-layer-forward" style={{display:"inline-block", transform:"rotate(90deg)"}}/>}>
											Aggiorna anche Scene Successive
										</Menu.Item>
									</Menu.Dropdown>
								</Menu>
							</Group>
							<ActionIcon.Group>
								<ActionIcon
									disabled={!localScene.history.canUndo()}
									onClick={onUndoButton}
									title="Risposta precedente">
									<i className="bi bi-arrow-90deg-left" />
								</ActionIcon>
								<ActionIcon
									disabled={!localScene.history.canRedo()}
									onClick={onRedoButton}
									title="Risposta successiva">
									<i className="bi bi-arrow-90deg-right" />
								</ActionIcon>
							</ActionIcon.Group>
						</Grid.Col>
					</Grid>
					<Box h="100%">
						<LoadingOverlay visible={loading}/>
						<Textarea
							h="100%"
							className={classes.growcol}
							styles={{
								wrapper: {flexGrow: 1},
								input: {height: "100%"}}}
							placeholder="Testo completo"
							description="Testo generato dall'AI o scrivibile a mano"
							label="Testo completo"
							value={localScene.history.current.fullText}
							onChange={e => handleEditFullText(e.target.value)} />
					</Box>
				</Stack>
			</Fieldset>
			<SceneDetails
				story={props.story}
				details={localScene.details}
				setDetails={handleEditDetails} />
		</SimpleGrid>
	);
}
export default SceneEditor;