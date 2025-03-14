import React, { useCallback, useEffect, useState } from "react";
import { Form, FormControlProps } from "react-bootstrap";

function DynamicTextField(props: {
	initialValue?: string,
	focusOnDoubleClick?: boolean,
	onChange?: (value: string) => void,
	onSubmit?: (value: string) => void,
	isInvalid?: (value: string) => boolean,
	baseProps?: FormControlProps
}) {
	const [value, setValue] = useState(props.initialValue ?? "");
	const [focus, setFocus] = useState(false);

	const handleSubmit = useCallback((value: string) => {
		if ((props.isInvalid !== undefined && !props.isInvalid(value))
			|| props.isInvalid === undefined) {
			props.onSubmit?.(value);
			setFocus(false);
		}
	}, [props.isInvalid, props.onSubmit]);

	useEffect(() => {
		if (props.initialValue) setValue(props.initialValue);
	}, [props.initialValue])

	return (
		<Form onSubmit={e => { e.preventDefault(); handleSubmit(value); }}>
			<Form.Control
				{...props.baseProps}
				className={`dynamic-text-field ${props.baseProps?.className ?? ""} ${focus ? "nodrag" : ""}`}
				value={value}
				plaintext={!focus}
				readOnly={!focus}
				isInvalid={props.isInvalid?.(value)}
				autoComplete="off"

				onChange={e => { setValue(e.target.value); props.onChange?.(value) }}
				onClick={props.focusOnDoubleClick ? undefined : () => setFocus(true)}
				onDoubleClick={props.focusOnDoubleClick ? () => setFocus(true) : undefined}
				onBlur={() => handleSubmit(value)}

				style={{
					cursor: focus ? "text" : "inherit",
					userSelect: focus ? "auto" : "none",
					...props.baseProps?.style
				}} />
		</Form>
	);
}

export default DynamicTextField;