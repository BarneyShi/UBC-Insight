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