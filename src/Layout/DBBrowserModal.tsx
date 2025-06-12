import { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Form, Modal, Row } from "react-bootstrap";
import { StoryElement, StoryElementType, StoryElementTypeDictionary } from "../StoryElements/StoryElement.ts";
import { searchDB } from "../Misc/DB.ts";

function DBBrowserModal(props: {
    modal: boolean,
    setModal: React.Dispatch<React.SetStateAction<boolean>>,
    elements: string[],
    elementType: StoryElementType,
    container?: RefObject<any>,
    onSubmit: (element: StoryElement) => boolean
}) {
    const [search, setSearch] = useState<string>("");
    const [type, setType] = useState<StoryElementType>(props.elementType);
    const [results, setResults] = useState<StoryElement[]>(searchDB("", type));
    const [selected, setSelected] = useState<StoryElement[]>([]);

    const handleModalClose = useCallback(() => {
        props.setModal(false);
        setType(props.elementType);
        setSearch("");
        setSelected([]);
    }, [props.setModal, props.elementType]);

    const onAddResult = useCallback((result: StoryElement) => {
        setSelected(selected => selected.concat(result));
    }, []);

    const onRemoveResult = useCallback((result: StoryElement) => {
        setSelected(selected => selected.filter(s => s !== result));
    }, [])
    
    const onSubmit = useCallback(() => {
        selected.forEach(element => props.onSubmit(element));
        handleModalClose();
    }, [selected, type])

    const checkElementSelectable = useCallback((element: StoryElement) => {
        return !props.elements.includes(element.id) && !selected.includes(element);
    }, [props.elements, selected]);

    const typeString = useMemo(() => StoryElementTypeDictionary.ita.singular[type], [type]);

    useEffect(() => {
        setType(props.elementType);
    }, [props.elementType]);

    useEffect(() => {
        setResults(searchDB(search, type))
    }, [search, type]);

    return (
        <Modal
            show={props.modal}
            onHide={handleModalClose}
            container={props.container}
            scrollable={true}
            size="lg">
            <Modal.Header>
                <Modal.Title>
                    Scegli un {typeString} dal Catalogo
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col xs={1}>
                        <Button onClick={() => setType(StoryElementType.character)}>Cha</Button>
                        <Button onClick={() => setType(StoryElementType.object)}>Obj</Button>
                        <Button onClick={() => setType(StoryElementType.location)}>Loc</Button>
                    </Col>
                    <Col>
                        <Row>
                            <Form.Control
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                id="db-search"
                                autoFocus/>
                        </Row>
                        <Row>
                            {results.length ?
                                results.map((result, idx) => (
                                    <DBBrowserElement
                                        key={idx}
                                        element={result}
                                        addable={checkElementSelectable(result)}
                                        onAdd={() => onAddResult(result)}
                                        removable={selected.includes(result)}
                                        onRemove={() => onRemoveResult(result)}/>
                                ))
                            :
                                "Nessun risultato" 
                            }
                        </Row>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" type="reset" onClick={handleModalClose}>
                    Annulla
                </Button>
                <Button variant="primary" type="submit" disabled={selected.length === 0} onClick={onSubmit}>
                    Aggiungi
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

function DBBrowserElement(props: {
    element: StoryElement,
    addable: boolean,
    onAdd: () => void,
    removable: boolean,
    onRemove: () => void,
}) {
    
    const imgPath = useMemo(() => require(`../img/${StoryElementTypeDictionary.eng.singular[props.element.elementType]}.png`), [props.element]);
    return (
        <Card style={{width: "25%"}}>
            <Card.Img variant="top" src={imgPath}/>
            <Card.Body>
                <Card.Title>{props.element.name}</Card.Title>
                <Card.Subtitle>{props.element.type}</Card.Subtitle>
                <Card.Text>{props.element.dating.join(", ")}</Card.Text>
                <Card.Text>{props.element.description}</Card.Text>
            </Card.Body>
            <Card.Footer>
                <Button
                    onClick={props.onAdd}
                    disabled={!props.addable}>
                    Aggiungi
                </Button>
                {props.removable &&
                    <Button variant="danger" onClick={props.onRemove}>
                        <i className="bi bi-trash"/>
                    </Button>}
            </Card.Footer>
        </Card>
    );
} 

export default DBBrowserModal;