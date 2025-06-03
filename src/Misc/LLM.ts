export async function sendToLLM(payload: object): Promise<string> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://127.0.0.1:5000/", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                console.log(xhr.responseText)
                resolve(xhr.responseText);
            }
            if (xhr.status !== 200) {
                console.error(xhr.responseText)
                reject(new Error(`Risposta dall'LLM: ${xhr.status} - ${xhr.statusText}`))
            }
        };
        xhr.onerror = () => reject(new Error("Errore nella richiesta all'LLM"));
        xhr.send(JSON.stringify(payload));
    })
}