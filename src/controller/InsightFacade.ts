import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import Section from "../model/Section";
import JSZip from "jszip";
import * as fs from "fs-extra";
import Room from "../model/Room";
import {addCourses, addRooms} from "./addDatasetUtil";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private dataset: Map<string, Section[]>;
	private roomDataset: Map<string, Room[]>;

	constructor() {
		// TODO change name to courseDataset
		this.dataset = new Map<string, Section[]>();
		this.roomDataset = new Map<string, Room[]>();
		console.log("InsightFacadeImpl::init()");
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		try {
			this.checkDatasetID(id);

			const jsZip = new JSZip();
			let zips = await jsZip.loadAsync(content, {base64: true});

			if (kind === InsightDatasetKind.Courses) {
				this.dataset.set(id, []);
				const courses = await addCourses(id, zips, this.dataset);
				return courses;
			} else {
				const rooms = await addRooms(id, zips, this.roomDataset);
				return rooms;
			}
		} catch (error) {
			throw new InsightError(error as string);
		}
	}

	public removeDataset(id: string): Promise<string> {
		// Handle invalid id & not found error;
		if (id.match(/_/g) !== null || id.match(/^\s*$/g) !== null) {
			throw new InsightError("Invalid id.");
		}
		if (!fs.existsSync("./data") || (fs.existsSync("./data") && !fs.readdirSync("./data").includes(id))) {
			throw new NotFoundError("Dataset not found.");
		}
		if (this.dataset.has(id)) {
			this.dataset.delete(id);
		}
		if (this.roomDataset.has(id)) {
			this.roomDataset.delete(id);
		}
		return fs.remove(`./data/${id}`).then(() => id);
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		try {
			let result: InsightResult[] = [{incorrect: "result"}];
			// define query variable
			if (typeof query === "object") {
				if (query == null) {
					throw new InsightError("query is null or undefined");
				}
				let queryCast: {[key: string]: any} = query as {[key: string]: any};
				// define query 1st level keys
				let where = queryCast["WHERE"];
				let options = queryCast["OPTIONS"];
				let transformations = queryCast["TRANSFORMATIONS"];
				if (where == null || options == null) {
					throw new InsightError("no where or no options");
				}
				// if (transformations == null) {
				// 	if (Object.keys(queryCast).length !== 2) {
				// 		throw new InsightError("incorrect number of first lvl keys");
				// 	}
				// } else {
				// 	if (Object.keys(queryCast).length !== 3) {
				// 		throw new InsightError("incorrect number of first lvl keys");
				// 	}
				// }
				// get id string: works because columns must be non-empty array
				if (options["COLUMNS"] == null) {
					throw new InsightError("no columns");
				}
				if ((options["COLUMNS"][0].match(/_/g) || []).length !== 1) {
					throw new InsightError("incorrect number of underscores");
				}
				let idstring: string = options["COLUMNS"][0].split("_")[0];
				if (idstring == null || idstring === "" || /\s/g.test(idstring)) {
					throw new InsightError("invalid idstring");
				}
				// handling each key
				let queriedData: Section[] | Room[] | undefined;
				queriedData = this.handleWhere(where, idstring);
				if (queriedData == null) {
					throw new InsightError("queriedData is null");
				}
				let transformedData: Section[] | Room[] | undefined;
				// transformedData = this.handleTransformations(transformations, queriedData, idstring);
				result = this.handleOptions(options, transformedData, idstring);
			} else {
				throw new InsightError("invalid query type");
			}
			return Promise.resolve(result);
		} catch (error) {
			if (error instanceof ResultTooLargeError) {
				throw new ResultTooLargeError("result is too large");
			} else if (error instanceof InsightError) {
				throw new InsightError(error.message);
			} else {
				throw new InsightError(error as string);
			}
		}
	}

	public listDatasets(): Promise<InsightDataset[]> {
		if (!fs.existsSync("./data")) {
			return Promise.resolve([]);
		}
		let res: InsightDataset[] = [];
		for (const [key, val] of this.dataset) {
			const d: InsightDataset = {id: key, kind: InsightDatasetKind.Courses, numRows: val.length};
			res.push(d);
		}
		for (const [key, val] of this.roomDataset) {
			const d: InsightDataset = {id: key, kind: InsightDatasetKind.Rooms, numRows: val.length};
			res.push(d);
		}
		return Promise.resolve(res);
	}

	private checkDatasetID(id: string): void {
		if (
			id.match(/_/g) !== null ||
			id.match(/^\s*$/g) !== null ||
			(fs.existsSync("./data") && fs.readdirSync("./data").includes(id))
		) {
			throw new Error("Invalid id or dataset exists.");
		}
	}

	private handleWhere(clause: object, idstring: string): Section[] | Room[] | undefined {
		let where: {[key: string]: any} = clause as {[key: string]: any};
		if (this.dataset.get(idstring)) {
			return this.dataset.get(idstring)?.filter((obj) => {
				return this.handleWhereOperation(where, obj, idstring);
			});
		} else if (this.roomDataset.get(idstring)) {
			return this.roomDataset.get(idstring)?.filter((obj) => {
				return this.handleWhereOperation(where, obj, idstring);
			});
		}
		return undefined;
	}

	private handleWhereOperation(where: {[p: string]: any}, obj: Section | Room, idstr: string): boolean {
		if (Object.keys(where).length === 0) {
			return true;
		} else if (Object.keys(where).length > 1) {
			throw new InsightError("where has too many filters");
		}
		switch (Object.keys(where)[0]) {
			case "AND": {
				return this.handleLogicComparison("AND", where, obj, idstr);
			}
			case "OR": {
				return this.handleLogicComparison("OR", where, obj, idstr);
			}
			case "LT": {
				return obj.handleMComparison("LT", where, idstr);
			}
			case "GT": {
				return obj.handleMComparison("GT", where, idstr);
			}
			case "EQ": {
				return obj.handleMComparison("EQ", where, idstr);
			}
			case "IS": {
				return obj.handleSComparison(where, idstr);
			}
			case "NOT": {
				return !this.handleWhereOperation(where["NOT"], obj, idstr);
			}
			default: {
				throw new InsightError("invalid filter");
			}
		}
	}

	private handleLogicComparison(logicOp: string, where: {[p: string]: any}, obj: Section | Room, idstr: string) {
		let result: boolean;
		// source: https://stackoverflow.com/questions/24403732/how-to-check-if-array-is-empty-or-does-not-exist
		if (!Array.isArray(where[logicOp]) || !where[logicOp].length) {
			throw new InsightError("Logic has <1 filter");
		}
		if (logicOp === "AND") {
			result = true;
			for (let filter of where[logicOp]) {
				result &&= this.handleWhereOperation(filter, obj, idstr);
			}
		} else {
			result = false;
			for (let filter of where[logicOp]) {
				result ||= this.handleWhereOperation(filter, obj, idstr);
			}
		}
		return result;
	}

	private handleOptions(clause: object, data: Section[] | Room[] | undefined, idstr: string): InsightResult[] {
		let options: {[key: string]: any} = clause as {[key: string]: any};
		let columns = options["COLUMNS"];
		let order = options["ORDER"];
		// source: https://stackoverflow.com/questions/24403732/how-to-check-if-array-is-empty-or-does-not-exist
		if (!Array.isArray(columns) || !columns.length) {
			throw new InsightError("No key in columns");
		}
		let ret: InsightResult[] = [];
		data?.forEach((sec) => {
			let obj: {[key: string]: any} = {};
			for (let key of columns) {
				let [idstring, field] = key.split("_");
				if (idstring !== idstr) {
					throw new InsightError("references multiple datasets");
				}
				obj[key] = sec.getSectionField(field);
			}
			ret.push(obj);
		});
		if ((Object.keys(options).length === 2) && order != null) {
			if (!columns.includes(order)) {
				throw new InsightError("order not in columns");
			}
			// source:https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
			ret.sort((a,b) => (a[order] > b[order]) ? 1 : ((b[order] > a[order]) ? -1 : 0));
		} else if (Object.keys(options).length > 1) {
			throw new InsightError("Invalid keys in options");
		}
		if (ret.length > 5000) {
			throw new ResultTooLargeError("TooLarge");
		}
		return ret;
	}
	//
	// private handleTransformations(clause: any, queriedData: Section[], idstring: string): Section[] | Room[] | undefined {
	//
	// 	if (clause == null) {
	// 		return queriedData;
	// 	}
	// 	let transformations: {[key: string]: any} = clause as {[key: string]: any};
	//
	// 	// define transformation keys
	// 	let group = transformations["GROUP"];
	// 	let apply = transformations["APPLY"];
	// 	if (group == null || apply == null || Object.keys(transformations).length !== 2) {
	// 		throw new InsightError("incorrect transformation keys");
	// 	}
	//
	// 	if (!Array.isArray(group) || !group.length) {
	// 		throw new InsightError("No key in group");
	// 	}
	//
	// 	// source: https://stackoverflow.com/questions/40774697/how-can-i-group-an-array-of-objects-by-key
	// 	// let groupedData = queriedData.reduce(function (r, a) {
	// 	// 	r[a[]] = r[a.make] || [];
	// 	// 	r[a.make].push(a);
	// 	// 	return r;
	// 	// }, Object.create(null));
	//
	//
	// 	return queriedData;
	// }
}
