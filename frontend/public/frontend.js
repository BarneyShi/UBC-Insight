document.getElementById("click-me-button").addEventListener("click", handleClickMe);
document.getElementById("upload-button").addEventListener("click", handleClickUpload);

// The dataset to be queried
let selectedDataset = '';

function handleClickMe() {
	alert("Button Clicked!");
}

function handleClickUpload() {
	document.getElementById("upload-input").click();
}

function readZipToBuffer(file) {
	// Reference: https://stackoverflow.com/questions/36280818/how-to-convert-file-to-base64-in-javascript
	const fileReader = new FileReader();
	fileReader.readAsArrayBuffer(file);
	fileReader.onload = function () {
		return fileReader.result;
	}
	fileReader.onerror = function () {
		return new Error("Failed to read zip file!");
	}
	
}
async function sendPutRequest(file, id, kind) {
	// Reference: https://jasonwatmore.com/post/2021/09/20/fetch-http-put-request-examples
	const option = {
		method: "PUT",
		headers: {'Content-Type': 'application/*'},
		body: readZipToBuffer(file)
	}
	const response = await fetch(`https://locahost:4321/dataset/${id}/${kind}`, option);
	const data = await response.json();
	console.log(data);
}