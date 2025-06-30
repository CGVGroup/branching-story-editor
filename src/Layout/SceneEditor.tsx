import React, { useCallback, useContext, useEffect, useState } from "react";
import { Button, ButtonGroup, Card, Col, Dropdown, FloatingLabel, Form, Row, Spinner } from "react-bootstrap";
import { debounce } from 'throttle-debounce';
import Story from "../StoryElements/Story.ts";
import Scene, { SceneDetails as SceneDetailsType } from "../StoryElements/Scene.ts";
import SceneDetails from "./SceneDetails.tsx";
import PromptArea from "./PromptArea.tsx";
import { ModalContents } from "./GenericModal.tsx";
import { ChosenModelContext } from "../App.tsx";
import LoadingPlaceholders from "../Misc/LoadingPlaceholders.tsx";
// @ts-ignore
import {ReactComponent as AiPen} from "../img/ai-pen.svg";

function SceneEditor(props: {
	story: Story,
	setStory: React.Dispatch<React.SetStateAction<Story>>,
	nodeId: string,
	scene: Scene,
	setScene: (newScene: Scene) => void,
	setModal: (contents: ModalContents) => void
}) {
	const [localScene, setLocalScene] = useState(Scene.from(props.scene));
	const [loading, setLoading] = useState(false);
	const [isManualEdit, setIsManualEdit] = useState(false);
	const [chosenModel, _] = useContext(ChosenModelContext)!;

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

	const onSendButton = useCallback(() => {
		props.setModal({
			title: "Vuoi richiedere un altro testo?",
			body: <span>È possibile ritornare alle proposte precedenti e successive con i tasti <i className="bi bi-arrow-90deg-left"/> e <i className="bi bi-arrow-90deg-right"/>.</span>,
			okProps: {variant:"primary", onClick: onSendToLLM},
			okText:"Sì",
			cancelProps: {variant:"secondary"},
			cancelText:"No"})
	}, [onSendToLLM])

	const onUndoButton = useCallback(() => {
		setLocalScene(scene => scene.cloneAndUndo());
	}, []);
	
	const onRedoButton = useCallback(() => {
		setLocalScene(scene => scene.cloneAndRedo());
	}, []);
	
	useEffect(() => handleSave(localScene), [handleSave, localScene]);

	return (			
		<Row className="h-100">
			<Col xs={6} className="h-100">
				<Card className="h-100">
					<Card.Header>
						<h4>Testo</h4>
					</Card.Header>
					<Card.Body className="h-100">
						<Col className="h-100">
							<Row className="h-25 gx-0">
								<Col xs={10}>
									<PromptArea
										initialText={localScene.history.current.prompt}
										story={props.story}
										setText={handleEditPrompt} />
								</Col>
								<Col>
									<Dropdown as={ButtonGroup}>
										<Button onClick={onSendButton} disabled={loading} title="Invia all'IA">
											{loading ? 
												<Spinner size="sm"/>
											:
												<AiPen/>
											}
										</Button>
										<Dropdown.Toggle disabled={loading} split>
											<Dropdown.Menu variant="primary" align="end" style={{ minWidth: 'auto' }}>
												<Dropdown.Item
													onClick={async () => {
														for await(const {done, progress, newStory} of props.story.sendStoryToLLM(chosenModel, props.nodeId)) {
															if (done) props.setStory(newStory);
														}}}
													title="Aggiorna anche Scene Successive"
													style={{width:"fit-content"}}>
													<AiPen/>
													{" "}
													<i className="bi bi-layer-forward" style={{display:"inline-block", transform:"rotate(90deg)"}}/>
												</Dropdown.Item>
											</Dropdown.Menu>
										</Dropdown.Toggle>
									</Dropdown>
									<ButtonGroup>
										<Button
											variant="secondary"
											disabled={!localScene.history.canUndo()}
											onClick={onUndoButton}
											title="Risposta precedente">
											<i className="bi bi-arrow-90deg-left" />
										</Button>
										<Button
											variant="secondary"
											disabled={!localScene.history.canRedo()}
											onClick={onRedoButton}
											title="Risposta successiva">
											<i className="bi bi-arrow-90deg-right" />
										</Button>
									</ButtonGroup>
								</Col>
							</Row>
							<div className="h-75">
								{loading ?
									<LoadingPlaceholders/>
								:
									<FloatingLabel className="h-100" label="Testo completo:">
										<Form.Control
											as="textarea"
											placeholder="Testo Completo"
											value={localScene.history.current.fullText}
											onChange={e => handleEditFullText(e.target.value)}
											style={{height:"100%"}} />
									</FloatingLabel>
								}
							</div>
						</Col>
					</Card.Body>
				</Card>
			</Col>
			<Col>
				<SceneDetails
					story={props.story}
					details={localScene.details}
					setDetails={handleEditDetails} />
			</Col>
		</Row>
		
	);
}

export default SceneEditor;