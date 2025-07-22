import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {ActionIcon, AppShell, Button, Center, Divider, Fieldset, FileButton, Flex, Group, Modal, NavLink, Paper, ScrollArea, Select, SimpleGrid, Stack, Textarea, TextInput, Title} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";
import Story from "../StoryElements/Story.ts";
import StoryFlowChartViewer from "../Flow/StoryFlowChartViewer.tsx";
import StoryElements from "./StoryElements.tsx";
import { ChosenModelContext, ModelListContext } from "../App.tsx";
import classes from "../GrowColumn.module.css"

function StoriesDashboard(props: {
	stories: Map<string, Story>,
	setStory: (id: string, newStory: Story) => void,
	addStory: (newStory: Story) => string,
	deleteStory: (id: string) => void,
	lastOpenStory: string | null,
	setLastOpenStory: (id: string) => void,
}) {	
	const navigate = useNavigate();
	
	const [chosenModel, setChosenModel] = useContext(ChosenModelContext)!;

	const [deleteStory, {open: openDeleteStory, close: closeDeleteStory}] = useDisclosure(false);
	const [selectedId, setSelectedId] = useState<string | null>(props.lastOpenStory);
	const [fileUploading, fileUploadingHandler] = useDisclosure(false);

	const fileUpload = useRef<HTMLInputElement>(null);
	const modelNamesContext = useContext(ModelListContext);

	const addStory = useCallback((story: Story) => {
		const newId = props.addStory(story);
		setSelectedId(newId);
	}, [props.addStory])

	const onClickEdit = useCallback((id: string) => {
		navigate(`${id}`);
		setSelectedId(id);
		props.setLastOpenStory(id);
	}, []);
	
	const onUpload = useCallback(async (files?: File[] | null) => {
		if (!files) {
			fileUploadingHandler.close();
			return;
		}
		try {
			for (const file of files) {
				addStory(Story.fromJSON(await file.text()));
			}
		} catch(err) {
			console.error(err);
		} finally {
			fileUploadingHandler.close();
		}
	}, [addStory])

	const onAddNew = useCallback(() => {
		addStory(new Story());
	}, [addStory]);

	const onClickCopy = useCallback((story: Story) => {
		addStory(story.cloneAndSetTitle(`${story.title} (Copia)`));
	}, [addStory])

	const selectedStory = useMemo(() => props.stories.get(selectedId!), [props.stories, selectedId]);

	const deleteStoryModal = useMemo(() => 
		selectedId && 
			<Modal
				opened={deleteStory}
				onClose={closeDeleteStory}
				title={<Title order={4}>Eliminare <b>{selectedStory?.title}</b>?</Title>}>
				<Group justify="flex-end">
					<Button color="gray" variant="light" onClick={closeDeleteStory}>Annulla</Button>
					<Button color="red" variant="filled" onClick={() => {props.deleteStory(selectedId); closeDeleteStory();}}>Conferma</Button>
				</Group>
			</Modal>
	, [deleteStory, selectedId, selectedStory, props.deleteStory])

	// Handler for aborting file upload dialog
	useEffect(() => {
		const onCancelDialog = () => fileUploadingHandler.close()
		fileUpload.current?.addEventListener("cancel", onCancelDialog);
		return () => fileUpload.current?.removeEventListener("cancel", onCancelDialog);
	}, []);
	
	useEffect(() => {
		document.title = "Story Editor";
	}, []);
	
	return (
		<AppShell 
			header={{ height: "10vh" }}
			navbar={{ width: "20vw", breakpoint: "sm" }}
			styles={{ main: {display: "flex"} }}>
			<AppShell.Header p="xs">
				<Title order={1} ta="center" h="100%">Story Editor</Title>
				<Select
					label="LLM"
					allowDeselect={false}
					defaultValue={chosenModel}
					style={{position: "absolute", right: "0", top: "0", width: "10%"}}
					onChange={choice => setChosenModel(choice!)}
					data={modelNamesContext!}/>
			</AppShell.Header>
			<AppShell.Navbar p="md">
				<AppShell.Section pb="xs">
					<Group justify="space-between">
						<Title order={3} ta="center" style={{flexGrow: 1}}> Storie Salvate </Title>
						<ActionIcon.Group>
							<ActionIcon onClick={onAddNew} title="Crea una nuova storia" size="lg">
								<i className="bi bi-file-earmark-plus"/>
							</ActionIcon>
							<FileButton
								onChange={files => {fileUploadingHandler.open(); onUpload(files);}}
								multiple
								accept=".story">
								{props =>
									<ActionIcon 
										{...props}
										title="Carica una storia da file"
										loading={fileUploading}
										size="lg">
											<i className="bi bi-cloud-upload" />
									</ActionIcon>}
							</FileButton>
						</ActionIcon.Group>
					</Group>
				</AppShell.Section>
				<AppShell.Section grow component={ScrollArea}>
					{[...props.stories.keys()].map(id =>
						<NavLink
							key={id}
							active={selectedId === id}
							label={props.stories.get(id)!.title}
							title={props.stories.get(id)!.title}
							onClick={() => setSelectedId(id)}
							style={{fontStyle: props.stories.get(id)!.flow.nodes.length === 0 ? "italic" : ""}}
							rightSection={
								<ActionIcon
									size="lg"
									variant="light"
									onClick={() => onClickEdit(id)}>
										<i className="bi bi-pencil-square" aria-label="edit"/>
								</ActionIcon>
							}/>
					)}
				</AppShell.Section>
			</AppShell.Navbar>
			<AppShell.Main pe="sm">
				{deleteStoryModal}
				{selectedId && selectedStory ?
					<Flex className={classes.growcol}>
						<Group>
							<ActionIcon.Group>
								<ActionIcon size="lg" color="red" onClick={openDeleteStory} title="Elimina">
									<i className="bi bi-trash" aria-label="delete"/> 
								</ActionIcon>
								<ActionIcon size="lg" variant="light" onClick={() => onClickCopy(selectedStory)} title="Duplica">
									<i className="bi bi-copy" aria-label="duplicate"/> 
								</ActionIcon>
								<ActionIcon size="lg" variant="filled" onClick={() => onClickEdit(selectedId)} title="Modifica">
									<i className="bi bi-pencil-square" aria-label="edit"/>
								</ActionIcon>
							</ActionIcon.Group>
							<TextInput
								size="md"
								placeholder="Nessun titolo"
								value={selectedStory.title}
								onChange={e => props.setStory(selectedId, selectedStory.cloneAndSetTitle(e.target.value))}
								style={{flexGrow: 1}}/>
						</Group>
						<Flex className={classes.growcol}>
							<Paper h="50%">
								<StoryFlowChartViewer story={selectedStory} storyId={selectedId}/>
							</Paper>
							<Paper h="50%">
								<SimpleGrid cols={2} h="100%">
									<StoryElements
										story={selectedStory}
										readOnly={true} />
									<Fieldset legend="Dettagli Storia" h="100%">
										<Stack h="100%">
											<Textarea
												label="Riassunto"
												placeholder="Riassunto"
												value={selectedStory.summary}
												onChange={e => props.setStory(selectedId, selectedStory.cloneAndSetSummary(e.target.value))}
												className={classes.growcol}
												classNames={{wrapper: classes.growcol}}
												styles={{input: { flexGrow: 1 }}}/>
											<Textarea
												label="Note"
												placeholder="Note"
												value={selectedStory.notes}
												onChange={e => props.setStory(selectedId, selectedStory.cloneAndSetNotes(e.target.value))}
												autosize={false}
												className={classes.growcol}
												classNames={{wrapper: classes.growcol}}
												styles={{input: { flexGrow: 1 }}}/>
										</Stack>
									</Fieldset>
								</SimpleGrid>
							</Paper>
						</Flex>
					</Flex>
				:
					<Flex direction="column" style={{flexGrow: 1}}>
						<div style={{
							flexGrow: 1,
							backgroundImage:"url(/Desert.jpg)",
							backgroundSize:"cover",
							opacity:"0.15"}}>
							<Center>
								Crea o seleziona una Storia
							</Center>
						</div>
						
					</Flex>
				}
			</AppShell.Main>
		</AppShell>
	);
}

export default StoriesDashboard;