export async function sendToLLM(prompt: string): Promise<string> {
    return new Promise((res, _) => setTimeout(() => res(
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In consequat, est non hendrerit consequat, ex eros tincidunt ipsum, sed tristique diam libero eu massa. Nullam aliquam magna sed nisi egestas imperdiet. Maecenas eget congue metus. Phasellus rutrum libero non ex tristique malesuada. Sed at dui sit amet mi venenatis tempus vitae id libero. Sed sit amet leo in diam bibendum efficitur. Praesent tincidunt velit a suscipit eleifend. Curabitur dapibus ac nulla non posuere. Duis eu quam at mauris sagittis aliquam. Cras turpis mauris, feugiat vitae ante sit amet, lacinia porttitor lorem. Duis sodales, magna id mollis viverra, nulla dolor ultricies orci, non ullamcorper velit enim sed dolor. In a diam arcu. Phasellus non diam scelerisque, congue nunc eu, porta eros. Cras tempus porttitor dui, eu semper justo dignissim a. Nulla eu pretium urna, quis hendrerit ligula."
    ), 1000));
}
//return fetch("http://127.0.0.1:5000");
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