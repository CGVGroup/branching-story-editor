import { useCallback, useEffect, useMemo, useState } from "react";
import { getConnectedEdges, Node } from "@xyflow/react";
import { ActionIcon, ActionIconGroup, Button, Flex, Group, Paper, Stack, TextInput } from "@mantine/core";
import { isNotEmpty } from "@mantine/form";
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { debounce } from "throttle-debounce";
import Story from "../../StoryElements/Story.tsx";
import Choice, { ChoiceDetails } from "../../StoryElements/Choice.ts";
import { NodeType, storyNodeColorArray } from "../../Flow/StoryNode.tsx";
import DynamicTextField from "../Components/DynamicTextField.tsx";

function ChoiceEditor(props: {
	story: Story,
	nodeId: string,
	choice: Choice,
	setChoice: (choice: Choice) => void,
	onChoiceMoved: (changes: number[]) => void,
	onChoiceDeleted: (idx: number) => void,
	onClickEditNode: (id: string) => void,
	readOnly?: boolean
}) {
	const [localChoice, setLocalChoice] = useState(Choice.from(props.choice));
	const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

	const addNewChoice = useCallback((index: number) => {
		setLocalChoice(choice => choice.cloneAndAddChoice({text: `Scelta ${index + 1}`, wrong: false}));
	}, []);

	const deleteChoice = useCallback((index: number) => {
		setLocalChoice(choice => choice.cloneAndDeleteAtIndex(index));
		props.onChoiceDeleted(index);
	}, [props.onChoiceDeleted]);

	const setChoiceText = useCallback((idx: number, text: string) => {
		setLocalChoice(choice => choice.cloneAndSetChoiceText(idx, text)); 
	}, []);

	const setTitle = useCallback((title: string) => {
		setLocalChoice(choice => choice.cloneAndSetTitle(title));
	}, []);
	
	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = localChoice.choices.findIndex(choice => choice.text === active.id);
		const newIndex = localChoice.choices.findIndex(choice => choice.text === over.id);
		setLocalChoice(choice => choice.cloneAndSetChoices(arrayMove(choice.choices, oldIndex, newIndex)))
		
		const numberedArray = [...Array(Math.max(oldIndex, newIndex) + 1).keys()];
		const changes = arrayMove(numberedArray, oldIndex, newIndex);
		props.onChoiceMoved(changes);
	}, [props.onChoiceMoved]);
	
	const nextNodes = useMemo(() => {
		const thisNode = props.story.getNode(props.nodeId)!;
		const outgoingEdges = getConnectedEdges([thisNode], props.story.flow.edges).filter(edge => edge.source === thisNode.id);
		return localChoice.choices.map((_, idx) => {
			const nodeId = outgoingEdges.find(edge => edge.sourceHandle === `source-${idx}`)?.target;
			return nodeId ? props.story.getNode(nodeId)! : null
		});
	}, [localChoice, props.story, props.nodeId]);

	const handleSave = useCallback(debounce(250, (choice: Choice) => {
		props.setChoice(choice);
	}), []);

	useEffect(() => handleSave(localChoice), [handleSave, localChoice]);

	return (
		<Stack gap="md" px="xs">
			<TextInput
				defaultValue={localChoice.title}
				onChange={e => setTitle(e.currentTarget.value)}
				size="lg"
				placeholder="Nessun interrogativo"
				label="Interrogativo"/>
			<Stack gap="sm">
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
					<SortableContext items={localChoice.choices.map(choice => choice.text)} strategy={verticalListSortingStrategy}>
						{localChoice.choices.map((choice, index, choices) => 
							<DraggableChoice
								key={choice.text}
								choice={choice}
								choiceIndex={index}
								choices={choices}
								setChoiceText={text => setChoiceText(index, text)}
								deleteChoice={() => deleteChoice(index)}
								onClickEditNode={props.onClickEditNode}
								nextNodes={nextNodes}/>
						)}
					</SortableContext>
				</DndContext>
			</Stack>
			{!props.readOnly &&
				<Button
					size="xl"
					color={storyNodeColorArray[NodeType.choice]}
					variant="subtle"
					onClick={() => addNewChoice(localChoice.choices.length)}
					title="Aggiungi Scelta">
					<i className="bi bi-plus-square-dotted" style={{display: "block", fontSize:"xxx-large"}} />
				</Button>
			}
		</Stack>
	);
}

function DraggableChoice(props: {
	choice: ChoiceDetails,
	choiceIndex: number,
	choices: ChoiceDetails[],
	setChoiceText: (text: string) => void,
	deleteChoice: () => void,
	onClickEditNode: (id: string) => void,
	nextNodes: (Node | null)[],
	readOnly?: boolean
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({id: props.choice.text});

	return (
		<Paper
			ref={setNodeRef}
			shadow={isDragging ? "lg" : "xs"}
			className={props.choice.wrong ? "wrong-choice" : ""}
			p="sm"
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				cursor: isDragging ? "grabbing" : "inherit"
			}}
			{...attributes}>
			<Group>
				<Flex
					align="center"
					justify="center"
					style={{
						cursor: isDragging ? "grabbing" : "grab",
						fontSize: "1.5em"
					}}
					{...listeners}>
					<i className="bi bi-grip-vertical" />
				</Flex>
				<DynamicTextField
					initialValue={props.choice.text}
					onSubmit={props.setChoiceText}
					validate={value =>
						isNotEmpty("Il testo della scelta non può essere vuoto")(value) ||
						(props.choices.some((choice, idx) => choice.text === value && idx !== props.choiceIndex) ? "Esiste già una scelta con questo testo" : null)}
					baseProps={{
						size: "md",
						disabled: props.readOnly,
						label: `Scelta ${props.choiceIndex + 1}`,
						style: {flexGrow: 1}
					}}
				/>
				{!props.readOnly &&
					<ActionIconGroup>
						<ActionIcon
							color="red"
							onClick={props.deleteChoice}
							title="Elimina"
							size="lg">
							<i className="bi bi-trash" aria-label="delete" /> 
						</ActionIcon>
						<ActionIcon
							onClick={() => props.nextNodes[props.choiceIndex] !== null && props.onClickEditNode(props.nextNodes[props.choiceIndex]!.id)}
							color={props.nextNodes[props.choiceIndex] !== null ? storyNodeColorArray[props.nextNodes[props.choiceIndex]!.type as NodeType] : undefined}
							variant="light"
							title={props.nextNodes[props.choiceIndex] !== null ? `Apri ${props.nextNodes[props.choiceIndex]!.data.label}` : "Nessun nodo collegato"}
							disabled={props.nextNodes[props.choiceIndex] === null}
							size="lg">
							<i className="bi bi-box-arrow-up-right" aria-label="open" /> 
						</ActionIcon>
					</ActionIconGroup>
				}
			</Group>
		</Paper>
	)
}

export default ChoiceEditor;