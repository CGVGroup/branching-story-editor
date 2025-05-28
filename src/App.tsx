import "./App.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { v4 as uuidv4 } from "uuid";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import StoriesDashboard from "./Layout/StoriesDashboard.tsx";
import StoryEditor from "./Layout/StoryEditor.tsx";
import Story from "./StoryElements/Story.ts";
import GenericModal, { ModalContents } from "./Layout/GenericModal.tsx";
import { DbContext, getAll } from "./Misc/DB.ts";
import { Spinner } from "react-bootstrap";

export const DefaultEnumsContext = createContext({
  time: ["Alba", "Mattina", "Mezzogiorno", "Pomeriggio", "Tramonto", "Sera", "Notte"],
  weather: ["Soleggiato", "Velato", "Coperto", "Pioggia", "Temporale", "Tempesta"],
  tone: ["Allegria", "Tristezza", "Tensione", "Indagine"],
  value: ["Clemenza", "Gentilezza", "Abnegazione", "Scaltrezza"],
});

export const DbFields = createContext({
  datazioni: [
    {label: "XVIII Dinastia", value: "XVIII Dinastia"},
    {label: "III Dinastia", value: "III Dinastia"},
    {label: "XIX Dinastia", value: "XIX Dinastia"},
    {label: "XII Dinastia", value: "XII Dinastia"},
    {label: "Epoca Tarda", value: "Epoca Tarda"},
    {label: "Periodo Tolemaico", value: "Periodo Tolemaico"},
    {label: "Epoca Romana", value: "Epoca Romana"},
    {label: "VI Dinastia", value: "VI Dinastia"}
  ],
  materiali: [
    {label: "Ebano", value: "Ebano"},
    {label: "Oro", value: "Oro"},
    {label: "Lapislazzuli", value: "Lapislazzuli"},
    {label: "Ebano", value: "Ebano"},
    {label: "Calcite", value: "Calcite"}
]})

function App() {
  const [stories, setStories] = useState(new Map<string, Story>());
  const [lastOpenStory, setLastOpenStory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalContents, setModalContents] = useState<ModalContents>({});
  const [db, setDb] = useState<Object | null>(null);
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
  
  const setModal = useCallback((contents: ModalContents) => {
    setModalContents(contents);
    setShowModal(true);
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
			localStorage.setItem("stories", JSON.stringify([...storiesRef.current.entries()]));
		}
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, []);

  // Keep stories reference updated
  useEffect(() => {storiesRef.current = stories}, [stories]);

  // Fetch elements from DB
  useEffect(() => {
    getAll().then(dbObject => {
      setDb(dbObject);
      console.log("Fetched database");
    });
  }, []);
  
  return (
    db === null ?
      <Spinner/>
    :
      <div className="App">
        <GenericModal show={showModal} setShow={setShowModal} {...modalContents}/>
        <DbContext.Provider value={{db}}>
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
                  setLastOpenStory={setLastOpenStory}
                  setModal={setModal} />
              } />
              <Route path="/stories/:id" element={
                <StoryEditor
                  stories={stories}
                  setStory={setStory}
                  setModal={setModal} />} />
            </Routes>
          </Router>
        </DbContext.Provider>
      </div>
  );
}

export default App;
