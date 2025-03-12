import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, Col, Row } from "react-bootstrap";
import * as Blockly from 'blockly/core';
import { useBlocklyWorkspace } from "react-blockly";
import { javascriptGenerator } from 'blockly/javascript';
import { baseToolboxCategories, BlocklyCanvas, populateCustomToolbox, workspaceConfiguration } from "../Blockly/BlocklyConfiguration.tsx";
import { BlockData, convertFromEnumToObjectType, convertFromObjectTypeToEnum } from "../Blockly/Blocks.ts";
import { StoryElementType, StoryElement } from "../StoryElements/StoryElement.ts";
import Story from "../StoryElements/Story.ts";
import Scene, { SceneDetails as SceneDetailsType } from "../StoryElements/Scene.ts";
import ElementModal from "./AddElementModal.tsx";
import SceneDetails from "./SceneDetails.tsx";
import PromptArea from "./PromptArea.tsx";

function SceneEditor(props: {
	story: Story,
	setStory: React.Dispatch<React.SetStateAction<Story>>,
	scene: Scene,
	setScene: (newScene: Scene) => void,
}) {
	const [modal, setModal] = useState(false);
	const [modalType, setModalType] = useState(StoryElementType.character);
	const [timer, setTimer] = useState<NodeJS.Timeout>();

	const blocklyRef = useRef(null);

	const [blocks, setBlocks] = useState<[string, StoryElementType | null][]>([]);
	const [localScene, setLocalScene] = useState(
		new Scene(
			props.scene.workspace,
			props.scene.details,
			props.scene.prompt
		));
	
	const handleWorkspaceChange = useCallback((workspace: Blockly.Workspace) => {
		let workspaceString = javascriptGenerator.workspaceToCode(workspace);
		if (workspaceString.endsWith(",")) {
			workspaceString = workspaceString.slice(0, -1);
		}
		const workspaceObject: BlockData[] = JSON.parse("[" + workspaceString + "]");
		setBlocks(workspaceObject.map(block => [block.outputText ?? "", convertFromObjectTypeToEnum(block.type)]));
		setLocalScene(localScene => new Scene(workspace, localScene.details, localScene.prompt));
	}, []);

	const { workspace } = useBlocklyWorkspace({
		ref: blocklyRef,
		toolboxConfiguration: baseToolboxCategories,
		workspaceConfiguration: workspaceConfiguration,
		onWorkspaceChange: handleWorkspaceChange,
		initialJson: localScene.workspace
	});

	const handleSave = useCallback((scene: Scene) => {
		props.setScene(scene);
	}, []);

	const handleEditDetails = useCallback((newDetails: SceneDetailsType) => {
		setLocalScene(scene => new Scene(scene.workspace, newDetails, scene.prompt));
	}, []);

	const handleEditPrompt = useCallback((newPrompt: string) => {
		setLocalScene(scene => new Scene(scene.workspace, scene.details, newPrompt));
	}, []);

	const onClickAdd = useCallback((type: StoryElementType) => {
		setModalType(type);
		setModal(true);
	}, []);

	const onSubmitNewElement = useCallback((newElement: StoryElement): boolean => {
		if (!props.story.canAddElement(newElement)) return false;
		props.setStory(story => story.cloneAndAddElement(newElement))
		workspace?.refreshToolboxSelection();
		return true;
	}, [props.story, props.setStory, workspace]);

	const handleBlockChange = useCallback((blocks: [string, StoryElementType | null][]) => {
		setBlocks(blocks);
		if (workspace) {
			workspace.clear();
			let stack: Blockly.BlockSvg | undefined;
			blocks.forEach(blockInfo => {
				const block = workspace.newBlock(convertFromEnumToObjectType(blockInfo[1]));
				block.setFieldValue(blockInfo[0], blockInfo[1] === null ? "TextContent" : "SceneObjectName");

				if (stack) stack.nextConnection.connect(block.previousConnection);
				block.initSvg();
				stack = block;
			});
			workspace.render();
			workspace.scrollCenter()
		}
	}, [workspace]);



	useEffect(() => {
		if (workspace) populateCustomToolbox(props.story, workspace, onClickAdd);
	}, [props.story, workspace, onClickAdd]);

	useEffect(() => {
		if (timer) {
			clearTimeout(timer);
		}
		setTimer(setTimeout(() => handleSave(localScene), 250));
	}, [localScene, handleSave]);

	return (
		<Col className="h-100">
			<ElementModal
				modal={modal}
				setModal={setModal}
				modalAction="add"
				elementType={modalType}
				onSubmit={element => onSubmitNewElement(element)} />
			<Row className="h-100">
				<Col xs={6} className="h-100">
					<Card className="h-100">
						<Card.Header>
							<h4>Prompt</h4>
						</Card.Header>
						<Card.Body className="h-100">
							<div className="h-75">
								<BlocklyCanvas
									blocklyRef={blocklyRef} />
							</div>
							<div className="h-25">
								<PromptArea
									initialText={localScene.prompt}
									story={props.story}
									setBlocks={handleBlockChange}
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
		</Col>
	);
}

export default SceneEditor;