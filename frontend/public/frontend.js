document.getElementById("click-me-button").addEventListener("click", handleClickMe);
document.getElementById("upload-button").addEventListener("click", handleClickUpload);

// The dataset to be queried
let selectedDataset = '';

function handleClickMe() {
	alert("Button Clicked!");
}

async function handleClickUpload(event) {
	event.preventDefault();
	const fileInput = document.getElementById("upload-input").files[0];
	const id = document.getElementById("id-input").value;
	const isCourseKind = document.getElementById("courses-kind").checked;
	const isRoomKind = document.getElementById("rooms-kind").checked;
	if (!isCourseKind && !isRoomKind) {
		alert("Please select a kind!");
		return;
	}
	if (id.length === 0) {
		alert("ID cannot be empty!");
		return;
	}
	if (!fileInput) {
		alert("Please upload a dataset first!");
		return;
	}
	const kind = isRoomKind ? "rooms" : "courses";
	await sendPutRequest(fileInput, id, kind);
}

async function sendPutRequest(file, id, kind) {
	// Reference: https://jasonwatmore.com/post/2021/09/20/fetch-http-put-request-examples
	// const body = readZipToBuffer(file);
	const option = {
		method: "PUT",
		headers: {'Content-Type': 'application/x-zip-compressed'},
		body: file
	}
	const response = await fetch(`http://localhost:4321/dataset/${id}/${kind}`, option);
	const data = await response.json();
	console.log("Add dataset result: ", data);
	if (data["result"]) {
		await addRowToTable(id, kind);
	} else {
		alert(`Failed to add the dataset\n ${data.error}`);
	}
	document.getElementById("addDataset-form").reset();
}

async function addRowToTable(id, kind) {
	const table = document.getElementById("dataset-table");
	const row = document.createElement("tr");
	const numRows = await getDatasetRows(id);
	row.innerHTML = `
		<td><input type="checkbox" /></td>
		<td>${id}</td>
		<td>${kind === "rooms" ? "Rooms" : "Courses"}</td>
		<td>${numRows}</td>
	`
	table.appendChild(row);
}

async function getDatasetRows(id) {
	const response = await fetch(`http://localhost:4321/datasets`, {method: "GET"});
	const data = await response.json();
	if (data["error"]) {
		return "Undefined";
	}
	const dataset = data.result.find(e => e.id === id);
	return dataset.numRows;
}