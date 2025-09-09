import React, { useCallback, useMemo, useState } from "react";
import { Avatar, Badge, Box, Button, Center, Group, Menu, NavLink, Stack, Tabs } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { StoryElementType, StoryElement, shortNoElementsText, StoryElementColorArray } from "../StoryElements/StoryElement.ts";
import ElementModal from "./Components/AddElementModal.tsx";
import Story from "../StoryElements/Story.ts";
import classes from "./GrowColumn.module.css"
import DBBrowserModal from "./Components/DBBrowserModal.tsx";

/**
 * Utility array for {@link StoryElementType type}-dependent properties.
 */
const storyElementTabsArray = [
	{type: StoryElementType.character, color: StoryElementColorArray[StoryElementType.character], tabContents: <img src={require("../img/character.png")} title="Personaggi" alt="characters" style={{height:"3em"}}/>},
	{type: StoryElementType.object, color: StoryElementColorArray[StoryElementType.object], tabContents: <img src={require("../img/object.png")} title="Oggetti" alt="objects" style={{height:"3em"}}/>},
	{type: StoryElementType.location, color: StoryElementColorArray[StoryElementType.location], tabContents: <img src={require("../img/location.png")} title="Luoghi" alt="locations" style={{height:"3em"}}/>}
]

/**
 * 
 */
function StoryElements (props: {
	story: Story,
	setStory?: React.Dispatch<React.SetStateAction<Story>>,
	readOnly?: boolean
}) {
	const [key, setKey] = useState(StoryElementType.character);
	const [selectedElement, setSelectedElement] = useState<StoryElement>();
	const [newElementModal, newElementModalHandlers] = useDisclosure(false);
	const [dbModal, dbModalHandlers] = useDisclosure(false);

	const onAddButtonClicked = useCallback(() => {
		setSelectedElement(undefined);
		newElementModalHandlers.open();
	}, [newElementModalHandlers]);

	const onOpenDBButtonClicked = useCallback(() => {
		dbModalHandlers.open();
	}, [dbModalHandlers]);

	const onElementEditButtonClicked = useCallback(() => {
		newElementModalHandlers.open();
	}, [newElementModalHandlers]);

	const onElementDeleteButtonClicked = useCallback((element: StoryElement) => {
		props.setStory?.(story => story.cloneAndDeleteElement(element.id));
		setSelectedElement(undefined);
	}, []);

	const onSubmitNewElement = useCallback((newElement: StoryElement) => {
		if (!props.story.canAddElement(newElement)) return;
		props.setStory?.(story => story.cloneAndAddElement(newElement));
	}, [key, props.story]);

	const onNewElementModalExited = useCallback(() => {
		setSelectedElement(undefined);
	}, []);

	const onElementEdited = useCallback((editedElement: StoryElement) => {
		if (selectedElement) {
			props.setStory?.(story => story.cloneAndSetElement(selectedElement.id, editedElement));
		}
	}, [selectedElement, key]);

	const allElements = useMemo(() => storyElementTabsArray.map(tab => props.story.getElementsByType(tab.type))
	, [props.story]);

	const badges = useMemo(() => storyElementTabsArray.map(tab => props.story.getElementsByType(tab.type).length)
	, [props.story]);

	return (
		<>
			{!props.readOnly && <ElementModal
				show = {newElementModal}
				handlers = {newElementModalHandlers}
				elementType = {key}
				initialElement = {selectedElement}
				allElements={props.story.getElementsByType(key)}
				onSubmit = {selectedElement === undefined ? onSubmitNewElement : onElementEdited}
				onExited={onNewElementModalExited}/>}
			{!props.readOnly && <DBBrowserModal
				show = {dbModal}
				handlers = {dbModalHandlers}
				selectedElements = {props.story.getElements()}
				elementType = {key}
				onSubmit = {onSubmitNewElement}/>}
			<Tabs
				value={key.toString()}
				onChange={k => setKey(Number.parseInt(k ?? "0"))}
				classNames={{root: classes.growcol, panel: classes.growcol}}>
				<Tabs.List grow>
					{storyElementTabsArray.map((tab, idx) =>
						<Tabs.Tab key={idx} value={tab.type.toString()} px={0} color={tab.color} variant="light">
							<Center inline>
								{tab.tabContents}
								<Badge color={tab.color} variant="light">
									{badges[idx]}
								</Badge>
							</Center>
						</Tabs.Tab>)}
				</Tabs.List>
				{storyElementTabsArray.map((tab, idx) =>
				<Tabs.Panel key={idx} value={tab.type.toString()}>
					<Stack pt="xs" gap="xs" className={classes.growcol}>
						{!props.readOnly && 
							<Center>
								<Group gap="xs">
									<Button
										onClick={onOpenDBButtonClicked}
										color={tab.color}
										leftSection={<i className="bi bi-journal-plus" />}>
										Da catalogo
									</Button>
									<Button
										onClick={onAddButtonClicked}
										color={tab.color}
										variant="light"
										leftSection={<i className="bi bi-plus-square" />}>
										Crea
									</Button>
								</Group>
							</Center>
						}
						<Box>
							{allElements[tab.type].length === 0 ?
								<NavLink disabled label={<Center>{shortNoElementsText[tab.type]}</Center>}/>
							:
								allElements[tab.type].map(element => (
									<StoryElementComponent
										key={element.id}
										element={element}
										onClick={() => setSelectedElement(element)}
										onEdit={onElementEditButtonClicked}
										onDelete={() => onElementDeleteButtonClicked(element)}
										readOnly={props.readOnly}/>
								))
							}
						</Box>
					</Stack>
				</Tabs.Panel>
				)}
			</Tabs>
		</>
	);
};

/**
 * Wrapper for Mantine's <{@link NavLink}/> and <{@link Menu}/>. Displays one StoryElement and its interactions.
 * @param element the element to show
 * @param onClick callback invoked upon click on NavLink
 * @param onClick callback invoked upon click on edit button - only for local elements ({@link StoryElement.resident})
 * @param onDelete callback invoked upon click on delete button
 * @param readOnly whether interaction should be disabled
 */
function StoryElementComponent(props: {
	element: StoryElement,
	onClick: () => void,
	onEdit: () => void,
	onDelete: () => void,
	readOnly?: boolean
}) {
	return (
		<Menu position="right" disabled={props.readOnly}>
			<Menu.Target>
				<NavLink
					active
					color={storyElementTabsArray[props.element.elementType].color}
					variant="light"
					label={props.element.name}
					description={props.element.type}
					leftSection={<Avatar></Avatar>}
					onClick={props.onClick}
					style={{fontStyle: props.element.resident ? "italic" : undefined}}/>
			</Menu.Target>
			<Menu.Dropdown p={0}>
				{props.element.resident && (
					<Menu.Item 
						component="button"
						variant="subtle"
						color={storyElementTabsArray[props.element.elementType].color}
						onClick={props.onEdit}>
						<i className="bi bi-pencil" aria-label="edit" />
					</Menu.Item>
				)}
				<Menu.Item
					component="button"
					variant="subtle"
					color="red"
					onClick={props.onDelete}>
					<i className="bi bi-trash" aria-label="delete" /> 
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>);
}

export default StoryElements;
export {storyElementTabsArray};
