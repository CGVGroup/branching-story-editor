import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import Story from "../StoryElements/Story.ts";
import Scene, { SceneDetails as SceneDetailsType } from "../StoryElements/Scene.ts";
import SceneDetails from "./SceneDetails.tsx";
import PromptArea from "./PromptArea.tsx";
import debouncing from "../Misc/Debouncing.ts";
import { sendToLLM } from "../Misc/LLM.ts";
import UndoStack from "../Misc/UndoStack.ts";

function SceneEditor(props: {
	story: Story,
	setStory: React.Dispatch<React.SetStateAction<Story>>,
	scene: Scene,
	setScene: (newScene: Scene) => void,
}) {
	const [timer, setTimer] = useState<NodeJS.Timeout>();
	const [localScene, setLocalScene] = useState(Scene.from(props.scene));
	const [loading, setLoading] = useState(false);
	const [undoStack, setUndoStack] = useState(new UndoStack([localScene.fullText]));

	const handleSave = useCallback((scene: Scene) => {
		props.setScene(scene);
	}, []);

	const handleEditDetails = useCallback((newDetails: SceneDetailsType) => {
		setLocalScene(scene => new Scene(newDetails, scene.prompt, scene.fullText));
	}, []);

	const handleEditPrompt = useCallback((newPrompt: string) => {
		setLocalScene(scene => new Scene(scene.details, newPrompt, scene.fullText));
	}, []);
	
	const handleEditFullText = useCallback((newText: string) => {
		setUndoStack(undoStack => undoStack.set(newText));
	}, []);
	
	const onSendButton = useCallback(async () => {
		setLoading(true);
		const response = await sendToLLM("");
		if (response.ok) {
			const responseText = await response.text();
			setUndoStack(undoStack => undoStack.push(responseText));
		}
		setLoading(false);
	}, []);

	const onUndoButton = useCallback(() => {
		setUndoStack(undoStack => undoStack.undo());
	}, []);
	
	const onRedoButton = useCallback(() => {
		setUndoStack(undoStack => undoStack.redo());
	}, []);

	useEffect(() => debouncing(timer, setTimer, () => 
		setLocalScene(localScene => new Scene(localScene.details, localScene.prompt, undoStack.peek())),
		250
	), [undoStack]);

	return (			
		<Row className="h-100">
			<Col xs={6} className="h-100">
				<Card className="h-100">
					<Card.Header>
						<h4>Prompt</h4>
					</Card.Header>
					<Card.Body className="h-100">
						<Col className="h-100" onBlur={() => handleSave(localScene)}>
							<Row className="h-25 gx-0">
								<Col>
									<PromptArea
										initialText={localScene.prompt}
										story={props.story}
										setText={handleEditPrompt} />
								</Col>
								<Col xs={1}>
									<Button onClick={onSendButton} disabled={loading}>
										{loading ? 
											<Spinner size="sm"/>
										:
											<i className="bi bi-send" />
										}
									</Button>
									<Button
										variant="secondary"
										disabled={!undoStack.canUndo()}
										onClick={onUndoButton}>
										<i className="bi bi-arrow-90deg-left" />
									</Button>
									<Button
										variant="secondary"
										disabled={!undoStack.canRedo()}
										onClick={onRedoButton}>
										<i className="bi bi-arrow-90deg-right" />
									</Button>
								</Col>
							</Row>
							<div className="h-75">
								<Form.Control
									as="textarea"
									value={undoStack.peek()}
									onChange={e => handleEditFullText(e.target.value)}
									style={{height:"100%"}} />
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