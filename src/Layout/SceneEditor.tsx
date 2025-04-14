import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Col, FloatingLabel, Form, Row, Spinner } from "react-bootstrap";
import { debounce } from 'throttle-debounce';
import Story from "../StoryElements/Story.ts";
import Scene, { SceneDetails as SceneDetailsType } from "../StoryElements/Scene.ts";
import SceneDetails from "./SceneDetails.tsx";
import PromptArea from "./PromptArea.tsx";
import { sendToLLM } from "../Misc/LLM.ts";
import UndoStack from "../Misc/UndoStack.ts";
import { ModalContents } from "./GenericModal.tsx";

function SceneEditor(props: {
	story: Story,
	setStory: React.Dispatch<React.SetStateAction<Story>>,
	scene: Scene,
	setScene: (newScene: Scene) => void,
	setModal: (contents: ModalContents) => void
}) {
	const [localScene, setLocalScene] = useState(Scene.from(props.scene));
	const [loading, setLoading] = useState(false);
	const [undoStack, setUndoStack] = useState(new UndoStack([localScene.fullText]));

	const handleSave = useCallback(debounce(250, (scene: Scene) => {
		props.setScene(scene);
	}), []);

	const handleEditDetails = useCallback((newDetails: SceneDetailsType) => {
		setLocalScene(scene => new Scene(newDetails, scene.prompt, scene.fullText));
	}, []);

	const handleEditPrompt = useCallback((newPrompt: string) => {
		setLocalScene(scene => new Scene(scene.details, newPrompt, scene.fullText));
	}, []);
	
	const handleEditFullText = useCallback((newText: string) => {
		setUndoStack(undoStack => undoStack.set(newText));
	}, []);

	const onSendToLLM = useCallback(async () => {
		setLoading(true);
		//const response = await sendToLLM("");
		/*if (response.ok) {
			const responseText = await response.text();
			setUndoStack(undoStack => undoStack.push(responseText));
		}*/
		setUndoStack(undoStack => undoStack.push(response));
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
		setUndoStack(undoStack => undoStack.undo());
	}, []);
	
	const onRedoButton = useCallback(() => {
		setUndoStack(undoStack => undoStack.redo());
	}, []);

	useEffect(() => 
		setLocalScene(localScene => new Scene(localScene.details, localScene.prompt, undoStack.peek()))
	, [undoStack]);
	
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
								<Col>
									<PromptArea
										initialText={localScene.prompt}
										story={props.story}
										setText={handleEditPrompt} />
								</Col>
								<Col xs={1}>
									<Button onClick={onSendButton} disabled={loading} title="Invia all'IA">
										{loading ? 
											<Spinner size="sm"/>
										:
											<i className="bi bi-send" />
										}
									</Button>
									<Button
										variant="secondary"
										disabled={!undoStack.canUndo()}
										onClick={onUndoButton}
										title="Risposta precedente">
										<i className="bi bi-arrow-90deg-left" />
									</Button>
									<Button
										variant="secondary"
										disabled={!undoStack.canRedo()}
										onClick={onRedoButton}
										title="Risposta successiva">
										<i className="bi bi-arrow-90deg-right" />
									</Button>
								</Col>
							</Row>
							<div className="h-75">
								<FloatingLabel className="h-100" label="Testo completo:">
									<Form.Control
										as="textarea"
										placeholder="Testo Completo"
										value={undoStack.peek()}
										onChange={e => handleEditFullText(e.target.value)}
										style={{height:"100%"}} />
								</FloatingLabel>
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