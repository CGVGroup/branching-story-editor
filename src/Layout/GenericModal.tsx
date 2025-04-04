import React, { ReactNode } from "react";
import { Button, ButtonProps, Modal } from "react-bootstrap";

type ModalContents = {
    title?: ReactNode,
    body?: ReactNode,
    okProps?: ButtonProps,
    okText?: string,
    cancelProps?: ButtonProps,
    cancelText?: string,
}

function GenericModal(props: ModalContents & {
    show: boolean,
    setShow: React.Dispatch<React.SetStateAction<boolean>>
}) {    
    return (
        <Modal show={props.show} scrollable onHide={() => props.setShow(false)}>
            {props.title &&
                <Modal.Header closeButton>
                    <Modal.Title>
                        {props.title}
                    </Modal.Title>
                </Modal.Header>
            }
            {props.body &&
                <Modal.Body>
                    {props.body}
                </Modal.Body>
            }
            {(props.okProps || props.cancelProps) &&
                <Modal.Footer>
                    {props.cancelProps && 
                        <Button {...props.cancelProps} onClick={(e) => {props.cancelProps?.onClick?.(e); props.setShow(false)}}>
                            {props.cancelText ?? "Annulla"}
                        </Button>}
                    {props.okProps && 
                        <Button {...props.okProps} onClick={(e) => {props.okProps?.onClick?.(e); props.setShow(false)}}>
                            {props.okText ?? "Ok"}
                        </Button>}
                </Modal.Footer>
            }
        </Modal>
    );
}

export default GenericModal;
export type { ModalContents };