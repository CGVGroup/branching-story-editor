import { useCallback, useEffect, useState } from "react";
import { Combobox, Input, Tree, Group, useCombobox, TreeNodeData, PillsInput, Pill, PillsInputProps } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { useUncontrolled } from "@mantine/hooks";

function TreeMultiSelect(props: {
    form: UseFormReturnType<any>,
    formKey: string,
    data: TreeNodeData[],
    inputProps: PillsInputProps,
    placeholder?: string
}) {
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
        onDropdownOpen: () => combobox.updateSelectedOptionIndex('selected')
    })
    const [_value, handleChange] = useUncontrolled({
        defaultValue: props.form.getInputProps(props.formKey).defaultValue,
        onChange: props.form.getInputProps(props.formKey).onChange
    });

    const [multiValue, setMultiValue] = useState<string[]>(props.form.getInputProps(props.formKey).defaultValue);
    
    const handleValueSelect = useCallback((val: string) =>
        setMultiValue(current => current.includes(val) ? current.filter(v => v !== val) : [...current, val])
    , []);

    const handleValueRemove = useCallback((val: string) =>
        setMultiValue(current => current.filter(v => v !== val))
    , []);

    useEffect(() => handleChange(multiValue), [multiValue]);

    return(
        <Combobox
            store={combobox}
            onOptionSubmit={val => handleValueSelect(val)}>
            <Combobox.Target>
                <PillsInput
                    pointer
                    rightSection={<Combobox.Chevron/>}
                    rightSectionPointerEvents="none"
                    onClick={() => combobox.toggleDropdown()}
                    {...props.inputProps}
                    key={props.form.key(props.formKey)}
                    {...props.form.getInputProps(props.formKey)}>
                    <Pill.Group>
                        {multiValue.length > 0 ? 
                            multiValue.map(value =>
                                <Pill key={value} withRemoveButton onRemove={() => {handleValueRemove(value)}}>
                                    {value}
                                </Pill>)
                        :
                            props.placeholder && <Input.Placeholder>{props.placeholder}</Input.Placeholder>
                        }
                    </Pill.Group>
                </PillsInput>
            </Combobox.Target>
            <Combobox.Dropdown mah={250} style={{zIndex: 2000, overflowY: 'auto'}} p="md">
                <Combobox.Options>
                    <Tree
                        data={props.data}
                        renderNode={({node, expanded, hasChildren, elementProps, tree}) => {
                            return (
                                hasChildren ? (
                                    <Group gap={5} {...elementProps} onClick={() => tree.toggleExpanded(node.value)}>
                                        {node.label}
                                        <i className="bi bi-chevron-down"
                                            style={{ display: "inline-block", transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}/>
                                    </Group>)
                                :
                                    <Combobox.Option value={node.value} {...elementProps} active={multiValue.includes(node.value)}>
                                        <Group gap={5}>
                                            {multiValue.includes(node.value) && <i className="bi bi-check"/>}
                                            {node.label}
                                        </Group>
                                    </Combobox.Option>
                            );
                        }}/>
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
}

export default TreeMultiSelect;