import { useCallback, useContext, useState } from "react";
import { ActionIcon, Flex, Group, TextInput } from "@mantine/core"
import { UsernameContext } from "../../App.tsx";
import { useNavigate } from "react-router-dom";

function Login(props: {
    navigateTo: string;
}) {
    const [, setUsername] = useContext(UsernameContext)!;
    
    const navigate = useNavigate();
    
    const [localName, setLocalName] = useState("");

    const handleContinue = useCallback((name: string) => {
        setUsername(name);
        navigate(props.navigateTo);
    }, [setUsername]);
    return (
        <Flex direction="row" h="100%" align="center" justify="center">
            <Group>
                <TextInput
                    placeholder="Inserisci uno username"
                    value={localName}
                    onKeyDown={e => e.key === "Enter" && handleContinue(localName)}
                    onChange={e => setLocalName(e.currentTarget.value)}
                    autoComplete="username"
                    autoFocus
                    size="lg"/>
                <ActionIcon size="xl" onClick={() => handleContinue(localName)}>
                    <i className="bi bi-arrow-right"/>
                </ActionIcon>    
            </Group>
        </Flex>
)}

export default Login; 