import React, { useCallback, useEffect, useState } from "react";
import { Card, Col, Row } from "react-bootstrap";
import Story from "../StoryElements/Story.ts";
import Scene, { SceneDetails as SceneDetailsType } from "../StoryElements/Scene.ts";
import SceneDetails from "./SceneDetails.tsx";
import PromptArea from "./PromptArea.tsx";
import debouncing from "../Misc/Debouncing.ts";

function SceneEditor(props: {
	story: Story,
	setStory: React.Dispatch<React.SetStateAction<Story>>,
	scene: Scene,
	setScene: (newScene: Scene) => void,
}) {
	const [timer, setTimer] = useState<NodeJS.Timeout>();
	const [localScene, setLocalScene] = useState(props.scene.copy());

	const handleSave = useCallback((scene: Scene) => {
		props.setScene(scene);
	}, []);

	const handleEditDetails = useCallback((newDetails: SceneDetailsType) => {
		setLocalScene(scene => new Scene(newDetails, scene.prompt));
	}, []);

	const handleEditPrompt = useCallback((newPrompt: string) => {
		setLocalScene(scene => new Scene(scene.details, newPrompt));
	}, []);

	useEffect(() => debouncing(timer, setTimer, () => handleSave(localScene), 250)
	, [localScene, handleSave]);

	return (			
		<Row className="h-100">
			<Col xs={6} className="h-100">
				<Card className="h-100">
					<Card.Header>
						<h4>Prompt</h4>
					</Card.Header>
					<Card.Body className="h-100">
						<div className="h-75">
							
						</div>
						<div className="h-25">
							<PromptArea
								initialText={localScene.prompt}
								story={props.story}
								setText={handleEditPrompt} />
						</div>
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