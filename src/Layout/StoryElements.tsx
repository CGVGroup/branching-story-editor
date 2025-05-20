import React, { useCallback, useMemo, useState } from "react";
import { Tabs, Tab, Button, ListGroup, Badge, OverlayTrigger, Tooltip, ButtonGroup } from "react-bootstrap";
import { StoryElementType, StoryElement } from "../StoryElements/StoryElement.ts";
import ElementModal from "./AddElementModal.tsx";
import Story from "../StoryElements/Story.ts";

const storyElementTabsArray = [
  {type: StoryElementType.character, className: "character-mention", tabContents: <img src={require("../img/character.png")} title="Personaggi" alt="characters" style={{height:"3em"}}/>, buttonText: "Personaggi ", noElementsText: "Nessun personaggio" },
  {type: StoryElementType.object, className: "object-mention", tabContents: <img src={require("../img/object.png")} title="Oggetti" alt="objects" style={{height:"3em"}}/>, buttonText: "Oggetti ", noElementsText: "Nessun oggetto" },
  {type: StoryElementType.location, className: "location-mention", tabContents: <img src={require("../img/location.png")} title="Luoghi" alt="locations" style={{height:"3em"}}/>, buttonText: "Luoghi ", noElementsText: "Nessun luogo" }
]

function StoryElements (props: {
  story: Story,
  setStory?: React.Dispatch<React.SetStateAction<Story>>,
  readOnly?: boolean
}) {
  const [key, setKey] = useState(StoryElementType.character);
  const [selectedElement, setSelectedElement] = useState<StoryElement>();
  const [selectedElementId, setSelectedElementId] = useState<string>();
  
  const [modal, setModal] = useState(false);
  const [modalAction, setModalAction] = useState<"add" | "edit">("add");

  const readOnly = props.readOnly ?? false;

  const onSelectElement = useCallback((id: string, element: StoryElement) => {
    setSelectedElementId(id);
    setSelectedElement(element);
  }, []);

  const onDeselectElement = useCallback(() => {
    setSelectedElementId(undefined);
    setSelectedElement(undefined);
  }, []);

  const onAddButtonClicked = useCallback(() => {
    setModalAction("add");
    setModal(true);
    setSelectedElementId(undefined);
    setSelectedElement(undefined);
  }, []);

  const onElementEditButtonClicked = useCallback((id: string, element: StoryElement) => {
    onSelectElement(id, element)
    setModalAction("edit");
    setModal(true);
  }, [onSelectElement]);

  const onElementDeleteButtonClicked = useCallback((id: string) => {
    props.setStory?.(story => story.cloneAndDeleteElement(id));
    onDeselectElement();
  }, [onDeselectElement]);

  const onSubmitNewElement = useCallback((newElement: StoryElement) => {
    if (!props.story.canAddElement(newElement)) return false;
    props.setStory?.(story => story.cloneAndAddElement(newElement));
    onDeselectElement();
    return true;
  }, [key, props.story]);

  const onEditElement = useCallback((editedElement: StoryElement) => {
    if (selectedElementId) {
      props.setStory?.(story => story.cloneAndSetElement(selectedElementId, editedElement));
      onDeselectElement();
      return true;
    }
    onDeselectElement();
    return false;
  }, [selectedElementId, key]);

  const dynamicElementModal = useMemo(() => (
    <ElementModal
      modal = {modal}
      setModal = {setModal}
      modalAction = {modalAction}
      elementType = {key}
      initialElement = {selectedElement}
      onSubmit = {modalAction === "add" ? onSubmitNewElement : onEditElement} />
  ), [key, modalAction, modal, selectedElement, onEditElement, onSubmitNewElement]);

  const elementList = useCallback((type: StoryElementType, readOnly: boolean, className?: string) => {
    const elements = [...props.story.getElementMapByType(type)];
    return (
      <ListGroup style={{overflowY: "auto"}} className="story-elements">
        {elements.length === 0 ?
          <ListGroup.Item disabled>
            {storyElementTabsArray[type].noElementsText}
          </ListGroup.Item>
        :
          elements.map(([id, elem]) => (
            <OverlayTrigger
              key={id}
              placement={"right"}
              trigger="focus"
              overlay={
                <Tooltip>
                  <ButtonGroup vertical>
                    <Button variant="secondary" onClick={() => onElementEditButtonClicked(id, elem)} title="Modifica">
                      <i className="bi bi-pencil" aria-label="edit" /> 
                    </Button>
                    <Button variant="danger" onClick={() => onElementDeleteButtonClicked(id)} title="Elimina">
                      <i className="bi bi-trash" aria-label="delete" /> 
                    </Button>
                  </ButtonGroup>
                </Tooltip>}>
              <ListGroup.Item key={id} action={!readOnly}
                className={`d-flex flex-grow-1 ${className} ${readOnly ? "disabled" : ""}`}
                style={{textWrap:"pretty", justifyContent:"space-evenly", pointerEvents: readOnly ? "none" : undefined}}>
                {elem.name}
              </ListGroup.Item>
            </OverlayTrigger>
          ))
        }
      </ListGroup>);
  }, [props, onElementEditButtonClicked, onElementDeleteButtonClicked]);

  const badges = useMemo(() => [props.story.characters.size, props.story.objects.size, props.story.locations.size], [props.story]);

  return (
    <>
      {dynamicElementModal}
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
              <Button onClick={onAddButtonClicked} variant="outline-primary">
                {tab.buttonText}
                <i className="bi bi-plus-square" />
              </Button>}
            {elementList(tab.type, readOnly, tab.className)}
          </Tab>
        )}
      </Tabs>
    </>
  );
};

export default StoryElements;
export {storyElementTabsArray};
