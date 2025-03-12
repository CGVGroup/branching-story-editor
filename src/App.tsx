import "./App.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import React, { createContext, useCallback, useEffect, useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import StoryEditor from "./Layout/StoryEditor.tsx";
import TemplateEditor from "./Layout/TemplateEditor.tsx";
import Story from "./StoryElements/Story.ts";
import { initBlocks } from "./Blockly/Blocks.ts";
import Template from "./StoryElements/Template.ts";
import InstanceEditor from "./Layout/InstanceEditor.tsx";

const tempMap = new Map<string, Template>();

export const SceneDetailsContext = createContext({
  time: ["Alba", "Mattina", "Mezzogiorno", "Pomeriggio", "Tramonto", "Sera", "Notte"],
  weather: ["Soleggiato", "Velato", "Coperto", "Pioggia", "Temporale", "Tempesta"],
  tone: ["Allegria", "Tristezza", "Tensione", "Indagine"],
  value: ["Clemenza", "Gentilezza", "Abnegazione", "Scaltrezza"],
});

function App() {
  const [stories, setStories] = useState(tempMap);

  const setTemplate = useCallback((id: string, newStory: Story) => {
    setStories(stories => new Map(Array.from(stories).map(
      storyIter => {
        if (storyIter[0] === id)
          return [storyIter[0], new Template(newStory.clone(), storyIter[1].instances)];
        else
          return storyIter;
      }
    )));
  }, []);

  const setInstance = useCallback((id: string, index: number, newStory: Story) => {
    setStories(stories => new Map(Array.from(stories).map(
      storyIter => {
        if (storyIter[0] === id) {
          storyIter[1].instances[index].instance = newStory;
          return [storyIter[0], new Template(newStory.clone(), storyIter[1].instances)];
        } else return storyIter;
      }
    )));
  }, []);

  useEffect(() => initBlocks(), []);
  useEffect(() => {
    const handleContextmenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextmenu);
    return () => document.removeEventListener('contextmenu', handleContextmenu);
  }, []);

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/stories"/>} />
          <Route path="/stories" element={<StoryEditor stories={stories} setStories={setStories}/>} />
          <Route path="/stories/:id" element={<TemplateEditor stories={stories} setStory={setTemplate}/>} />
          <Route path="/stories/:id/:index" element={<InstanceEditor stories={stories} setInstance={setInstance}/>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
