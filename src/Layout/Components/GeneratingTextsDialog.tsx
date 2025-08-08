import { Dialog, Progress, Stack, Text } from "@mantine/core";

type TextsLoadingInfo = {
    current: number,
    total: number,
    currentScene: string
}

function GeneratingTextsDialog(props: {
    loading: boolean,
    current: number,
    total: number,
    currentScene: string
}) {
    return (
        <Dialog opened={props.loading} transitionProps={{exitDelay: 2000}}>
            <Stack>
                <Progress value={props.current * 100 /props.total} transitionDuration={1000} animated/>
                {props.currentScene ? 
                    <Text>Generando il testo di: <b>{props.currentScene}</b> ({props.current + 1}/{props.total})</Text>
                :
                    <Text>Generati <b>{props.total}</b> testi</Text>}
            </Stack>
        </Dialog>
    );
}

export default GeneratingTextsDialog;
export {TextsLoadingInfo};