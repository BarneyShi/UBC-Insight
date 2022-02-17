import JSZip from "jszip";
import * as fs from "fs-extra";
import * as parse5 from "parse5";
import * as http from "http";
import Section from "../model/Section";
import {InsightError} from "./IInsightFacade";
import Room from "../model/Room";

function handleMComparison(
	mComparator: string, where: {[p: string]: any}, idstr: string, mfield: string[], obj: Section) {
	let mkey: string[] = Object.keys(where[mComparator])[0].split("_");
	let [idstring, field] = mkey;
	if (idstring !== idstr) {
		throw new InsightError("references multiple datasets");
	}
	if (!(typeof where[mComparator][Object.keys(where[mComparator])[0]] === "number")) {
		throw new InsightError("invalid mcomparator type");
	}
	if (!mfield.includes(field)) {
		throw new InsightError("not an mfield");
	}
	if (mComparator === "GT") {
		return getSectionField(obj, field) > where[mComparator][Object.keys(where[mComparator])[0]];
	} else if (mComparator === "LT") {
		return getSectionField(obj, field) < where[mComparator][Object.keys(where[mComparator])[0]];
	} else {
		return getSectionField(obj, field) === where[mComparator][Object.keys(where[mComparator])[0]];
	}
}


function handleSComparison(where: {[p: string]: any}, idstr: string, sfield: string[], obj: Section) {
	let mkey: string[] = Object.keys(where["IS"])[0].split("_");
	let [idstring, field] = mkey;
	if (idstring !== idstr) {
		throw new InsightError("references multiple datasets");
	}
	let strMatch: string = where["IS"][Object.keys(where["IS"])[0]];
	if (strMatch == null) {
		throw new InsightError("invalid skey type");
	}
	if (!sfield.includes(field)) {
		throw new InsightError("not an mfield");
	}
	if ((strMatch.match(/\*/g) || []).length > 2 ||
		(strMatch.includes("*") && !strMatch.split("*").includes(""))) {
		throw new InsightError("asterisk issues");
	}
	let regMatch = new RegExp("^" + strMatch.replace(/\*/g, ".*") + "$");
	return regMatch.test(getSectionField(obj, field).toString());
}

function getSectionField(section: {[key: string]: any}, field: string): Section | number {
	switch (field) {
		case "avg": {
			return section.avg;
		}
		case "pass": {
			return section.pass;
		}
		case "fail": {
			return section.fail;
		}
		case "audit": {
			return section.audit;
		}
		case "year": {
			return Number(section.year);
		}
		case "dept": {
			return section.dept;
		}
		case "id": {
			return section.id;
		}
		case "instructor": {
			return section.instructor;
		}
		case "title": {
			return section.title;
		}
		case "uuid": {
			return section.uuid.toString();
		}
		default: {
			throw new InsightError("Invalid field");
		}
	}
}


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

async function addRooms(id: string, zips: JSZip, dataset: Map<string, Section[]>): Promise<string[]> {
	if (!zips.files["rooms/"] || !zips.files["rooms/index.htm"]) {
		throw new InsightError("Zip doesn't have rooms/ or index.htm file.");
	}
	let promises: Array<Promise<void>> = [];
	let ids: string[] = [];
	zips.forEach(async (relativePath, file) => {
		if (relativePath.match(/^rooms\/index.htm$/g)) {
			const promise = file.async("text").then(async (data) => {
				const html = parse5.parse(data);
				const rooms = await findRooms(html, zips);
				const jsonPath = `./data/${id}/${relativePath}.json`;
				// await fs.outputJSON(jsonPath, jsons);
				// } catch (error) {
				// 	console.log("Skip over this invalid json");
				// }
			});
			promises.push(promise);
		}
	});
	return Promise.resolve([]);
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
		const shortName = findTargetAttrUnderTag(tr, "#text", "views-field-field-building-code");
		const fullName = findTargetAttrUnderTag(tr, "#text", "views-field-title");
		const address = findTargetAttrUnderTag(tr, "#text", "views-field-field-building-address");
		const href = findTargetAttrUnderTag(tr, "a", "views-field-nothing");

		const promise = findRoomDetail(href, zips).then((roomDetails: any) => {
			if (roomDetails.length === 0) {
				Promise.resolve([]);
			}
			findRoomCoords(address).then((coords) => {
				if (coords["error"]) {
					Promise.resolve([]);
				}
				rooms.push(new Room(fullName, shortName, roomDetails.number, address, coords.lat, coords.lon,
					roomDetails.seats, roomDetails.type, roomDetails.furniture, roomDetails.href));
			});
		});
		promises.push(promise);
	}
	return Promise.allSettled([promises]).then(() => rooms);
}

