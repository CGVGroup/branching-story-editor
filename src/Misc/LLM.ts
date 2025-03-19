export async function sendToLLM(prompt: string): Promise<Response> {
    return fetch("http://127.0.0.1:5000");
}
/*const xhr = new XMLHttpRequest();
    //xhr.open("POST", "http://127.0.0.1:5000/", true);
    //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.open("GET", "http://127.0.0.1:5000/", true);
    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            setLoadings(loadings => loadings.map((l, idx) => idx === id ? false : l));
            setFullTexts(fullTexts => fullTexts.map((ft, idx) => idx === id ? xhr.responseText : ft));
        }
        };
    xhr.send(`prompt=${(localInstance.flow.nodes[id].data.scene as Scene).prompt}`);
*/