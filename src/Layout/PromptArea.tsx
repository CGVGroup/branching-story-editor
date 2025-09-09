import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RichTextarea, RichTextareaHandle, createRegexRenderer } from "rich-textarea"
import { Combobox, Flex, InputBase, Text, useCombobox } from "@mantine/core";
import Story from "../StoryElements/Story.ts";
import { StoryElementType, StoryElementTypeMentions, StoryElement } from "../StoryElements/StoryElement.ts";
import PromptAreaMenu from "./Components/PromptAreaMenu.tsx";
import classes from "./GrowColumn.module.css"

type Position = {
	top: number;
	left: number;
	caret: number;
};

const MENTION_REGEX = /\B@([\w]*)$/;
const maxElementsShown = 6;

/**
 * Wrapper for <{@link RichTextarea}/> and Mantine's {@link Combobox}.
 * 
 * RichTextarea is not used as a standalone component, but as the `component` prop for <{@link InputBase}/>, in order to inherit its style.
 */
function PromptArea(props: {
	story: Story,
	initialText?: string,
	setText?: (text: string) => void,
	onBlur?: (text: string) => void,
	readOnly?: boolean
}) {
	const ref = useRef<RichTextareaHandle>(null);

	const [text, setText] = useState(props.initialText ?? "");
	const [pos, setPos] = useState<Position | null>(null);

	const combobox = useCombobox({
		onDropdownOpen: () => combobox.selectFirstOption(),
		onDropdownClose: () => combobox.resetSelectedOption(),
	});
	
	const allElements = useMemo(() => props.story.getElements(), [props.story]);
	
	const [match, search] = useMemo(() => {
		const targetText = pos ? text.slice(0, pos.caret) : text;
		const match = pos && targetText.match(MENTION_REGEX);
		return [match, match?.[1] ?? ""];
	}, [pos, text]);
	
	const [highlightAll, highlightCharacters, highlightObjects, highlightLocations] = useMemo(() => props.story.getMatchRegExps(), [props.story]);
	
	/**
	 * Splits a text using {@link highlightAll} and (optionally) spaces as boundaries
	 * @param text text to split
	 * @param spaces whether to split on spaces
	 */
	const textSplitter = useCallback((text: string, spaces: boolean) => {
		const split = allElements.length > 0 ? text.split(highlightAll) : [text];
		let retArr: string[];
		if (!spaces) retArr = split;
		else {
			retArr = split
				.reduce((acc, spl) => {
					if (spl.match(highlightAll))
						return acc.concat(spl);
					else
						return acc.concat(spl.split(/(\s)/g));
				}, new Array<string>());
		}
		return retArr.filter(s => s !== "");
	}, [allElements, highlightAll]);

	/**
	 * Given a mention, returns its corresponding {@link StoryElementType} (or null).
	 * @param mention string starting with an `@` symbol (e.g. obtained by {@link textSplitter})
	 */
	const mentionMatcher = useCallback((mention: string) => {
		if (mention.match(highlightCharacters)) return StoryElementType.character;
		if (mention.match(highlightObjects)) return StoryElementType.object;
		if (mention.match(highlightLocations)) return StoryElementType.location;
		return null;
	}, [highlightCharacters, highlightObjects, highlightLocations]);

	/**
	 * Adds the name corresponding to element with the given {@link StoryElement.id id} at the {@link pos.caret caret position}.
	 * @param id id of the StoryElement to add
	 */
	const complete = useCallback((id: string | undefined) => {
		if (!ref.current || !pos || !id) return;
		const previousWord = [...text.matchAll(highlightAll)].find(m => m.index === match?.index)?.[0];
		const wordStart = pos.caret - search.length - 1;
		const wordEnd = previousWord ? wordStart + previousWord.length : pos.caret; 
		ref.current.setRangeText(
			`@${allElements.find(element => element.id === id)!.name} `,
			wordStart,
			wordEnd,
			"end");
	}, [ref, pos, text, search, match, highlightAll, allElements]);

	/**
	 * Function to pass to <{@link RichTextarea}/> that defines how to render rich text.
	 * 
	 * *Note: This function and some of the previous ones could be simplified by using the {@link createRegexRenderer} helper function. However, it was causing major issues and could not be used in the end.*
	 */
	const renderer = useCallback((text: string) => {
		return textSplitter(text, true)
			.map((word, idx) => {
				if (word.startsWith("@")) {
					const mentionType = mentionMatcher(word);
					const mentionClass = mentionType === null ? "no-mention" : StoryElementTypeMentions[mentionType];
					return <Text key={idx} span className={mentionClass} size="sm">{word}</Text>;
				}
				return word;
			}
		);
	}, [textSplitter, mentionMatcher]);

	// Keep text updated upon change of props.initialText
	useEffect(() => setText(props.initialText ?? ""), [props.initialText]);

	return (
		<Flex className={`${classes.growcol} prompt-area`}>
			<Combobox
				withinPortal={false}
				store={combobox}
				position="top"
				classNames={{dropdown: "prompt-area-menu"}}>
				<Combobox.Target>
					<InputBase
						component={RichTextarea}
						ref={ref}
						value={text}
						label="Prompt"
						description='Usa "@" per menzionare gli elementi della storia'
						placeholder="Prompt"
						multiline
						styles={{input: {width: "100%", resize: "vertical"}}}
						onBlur={e => {
							e.preventDefault();
							if (!e.relatedTarget?.closest(".prompt-area-menu")) {
								props.onBlur?.(text);
								combobox.closeDropdown();
							}
						}}
						onChange={e => {
							setText(e.target.value);
							props.setText?.(e.target.value);
						}}
						onSelectionChange={r => {
							if (r.focused) {
								setPos({top: r.top, left: r.left, caret: r.selectionStart});
								if (MENTION_REGEX.test(text.slice(0, r.selectionStart))) {
									combobox.openDropdown();
								} else {
									combobox.closeDropdown();
								}
							}
						}}
						disabled={props.readOnly}>
						{renderer}
					</InputBase>
				</Combobox.Target>
				<Combobox.DropdownTarget>
					<div
						className="prompt-area-menu-target"
						style={{top: `${pos?.top}px`, left: `${pos?.left}px`}}/>
				</Combobox.DropdownTarget>
				<Combobox.Dropdown>					
					<PromptAreaMenu
						allElements={allElements}
						search={search}
						maxElementsShown={maxElementsShown}
						onClick={complete}
						promptAreaRef={ref}/>
				</Combobox.Dropdown>
			</Combobox>
		</Flex>
	);
}

export default PromptArea;