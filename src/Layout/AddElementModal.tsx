import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { CharacterElement, LocationElement, ObjectElement, StoryElementType, StoryElement } from "../StoryElements/StoryElement.ts";
import React from "react";
import StoryElementInputForm from "./StoryElementInputForm.tsx";

function ElementModal(props: {
    modal: boolean,
    setModal: React.Dispatch<React.SetStateAction<boolean>>,
    modalAction: "add" | "edit",
    elementType: StoryElementType,
    initialElement?: StoryElement,
    onSubmit: (element: StoryElement) => boolean
}) {
    let blankElement: StoryElement;
    let typeString: string;
    let actionString: string;
    let buttonString: string;

    switch (props.elementType) {
        case StoryElementType.character:
            blankElement = new CharacterElement(false, "Nuovo Personaggio");
            typeString = "personaggio";
        break;
        case StoryElementType.object:
            blankElement = new ObjectElement(false, "Nuovo Oggetto");
            typeString = "oggetto";
        break;
        case StoryElementType.location:
            blankElement = new LocationElement(false, "Nuovo Luogo");
            typeString = "luogo";
        break;
        default:
            throw new TypeError(props.elementType + " is not a valid type");
    }

    switch (props.modalAction) {
        case "add":
            actionString = "Aggiungi un nuovo";
            buttonString = "Aggiungi";
        break;
        case "edit":
            actionString = "Modifica";
            buttonString = "Modifica";
        break;
    }

    const title = `${actionString} ${typeString}`;

    const initElement = props.initialElement ?? blankElement;

    const [element, setElement] = useState(initElement);
    const [alert, setAlert] = useState(false);
    const [alertText, setAlertText] = useState("");

    const handleModalClose = () => {
        props.setModal(false);
        setElement(initElement);
        setAlert(false);
        setAlertText("");
    }

    const onConfirm = () => {
        const errorMessage = checkElementInvalid(element);
        if (errorMessage) {
            setAlertText(errorMessage);
            setAlert(true);
            return;
        }

        if (props.onSubmit(element)) {
            handleModalClose();
            return;
        }

        setAlertText(`Un ${typeString} con questo nome esiste già.`);
        setAlert(true);
    }

    const checkElementInvalid = (element: StoryElement) => {
        if (!element) throw new Error("Element is undefined");
        if (!element.name || element.name === "") return "Il nome non può essere vuoto";
        return;
    }

    useEffect(() => setElement(props.initialElement ?? blankElement), [props.initialElement, props.elementType]);
    
    return (
        <Modal show={props.modal} onHide={handleModalClose}>
            <Form onSubmit={e => {e.preventDefault(); onConfirm()}}>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <StoryElementInputForm
                        type={props.elementType}
                        element={element}
                        setElement={setElement} />
                        {alert && (
                            <Alert
                                className="mt-3"
                                variant={"danger"}
                                dismissible
                                onClose={() => setAlert(false)} >
                            {alertText}
                        </Alert>
                        )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" type="reset" onClick={handleModalClose}>
                        Annulla
                    </Button>
                    <Button variant="primary" type="submit">
                        {buttonString}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default ElementModal;