import "./App.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import '@mantine/core/styles.css';
import { v4 as uuidv4 } from "uuid";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Center, Loader, MantineProvider } from "@mantine/core";
import { ModalsProvider } from '@mantine/modals';
import StoriesDashboard from "./Layout/StoriesDashboard.tsx";
import StoryEditor from "./Layout/Editors/StoryEditor.tsx";
import Story from "./StoryElements/Story.ts";
import { DbContext, getAll, getEnums, getModels, getTaxonomies, SceneDetailsEnums, Taxonomies } from "./Misc/DB.ts";

export const SceneDetailsEnumsContext = createContext<SceneDetailsEnums | null>(null);
export const TaxonomiesContext = createContext<Taxonomies | null>(null);
export const ModelListContext = createContext<string[] | null>(null);
export const ChosenModelContext = createContext<[string, React.Dispatch<React.SetStateAction<string>>] | null>(null);

function App() {
  const [stories, setStories] = useState(new Map<string, Story>());
  const [lastOpenStory, setLastOpenStory] = useState<string | null>(null);
  const [db, setDb] = useState<Object | null>(null);
  const [taxonomies, setTaxonomies] = useState<Taxonomies | null>(null);
  const [enums, setEnums] = useState<SceneDetailsEnums | null>(null);
  const [models, setModels] = useState<string[] | null>(null);
  const [chosenModel, setChosenModel] = useState("default");
  
  const storiesRef = useRef(stories);

  const setStory = useCallback((id: string, newStory: Story) => {
    setStories(stories => {stories.set(id, newStory); return new Map(stories);});
  }, []);

  const addStory = useCallback((newStory: Story) => {
    const id = uuidv4();
    setStory(id, newStory);
    return id;
  }, [setStory]);

  const deleteStory = useCallback((id: string) => {
    setStories(stories => {stories.delete(id); return new Map(stories);});
  }, []);

  // Parse stories from localStorage
  useEffect(() => {
    if (!db) return;
    const savedStories = localStorage.getItem("stories");
    if (savedStories) {
      const parsedStories = JSON.parse(savedStories);
      if (parsedStories?.length) {
        setStories(new Map(parsedStories.map(([id, story]) => [id, Story.fromJSON(story)])));
      }
    }
  }, [db]);

  // Save stories on exit
  useEffect(() => {
    const onBeforeUnload = (e: Event) => {
      e.preventDefault();
			localStorage.setItem("stories", JSON.stringify([...storiesRef.current.entries()]));
		}
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, []);

  // Keep stories reference updated
  useEffect(() => {storiesRef.current = stories}, [stories]);

  // Fetch elements from DB
  useEffect(() => {
    getAll().then(dbObject => setDb(dbObject));
  }, []);

  // Fetch model names from backend
  useEffect(() => {
    getModels().then(modelList => {
      setModels(modelList);
    })
  }, []);
  
  // Fetch scene details enums from backend
  useEffect(() => {
    getEnums().then(enums => {
      setEnums(enums as SceneDetailsEnums);
    })
  }, []);

  // Fetch taxonomies from backend
  useEffect(() => {
    getTaxonomies().then(taxonomies => {
      setTaxonomies(taxonomies as Taxonomies);
    })
  }, []);
  
  return (
    <MantineProvider>
      {db === null ?
        <Center>
          Loading...
          <Loader/>
        </Center>
      :
        <div className="App">
          <DbContext.Provider value={{db}}>
          <TaxonomiesContext.Provider value={taxonomies}>
          <ModelListContext.Provider value={models}>
          <ChosenModelContext.Provider value={[chosenModel, setChosenModel]}>
          <SceneDetailsEnumsContext.Provider value={enums}>
          <MantineProvider>
          <ModalsProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Navigate to="/stories"/>} />
                <Route path="/stories" element={
                  <StoriesDashboard
                    stories={stories}
                    setStory={setStory}
                    addStory={addStory}
                    deleteStory={deleteStory}
                    lastOpenStory={lastOpenStory}
                    setLastOpenStory={setLastOpenStory}/>
                } />
                <Route path="/stories/:id" element={
                  <StoryEditor
                    stories={stories}
                    setStory={setStory}/>
                } />
              </Routes>
            </Router>
          </ModalsProvider>
          </MantineProvider>
          </SceneDetailsEnumsContext.Provider>
          </ChosenModelContext.Provider>
          </ModelListContext.Provider>
          </TaxonomiesContext.Provider>
          </DbContext.Provider>
        </div>}
    </MantineProvider>
  );
}

export default App;
