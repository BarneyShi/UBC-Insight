document.getElementById("click-me-button").addEventListener("click", handleClickMe);
document.getElementById("upload-button").addEventListener("click", handleClickUpload);
window.onload = fetchAllDatasets;
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
	// Temporarily disable the button
	const button = document.getElementById("upload-button");
	button.innerText = "Uploading...";
	button.disabled = true;
	button.style.backgroundColor = "gray";

	await sendPutRequest(fileInput, id, kind);
	// Reset the button
	button.innerText = "Upload";
	button.disabled = false;
	button.style.backgroundColor = "#3f51b5";
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

async function addRowToTable(id, kind, rows = undefined) {
	const table = document.getElementById("dataset-table");
	const row = document.createElement("tr");
	row.setAttribute("row-id", id);
	if (rows === undefined) {
		rows = await getDatasetRows(id);
	}
	row.innerHTML = `
		<td><input class="checkbox-input" checkbox-id=${id} type="checkbox" /></td>
		<td>${id}</td>
		<td>${kind === "rooms" ? "Rooms" : "Courses"}</td>
		<td>${rows}</td>
		<td><button aria-id=${id} class="delete-button">Delete</button></td>
	`
	table.appendChild(row);
	// Reference" https://stackoverflow.com/a/48365211/9497206
	const button = document.querySelector(`[aria-id='${id}']`);
	button.addEventListener("click", async () => await deleteDataset(id));

	const checkbox = document.querySelector(`[checkbox-id='${id}']`);
	checkbox.addEventListener("change", (e) => handleCheckbox(e));
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

async function fetchAllDatasets() {
	const response = await fetch(`http://localhost:4321/datasets`, {method: "GET"});
	const data = await response.json();
	if (data["error"]) {
		return;
	}
	for (let i = 0; i < data.result.length; i++) {
		const dataset = data.result[i];
		await addRowToTable(dataset.id, dataset.kind, dataset.numRows);
	}
}

async function deleteDataset(id) {
	const response = await fetch(`http://localhost:4321/dataset/${id}`, {method: "DELETE"});
	const data = await response.json();
	if (data["error"]) {
		return;
	}
	document.querySelector(`[row-id='${id}']`).remove();
}

async function handleCheckbox(event) {
	const checkboxes = document.getElementsByClassName("checkbox-input");
	for (const checkbox of checkboxes) {
		checkbox.checked = false;
	}
	const id = event.target.getAttribute("checkbox-id");
	document.querySelector(`[checkbox-id='${id}']`).checked = true;
	selectedDataset = id;
	console.log(`Dataset selected: ${id}`);
}