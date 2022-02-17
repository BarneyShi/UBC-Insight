import JSZip from "jszip";
import * as fs from "fs-extra";
import * as parse5 from "parse5";
import * as http from "http";
import Section from "../model/Section";
import {InsightError} from "./IInsightFacade";
import Room from "../model/Room";

async function addCourses(id: string, zips: JSZip, dataset: Map<string, Section[]>): Promise<string[]> {
	// Check if root dir has 'courses/'
	if (!zips.files["courses/"]) {
		throw new InsightError("Root dir doesn't have a courses/ folder.");
	}
	// Add dataset to Map() and /data folder.
	let promises: Array<Promise<void>> = [];
	let ids: string[] = [];
	zips.forEach((relativePath, file) => {
		if (relativePath.match(/^courses/g) !== null) {
			const promise = file.async("text").then(async (data) => {
				let jsons;
				try {
					jsons = JSON.parse(data);
					dataset.get(id)?.push(...setSections(jsons.result));
					// Persist to ./data
					const jsonPath = `./data/${id}/${relativePath}.json`;
					await fs.outputJSON(jsonPath, jsons);
				} catch (error) {
					console.log("Skip over this invalid json");
				}
			});
			promises.push(promise);
		}
	});
	// Wait till all `file.async` have resolved in `forEach()`.
	return Promise.allSettled(promises).then(() => {
		if (fs.existsSync("./data")) {
			const filesInDataDir = fs.readdirSync("./data");
			ids.push(...filesInDataDir);
		}
		if (dataset.get(id)?.length === 0) {
			throw new InsightError("No valid sections in dataset!");
		}
		return ids;
	});
}

async function addRooms(id: string, zips: JSZip, dataset: Map<string, Room[]>): Promise<string[]> {
	if (!zips.files["rooms/"] || !zips.files["rooms/index.htm"]) {
		throw new InsightError("Zip doesn't have rooms/ or index.htm file.");
	}
	dataset.set(id, []);
	let promises: Array<Promise<void>> = [];
	let ids: string[] = [];
	zips.forEach((relativePath, file) => {
		if (relativePath.match(/^rooms\/index.htm$/g)) {
			const promise = file.async("text").then(async (data) => {
				const html = parse5.parse(data);
				const rooms = await findRooms(html, zips);
				console.log(`Found ${rooms.length} rooms!`);
				if (rooms.length !== 0) {
					for (let room of rooms) {
						dataset.get(id)?.push(room);
						const path = `./data/${id}/${room.name}.json`;
						fs.outputJSONSync(path, room);
					}
				}
			});
			promises.push(promise);
		}
	});
	return Promise.allSettled(promises).then(() => {
		if (fs.existsSync("./data")) {
			const filesInDataDir = fs.readdirSync("./data");
			ids.push(...filesInDataDir);
		}
		if (dataset.get(id)?.length === 0) {
			throw new InsightError("No valid sections in dataset!");
		}
		return ids;
	});
}
function setSections(sections: Array<{[key: string]: any}>): Section[] {
	let ans: Section[] = [];
	sections.forEach((e: any) => {
		let year: number = e.Year;
		if (e.Section === "overall") {
			year = 1900;
		}
		const s: Section = new Section(
			e.Subject,
			e.Course,
			e.Avg,
			e.Professor,
			e.Title,
			e.Pass,
			e.Fail,
			e.Audit,
			e.id,
			year
		);
		ans.push(s);
	});
	return ans;
}
// Find all <tr>s associated, then from there to find <td>s.
function findRooms(nodes: {[key: string]: any}, zips: JSZip): Promise<Room[]> {
	let targetTRs = findTargetTag(nodes, "tr", "");
	let rooms: Room[] = [];
	let promises: any = [];
	for (let tr of targetTRs) {
		let shortName = findTargetAttrUnderTag(tr, "#text", "views-field-field-building-code");
		shortName = tidyOutput(shortName);
		let fullName = findTargetAttrUnderTag(tr, "#text", "views-field-title");
		fullName = tidyOutput(fullName);
		let address = findTargetAttrUnderTag(tr, "#text", "views-field-field-building-address");
		address = tidyOutput(address);
		let href = findTargetAttrUnderTag(tr, "a", "views-field-nothing");
		href = tidyOutput(href);

		const promise = findRoomDetail(href, zips).then((roomDetails: any) => {
			if (roomDetails.length !== 0) {
				const coordPromise = findRoomCoords(address).then((coords) => {
					if (!coords["error"]) {
						for (const room of roomDetails) {
							const newRoom = new Room(
								fullName,
								shortName,
								room.number,
								address,
								coords.lat,
								coords.lon,
								room.seats,
								room.type,
								room.furniture,
								room.roomHref
							);
							// console.log("Found a room", newRoom);
							rooms.push(newRoom);
						}
					}
				});
				return Promise.allSettled([coordPromise]);
			}
		});
		promises.push(promise);
	}
	return Promise.allSettled(promises).then(() => {
		return rooms;
	});
}

