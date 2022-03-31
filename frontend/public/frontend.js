document.getElementById("click-me-button").addEventListener("click", handleClickMe);
document.getElementById("upload-button").addEventListener("click", handleClickUpload);
document.getElementById("add-filter-button").addEventListener("click", handleAddFilter);
window.onload = fetchAllDatasets;
// The dataset to be queried
let selectedDataset = '';
let selectedDatasetKind = '';

let selectedField = 'Department';

const mCompFields = ["avg", "pass", "fail", "audit", "year",
"lat", "lon", "seats", ]


function boxChecked(event) {
	let selectOrder = document.getElementById("select-order");
	if (event.currentTarget.checked) {
		let newOption = document.createElement("option");
		newOption.setAttribute("id", `${event.currentTarget.id}_2`)
		newOption.innerHTML = `${event.currentTarget.id}`
		newOption.setAttribute("value", event.currentTarget.name);
		selectOrder.appendChild(newOption);
	} else {
		let removedNode = document.getElementById(`${event.currentTarget.id}_2`);
		selectOrder.removeChild(removedNode);
	}
}

async function handleKindChange() {
	let div = document.getElementById("list-of-filters");
	while (div.children.length > 2) {
		div.removeChild(div.lastChild);
	}
	document.getElementById("select-order").innerHTML = '';
}

async function handleColumnsUpdate() {
	let div = document.getElementById("columns");
	if (selectedDatasetKind === "Courses") {
		div.innerHTML += `
			<input type="checkbox" id="Department" name="dept">Department<br>
			<input type="checkbox" id="ID" name="id">ID<br>
			<input type="checkbox" id="Average" name="avg">Average<br>
			<input type="checkbox" id="Instructor" name="instructor">Instructor<br>
			<input type="checkbox" id="Name" name="title">Name<br>
			<input type="checkbox" id="Passed" name="pass">Passed<br>
			<input type="checkbox" id="Failed" name="fail">Failed<br>
			<input type="checkbox" id="Audited" name="audit">Audited<br>
			<input type="checkbox" id="UUID" name="uuid">UUID<br>
			<input type="checkbox" id="Year" name="year">Year<br>
		`;
		document.getElementById("Department").addEventListener("click", boxChecked);
		document.getElementById("ID").addEventListener("click", boxChecked);
		document.getElementById("Average").addEventListener("click", boxChecked);
		document.getElementById("Instructor").addEventListener("click", boxChecked);
		document.getElementById("Name").addEventListener("click", boxChecked);
		document.getElementById("Passed").addEventListener("click", boxChecked);
		document.getElementById("Failed").addEventListener("click", boxChecked);
		document.getElementById("Audited").addEventListener("click", boxChecked);
		document.getElementById("UUID").addEventListener("click", boxChecked);
		document.getElementById("Year").addEventListener("click", boxChecked);
	} else {
		div.innerHTML += `
			<input type="checkbox" id="Full Name" name="fullname">Full Name<br>
			<input type="checkbox" id="Short Name" name="shortname">Short Name<br>
			<input type="checkbox" id="Number" name="number">Number<br>
			<input type="checkbox" id="Name" name="name">Name<br>
			<input type="checkbox" id="Address" name="address">Address<br>
			<input type="checkbox" id="Lat" name="lat">Latitude<br>
			<input type="checkbox" id="Lon" name="lon">Longitude<br>
			<input type="checkbox" id="Seats" name="seats">Seats<br>
			<input type="checkbox" id="Type" name="type">Type<br>
			<input type="checkbox" id="Furniture" name="furniture">Furniture<br>
			<input type="checkbox" id="HREF" name="href">Href<br>
		`;
		document.getElementById("Full Name").addEventListener("click", boxChecked);
		document.getElementById("Short Name").addEventListener("click", boxChecked);
		document.getElementById("Number").addEventListener("click", boxChecked);
		document.getElementById("Name").addEventListener("click", boxChecked);
		document.getElementById("Address").addEventListener("click", boxChecked);
		document.getElementById("Lat").addEventListener("click", boxChecked);
		document.getElementById("Lon").addEventListener("click", boxChecked);
		document.getElementById("Seats").addEventListener("click", boxChecked);
		document.getElementById("Type").addEventListener("click", boxChecked);
		document.getElementById("Furniture").addEventListener("click", boxChecked);
		document.getElementById("HREF").addEventListener("click", boxChecked);
	}
}

async function handleFieldSelection(event) {
	console.log("was called");
	event.preventDefault();
	let fields = event.currentTarget;
	console.log(fields);
	selectedField = fields.options[fields.selectedIndex].value;
	await createCompOptions(selectedField, fields.nextElementSibling);
}

async function handleRemoveFilter(event) {
	console.log("was called");
	let previous;
	for (let i = 0; i < 5; i++) {
		previous = event.currentTarget.previousElementSibling;
		previous.parentNode.removeChild(previous);
	}
	event.currentTarget.parentNode.removeChild(event.currentTarget);
}

