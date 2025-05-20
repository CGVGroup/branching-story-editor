import { Button, Card, Col, Container, FloatingLabel, Form, InputGroup, ListGroup, Row, Spinner, Stack } from "react-bootstrap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Story from "../StoryElements/Story.ts";
import StoryFlowChartViewer from "../Flow/StoryFlowChartViewer.tsx";
import StoryElements from "./StoryElements.tsx";
import { ModalContents } from "./GenericModal.tsx";

function StoriesDashboard(props: {
	stories: Map<string, Story>,
	setStory: (id: string, newStory: Story) => void,
	addStory: (newStory: Story) => string,
	deleteStory: (id: string) => void,
	lastOpenStory: string | null,
	setLastOpenStory: (id: string) => void,
	setModal: (contents: ModalContents) => void,
}) {	
	const navigate = useNavigate();
	
	const [selectedId, setSelectedId] = useState<string | null>(props.lastOpenStory);
	const [fileUploading, setFileUploading] = useState(false);

	const fileUpload = useRef<HTMLInputElement>(null);

	const addStory = useCallback((story: Story) => {
		const newId = props.addStory(story);
		setSelectedId(newId);
	}, [props.addStory])

	const onClickDelete = useCallback((id: string) => {
		props.setModal({
			title:`Eliminare "${props.stories.get(id)?.title}"?`,
			okProps: {variant:"danger", onClick: () => props.deleteStory(id)},
			okText: "Elimina",
			cancelProps: {variant: "secondary"},
			cancelText: "Annulla"
		});
	}, [props.stories, props.deleteStory]);

	const onClickEdit = useCallback((id: string) => {
		navigate(`${id}`);
		setSelectedId(id);
		props.setLastOpenStory(id);
	}, []);
	
	const onUpload = useCallback(async (files?: FileList | null) => {
		if (!files) {
			setFileUploading(false);
			return;
		}
		try {
			for (const file of Array.from(files)) {
				addStory(Story.fromJSON(await file.text()));
			}
		} catch(err) {
			console.error(err);
		} finally {
			setFileUploading(false);
		}
	}, [addStory])

	const onAddNew = useCallback(() => {
		addStory(new Story());
	}, [addStory]);

	const onClickCopy = useCallback((story: Story) => {
		addStory(story.cloneAndSetTitle(`${story.title} (Copia)`));
	}, [addStory])

	const selectedStory = useMemo(() => props.stories.get(selectedId!), [props.stories, selectedId]);

	// Handler for aborting file upload dialog
	useEffect(() => {
		const onCancelDialog = () => setFileUploading(false)
		fileUpload.current?.addEventListener("cancel", onCancelDialog);
		return () => fileUpload.current?.removeEventListener("cancel", onCancelDialog);
	}, []);
	
	useEffect(() => {
		document.title = "Story Editor";
	}, []);
	
	return (
		<Container className="h-100" fluid>
			<Row style={{height:"10%", alignItems:"center"}}>
				<h3>Story Editor</h3>
			</Row>
			<Row style={{height:"90%"}}>
				<Col sm={3} className="h-100">
					<Card className="h-100">
						<Card.Header>
							<Stack gap={1} direction="horizontal">
								<h5> Storie Salvate </h5>
								<Button variant="primary" className={"ms-auto"} onClick={onAddNew} title="Crea una nuova storia">
									<i className="bi bi-file-earmark-plus"/>
								</Button>
								<Button variant="primary" onClick={() => {setFileUploading(true); fileUpload.current?.click()}} title="Carica una storia da file">							
									{fileUploading ?
										<Spinner size="sm" /> : <i className="bi bi-cloud-upload" />}
								</Button>
								<input
									ref={fileUpload}
									id="upload-story"
									type="file"
									accept=".story"
									multiple
									onChange={e => onUpload((e.target as HTMLInputElement).files)}
									style={{display:"none"}}
								/>
							</Stack>
						</Card.Header>
						<Card.Body style={{padding:"0", maxHeight:"100%", overflow:"auto"}}>
							<ListGroup variant="flush">
								{[...props.stories.keys()].map(id =>
									<ListGroup.Item key={id}>
										<ListGroup horizontal>
											<ListGroup.Item
												action
												title="Visualizza"
												onClick={() => setSelectedId(id)}
												className={id === selectedId ? "active" : ""}
												style={{fontStyle: props.stories.get(id)!.flow.nodes.length === 0 ? "italic" : ""}}>
												{props.stories.get(id)!.title}
											</ListGroup.Item>
											<ListGroup.Item
												action
												variant="secondary"
												title="Modifica"
												onClick={() => onClickEdit(id)}
												style={{width:"3em"}}>
												<i className="bi bi-pencil-square" aria-label="edit"/>
											</ListGroup.Item>
										</ListGroup>
									</ListGroup.Item>
								)}
							</ListGroup>
						</Card.Body>
					</Card>
				</Col>
				<Col className="h-100">
					<Card className="h-100">
						{selectedId && selectedStory ?
							<>
								<Card.Header>
									<InputGroup>
										<Button variant="danger" onClick={() => onClickDelete(selectedId)} title="Elimina">
											<i className="bi bi-trash" aria-label="delete"/> 
										</Button>
										<Button variant="secondary" onClick={() => onClickCopy(selectedStory)} title="Duplica">
											<i className="bi bi-copy" aria-label="duplicate"/> 
										</Button>
										<Button variant="primary" onClick={() => onClickEdit(selectedId)} title="Modifica">
											<i className="bi bi-pencil-square" aria-label="edit"/>
										</Button>
										<Form.Control
											value={selectedStory.title}
											onChange={e => props.setStory(selectedId, selectedStory.cloneAndSetTitle(e.target.value))}/>
									</InputGroup>
								</Card.Header>
								<Card.Body>
									<Card style={{height:"40%"}}>
										<StoryFlowChartViewer story={selectedStory} storyId={selectedId}/>
									</Card>
									<Row style={{height:"60%"}}>
										<Col xs={6} className="h-100">
											<Card className="h-100">
												<Card.Body className="h-100 custom-tabs" style={{display: "flex", flexDirection: "column"}}>
													<StoryElements
														story={selectedStory}
														readOnly={true} />
												</Card.Body>
											</Card>
										</Col>
										<Col>
											<FloatingLabel className="h-50" label="Riassunto:">
												<Form.Control
													as="textarea"
													placeholder="Riassunto"
													className="h-100"
													value={selectedStory.summary}
													onChange={e => props.setStory(selectedId, selectedStory.cloneAndSetSummary(e.target.value))}/>
											</FloatingLabel>
											<FloatingLabel className="h-50" label="Note:">
												<Form.Control
													as="textarea"
													placeholder="Note"
													className="h-100"
													value={selectedStory.notes}
													onChange={e => props.setStory(selectedId, selectedStory.cloneAndSetNotes(e.target.value))}/>
											</FloatingLabel>
										</Col>
									</Row>
								</Card.Body>
							</>
						:
							<Card.Body className="p-0 d-flex flex-column">
								<div style={{
									width:"100%",
									height:"100%",
									backgroundImage:"url(/Desert.jpg)",
									backgroundSize:"cover",
									opacity:"0.15"}}>
								</div>
								<Col style={{position:"absolute", top:"33%", width:"100%", fontSize:"x-large", alignContent:"center"}}>
									<span>
										Crea o seleziona una Storia
									</span>
								</Col>
							</Card.Body>
						}
					</Card>
				</Col>
			</Row>
		</Container>
	);
}

export default StoriesDashboard;