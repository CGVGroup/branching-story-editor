/*export async function sendToLLM(prompt: string): Promise<string> {
    console.log(`Sent "${prompt}" to LLM`);
    return new Promise((res, _) => setTimeout(() => res(
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In consequat, est non hendrerit consequat, ex eros tincidunt ipsum, sed tristique diam libero eu massa. Nullam aliquam magna sed nisi egestas imperdiet. Maecenas eget congue metus. Phasellus rutrum libero non ex tristique malesuada. Sed at dui sit amet mi venenatis tempus vitae id libero. Sed sit amet leo in diam bibendum efficitur. Praesent tincidunt velit a suscipit eleifend. Curabitur dapibus ac nulla non posuere. Duis eu quam at mauris sagittis aliquam. Cras turpis mauris, feugiat vitae ante sit amet, lacinia porttitor lorem. Duis sodales, magna id mollis viverra, nulla dolor ultricies orci, non ullamcorper velit enim sed dolor. In a diam arcu. Phasellus non diam scelerisque, congue nunc eu, porta eros. Cras tempus porttitor dui, eu semper justo dignissim a. Nulla eu pretium urna, quis hendrerit ligula."
    ), 1000));
}*/

export async function sendToLLM(payload: object): Promise<string> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://192.168.50.15:11434", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                console.log(xhr.responseText)
                resolve(xhr.responseText);
            }
            if (xhr.status !== 200) {
                reject(new Error(`Risposta dall'LLM: ${xhr.status} - ${xhr.statusText}`))
            }
        };
        xhr.onerror = () => reject(new Error("Errore nella richiesta all'LLM"));
        xhr.send(JSON.stringify(payload));
    })
}