async function handleAddFilter(event) {
	if (selectedDataset === '') {

		alert("Please select a dataset first");
		return;
	}
	let div = document.getElementById("list-of-filters");
	let newFilter = document.createElement("div");
	newFilter.setAttribute("style", "max-width: initial")
	if (selectedDatasetKind === "Courses") {
		newFilter.innerHTML = `
		</p>
		<select name="fields" class="fields" id="fields">
			<option value="dept">Department</option>
			<option value="id">ID</option>
			<option value="avg">Average</option>
			<option value="instructor">Instructor</option>
			<option value="title">Name</option>
			<option value="pass">Num of Passed</option>
			<option value="fail">Num of Failed</option>
			<option value="audit">Num of Audited</option>
			<option value="uuid">UUID</option>
			<option value="year">Year</option>
		</select>
		<select id="mComparator" class="mComparator">
			<option value="IS">Contains</option>
		</select>
		<br>
		<input type="text" id="compValue" class="compValue">
		<button id="remove-filter-button" class="filter-button">Remove filter</button>
		`
	} else {
		newFilter.innerHTML = `
		</p>
		<select name="fields" class="fields" id="fields">
			<option value="fullname">Full Name</option>
			<option value="shortname">Short Name</option>
			<option value="number">Number</option>
			<option value="name">Name</option>
			<option value="address">Address</option>
			<option value="lat">Latitude</option>
			<option value="lon">Longitude</option>
			<option value="seats">Seats</option>
			<option value="type">Type</option>
			<option value="furniture">Furniture</option>
			<option value="href">HREF</option>
		</select>
		<select id="mComparator" class="mComparator">
			<option value="IS">Contains</option>
		</select>
		<br>
		<input type="text" id="compValue" class="compValue">
		<button id="remove-filter-button" class="filter-button">Remove filter</button>
		`
	}
	div.appendChild(newFilter);

	newFilter.children[1].addEventListener("change", handleFieldSelection);
	newFilter.lastElementChild.addEventListener("click", handleRemoveFilter);
}

async function handleClickMe(event) {
	event.preventDefault();
	console.log("button clicked");
	let fields = document.getElementsByClassName("fields");
	let mComps = document.getElementsByClassName("mComparator")
	let mCompValue = document.getElementsByClassName("compValue")
	let columns = document.querySelectorAll('div#columns input[type=checkbox]')
	let order = document.getElementById("select-order").value;

	let jsonQuery = {
		"WHERE": {
		},
		"OPTIONS": {
			"COLUMNS": [
			],
			"ORDER": ""
		}
	}

	if (mComps.length > 0) {
		jsonQuery["WHERE"]["AND"] = [];
		for (let m = 0; m < mComps.length; m++) {
			jsonQuery["WHERE"]["AND"].push({});
			jsonQuery["WHERE"]["AND"][m][mComps[m].value] = {};
			jsonQuery["WHERE"]["AND"][m][mComps[m].value][`${selectedDataset}_${fields[m].value}`] =
				mCompFields.includes(fields[m].value) ? Number(mCompValue[m].value) : mCompValue[m].value;
		}
	}


	for (let c of columns) {
		if (c.checked) {
			jsonQuery["OPTIONS"]["COLUMNS"].push(`${selectedDataset}_${c.name}`);
		}
	}
	jsonQuery["OPTIONS"]["ORDER"] = `${selectedDataset}_${order}`;

	console.log(jsonQuery);
	await queryRequest(jsonQuery, columns);

}

async function queryRequest(jsonQuery, columns) {
	// Reference: https://jasonwatmore.com/post/2021/09/20/fetch-http-put-request-examples
	// const body = readZipToBuffer(file);
	const option = {
		method: "POST",
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(jsonQuery)
	}
	let response = await fetch(`http://localhost:4321/query`, option);
	let result = await response.json();
	console.log(result);
	if (!result["result"]) {
		if (result["error"] === "result is too large") {
			alert("Failed to query dataset\n Result is too large");
			return;
		} else {
			alert("Failed to query dataset\n Invalid query");
			return;
		}

	}
	console.log(result);
	let div = document.getElementById("queryResults");
	div.innerHTML = "";
	await createQueryTable(columns, result["result"])
}

async function createCompOptions(field, mComparator) {

	if (mCompFields.includes(field)) {
		mComparator.innerHTML = `
			<option value="GT">Greater than</option>
			<option value="LT">Less than</option>
			<option value="EQ">Equal to</option>
		`
	} else {
		mComparator.innerHTML = `
			<option value="IS">Contains</option>
		`
	}
}

async function createQueryTable(columns, result) {
	let div = document.getElementById("queryResults");

	let table = document.createElement("table");
	table.setAttribute("border", 1);



	let header = document.createElement("thead");
	let headerRow = document.createElement("tr");
	header.appendChild(headerRow);
	// header.setAttribute("header-id");

	// cannot read property of undefined for columns
	for (let c of columns) {

		if (c.checked) {
			headerRow.insertCell(-1).outerHTML = `<th>${c.id}</th>`;
		}
	}
	table.appendChild(header);

	let body = document.createElement("tbody");
	for (let i of result) {
		let newRow = document.createElement("tr");
		let j = 0
		for (let k of Object.values(i)) {
			newRow.insertCell(j).innerHTML = `${k}`
			j++;
		}
		body.appendChild(newRow);
	}
	table.appendChild(body);
	div.append(table);
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
	let kind = event.currentTarget.parentNode.parentNode.children[2].innerHTML;
	if (selectedDatasetKind !== kind) {
		await handleKindChange();
	}
	selectedDatasetKind = kind;
	let div = document.getElementById("columns");
	while (div.children.length > 1) {
		div.removeChild(div.lastChild);
	}
	await handleColumnsUpdate();
	console.log(`Dataset selected: ${id}`);
}
