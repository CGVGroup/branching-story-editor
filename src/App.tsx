import "./App.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { v4 as uuidv4 } from "uuid";
import React, { createContext, useCallback, useEffect, useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import StoriesDashboard from "./Layout/StoriesDashboard.tsx";
import StoryEditor from "./Layout/StoryEditor.tsx";
import Story from "./StoryElements/Story.ts";

export const DefaultEnumsContext = createContext({
  time: ["Alba", "Mattina", "Mezzogiorno", "Pomeriggio", "Tramonto", "Sera", "Notte"],
  weather: ["Soleggiato", "Velato", "Coperto", "Pioggia", "Temporale", "Tempesta"],
  tone: ["Allegria", "Tristezza", "Tensione", "Indagine"],
  value: ["Clemenza", "Gentilezza", "Abnegazione", "Scaltrezza"],
});

function App() {
  const [stories, setStories] = useState(new Map<string, Story>());
  const [lastOpenStory, setLastOpenStory] = useState<string | null>(null);

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

  /*useEffect(() => {
    const handleContextmenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextmenu);
    return () => document.removeEventListener('contextmenu', handleContextmenu);
  }, []);*/

  return (
    <div className="App">
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
          <Route path="/stories/:id" element={<StoryEditor stories={stories} setStory={setStory}/>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
