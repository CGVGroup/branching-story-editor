import "./App.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import '@mantine/core/styles.css';
import { v4 as uuidv4 } from "uuid";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Center, Loader, MantineProvider, Title } from "@mantine/core";
import { ModalsProvider } from '@mantine/modals';
import StoriesDashboard from "./Layout/StoriesDashboard.tsx";
import StoryEditor from "./Layout/Editors/StoryEditor.tsx";
import Story from "./StoryElements/Story.ts";
import { DBContext, getAll, getEnums, getModels, getPrompts, getTaxonomies, SceneDetailsEnums, Taxonomies } from "./Misc/DB.ts";
import classes from "./Layout/GrowColumn.module.css"

export const SceneDetailsEnumsContext = createContext<SceneDetailsEnums | null>(null);
export const TaxonomiesContext = createContext<Taxonomies | null>(null);
export const ModelListContext = createContext<string[] | null>(null);
export const PromptListContext = createContext<string[] | null>(null);
export const ChosenModelContext = createContext<[string, React.Dispatch<React.SetStateAction<string>>] | null>(null);
export const ChosenPromptContext = createContext<[string, React.Dispatch<React.SetStateAction<string>>] | null>(null);

/**
 * The outermost container of the App.
 * 
 * Manages entities that exist for the entire lifecycle of the app, namely:
 * - Contexts
 * - Stories
 * - DB
 * - Backend-fetched enumerations
 * @returns 
 */
function App() {
	const [stories, setStories] = useState<Map<string, Story> | null>(null);
	const [db, setDb] = useState<Object | null>(null);
	const [taxonomies, setTaxonomies] = useState<Taxonomies | null>(null);
	const [enums, setEnums] = useState<SceneDetailsEnums | null>(null);
	const [models, setModels] = useState<string[] | null>(null);
	const [prompts, setPrompts] = useState<string[] | null>(null);
	const [lastOpenStory, setLastOpenStory] = useState<string | null>(null);
	const [chosenModel, setChosenModel] = useState("default");
	const [chosenPrompt, setChosenPrompt] = useState("default");
	//const [loaded, setLoaded] = useState({stories: false, db: false, taxonomies: false, enums: false, models: false, prompts: false});
	const [loading, setLoading] = useState(true);
	
	const storiesRef = useRef(stories);

	const setStory = useCallback((id: string, newStory: Story) => {
		setStories(stories => {stories?.set(id, newStory); return new Map(stories);});
	}, []);

	const addStory = useCallback((newStory: Story) => {
		const id = uuidv4();
		setStory(id, newStory);
		return id;
	}, [setStory]);

	const deleteStory = useCallback((id: string) => {
		setStories(stories => {stories?.delete(id); return new Map(stories);});
	}, []);

	// Parse stories from localStorage
	useEffect(() => {
		if (!db) return;
		const savedStories = localStorage.getItem("stories");
		const parsedStories = savedStories ? 
			JSON.parse(savedStories) as [id: string, serializedStory: string][]
		:
			[];
		setStories(new Map(parsedStories.map(([id, story]) => [id, Story.fromJSON(story)])));
		//setLoaded(loaded => {return {...loaded, stories: true}});
	}, [db]);

	// Keep reference to stories updated
	useEffect(() => {storiesRef.current = stories}, [stories]);
	
	// Save stories on exit/reload and triggers pop-up
	useEffect(() => {
		const onBeforeUnload = (e: Event) => {
			if (!storiesRef.current) return;
			e.preventDefault(); // Triggers the pop-up
			localStorage.setItem("stories", JSON.stringify([...storiesRef.current!.entries()]));
		}
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, []);
	
	// Fetch elements from DB
	useEffect(() => {
		getAll().then(dbObject => setDb(dbObject));
	}, []);

	// Fetch model names from backend
	useEffect(() => {
		getModels().then(modelList => setModels(modelList));
	}, []);

	// Fetch prompt names from backend
	useEffect(() => {
		getPrompts().then(promptList => setPrompts(promptList));
	}, []);
	
	// Fetch scene details enums from backend
	useEffect(() => {
		getEnums().then(enums => setEnums(enums as SceneDetailsEnums));
	}, []);

	// Fetch taxonomies from backend
	useEffect(() => {
		getTaxonomies().then(taxonomies => setTaxonomies(taxonomies as Taxonomies));
	}, []);

	useEffect(() => {
		if (stories !== null &&
			db !== null &&
			taxonomies !== null &&
			enums !== null &&
			models !== null &&
			prompts !== null)
			setLoading(false);
	}, [stories, db, taxonomies, enums, models, prompts]);

	return (
		<MantineProvider>
			{loading ?
				<Center h="100vh" className={classes.growcol}>
					<Title order={2}>
						Caricamento...
					</Title>
					<Loader size="xl"/>
				</Center>
			:
				<div className="App">
					<DBContext.Provider value={{db}}>
					<TaxonomiesContext.Provider value={taxonomies}>
					<ModelListContext.Provider value={models}>
					<PromptListContext.Provider value={prompts}>
					<ChosenModelContext.Provider value={[chosenModel, setChosenModel]}>
					<ChosenPromptContext.Provider value={[chosenPrompt, setChosenPrompt]}>
					<SceneDetailsEnumsContext.Provider value={enums}>
					<ModalsProvider>
					<Router>
					<Routes>
						<Route path="/" element={<Navigate to="/stories"/>} />
						<Route path="/stories" element={
							<StoriesDashboard
								stories={stories!}
								setStory={setStory}
								addStory={addStory}
								deleteStory={deleteStory}
								lastOpenStory={lastOpenStory}
								setLastOpenStory={setLastOpenStory}/>
						} />
						<Route path="/stories/:id" element={
							<StoryEditor
								stories={stories!}
								setStory={setStory}/>
						} />
					</Routes>
					</Router>
					</ModalsProvider>
					</SceneDetailsEnumsContext.Provider>
					</ChosenPromptContext.Provider>
					</ChosenModelContext.Provider>
					</PromptListContext.Provider>
					</ModelListContext.Provider>
					</TaxonomiesContext.Provider>
					</DBContext.Provider>
				</div>
			}
		</MantineProvider>
	);
}

export default App;
