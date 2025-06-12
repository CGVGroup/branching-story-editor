import "./App.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { v4 as uuidv4 } from "uuid";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import StoriesDashboard from "./Layout/StoriesDashboard.tsx";
import StoryEditor from "./Layout/StoryEditor.tsx";
import Story from "./StoryElements/Story.ts";
import GenericModal, { ModalContents } from "./Layout/GenericModal.tsx";
import { DbContext, getAll, getEnums, getModels } from "./Misc/DB.ts";
import { Col, Spinner } from "react-bootstrap";
import { StoryElementType, StoryElementTypeDictionary } from "./StoryElements/StoryElement.ts";

type ReactSelectOption = {
  label: string,
  value: string
}

type DbFields = {
  datings: ReactSelectOption[],
  materials: ReactSelectOption[] 
}

type SceneDetailsEnums = {
  time: string[],
  weather: string[],
  tone: string[],
  value: string[]
}

export const SceneDetailsEnumsContext = createContext<SceneDetailsEnums | null>(null);
export const DbFieldsContext = createContext<DbFields | null>(null);
export const ModelListContext = createContext<string[] | null>(null);
export const ChosenModelContext = createContext<[string, React.Dispatch<React.SetStateAction<string>>] | null>(null);

function App() {
  const [stories, setStories] = useState(new Map<string, Story>());
  const [lastOpenStory, setLastOpenStory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalContents, setModalContents] = useState<ModalContents>({});
  
  const [db, setDb] = useState<Object | null>(null);
  const [dbFields, setDbFields] = useState<DbFields | null>(null);
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
      const datings = new Set<string>();
      const materials = new Set<string>();
      for (const category in dbObject) {
        dbObject[category].forEach(elem => elem["dating"].forEach(dating => datings.add(dating)));
        if (category === StoryElementTypeDictionary.eng.plural[StoryElementType.object]) {
          dbObject[category].forEach(elem => elem["materials"].forEach(material => materials.add(material)));
        }
      }
      setDbFields({
        datings: Array.from(datings).map(dating => {return {label: dating, value: dating}}),
        materials: Array.from(materials).map(material => {return {label: material, value: material}})
      });
    });
  }, []);

  // Fetch model names from backend
  useEffect(() => {
    getModels().then(modelList => {
      setModels(modelList);
      console.log(modelList);
    })
  }, []);
  
  // Fetch scene details enums from backend
  useEffect(() => {
    getEnums().then(enums => {
      setEnums(enums as SceneDetailsEnums);
      console.log(enums);
    })
  }, []);
  
  return (
    db === null ?
      <Col>
        Loading...
        <Spinner/>
      </Col>
    :
      <div className="App">
        <GenericModal show={showModal} setShow={setShowModal} {...modalContents}/>
        <DbContext.Provider value={{db}}>
        <DbFieldsContext.Provider value={dbFields}>
        <ModelListContext.Provider value={models}>
        <ChosenModelContext.Provider value={[chosenModel, setChosenModel]}>
        <SceneDetailsEnumsContext.Provider value={enums}>
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
        </SceneDetailsEnumsContext.Provider>
        </ChosenModelContext.Provider>
        </ModelListContext.Provider>
        </DbFieldsContext.Provider>
        </DbContext.Provider>
      </div>
  );
}

export default App;
