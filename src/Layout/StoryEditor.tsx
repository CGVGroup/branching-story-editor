import { Button, Card, Col, Container, ListGroup, Row, Spinner, Stack } from "react-bootstrap";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Story from "../StoryElements/Story.ts";
import ActionListElement from "./ActionListElement.tsx";
import StoryFlowChartViewer from "../Flow/StoryFlowChartViewer.tsx";
import Template from "../StoryElements/Template.ts";
import TemplateDetails from "./TemplateDetails.tsx";

function StoryEditor(props: {
	stories: Map<string, Template>,
	setStories: React.Dispatch<React.SetStateAction<Map<string, Template>>>
}) {
	const [id, setId] = useState<string>();
	const [template, setTemplate] = useState<Template>();
	const [fileUploading, setFileUploading] = useState(false);

	const navigate = useNavigate();

	const fileUpload = useRef<HTMLInputElement>(null);

	const onClickDelete = useCallback((id: string) => {
		props.setStories(stories => {
			const newStories = new Map(stories);
			newStories.delete(id);
			return newStories})
	}, [props.setStories]);
	
	const onUpload = useCallback(async (files?: FileList | null) => {
		if (!files) {
			setFileUploading(false);
			return;
		}
		try {
			const newStories: [string, Template][] = [];
			for (const file of Array.from(files)) {
				newStories.push([uuidv4(), new Template(Story.fromJSON(await file.text()))]);
			}
			props.setStories(stories => new Map([...stories, ...newStories]));
		} catch(err) {
			console.error(err);
		} finally {
			setFileUploading(false);
		}

	}, [props.setStories])

	const onAdd = useCallback(() => {
		props.setStories(stories => new Map(stories).set(uuidv4(), new Template()));
	}, [props.setStories]);

	useEffect(() => {
		if (id && template)
			props.setStories(stories =>
				new Map(stories).set(id, new Template(template.template, template.instances)));
	}, [props.setStories, template])

	useEffect(() => {
		fileUpload.current?.addEventListener("cancel", () => setFileUploading(false));
	}, [])
	
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
								<h5> Template Salvati </h5>
								<Button variant="primary" className={"ms-auto"} onClick={onAdd}>
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
								{[...props.stories.keys()].map(id =>
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
											<ListGroup.Item action onClick={() => {setId(id); setTemplate(props.stories.get(id));}} style={{width:"100%"}}>
												{props.stories.get(id)!.template.flow.nodes.length === 0 ? 
													<i>{props.stories.get(id)!.template.title}</i>
												:
													props.stories.get(id)!.template.title
												}
											</ListGroup.Item>
										</ActionListElement>
									</ListGroup.Item>)}
							</ListGroup>
						</Card.Body>
					</Card>
				</Col>
				<Col className="h-100">
					<Card className="h-100">
						{id && template &&
							<>
								<Card.Header>
									<h5>{template.template.title}</h5>
								</Card.Header>
								<Card.Body>
									<Card style={{height:"40%"}}>
										<StoryFlowChartViewer story={template.template} storyId={id}/>
									</Card>
									<Row style={{height:"60%"}}>
									<TemplateDetails
										template={template}
										setTemplate={setTemplate}
										onClick={(index: number) => navigate(`/stories/${id}/${index}`)} />
									</Row>
								</Card.Body>
							</>
						}
					</Card>
				</Col>
			</Row>
		</Container>
	);
}

export default StoryEditor;