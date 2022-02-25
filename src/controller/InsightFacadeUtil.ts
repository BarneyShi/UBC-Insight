
import Section from "../model/Section";
import {InsightError} from "./IInsightFacade";
import Room from "../model/Room";

// function handleMComparison(
// 	mComparator: string, where: {[p: string]: any}, idstr: string, obj: Section | Room) {
// 	let mfield: string[] = ["avg", "pass", "fail", "audit", "year"];
// 	// let room_mfield: string[] = ["lat", "lon", "seats"];
// 	let mkey: string[] = Object.keys(where[mComparator])[0].split("_");
// 	let [idstring, field] = mkey;
// 	if (idstring !== idstr) {
// 		throw new InsightError("references multiple datasets");
// 	}
// 	if (!(typeof where[mComparator][Object.keys(where[mComparator])[0]] === "number")) {
// 		throw new InsightError("invalid mcomparator type");
// 	}
// 	if (!mfield.includes(field)) {
// 		throw new InsightError("not an mfield");
// 	}
// 	if (mComparator === "GT") {
// 		return getSectionField(obj, field) > where[mComparator][Object.keys(where[mComparator])[0]];
// 	} else if (mComparator === "LT") {
// 		return getSectionField(obj, field) < where[mComparator][Object.keys(where[mComparator])[0]];
// 	} else {
// 		return getSectionField(obj, field) === where[mComparator][Object.keys(where[mComparator])[0]];
// 	}
// }


// function handleSComparison(where: {[p: string]: any}, idstr: string, obj: Section | Room) {
// 	let sfield: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname", "number",
// 		"name", "address", "type", "furniture", "href"];
// 	let mkey: string[] = Object.keys(where["IS"])[0].split("_");
// 	let [idstring, field] = mkey;
// 	if (idstring !== idstr) {
// 		throw new InsightError("references multiple datasets");
// 	}
// 	let strMatch: string = where["IS"][Object.keys(where["IS"])[0]];
// 	if (strMatch == null) {
// 		throw new InsightError("invalid skey type");
// 	}
// 	if (!sfield.includes(field)) {
// 		throw new InsightError("not an mfield");
// 	}
// 	if ((strMatch.match(/\*/g) || []).length > 2 ||
// 		(strMatch.includes("*") && !strMatch.split("*").includes(""))) {
// 		throw new InsightError("asterisk issues");
// 	}
// 	let regMatch = new RegExp("^" + strMatch.replace(/\*/g, ".*") + "$");
// 	return regMatch.test(getSectionField(obj, field).toString());
// }

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

export {getSectionField};
