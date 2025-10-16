import { RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { UseDisclosureHandlers } from "@mantine/hooks";
import { Affix, Avatar, Button, Checkbox, CloseButton, Combobox, Divider, Fieldset, Grid, Group, Modal, RenderTreeNodePayload, ScrollArea, SegmentedControl, Stack, Text, TextInput, Tree, useTree } from "@mantine/core";
import { ObjectElement, StoryElement, StoryElementColorArray, StoryElementType, StoryElementTypeArray, StoryElementTypeDictionary, StoryElementTypeMentions } from "../../StoryElements/StoryElement.ts";
import { getElementFromDB, searchDB, Taxonomies, taxonomyToTree } from "../../Misc/DB.ts";
import { TaxonomiesContext } from "../../App.tsx";
import { DB } from "../../Misc/DB.ts";

type SearchFilters = {
  [K in keyof Pick<StoryElement & ObjectElement, "type" | "dating" | "materials" | "origin">]: string[];
};

const maxResultsCount = 30;

/**
 * Wapper for Mantine's {@link Modal} that allows searching the {@link DB} and selecting multiple {@link StoryElement}s from it.
 */
function DBBrowserModal(props: {
	show: boolean,
	handlers: UseDisclosureHandlers,
	selectedElements: StoryElement[],
	elementType: StoryElementType,
	container?: RefObject<any>,
	onSubmit: (element: StoryElement) => void
}) {
	const taxonomies = useContext(TaxonomiesContext)!;
	const ref = useRef<HTMLDivElement | null>(null);
	
	const [search, setSearch] = useState<string>("");
	const [type, setType] = useState<StoryElementType>(props.elementType);
	const [filters, setFilters] = useState<SearchFilters>({type: [], dating: [], materials: [], origin: []});
	const [updateFilters, setUpdateFilters] = useState<Record<keyof SearchFilters, boolean>>({type: false, dating: false, materials: false, origin: false})
	const [results, setResults] = useState<StoryElement[]>(searchDB(type, search));
	const [selected, setSelected] = useState<string[]>([]);

	const typeTree = useTree();
	const datingTree = useTree();
	const materialTree = useTree();
	const originTree = useTree();

	const trees = useMemo(() => [typeTree, datingTree, materialTree, originTree], []);

	const typeOptions = useMemo(() => taxonomyToTree(taxonomies[StoryElementTypeDictionary.eng.plural[type] as keyof Taxonomies]), [type]);
	const datingOptions = useMemo(() => taxonomyToTree(taxonomies.periods), []);
	const materialOptions = useMemo(() => taxonomyToTree(taxonomies.materials), []);
	const originOptions = useMemo(() => taxonomyToTree(taxonomies.areas), []);
	
	const handleModalClose = useCallback(() => {
		setType(props.elementType);
		setSearch("");
		setSelected([]);
		setFilters({type: [], dating: [], materials: [], origin: []});
		setUpdateFilters({type: false, dating: false, materials: false, origin: false});
		trees.forEach(tree => {
			tree.setCheckedState([]);
			tree.setSelectedState([]);
			tree.collapseAllNodes();
		});
	}, [props.elementType, trees]);
	
	const onSubmit = useCallback(() => {
		selected.forEach(id => props.onSubmit(getElementFromDB(id)));
		handleModalClose();
		props.handlers.close();
	}, [selected, type]);

	const onChangeTab = useCallback((tab: string) => {
		setType(Number.parseInt(tab));
		setSelected([]);
	}, []);

	const handleValueSelect = useCallback((id: string) =>
		setSelected(selected =>
			selected.includes(id) ? selected.filter(e => e !== id) : [...selected, id]
	), []);

	// If no filter is active, return first maxResultCount results
	// Otherwise, filter the search results and return the first maxResultCount results
	useEffect(() => {
		const results = searchDB(type, search);
		if (Object.values(filters).every(value => value.length === 0)) {
			setResults(results.slice(0, maxResultsCount));
			return;
		}
		setResults(results.filter(element => {
			for (const [key, filter] of Object.entries(filters) as [keyof SearchFilters, string[]][]) {
				if (!Object.keys(element).includes(key)) continue;
				const value = (element as StoryElement & ObjectElement)[key];
				if (Array.isArray(value!)) {
					return value.some(val => filter.includes(val));
				}
				return filter.includes(value);
			}
		}).slice(0, maxResultsCount));
	}, [search, type, filters, props.selectedElements]);

	// Keep type updated upon change of props.elementType
	useEffect(() => {
		setType(props.elementType);
	}, [props.elementType]);

	// Monitors updateFilters and sets the filters accordingly
	useEffect(() => {
		if (updateFilters.type) setFilters(filters => {return {...filters, type: typeTree.getCheckedNodes().map(status => status.value)}});
		if (updateFilters.dating) setFilters(filters => {return {...filters, dating: datingTree.getCheckedNodes().map(status => status.value)}});
		if (updateFilters.materials) setFilters(filters => {return {...filters, materials: materialTree.getCheckedNodes().map(status => status.value)}});
		if (updateFilters.origin) setFilters(filters => {return {...filters, origin: originTree.getCheckedNodes().map(status => status.value)}});
		
		if (Object.values(updateFilters).some(needsUpdate => needsUpdate)) setUpdateFilters({type: false, dating: false, materials: false, origin: false});
	}, [updateFilters]);

	return (
		<Modal.Root
			opened={props.show}
			onClose={props.handlers.close}
			size="xl"
			onExitTransitionEnd={handleModalClose}
			closeOnClickOutside={false}>
			<Modal.Overlay />
			<Combobox onOptionSubmit={handleValueSelect} classNames={{option: StoryElementTypeMentions[type]}}>
				<Modal.Content p="sm" pt={0} ref={ref}>
					<Modal.Header p={0} pt={"sm"}>
						<Stack gap="xs" w="100%">
							<Group>
								<Modal.Title>
									<Text size="lg">Scegli un {StoryElementTypeDictionary.ita.singular[type]} dal Catalogo</Text>
								</Modal.Title>
								<Modal.CloseButton />
							</Group>
							<Grid>
								<Grid.Col span={4}>
									<SegmentedControl
										data={StoryElementTypeArray.map(t => {
											return {
												label: StoryElementTypeDictionary.ita.plural[t],
												value: t.toString()
											}})}
										value={type.toString()}
										onChange={onChangeTab}
										color={StoryElementColorArray[type]}
										style={{textTransform: "capitalize"}}/>
								</Grid.Col>
								<Grid.Col span={8}>
									<Combobox.EventsTarget>
										<TextInput
											data-autofocus
											placeholder="Cerca..."
											value={search}
											onChange={e => setSearch(e.target.value)}
											rightSection={search && <CloseButton onClick={() => setSearch("")}/>}/>
									</Combobox.EventsTarget>
								</Grid.Col>
							</Grid>
							<Divider/>
						</Stack>
					</Modal.Header>
					<Grid>
						<Grid.Col span={4}>
							<Stack gap="xs">
								<Fieldset legend="Tipo">
									<Tree tree={typeTree} data={typeOptions} renderNode={nodeProps => renderTreeNode(nodeProps, type, () => setUpdateFilters(flags => {return {...flags, type: true}}))}/>
								</Fieldset>
								<Fieldset legend="Datazione">
									<Tree tree={datingTree} data={datingOptions} renderNode={nodeProps => renderTreeNode(nodeProps, type, () => setUpdateFilters(flags => {return {...flags, dating: true}}))}/>
								</Fieldset>
								{type === StoryElementType.object &&
									<Fieldset legend="Materiale">
										<Tree tree={materialTree} data={materialOptions} renderNode={nodeProps => renderTreeNode(nodeProps, type, () => setUpdateFilters(flags => {return {...flags, material: true}}))}/>
									</Fieldset>}
								{type !== StoryElementType.character &&
									<Fieldset legend="Area Geografica">
										<Tree tree={originTree} data={originOptions} renderNode={nodeProps => renderTreeNode(nodeProps, type, () => setUpdateFilters(flags => {return {...flags, area: true}}))}/>
									</Fieldset>}
							</Stack>
						</Grid.Col>
						<Grid.Col span={8}>
							<Combobox.Options>
								{results.length ?
									results.map((result, idx) => 
										<SearchMultiSelectOption
											key={idx}
											element={result}
											type={type}
											selected={selected}
											propsSelected={props.selectedElements.map(e => e.id)}/>)
								:
									<Combobox.Empty>Nessun risultato</Combobox.Empty> 
								}
							</Combobox.Options>
						</Grid.Col>
					</Grid>
					<Affix withinPortal={false} style={{position: "sticky", pointerEvents: "none"}}>
						<Group justify="flex-end" color="transparent">
							<Button
								color="gray"
								variant="light"
								onClick={props.handlers.close}
								style={{pointerEvents: "auto"}}>
								Annulla
							</Button>
							<Button
								color={StoryElementColorArray[type]}
								type="submit"
								disabled={selected.length === 0}
								onClick={onSubmit}
								style={{pointerEvents: "auto"}}>
								Aggiungi
							</Button>
						</Group>
					</Affix>
				</Modal.Content>
			</Combobox>
		</Modal.Root>
	);
}

/**
 * Renders one node of a Mantine {@link Tree}.
 * @param nodeProps props provided by the Tree component
 * @param type active {@link StoryElementType}
 * @param onClickOverride optional override to `nodeProps.elementProps.onClick`
 */
function renderTreeNode(
	{node, expanded, hasChildren, elementProps, tree}: RenderTreeNodePayload,
	type: StoryElementType,
	onClickOverride?: () => void
) {
	const checked = tree.isNodeChecked(node.value);
	return (
		<Group
			{...elementProps}
			gap="xs"
			wrap="nowrap"
			title={node.value}
			onClick={() => {}}>
			<Checkbox.Indicator
				checked={checked}
				indeterminate={tree.isNodeIndeterminate(node.value)}
				color={StoryElementColorArray[type]}
				onClick={e => {
					if (!checked) {
						tree.checkNode(node.value);
						tree.expand(node.value);
					} else {
						tree.uncheckNode(node.value);
					}
					onClickOverride ? onClickOverride() : elementProps.onClick(e);
				}}
				style={{cursor: "pointer"}}/>
			<Group
				gap={5}
				wrap="nowrap"
				onClick={e => {
					if (hasChildren) {
						tree.toggleExpanded(node.value);
						return;
					}
					if (!checked) {
						tree.checkNode(node.value);
					} else {
						tree.uncheckNode(node.value);
					}
					onClickOverride ? onClickOverride() : elementProps.onClick(e);
			}}>
				<Text size="sm" lineClamp={1}>{node.label}</Text>
				{hasChildren && (
					<i className="bi bi-chevron-down"
						style={{ display: "inline-block", transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}/>
				)}
			</Group>
		</Group>
	);
}

/**
 * Wrapper for Mantine's {@link Combobox.Option}.
 * @param element the corresponding DB element
 * @param type active {@link StoryElementType}
 * @param selected the list of currently selected results
 * @param propsSelected the list of selected elements passed by the parent
 */
function SearchMultiSelectOption(props: {
	element: StoryElement,
	type: StoryElementType,
	selected: string[],
	propsSelected: string[]
}) {
	return (
		<Combobox.Option
			value={props.element.id}
			key={props.element.id}
			disabled={props.propsSelected.includes(props.element.id)}>
			<Group gap="sm">
				<Checkbox
					checked={props.selected.includes(props.element.id) || props.propsSelected.includes(props.element.id)}
					onChange={() => {}}
					color={StoryElementColorArray[props.type]}
					aria-hidden
					tabIndex={-1}
					style={{ pointerEvents: 'none' }}/>
				<Avatar/>
				<div>
					<Text size="sm">{props.element.name}</Text>
					<Text size="xs" opacity={0.5}>{props.element.type}</Text>
					<Text size="xs" opacity={0.5}>{props.element.dating.join(", ")}</Text>
				</div>
			</Group>
		</Combobox.Option>
	);
}


export default DBBrowserModal;