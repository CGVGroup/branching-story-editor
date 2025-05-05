import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListGroup, Tab, Tabs } from "react-bootstrap";
import { createPortal } from "react-dom";
import { RichTextarea, RichTextareaHandle } from "rich-textarea"
import Story from "../StoryElements/Story.ts";
import { StoryElementType, StoryElementTypeString } from "../StoryElements/StoryElement.ts";
import { storyElementTabsArray } from "./StoryElements.tsx";

type Position = {
	top: number;
	left: number;
	caret: number;
};

const MENTION_REGEX = /\B@([\w]*)$/;
const maxElementsShown = 8;

function PromptArea(props: {
	story: Story,
	initialText?: string,
	setText?: (text: string) => void,
	onBlur?: (text: string) => void,
	readOnly?: boolean
}) {
	const ref = useRef<RichTextareaHandle>(null);
	const refApp = useRef(document.getElementsByClassName("App").item(0));
	const selectedRef = useRef<HTMLAnchorElement>(null);

	const [text, setText] = useState(props.initialText ?? "");
	const [pos, setPos] = useState<Position | null>(null);
	const [showMenu, setShowMenu] = useState(false);
	const [menuSelected, setMenuSelected] = useState<string | undefined>();
	const [menuTabKey, setMenuTabKey] = useState(StoryElementType.character);

	const allMap = useMemo(() => props.story.getAllElementsMap(), [props.story]);
	const allArray = useMemo(() => [...allMap.entries()], [allMap]);
	
	const [match, name] = useMemo(() => {
		const targetText = pos ? text.slice(0, pos.caret) : text;
		const match = pos && targetText.match(MENTION_REGEX);
		return [match, match?.[1] ?? ""];
	}, [pos, text]);
	
	const highlight_all = useMemo(() => {
		if (allArray.length === 0) return /^$/;
		else return new RegExp("(" + allArray.map(([_, element]) => `@${element.name}`).sort((a, b) => b.length - a.length).join("|") + ")", "g");
	}, [allArray]);

	const [highlight_characters, highlight_objects, highlight_locations] = useMemo(() => 
		[StoryElementType.character, StoryElementType.object, StoryElementType.location].map(type => new RegExp(
			`(^${allArray.filter(([_, element]) => element.type === type)
				.map(([_, element]) => `@${element.name}`)
				.join("|")}$)`)
	), [allArray]);

	const filtered = useMemo(() =>
		allArray.filter(([_, element]) =>
			element.name.toLowerCase()
				.startsWith(name.toLowerCase()))
	, [allArray, name]);

	const closeMenu = useCallback(() => {
		setShowMenu(false);
		setMenuTabKey(StoryElementType.character);
	}, []);

	const changeTab = useCallback((key?: string | null) => {
		if (key !== undefined) {
			setMenuTabKey(Number.parseInt(key ?? "0"));
		} else {
			setMenuTabKey(key => (key+1)%StoryElementTypeString.length);
		}
		setMenuSelected(undefined);
	}, []);

	const complete = useCallback((id: string | undefined) => {
		if (!ref.current || !pos || !id) return;
		const previousWord = [...text.matchAll(highlight_all)].find(m => m.index === match?.index)?.[0];
		const wordStart = pos.caret - name.length - 1;
		const wordEnd = previousWord ? wordStart + previousWord.length : pos.caret; 
		ref.current.setRangeText(
			`@${allMap.get(id)!.name}`,
			wordStart,
			wordEnd,
			"end");
		setShowMenu(false);
	},[ref, pos, text, name, match, highlight_all, allMap]);

	const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (!pos || !filtered.length || !showMenu || allArray.length === 0) return;
		switch (e.code) {
			case "ArrowUp":
			case "ArrowDown":
				e.preventDefault();
				setMenuSelected(selected => {
					const list = filtered.length > maxElementsShown ? filtered.filter(([_, element]) => element.type === menuTabKey) : filtered;
					const idx = list.findIndex(([id, _]) => id === selected);
					if (e.code === "ArrowUp") return list[idx <= 0 ? list.length - 1 : idx - 1][0];
					if (e.code === "ArrowDown") return list[idx >= list.length - 1 ? 0 : idx + 1][0];
				});
			break;
			case "Enter":
				e.preventDefault();
				complete(menuSelected);
			break;
			case "Tab":
				e.preventDefault();
				changeTab();
			break;
			case "Escape":
				e.preventDefault();
				closeMenu();
			break;
			default:
			break;
		}
	}, [pos, filtered, showMenu, allArray, complete, menuSelected, menuTabKey, changeTab, closeMenu]);

	const textSplitter = useCallback((text: string, spaces: boolean) => {
		const split = allArray.length > 0 ? text.split(highlight_all) : [text];
		let retArr: string[];
		if (!spaces) retArr = split;
		else {
			retArr = split
				.reduce((acc, spl) => {
					if (spl.match(highlight_all))
						return acc.concat(spl);
					else
						return acc.concat(spl.split(/(\s)/g));
				}, new Array<string>());
		}
		return retArr.filter(s => s !== "");
	}, [allArray, highlight_all]);

	const mentionMatcher = useCallback((mention: string) => {
		if (mention.match(highlight_characters)) return StoryElementType.character;
		if (mention.match(highlight_objects)) return StoryElementType.object;
		if (mention.match(highlight_locations)) return StoryElementType.location;
		return null;
	}, [highlight_characters, highlight_objects, highlight_locations]);

	const renderer = useCallback((text: string) => {
		return textSplitter(text, true)
			.map((word, idx) => {
				if (word.startsWith("@")) {
					const mentionType = mentionMatcher(word);
					const mentionClass = `${mentionType === null ? "no" : StoryElementTypeString[mentionType]}-mention`
					return <span key={idx} className={mentionClass} style={{borderRadius: "3px" }}>{word}</span>
				}
				return word;
			}
		);
	}, [textSplitter, mentionMatcher]);

	const elements = useMemo(() => {
		if (allArray.length === 0) {
		  return <ListGroup>
			  <PromptAreaMenuElement
			  value={"Non sono presenti elementi nella storia attuale"}
			  type={null} />
		  </ListGroup>
		}
		if (filtered.length === 0) {
		  return <ListGroup>
			  <PromptAreaMenuElement
			  value={"Nessuna corrispondenza"}
			  type={null} />
		  </ListGroup>
		}
		if (filtered.length <= maxElementsShown) {
		  return <ListGroup className="story-elements">
			{filtered.map(([id, element]) =>
			  <PromptAreaMenuElement
				key={id} 
				value={element.name}
				type={element.type}
				selected={id === menuSelected}
				onMouseEnter={() => setMenuSelected(id)}
				onClick={() => complete(id)} />)}
		  </ListGroup>
		}
		return (
		  <Tabs
			activeKey={menuTabKey}
			onSelect={k => changeTab(k)}
			onMouseDown={e => {e.preventDefault(); ref?.current?.focus()}}
			className="custom-tabs">
			{storyElementTabsArray.map(tab => 
			  <Tab
			  	eventKey={tab.type}
					key={tab.type}
					tabClassName={tab.className}
					title={
							<span style={{fontSize:"0.5em"}}>
								{tab.tabContents}
							</span>
						}>
				<ListGroup style={{height:"100%", overflowY:"auto"}} className="story-elements">
				  {filtered.filter(([_, element]) => element.type === tab.type).map(([id, element], idx) => 
					<PromptAreaMenuElement
					  key={idx}
					  selectedRef={id === menuSelected ? selectedRef : null}
					  value={element.name}
					  type={element.type}
					  selected={id === menuSelected}
					  id={id}
					  onMouseEnter={() => setMenuSelected(id)}
					  onClick={() => complete(id)} />)}
				</ListGroup>
			  </Tab>
			)}
		</Tabs>
	)}, [allArray, filtered, menuTabKey, menuSelected, selectedRef, changeTab, complete]);

	useEffect(() => setText(props.initialText ?? ""), [props.initialText]);
	useEffect(() => {if (filtered.length > 0) setMenuSelected(filtered[0][0])}, [filtered]);
	useEffect(() => selectedRef.current?.scrollIntoView({block:"end"}), [selectedRef]);

	return (
		<div className="prompt-area h-100 w-100">
			<RichTextarea
				ref={ref}
				value={text}
				className="form-control"
				id="prompt-text-area"
				placeholder='Usa "@" per citare gli elementi della storia'
				style={{width:"100%", height:"100%", left:"0px", background:"white", maxHeight:"100%"}}
				onBlur={e => {
					e.preventDefault();
					if (!e.relatedTarget?.closest(".prompt-area-menu")) {
						props.onBlur?.(text);
						closeMenu();
					}
				}}
				onChange={e => {
					setText(e.target.value);
					props.setText?.(e.target.value);
				}}
				onKeyDown={onKeyDown}
				onSelectionChange={r => {
					if (r.focused) {
						if (MENTION_REGEX.test(text.slice(0, r.selectionStart))) {
							setPos({
								top: r.top/* + r.height*/,
								left: r.left,
								caret: r.selectionStart
							});
							setShowMenu(true);
						} else {
							closeMenu();
						}
					}
				}}
				
				disabled={props.readOnly}>
				{renderer}
			</RichTextarea>
			{refApp.current && showMenu && !props.readOnly &&
				createPortal(
					<div
						className="prompt-area-menu d-flex flex-column"
						onBlur={closeMenu}
						style={{height: filtered.length > maxElementsShown ? "18em" : "", transform: `translate(min(${pos?.left ?? 0}px, calc(100vw - 100%)), max(${pos?.top ?? 0}px - 100%, 0px))`}}>
						{elements}
					</div>,
					refApp.current)
			}
		</div>
	);
}

function PromptAreaMenuElement(props: {
  value: string,
  type: StoryElementType | null,
  selected?: boolean,
  selectedRef?: React.Ref<HTMLAnchorElement> | null,
  id?: string,
  onMouseEnter?: () => void,
  onClick?: () => void
}) {
  return (
	<ListGroup.Item
		action={!!props.onClick}
		id={"id-"+props.id}
		ref={props.selectedRef ?? undefined}
		className={`${props.type === null ? "no" : StoryElementTypeString[props.type]}-mention ${props.selected ? "selected" : ""}`}
		onMouseEnter={props.onMouseEnter}
		onClick={props.onClick}>
		{props.value}
	</ListGroup.Item>
  );
}

export default PromptArea;