import { Card, Placeholder } from "react-bootstrap";

export default function LoadingPlaceholders() {
    return <Card className="h-100" style={{textAlign:"left"}}>
        <Card.Body>
            <Placeholder as={Card.Text} animation="wave">
                <Placeholder xs={4}/>{" "}<Placeholder xs={4}/>{" "}<Placeholder xs={3}/>
                <Placeholder xs={6}/>{" "}<Placeholder xs={5}/>
                <Placeholder xs={10}/>
            </Placeholder>
        </Card.Body>
    </Card>
}