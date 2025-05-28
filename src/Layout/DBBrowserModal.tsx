import { RefObject, useCallback, useState } from "react";
import { Button, Card, Col, Form, Modal, Row } from "react-bootstrap";
import { createNewDBElement, StoryElement, StoryElementType, StoryElementTypeDictionary } from "../StoryElements/StoryElement.ts";
import { searchDB } from "../Misc/DB.ts";

function DBBrowserModal(props: {
    modal: boolean,
    setModal: React.Dispatch<React.SetStateAction<boolean>>,
    elements: string[],
    elementType: StoryElementType,
    container?: RefObject<any>,
    onSubmit: (element: StoryElement) => boolean
}) {
    const [results, setResults] = useState<StoryElement[]>([]);
    const [selected, setSelected] = useState<StoryElement[]>([]);

    const onSearchChange = useCallback((search: string) => {
        if (search.length > 2) setResults(searchDB(search, props.elementType));
        else setResults([]);
    }, [props.elementType]);

    const handleModalClose = useCallback(() => {
        setResults([]);
        setSelected([]);
        props.setModal(false);
    }, [props.setModal]);

    const onAddResult = useCallback((result: StoryElement) => {
        setSelected(selected => selected.concat(result));
    }, []);

    const onRemoveResult = useCallback((result: StoryElement) => {
        setSelected(selected => selected.filter(s => s !== result));
    }, [])
    
    const onSubmit = useCallback(() => {
        selected.forEach(element => props.onSubmit(createNewDBElement(element, props.elementType)));
        handleModalClose();
    }, [selected])

    const checkElementSelectable = useCallback((element: StoryElement) => {
        return props.elements.includes(element.id) || selected.includes(element);
    }, [props.elements, selected]);

    const typeString = StoryElementTypeDictionary.ita.singular[props.elementType];

    return (
        <Modal
            show={props.modal}
            onHide={handleModalClose}
            container={props.container}>
            <Modal.Header>Scegli un {typeString} dal Catalogo</Modal.Header>
            <Modal.Body className="h-50">
                <Col>
                    <Form.Control onChange={e => onSearchChange(e.target.value)}/>
                    {results.length ?
                        results.map((result, idx) => (
                            <Card key={idx}>
                                <Card.Title>
                                    {result["name"]}
                                </Card.Title>
                                <Card.Body>
                                    <Col>
                                        <Row>
                                            {result["dating"].join(", ")}
                                        </Row>
                                        <Row>
                                            {result["description"]}
                                        </Row>
                                    </Col>
                                </Card.Body>
                                <Card.Footer>
                                    <Button
                                        onClick={() => onAddResult(result)}
                                        disabled={checkElementSelectable(result)}>
                                        Aggiungi
                                    </Button>
                                    {selected.includes(result) &&
                                        <Button variant="danger" onClick={() => onRemoveResult(result)}>
                                            <i className="bi bi-trash"/>
                                        </Button>}
                                </Card.Footer> 
                            </Card>
                        ))
                    :
                        "Nessun risultato" 
                    }
                </Col>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" type="reset" onClick={handleModalClose}>
                    Annulla
                </Button>
                <Button variant="primary" type="submit" onClick={onSubmit}>
                    Aggiungi
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default DBBrowserModal;