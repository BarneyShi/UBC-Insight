import * as fs from "fs-extra";
import Room from "../model/Room";
import Section from "../model/Section";
import {setSections} from "./addDatasetUtil";

function initInMemoryDatasets(courseMap: Map<string, Section[]>, roomMap: Map<string, Room[]>): void {
	// Reference: https://stackoverflow.com/questions/18112204/get-all-directories-within-directory-nodejs
	if (fs.pathExistsSync("./data")) {
		const ids = fs.readdirSync("./data", {withFileTypes: true}).filter((dir) => dir.isDirectory())
			.map((dir) => dir.name);
		ids.forEach((id) => {
			if (fs.pathExistsSync(`./data/${id}/courses`)) {
				// Reference: https://stackoverflow.com/questions/61645720/read-all-json-files-contained-in-a-dynamically-updated-folder
				const files = fs.readdirSync(`./data/${id}/courses`);
				files.forEach((file) => {
					const data = fs.readFileSync(`./data/${id}/courses/${file}`);
					const json = JSON.parse(data.toString());
					const sections = setSections(json.result);
					if (!courseMap.has(id)) {
						courseMap.set(id, []);
					}
					courseMap.get(id)?.push(...sections);
				});
			} else {
				// Reference: https://stackoverflow.com/questions/61645720/read-all-json-files-contained-in-a-dynamically-updated-folder
				const files = fs.readdirSync(`./data/${id}`);
				files.forEach((file) => {
					const data = fs.readFileSync(`./data/${id}/${file}`);
					const json = JSON.parse(data.toString());
					const room: Room = setRoom(json);
					if (!roomMap.has(id)) {
						roomMap.set(id, []);
					}
					roomMap.get(id)?.push(room);
				});
			}
		});
	}
}

function setRoom(json: {[key: string]: any}): Room {
	const room = new Room(
		json._fullname,
		json._shortName,
		json.number,
		json._address,
		json._lat,
		json._lon,
		json._seats,
		json._type,
		json._furniture,
		json._href
	);
	return room;
}

export {setSections, initInMemoryDatasets};
