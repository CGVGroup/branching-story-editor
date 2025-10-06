import { Center, Loader, Title } from "@mantine/core";
import classes from "../GrowColumn.module.css"

function Loading() {
	return (
		<Center h="100vh" className={classes.growcol}>
			<Title order={2}>
				Caricamento...
			</Title>
			<Loader size="xl"/>
		</Center>
	);
}

export default Loading;