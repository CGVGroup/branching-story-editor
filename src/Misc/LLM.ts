import Story from "../StoryElements/Story.ts";
/**
 * Sends all relevant info for a single scene to the backend via a POST HTTP Request.
 * @param payload all data pertaining to the current Story and Scene, see {@link Story.sendSceneToLLM} 
 * @param model name of the chosen LLM Model
 * @param prompt name of the chosen LLM Prompt
 * @returns a promise with the generated text
 */
export async function sendToLLM(payload: object, model: string, prompt: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", `/generate/${model}/${prompt}`, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
				resolve(xhr.responseText);
			}
			if (xhr.status !== 200) {
				console.error(xhr.responseText)
				reject(new Error(`Risposta dall'LLM: ${xhr.status} - ${xhr.statusText}`))
			}
		};
		xhr.onerror = () => reject(new Error("Errore nella richiesta all'LLM"));
		xhr.send(JSON.stringify(payload));
	});
}