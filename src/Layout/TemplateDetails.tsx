import React, { useCallback } from "react";
import { Button, Card, ListGroup, Stack } from "react-bootstrap";
import ActionListElement from "./ActionListElement.tsx";
import StoryElements from "./StoryElements.tsx";

function TemplateDetails(props: {
  template: Template,
  setTemplate: React.Dispatch<React.SetStateAction<Template | undefined>>
  onClick: (index: number) => void
}) {

  const onInstance = useCallback(() => {
    props.setTemplate(template => template?.cloneAndInstantiate());
	}, [props]);
  
  const onClickDeleteInstance = useCallback((instanceIndex: number) => {
    props.setTemplate(template =>
      new Template(
        template?.template,
        template?.instances.filter((_, idx) => idx !== instanceIndex)
  ));}, []);

  return (
    <Stack gap={1} direction="horizontal" style={{width:"100%", height:"100%"}}>
      <Card style={{width:"50%", height:"100%"}}>
        <Card.Body style={{maxHeight:"100%", overflow:"auto"}}>
          <StoryElements
            story={props.template.template}
            readOnly={true} />
        </Card.Body>
      </Card>
      <Card style={{width:"50%", height:"100%"}}>
        <Card.Header>
          <Stack gap={1} direction="horizontal">
            Istanze: {props.template.instances.length ?? 0}
            <Button variant="primary" className={"ms-auto"} onClick={onInstance}>Istanzia</Button>
          </Stack>
        </Card.Header>
        <Card.Body>
          <ListGroup>
            {props.template.instances.map((instance, idx) =>
              <ActionListElement key={idx}
                leftSide={
                  <Button variant="danger" onClick={() => onClickDeleteInstance(idx)}>
                    <i className="bi bi-trash" aria-label="delete" /> 
                  </Button>}>
                <ListGroup.Item action onClick={() => props.onClick(idx)}>
                  {instance.title}
                </ListGroup.Item>
              </ActionListElement>
            )}
          </ListGroup>
        </Card.Body>	
      </Card>
    </Stack>
  );
}

export default TemplateDetails;