// A iterative DFS helper to find target Tag or just return element text.
function findTargetTag(node: {[key: string]: any}, tagName: string, className: string):
Array<{[key: string]: any}> {
	let stack: Array<{[key: string]: any}> = [node];
	let tags = [];
	while (stack.length > 0) {
		const top = stack[0];
		stack.pop();
		for (const child of top.childNodes) {
			if (child.nodeName === tagName && className !== "" && child.attrs &&
				child.attrs.some((e: {[key: string]: any}) => e.name === "class" &&
				e.value.includes(className)) || child.nodeName === tagName && className === "") {
				tags.push(child);
			}
			stack.push(child);
		}
	}
	return tags;
}

function findTargetAttrUnderTag(tag: {[key: string]: any}, tagName: string, tdClassName: string): string {
	const targetTD = findTargetTag(tag, "td", tdClassName);
	if (targetTD.length === 0) {
		return "";
	}
	if (tagName === "#text") {
		return findTargetTag(targetTD, "#text", "")[0]?.value;
	} else if (tagName === "a") {
		const href = findTargetTag(targetTD, "a", "")[0]?.attrs?.find((e: any) => e.name === "href")?.value;
		return href;
	}
	return "";
}

function findRoomDetail(href: string, zips: JSZip): Promise<Array<{[key: string]: any}>> {
	let promises: Array<Promise<void>> = [];
	let rooms: Array<{[key: string]: any}> = [];
	zips.forEach(async (relativePath, file) => {
		const path = `/rooms${href.slice(1)}`;
		if (relativePath === path) {
			const promise = file.async("text").then(async (data) => {
				const root = parse5.parse(data);
				const roomTargetTRs = findTargetTag(root, "tr", "");
				for (let roomTR of roomTargetTRs) {
					const number: string = findTargetAttrUnderTag(roomTR, "#text", "views-field-field-room-number");
					if (!number) {
						break;
					}
					let seats: number = 0;
					let seatsRes: string =
					findTargetAttrUnderTag(roomTR, "#text", "views-field-field-room-capacity");
					if (seatsRes) {
						seats = parseInt(seatsRes, 10);
					}
					const furniture = findTargetAttrUnderTag(roomTR, "#text", "views-field-field-room-furniture");
					const type = findTargetAttrUnderTag(roomTR, "#text", "views-field-field-room-type");
					const roomHref = findTargetAttrUnderTag(roomTR, "a", "views-field-nothing");
					rooms.push({number, furniture, seats, type, roomHref});
				}
			});
			promises.push(promise);
		}
	});
	return Promise.allSettled([promises]).then(() => rooms);
}

function findRoomCoords(address: string): Promise<{[key: string]: any}> {
	// Reference: https://www.digitalocean.com/community/tutorials/how-to-create-an-http-client-with-core-http-in-node-js
	let coords = {};
	const request: Promise<{[key: string]: any}> = new Promise((resolve, reject) => {
		address = address.replace(/\s/g, "%");
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

export {getSectionField, handleSComparison, handleMComparison, addCourses, addRooms, setSections};
