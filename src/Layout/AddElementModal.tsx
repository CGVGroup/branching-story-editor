import React, { RefObject, useCallback, useEffect, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { StoryElementType, StoryElement, createNewElement, StoryElementTypeDictionary } from "../StoryElements/StoryElement.ts";
import StoryElementInputForm from "./StoryElementInputForm.tsx";

function ElementModal(props: {
    modal: boolean,
    setModal: React.Dispatch<React.SetStateAction<boolean>>,
    elementType: StoryElementType,
    initialElement?: StoryElement,
    container?: RefObject<any>,
    onSubmit: (element: StoryElement) => boolean
}) {
    const blankElement = createNewElement(props.elementType);
    const typeString = StoryElementTypeDictionary.ita.singular[props.elementType];

    let actionString: string;
    let buttonString: string;

    if (props.initialElement) {
        actionString = "Modifica";
        buttonString = "Modifica";
    } else {
        actionString = "Aggiungi un nuovo";
        buttonString = "Aggiungi";
    }

    const title = `${actionString} ${typeString}`;

    const initElement = props.initialElement ?? blankElement;

    const [element, setElement] = useState(initElement);
    const [alert, setAlert] = useState(false);
    const [alertText, setAlertText] = useState("");

    const handleModalClose = useCallback(() => {
        props.setModal(false);
        setElement(initElement);
        setAlert(false);
        setAlertText("");
    }, [props.setModal, initElement]);

    const onConfirm = useCallback(() => {
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
    }, [handleModalClose, element]);

    const checkElementInvalid = useCallback((element: StoryElement) => {
        if (!element) throw new Error("Element is undefined");
        if (!element.name || element.name === "") return "Il nome non può essere vuoto";
        return;
    }, []);

    useEffect(() => 
        setElement(props.initialElement ?? blankElement)    //Do NOT add blankElement as a dependency
    , [props.initialElement, props.elementType]);
    
    return (
        <Modal
            show={props.modal}
            onHide={handleModalClose}
            backdrop="static"
            container={props.container}>
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