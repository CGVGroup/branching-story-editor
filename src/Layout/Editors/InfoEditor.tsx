import { useCallback, useEffect, useState } from "react";
import { debounce } from 'throttle-debounce';
import { Stack, Textarea, TextInput } from "@mantine/core";
import { Info } from "../../Flow/InfoNode.tsx";

function InfoEditor(props: {
	nodeId: string,
	info: Info,
	setInfo: (newInfo: Info) => void,
}) {
	const [localInfo, setLocalInfo] = useState(props.info ?? {title: "", text: ""});

	const handleSave = useCallback(debounce(250, (info: Info) => {
		props.setInfo(info);
	}), []);

	const handleEditTitle = useCallback((newTitle: string) => {
		setLocalInfo(info => {return {...info, title: newTitle}});
	}, []);

	const handleEditText = useCallback((newText: string) => {
		setLocalInfo(info => {return {...info, text: newText}});
	}, []);
	
	useEffect(() => handleSave(localInfo), [handleSave, localInfo]);

	return (
        <Stack>
            <TextInput
                value={localInfo.title}
                onChange={e => handleEditTitle(e.currentTarget.value)}
                size="md"
                placeholder="Nessun Titolo"
                label="Titolo"/>
            <Textarea
                value={localInfo.text}
                onChange={e => handleEditText(e.target.value)}
                placeholder="Nessun Testo"
                label="Testo"
				resize="vertical"/>
        </Stack>		
	);
}
export default InfoEditor;