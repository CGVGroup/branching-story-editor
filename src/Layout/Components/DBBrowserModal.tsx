import { RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { UseDisclosureHandlers } from "@mantine/hooks";
import { Affix, Avatar, Button, Checkbox, CloseButton, Combobox, Divider, Fieldset, Grid, Group, Modal, RenderTreeNodePayload, SegmentedControl, Stack, Text, TextInput, Tree, useTree } from "@mantine/core";
import { StoryElement, StoryElementColorArray, StoryElementType, StoryElementTypeArray, StoryElementTypeDictionary, StoryElementTypeMentions } from "../../StoryElements/StoryElement.ts";
import { getElementFromDB, searchDB, taxonomyToTree } from "../../Misc/DB.ts";
import { TaxonomiesContext } from "../../App.tsx";

type SearchFilters = {
    type: string[],
    dating: string[],
    material: string[],
    area: string[],
}

const maxResultsCount = 30;

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
    const [filters, setFilters] = useState<SearchFilters>({type: [], dating: [], material: [], area: []});
    const [updateFilters, setUpdateFilters] = useState<Record<keyof SearchFilters, boolean>>({type: false, dating: false, material: false, area: false})
    const [results, setResults] = useState<StoryElement[]>(searchDB(search, type));
    const [selected, setSelected] = useState<string[]>([]);

    const typeTree = useTree();
    const datingTree = useTree();
    const materialTree = useTree();
    const areaTree = useTree();

    const trees = useMemo(() => [typeTree, datingTree, materialTree, areaTree], []);

    const typeOptions = useMemo(() => taxonomyToTree(taxonomies[StoryElementTypeDictionary.eng.plural[type]]), [type]);
    const datingOptions = useMemo(() => taxonomyToTree(taxonomies.periods), []);
    const materialOptions = useMemo(() => taxonomyToTree(taxonomies.materials), []);
    const areaOptions = useMemo(() => taxonomyToTree(taxonomies.areas), []);
    
    const handleModalClose = useCallback(() => {
        setType(props.elementType);
        setSearch("");
        setSelected([]);
        setFilters({type: [], dating: [], material: [], area: []});
        setUpdateFilters({type: false, dating: false, material: false, area: false});
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

    const renderTreeNode = useCallback(({node, expanded, hasChildren, elementProps, tree}: RenderTreeNodePayload) => {
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
                        elementProps.onClick(e);
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
                        elementProps.onClick(e);
                }}>
                    <Text size="sm" lineClamp={1}>{node.label}</Text>
                    {hasChildren && (
                        <i className="bi bi-chevron-down"
                            style={{ display: "inline-block", transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}/>
                    )}
                </Group>
            </Group>
        );
    }, [type]);

    const searchMultiSelectOption = useCallback((element: StoryElement, propsSelected: string[]) => {
        return (
            <Combobox.Option
                value={element.id}
                key={element.id}
                disabled={propsSelected.includes(element.id)}>
                <Group gap="sm">
                    <Checkbox
                        checked={selected.includes(element.id) || propsSelected.includes(element.id)}
                        onChange={() => {}}
                        color={StoryElementColorArray[type]}
                        aria-hidden
                        tabIndex={-1}
                        style={{ pointerEvents: 'none' }}/>
                    <Avatar/>
                    <div>
                        <Text size="sm">{element.name}</Text>
                        <Text size="xs" opacity={0.5}>{element.type}</Text>
                        <Text size="xs" opacity={0.5}>{element.dating.join(", ")}</Text>
                    </div>
                </Group>
            </Combobox.Option>
        );
    }, [selected, type]);

    const handleValueSelect = useCallback((id: string) =>
        setSelected(selected =>
            selected.includes(id) ? selected.filter(e => e !== id) : [...selected, id]
    ), []);

    useEffect(() => {
        const results = searchDB(search, type);
        if (Object.entries(filters).every(([, value]) => value.length === 0)) {
            setResults(results.slice(0, maxResultsCount));
            return;
        }
        setResults(results.filter((element, idx) => {
            if (idx >= maxResultsCount) return false;
            for (const [key, value] of Object.entries(filters)) {
                if (element[key] === undefined) continue;
                if (Array.isArray(element[key])) {
                    return element[key].some(f => value.includes(f));
                }
                return value.includes(element[key]);
            }
        }));
    }, [search, type, filters, props.selectedElements]);

    useEffect(() => {
        setType(props.elementType);
    }, [props.elementType]);

    useEffect(() => {
        if (updateFilters.type) setFilters(filters => {return {...filters, type: typeTree.getCheckedNodes().map(status => status.value)}});
        if (updateFilters.dating) setFilters(filters => {return {...filters, dating: datingTree.getCheckedNodes().map(status => status.value)}});
        if (updateFilters.material) setFilters(filters => {return {...filters, material: materialTree.getCheckedNodes().map(status => status.value)}});
        if (updateFilters.area) setFilters(filters => {return {...filters, area: areaTree.getCheckedNodes().map(status => status.value)}});
        if (Object.entries(updateFilters).some(([, value]) => value === true)) setUpdateFilters({type: false, dating: false, material: false, area: false});
    }, [updateFilters]);

    return (
        <Modal.Root opened={props.show}
            onClose={props.handlers.close}
            size="xl"
            onExitTransitionEnd={handleModalClose}>
            <Modal.Overlay />
            <Modal.Content p="sm" pt={0} ref={ref}>
                <Combobox onOptionSubmit={handleValueSelect} classNames={{option: StoryElementTypeMentions[type]}}>
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
                                    <Tree tree={typeTree} data={typeOptions} renderNode={nodeProps => renderTreeNode({...nodeProps, elementProps: {...nodeProps.elementProps, onClick: () => setUpdateFilters(flags => {return {...flags, type: true}})}})}/>
                                </Fieldset>
                                <Fieldset legend="Datazione">
                                    <Tree tree={datingTree} data={datingOptions} renderNode={nodeProps => renderTreeNode({...nodeProps, elementProps: {...nodeProps.elementProps, onClick: () => setUpdateFilters(flags => {return {...flags, dating: true}})}})}/>
                                </Fieldset>
                                {type === StoryElementType.object &&
                                    <Fieldset legend="Materiale">
                                        <Tree tree={materialTree} data={materialOptions} renderNode={nodeProps => renderTreeNode({...nodeProps, elementProps: {...nodeProps.elementProps, onClick: () => setUpdateFilters(flags => {return {...flags, material: true}})}})}/>
                                    </Fieldset>}
                                {type !== StoryElementType.character &&
                                    <Fieldset legend="Area Geografica">
                                        <Tree tree={areaTree} data={areaOptions} renderNode={nodeProps => renderTreeNode({...nodeProps, elementProps: {...nodeProps.elementProps, onClick: () => setUpdateFilters(flags => {return {...flags, area: true}})}})}/>
                                    </Fieldset>}
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={8}>
                            <Combobox.Options>
                                {results.length ?
                                    results.map(result => searchMultiSelectOption(result, props.selectedElements.map(e => e.id)))
                                :
                                    <Combobox.Empty>Nessun risultato</Combobox.Empty> 
                                }
                            </Combobox.Options>
                        </Grid.Col>
                    </Grid>
                </Combobox>
                <Affix withinPortal={false} style={{position: "sticky", pointerEvents: "none"}}>
                    <Group justify="flex-end">
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
        </Modal.Root>
    );
} 

export default DBBrowserModal;