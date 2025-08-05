import { Combobox, InputBase, Input, Tree, Group, useCombobox, TreeNodeData, InputBaseProps, FloatingPosition } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { useUncontrolled } from "@mantine/hooks";

function TreeSelect(props: {
    form: UseFormReturnType<any>,
    formKey: string,
    data: TreeNodeData[],
    inputProps: InputBaseProps,
    placeholder?: string,
    position?: FloatingPosition,
}) {
    const combobox = useCombobox({onDropdownClose: () => combobox.resetSelectedOption()})
    const [_value, handleChange] = useUncontrolled({
        defaultValue: props.form.getInputProps(props.formKey).defaultValue,
        onChange: props.form.getInputProps(props.formKey).onChange
    });

    return(
        <Combobox
            store={combobox}
            onOptionSubmit={val => {
                handleChange(val);
                combobox.closeDropdown();
            }}
            position={props.position}>
            <Combobox.Target>
                <InputBase
                    component="button"
                    type="button"
                    pointer
                    rightSection={<Combobox.Chevron/>}
                    rightSectionPointerEvents="none"
                    onClick={() => combobox.toggleDropdown()}
                    {...props.inputProps}
                    key={props.form.key(props.formKey)}
                    {...props.form.getInputProps(props.formKey)}>
                    {_value || props.placeholder && <Input.Placeholder>{props.placeholder}</Input.Placeholder>}
                </InputBase>
            </Combobox.Target>
            <Combobox.Dropdown mah={250} style={{zIndex: 2000, overflowY: 'auto'}} p="md">
                <Combobox.Options>
                    <Tree
                        data={props.data}
                        renderNode={({node, expanded, hasChildren, elementProps, tree}) => {
                            return (
                                hasChildren ? (
                                    <Group gap={5} {...elementProps} onClick={() => tree.toggleExpanded(node.value)}>
                                        <i className="bi bi-chevron-down"
                                            style={{ display: "inline-block", transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}/>
                                        {node.label}
                                    </Group>)
                                :
                                    <Combobox.Option value={node.value} {...elementProps}>{node.label}</Combobox.Option>
                            );
                        }}/>
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
}

export default TreeSelect;