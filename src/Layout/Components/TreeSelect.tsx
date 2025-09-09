import { Combobox, InputBase, Input, Tree, Group, useCombobox, TreeNodeData, InputBaseProps, FloatingPosition, PillsInput, Pill } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { useUncontrolled } from "@mantine/hooks";
import { useCallback, useMemo } from "react";

/**
 * Wrapper for an uncontrolled Select/MultiSelect {@link Combobox} to use as part of a {@link Form}, with values in a {@link Tree} structure.
 * @param isMulti whether to enable multiple choices
 * @param form parent Form
 * @param formKey parent Form {@link UseFormReturnType.key key}
 * @param data {@link TreeNodeData tree data}
 * @param inputComponentProps props to be passed to internal Combobox Input component
 * @param placeholder 
 * @param position dropdown {@link FloatingPosition position}
 */
function TreeSelect(props: {
	isMulti?: boolean,
	form: UseFormReturnType<any>,
	formKey: string,
	data: TreeNodeData[],
	inputComponentProps: InputBaseProps,
	placeholder?: string,
	position?: FloatingPosition,
}) {
	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
		onDropdownOpen: () => combobox.updateSelectedOptionIndex('selected')
	});

	const formInputProps = useMemo(() => props.form.getInputProps(props.formKey)
	, [props.form, props.formKey]);

	const [_value, handleChange] = useUncontrolled({
		defaultValue: formInputProps.defaultValue,
		onChange: formInputProps.onChange
	});

	const handleValueSelect = useCallback((val: string) =>
		handleChange(_value.includes(val) ? _value.filter(v => v !== val) : [..._value, val])
	, [_value]);

	const handleValueRemove = useCallback((val: string) =>
		handleChange(_value.filter(v => v !== val))
	, [_value]);

	return(
		<Combobox
			store={combobox}
			onOptionSubmit={props.isMulti ?
				handleValueSelect
			:
				val => {
					handleChange(val);
					combobox.closeDropdown();
				}
			}
			position={props.position}>
			<Combobox.Target>
				{props.isMulti ?
					<PillsInput
						pointer
						rightSection={<Combobox.Chevron/>}
						rightSectionPointerEvents="none"
						onClick={() => combobox.toggleDropdown()}
						{...props.inputComponentProps}
						{...formInputProps}>
						<Pill.Group>
							{_value.length > 0 ? 
								_value.map(value =>
									<Pill key={value} withRemoveButton onRemove={() => {handleValueRemove(value)}}>
										{value}
									</Pill>)
							:
								props.placeholder && <Input.Placeholder>{props.placeholder}</Input.Placeholder>
							}
						</Pill.Group>
					</PillsInput>
				:
					<InputBase
						component="button"
						type="button"
						pointer
						rightSection={<Combobox.Chevron/>}
						rightSectionPointerEvents="none"
						onClick={() => combobox.toggleDropdown()}
						{...props.inputComponentProps}
						{...formInputProps}>
						{_value || props.placeholder && <Input.Placeholder>{props.placeholder}</Input.Placeholder>}
					</InputBase>
			}
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
									props.isMulti ?
										<Combobox.Option value={node.value} {...elementProps} active={_value.includes(node.value)}>
											<Group gap={5}>
												{_value.includes(node.value) && <i className="bi bi-check"/>}
												{node.label}
											</Group>
										</Combobox.Option>
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