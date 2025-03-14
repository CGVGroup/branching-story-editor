import { Button, Card, Col, Container, ListGroup, Row, Spinner, Stack } from "react-bootstrap";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Story from "../StoryElements/Story.ts";
import ActionListElement from "./ActionListElement.tsx";
import StoryFlowChartViewer from "../Flow/StoryFlowChartViewer.tsx";
import StoryElements from "./StoryElements.tsx";

function StoriesDashboard({stories, setStory, addStory, deleteStory}: {
	stories: Map<string, Story>,
	setStory: (id: string, newStory: Story) => void,
	addStory: (newStory: Story) => void,
	deleteStory: (id: string) => void,
}) {	
	const [id, setId] = useState<string | undefined>([...stories.keys()]?.[0]);
	const [fileUploading, setFileUploading] = useState(false);

	const navigate = useNavigate();

	const fileUpload = useRef<HTMLInputElement>(null);

	const onClickDelete = useCallback((id: string) => {
		deleteStory(id);
	}, [deleteStory]);
	
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

	const selectedStory = useMemo(() => stories.get(id!), [stories, id]);

	// Handler for aborting file upload dialog
	useEffect(() => {
		fileUpload.current?.addEventListener("cancel", () => setFileUploading(false));
	}, []);
	
	useEffect(() => {
		setId([...stories.keys()].pop());
	}, [stories]);
	
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
								<Button variant="primary" className={"ms-auto"} onClick={onAddNew}>
									<i className="bi bi-file-earmark-plus"/>
								</Button>
								<Button variant="primary" onClick={() => {setFileUploading(true); fileUpload.current?.click()}}>							
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
								{[...stories.keys()].map(id =>
									<ListGroup.Item key={id}>
										<ActionListElement
											leftSide={
												<Button variant="danger" onClick={() => onClickDelete(id)}>
													<i className="bi bi-trash" aria-label="delete" /> 
												</Button>}
											rightSide={
												<Button variant="secondary" onClick={() => navigate(`${id}`)}>
													<i className="bi bi-pencil-square" aria-label="edit"/>
												</Button>}>
											<ListGroup.Item
												action
												onClick={() => setId(id)} style={{width:"100%"}}>
												<span style={{fontStyle: stories.get(id)!.flow.nodes.length === 0 ? "italic" : ""}}>
													{stories.get(id)!.title}
												</span>
											</ListGroup.Item>
										</ActionListElement>
									</ListGroup.Item>
								)}
							</ListGroup>
						</Card.Body>
					</Card>
				</Col>
				<Col className="h-100">
					<Card className="h-100">
						{selectedStory ?
							<>
								<Card.Header>
									<h5>{selectedStory.title}</h5>
								</Card.Header>
								<Card.Body>
									<Card style={{height:"40%"}}>
										<StoryFlowChartViewer story={selectedStory} storyId={id!}/>
									</Card>
									<Card style={{width:"50%", height:"60%"}}>
										<Card.Body className="h-100 custom-tabs" style={{display: "flex", flexDirection: "column"}}>
											<StoryElements
												story={selectedStory}
												readOnly={true} />
										</Card.Body>
									</Card>
								</Card.Body>
							</>
						:
							<Card.Body>
								Aggiungi una Storia
							</Card.Body>
						}
					</Card>
				</Col>
			</Row>
		</Container>
	);
}

export default StoriesDashboard;