import React, { useCallback, useMemo, useRef, useState } from "react";
import { Tabs, Tab, Button, ListGroup, Badge, OverlayTrigger, Tooltip, ButtonGroup } from "react-bootstrap";
import { StoryElementType, StoryElement } from "../StoryElements/StoryElement.ts";
import ElementModal from "./AddElementModal.tsx";
import Story from "../StoryElements/Story.ts";
import DBBrowserModal from "./DBBrowserModal.tsx";

const storyElementTabsArray = [
  {type: StoryElementType.character, className: "character-mention", tabContents: <img src={require("../img/character.png")} title="Personaggi" alt="characters" style={{height:"3em"}}/>, noElementsText: "Nessun personaggio" },
  {type: StoryElementType.object, className: "object-mention", tabContents: <img src={require("../img/object.png")} title="Oggetti" alt="objects" style={{height:"3em"}}/>, noElementsText: "Nessun oggetto" },
  {type: StoryElementType.location, className: "location-mention", tabContents: <img src={require("../img/location.png")} title="Luoghi" alt="locations" style={{height:"3em"}}/>, noElementsText: "Nessun luogo" }
]

function StoryElements (props: {
  story: Story,
  setStory?: React.Dispatch<React.SetStateAction<Story>>,
  readOnly?: boolean
}) {
  const [key, setKey] = useState(StoryElementType.character);
  const [selectedElement, setSelectedElement] = useState<StoryElement>();
  
  const [elementModal, setElementModal] = useState(false);
  const [dbModal, setDbModal] = useState(false);

  const refApp = useRef(document.getElementsByClassName("App").item(0));

  const readOnly = props.readOnly ?? false;

  const onSelectElement = useCallback((element: StoryElement) => {
    setSelectedElement(element);
  }, []);

  const onDeselectElement = useCallback(() => {
    setSelectedElement(undefined);
  }, []);

  const onAddButtonClicked = useCallback(() => {
    setSelectedElement(undefined);
    setElementModal(true);
  }, []);

  const onOpenDBButtonClicked = useCallback(() => {
    setDbModal(true);
  }, []);

  const onElementEditButtonClicked = useCallback((element: StoryElement) => {
    onSelectElement(element)
    setElementModal(true);
  }, [onSelectElement]);

  const onElementDeleteButtonClicked = useCallback((element: StoryElement) => {
    props.setStory?.(story => story.cloneAndDeleteElement(element.id));
    onDeselectElement();
  }, [onDeselectElement]);

  const onSubmitNewElement = useCallback((newElement: StoryElement) => {
    if (!props.story.canAddElement(newElement)) return false;
    props.setStory?.(story => story.cloneAndAddElement(newElement));
    onDeselectElement();
    return true;
  }, [key, props.story]);

  const onEditElement = useCallback((editedElement: StoryElement) => {
    if (selectedElement) {
      props.setStory?.(story => story.cloneAndSetElement(selectedElement.id, editedElement));
      onDeselectElement();
      return true;
    }
    onDeselectElement();
    return false;
  }, [selectedElement, key]);

  const dynamicElementModal = useMemo(() => (
    <ElementModal
      modal = {elementModal}
      setModal = {setElementModal}
      elementType = {key}
      initialElement = {selectedElement}
      container = {refApp}
      onSubmit = {selectedElement === undefined ? onSubmitNewElement : onEditElement} />
  ), [key, elementModal, selectedElement, onEditElement, onSubmitNewElement]);

  const elementList = useCallback((type: StoryElementType, readOnly: boolean, className?: string) => {
    const elements = props.story.getElementsByType(type);
    return (
      <ListGroup style={{overflowY: "auto"}} className="story-elements">
        {elements.length === 0 ?
          <ListGroup.Item disabled>
            {storyElementTabsArray[type].noElementsText}
          </ListGroup.Item>
        :
          elements.map(element => (
            <OverlayTrigger
              key={element.id}
              placement={"right"}
              trigger="focus"
              overlay={
                <Tooltip>
                  <ButtonGroup vertical>
                    {element.resident && <Button variant="secondary" onClick={() => onElementEditButtonClicked(element)} title="Modifica">
                      <i className="bi bi-pencil" aria-label="edit" /> 
                    </Button>}
                    <Button variant="danger" onClick={() => onElementDeleteButtonClicked(element)} title="Elimina">
                      <i className="bi bi-trash" aria-label="delete" /> 
                    </Button>
                  </ButtonGroup>
                </Tooltip>}>
              <ListGroup.Item key={element.id} action={!readOnly}
                className={`d-flex flex-grow-1 ${className} ${readOnly ? "disabled" : ""}`}
                style={{
                  textWrap:"pretty",
                  justifyContent:"space-evenly",
                  pointerEvents: readOnly ? "none" : undefined,
                  fontStyle: element.resident ? "italic" : undefined}}>
                {element.name}
              </ListGroup.Item>
            </OverlayTrigger>
          ))
        }
      </ListGroup>);
  }, [props, onElementEditButtonClicked, onElementDeleteButtonClicked]);

  const badges = useMemo(() => [props.story.getElementsByType(StoryElementType.character).length,
    props.story.getElementsByType(StoryElementType.object).length,
    props.story.getElementsByType(StoryElementType.location).length], [props.story]);

  return (
    <>
      {dynamicElementModal}
      <DBBrowserModal
        modal = {dbModal}
        setModal = {setDbModal}
        elements = {props.story.getElementsByType(key).map(el => el.id)}
        elementType = {key}
        container = {refApp}
        onSubmit = {onSubmitNewElement}/>
      <Tabs
        activeKey={key}
        onSelect={k => setKey(Number.parseInt(k ?? "0"))}
        className="mb-2 flex-nowrap"
        fill>
        {storyElementTabsArray.map((tab, idx) =>
          <Tab
            eventKey={tab.type}
            key={tab.type}
            className="h-100"
            tabClassName={tab.className}
            title={
              <>
                <span style={{width:"2em"}}>
                  {tab.tabContents}
                </span>
                <Badge className={tab.className + " selected"} bg="" pill>
                  {badges[idx]}
                </Badge>
              </>}>
            {!readOnly && 
              <ButtonGroup>
                <Button onClick={onOpenDBButtonClicked} variant="primary">
                  {"Da catalogo "}
                  <i className="bi bi-journal-plus" />
                </Button>
                <Button onClick={onAddButtonClicked} variant="outline-primary">
                  {"Crea "}
                  <i className="bi bi-plus-square" />
                </Button>
              </ButtonGroup>
              }
            {elementList(tab.type, readOnly, tab.className)}
          </Tab>
        )}
      </Tabs>
    </>
  );
};

export default StoryElements;
export {storyElementTabsArray};
