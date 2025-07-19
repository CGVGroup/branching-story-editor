import { useCallback, useEffect } from "react";
import { TextInput, TextInputProps } from "@mantine/core";
import { useField } from "@mantine/form"
import { UseDisclosureHandlers } from "@mantine/hooks";

function DynamicTextField(props: {
	initialValue?: string,
	focusOnDoubleClick?: boolean,
	//onChange?: (value: string) => void,
	onSubmit?: (value: string) => void,
	validate?: (value: unknown) => React.ReactNode,
	locked?: boolean,
	lockedHandler?: UseDisclosureHandlers
	baseProps?: TextInputProps
}) {
	const field = useField({
		initialValue: props.initialValue ?? "",
		validate: props.validate,
		validateOnBlur: true
	});
	
	const handleSubmit = useCallback((value: string) => {
		props.onSubmit?.(value);
		props.lockedHandler?.open();
	}, []);

	useEffect(() => {
		if (props.initialValue) field.setValue(props.initialValue);
	}, [props.initialValue]);

	return (
		<TextInput
			{...field.getInputProps()}
			size="sm"
			readOnly={props.locked}
			classNames={{input: `dynamic-text-field ${props.baseProps?.className ?? ""} ${!props?.locked && "focus nodrag"}`}}
			onBlur={e => handleSubmit(e.currentTarget.value)}
			onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur();}}
			onDoubleClick={e => {props.lockedHandler?.close(); e.currentTarget.focus();}}
			rightSection={props.locked !== undefined && <i className={props.locked ? "bi bi-lock" : "bi bi-unlock"} style={{opacity: "0.5"}}/>}
			rightSectionPointerEvents="none"
			styles={{
				input: {
					cursor: props.locked ? "inherit" : "text",
					userSelect: props.locked ? "none" : "auto",
				}
			}}
			{...props.baseProps}/>
	);
}

export default DynamicTextField;