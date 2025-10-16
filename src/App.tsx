import "./App.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import '@mantine/core/styles.css';
import { v4 as uuidv4 } from "uuid";
import { createContext, ReactElement, useCallback, useEffect, useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from '@mantine/modals';
import StoriesDashboard from "./Layout/StoriesDashboard.tsx";
import StoryEditor from "./Layout/Editors/StoryEditor.tsx";
import Story from "./StoryElements/Story.ts";
import { DBContext, getAll, getEnums, getModels, getPrompts, getStories, getTaxonomies, SceneDetailsEnums, Taxonomies, deleteStory as DBDeleteStory, saveStory as DBSaveStory } from "./Misc/DB.ts";
import Login from "./Layout/Components/Login.tsx";
import Loading from "./Layout/Components/Loading.tsx";

export const SceneDetailsEnumsContext = createContext<SceneDetailsEnums | null>(null);
export const TaxonomiesContext = createContext<Taxonomies | null>(null);
export const ModelListContext = createContext<string[] | null>(null);
export const PromptListContext = createContext<string[] | null>(null);
export const UsernameContext = createContext<[string, React.Dispatch<React.SetStateAction<string>>] | null>(null);

/**
 * The outermost container of the App.
 * 
 * Manages entities that exist for the entire lifecycle of the app, namely:
 * - Contexts
 * - Login information
 * - LocalStorage
 * - Backend-fetched data
 * 	- DB
 * 	- Enumerations
 * 	- Stories
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
	const [username, setUsername] = useState(localStorage.getItem("username") ?? "");
	const [loading, setLoading] = useState(true);
	
	const setStory = useCallback((id: string, newStory: Story) => {
		setStories(stories => {stories?.set(id, newStory); return new Map(stories);});
		DBSaveStory(username, id, newStory.serialize(), newStory.smartSerialize());
	}, [username]);

	const addStory = useCallback((newStory: Story) => {
		const id = uuidv4();
		setStory(id, newStory);
		DBSaveStory(username, id, newStory.serialize(), newStory.smartSerialize());
		return id;
	}, [setStory, username]);

	const deleteStory = useCallback((id: string) => {
		setStories(stories => {stories?.delete(id); return new Map(stories);});
		DBDeleteStory(username, id);
	}, [username]);

	const maybeRedirectOrLoad = useCallback((username: string, loading: boolean, component: ReactElement) => {
		if (!username) return <Navigate to="/"/>;
		if (loading) return <Loading/>;
		return component;
	}, []);

	// Save last username to localStorage
	useEffect(() => {localStorage.setItem("username", username)}, [username]);
	
	// Parse user's stories from the backend
	useEffect(() => {
		if (!db || !username) return;
		getStories(username).then(storiesMap => setStories(storiesMap));
	}, [db, username]);
	
	// Fetch Story Elements from DB
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

	// Sets loading to false when all fetched objects are loaded
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
		<div className="App">
			<MantineProvider>
			<UsernameContext.Provider value={[username, setUsername]}>
			<DBContext.Provider value={{db}}>
			<TaxonomiesContext.Provider value={taxonomies}>
			<ModelListContext.Provider value={models}>
			<PromptListContext.Provider value={prompts}>
			<SceneDetailsEnumsContext.Provider value={enums}>
			<ModalsProvider>
			<Router>
			<Routes>
				<Route path="/" element={username ? <Navigate to="/stories"/> : <Login navigateTo="/stories"/>} />
				<Route path="/stories" element={
					maybeRedirectOrLoad(
						username,
						loading,
						<StoriesDashboard
							stories={stories!}
							setStory={setStory}
							addStory={addStory}
							deleteStory={deleteStory}
							lastOpenStory={lastOpenStory}
							setLastOpenStory={setLastOpenStory}/>)}/>
				<Route path="/stories/:id" element={
					maybeRedirectOrLoad(
						username, 
						loading,
						<StoryEditor
							stories={stories!}
							setStory={setStory}/>)} />
			</Routes>
			</Router>
			</ModalsProvider>
			</SceneDetailsEnumsContext.Provider>
			</PromptListContext.Provider>
			</ModelListContext.Provider>
			</TaxonomiesContext.Provider>
			</DBContext.Provider>
			</UsernameContext.Provider>
			</MantineProvider>
		</div>
	);
}

export default App;
