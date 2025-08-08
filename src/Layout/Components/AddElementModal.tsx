import { useCallback, useContext, useEffect, useMemo } from "react";
import { StoryElementType, StoryElement, createNewElement, StoryElementTypeDictionary, ObjectElement, StoryElementColorArray } from "../../StoryElements/StoryElement.ts";
import { Button, Divider, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { UseDisclosureHandlers } from "@mantine/hooks";
import { TaxonomiesContext } from "../../App.tsx";
import { taxonomyToTree } from "../../Misc/DB.ts";
import TreeSelect from "./TreeSelect.tsx";
import TreeMultiSelect from "./TreeMultiSelect.tsx";

function ElementModal(props: {
    show: boolean,
    handlers: UseDisclosureHandlers,
    elementType: StoryElementType,
    initialElement?: StoryElement,
    allElements: StoryElement[],
    onSubmit: (element: StoryElement) => void,
    onExited: () => void
}) {
    const taxonomies = useContext(TaxonomiesContext)!;

    const typeOptions = useMemo(() => taxonomyToTree(taxonomies[StoryElementTypeDictionary.eng.plural[props.elementType]])
    , [props.elementType, taxonomies]);

    const datingOptions = useMemo(() => taxonomyToTree(taxonomies.periods), [taxonomies]);
    const materialOptions = useMemo(() => taxonomyToTree(taxonomies.materials), [taxonomies]);
    const originOptions = useMemo(() => taxonomyToTree(taxonomies.areas), [taxonomies]);

    const title = useMemo(() => props.initialElement ? `Modifica ${props.initialElement.name}` : `Aggiungi un nuovo ${StoryElementTypeDictionary.ita.singular[props.elementType]}`
    , [props.initialElement, props.elementType]);
    
    const buttonString = useMemo(() => props.initialElement ? "Modifica" : "Aggiungi", [props.initialElement]);

    const initialValues = useMemo(() => {
        const commonData = {
            name: props.initialElement?.name ?? `Nuovo ${StoryElementTypeDictionary.ita.singular[props.elementType]}`,
            type: props.initialElement?.type ?? "",
            dating: props.initialElement?.dating ?? [],
            description: props.initialElement?.description ?? ""
        };
        switch (props.elementType) {
            case (StoryElementType.character):
                return commonData;
            case (StoryElementType.object):
                return {...commonData, 
                    materials: (props.initialElement as ObjectElement)?.materials ?? [],
                    origin: (props.initialElement as ObjectElement)?.origin ?? "",
                };
            case (StoryElementType.location):
                return commonData;
        }
    }, [props.elementType, props.initialElement])

    const isNameAvailable = useCallback((name: string, message?: string) => {
        const firstMatch = props.allElements.find(element => element.name === name);
        if (!firstMatch) return null;
        if (props.initialElement && firstMatch.id === props.initialElement.id) return null;
        return message;
    }, [props.allElements, props.initialElement]);

    const onSubmit = useCallback(values => {
        const newElement = props.initialElement ? {...props.initialElement, ...values} : {...createNewElement(props.elementType), ...values};
        props.onSubmit(newElement);
        props.handlers.close();
    }, [props.initialElement, props.elementType, props.onSubmit, props.handlers]);

    const form = useForm({
        mode: "uncontrolled",
        initialValues: initialValues,
        validate: {
            name: value => (isNotEmpty("Questo campo non può essere vuoto")(value) ?? isNameAvailable(value, `Un ${StoryElementTypeDictionary.ita.singular[props.elementType]} con questo nome esiste già`))
        }
    });

    useEffect(() => {form.setInitialValues(initialValues); form.reset();}, [initialValues]);
    
    return (
        <Modal
            opened={props.show}
            onClose={props.handlers.close}
            onExitTransitionEnd={() => {props.onExited(); form.reset()}}
            title={<Text size="lg">{title}</Text>}
            keepMounted={false}
            zIndex={500}>
            <form onSubmit={form.onSubmit(values => onSubmit(values))}>
                <Stack gap="xs">
                    <TextInput
                        data-autofocus
                        label="Nome"
                        placeholder="Nessun nome"
                        autoFocus
                        key={form.key("name")}
                        {...form.getInputProps("name")} />
                    <TreeSelect
                        form={form}
                        formKey="type"
                        placeholder="Nessun tipo"
                        inputProps={{label: "Tipo"}}
                        data={typeOptions}/>
                    <TreeMultiSelect
                        form={form}
                        formKey="dating"
                        placeholder="Nessuna datazione"
                        inputProps={{label: "Datazioni"}}
                        data={datingOptions}/>
                    <TextInput
                        label="Descrizione"
                        placeholder="Nessuna descrizione"
                        key={form.key("description")}
                        {...form.getInputProps("description")}/>
                    {props.elementType === StoryElementType.object &&
                        <>
                            <Divider/>
                            <TreeMultiSelect
                                form={form}
                                formKey="materials"
                                placeholder="Nessun materiale"
                                inputProps={{label: "Materiali"}}
                                data={materialOptions}/>
                            <TreeSelect
                                form={form}
                                formKey="origin"
                                placeholder="Origine"
                                position="top"
                                inputProps={{label: "Origine"}}
                                data={originOptions}/>
                        </>
                    }
                </Stack>
                <Divider my="md"/>
                <Group justify="flex-end">
                    <Button color="gray" variant="light" onClick={props.handlers.close}>
                        Annulla
                    </Button>
                    <Button color={StoryElementColorArray[props.elementType]} type="submit">
                        {buttonString}
                    </Button>
                </Group>
            </form>
        </Modal>
    );
}

export default ElementModal;