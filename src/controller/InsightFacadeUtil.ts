import JSZip from "jszip";
import * as fs from "fs-extra";
import Section from "../model/Section";
import {InsightError} from "./IInsightFacade";

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
	try {
	// Check if root dir has 'courses/'
		if (!zips.files["courses/"]) {
			throw new Error("Root dir doesn't have a courses/ folder.");
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
	} catch (error) {
		throw new InsightError(error as string);
	}
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


export {getSectionField, handleSComparison, handleMComparison, addCourses, setSections};
