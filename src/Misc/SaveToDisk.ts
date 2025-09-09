/**
 * Opens the file dialog to save the object / downloads the object in Downloads (which one depends on browser settings).
 * @param object the JS object to save
 * @param fileName the name to give the downloaded file
 * @param fileType MIME string indicating the content type
 */
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