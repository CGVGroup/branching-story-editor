export default function saveToDisk(object: any, fileName?: string, fileType?: string) {
    if (!object) return;
    const name = fileName ?? "Download";
    const type = fileType ?? "text/plain";

    const blob = new Blob([object], { type: type });
    let link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = name;
    link.click();
    link.remove();
}