// A iterative DFS helper to find target Tag or just return element text.
function findTargetTag(node: {[key: string]: any}, tagName: string, className: string): Array<{[key: string]: any}> {
	try {
		let stack: Array<{[key: string]: any}> = [node];
		let tags = [];
		while (stack.length > 0) {
			const element: any = stack.pop();
			if (
				(element.nodeName === tagName &&
					className !== "" &&
					element.attrs &&
					element.attrs.some(
						(e: {[key: string]: any}) => e.name === "class" && e.value.includes(className)
					)) ||
				(element.nodeName === tagName && className === "")
			) {
				tags.push(element);
			}
			if (element.childNodes) {
				for (const child of element.childNodes) {
					stack.push(child);
				}
			}
		}
		return tags;
	} catch (error) {
		console.log("Error while doing DFS: ", error);
		return [];
	}
}

function findTargetAttrUnderTag(tag: {[key: string]: any}, tagName: string, tdClassName: string): string {
	let targetTD = findTargetTag(tag, "td", tdClassName);
	if (targetTD.length === 0) {
		return "";
	}
	if (tagName === "#text") {
		const nodes = findTargetTag(targetTD[0], "#text", "");
		if (nodes.length === 0) {
			return "";
		}
		let texts = "";
		for (const n of nodes) {
			texts += n.value;
		}
		return texts;
	} else if (tagName === "a") {
		const href = findTargetTag(targetTD[0], "a", "")[0]?.attrs?.find((e: any) => e.name === "href")?.value;
		return href;
	}
	return "";
}

function findRoomDetail(href: string, zips: JSZip): Promise<Array<{[key: string]: any}>> {
	let promises: Array<Promise<void>> = [];
	let rooms: Array<{[key: string]: any}> = [];
	const path = `rooms${href.slice(1)}`;
	zips.forEach((relativePath, file) => {
		if (relativePath === path) {
			const promise = file.async("text").then(async (data) => {
				const root = parse5.parse(data);
				const roomTargetTRs = findTargetTag(root, "tr", "");
				for (let roomTR of roomTargetTRs) {
					let number: string = findTargetAttrUnderTag(roomTR, "#text", "views-field-field-room-number");
					if (!number) {
						continue;
					}
					number = tidyOutput(number);
					let seats: number = 0;
					let seatsRes: string = findTargetAttrUnderTag(roomTR, "#text", "views-field-field-room-capacity");
					if (seatsRes) {
						seatsRes = tidyOutput(seatsRes);
						seats = parseInt(seatsRes, 10);
					}
					let furniture = findTargetAttrUnderTag(roomTR, "#text", "views-field-field-room-furniture");
					furniture = tidyOutput(furniture);
					let type = findTargetAttrUnderTag(roomTR, "#text", "views-field-field-room-type");
					type = tidyOutput(type);
					let roomHref = findTargetAttrUnderTag(roomTR, "a", "views-field-nothing");
					roomHref = tidyOutput(roomHref);
					rooms.push({number, furniture, seats, type, roomHref});
				}
			});
			promises.push(promise);
		}
	});
	return Promise.allSettled(promises).then(() => rooms);
}

function findRoomCoords(address: string): Promise<{[key: string]: any}> {
	// Reference: https://www.digitalocean.com/community/tutorials/how-to-create-an-http-client-with-core-http-in-node-js
	let coords = {};
	const request: Promise<{[key: string]: any}> = new Promise((resolve, reject) => {
		address = address.replace(/\s/g, "%20");
		http.get(`http://cs310.students.cs.ubc.ca:11316/api/v1/project_team<528>/${address}`, (res) => {
			let blobs = "";
			res.on("data", (chunk) => {
				blobs += chunk;
			});
			res.on("end", () => {
				coords = JSON.parse(blobs);
				resolve(coords);
			});
			res.on("error", () => {
				resolve(coords);
			});
		});
	});
	return request;
}

function tidyOutput(str: string): string {
	str = str.trim();
	str = str.replace(/(\s)+/g, " ");
	return str;
}
export {addCourses, addRooms, setSections};
