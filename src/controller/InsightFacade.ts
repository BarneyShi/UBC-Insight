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
// import section from "../model/Section";
import {getSectionField, handleSComparison, handleMComparison, addCourses, addRooms} from "./InsightFacadeUtil";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private dataset: Map<string, Section[]>;

	constructor() {
		this.dataset = new Map<string, Section[]>();
		console.log("InsightFacadeImpl::init()");
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		try {
			this.checkDatasetID(id);

			this.dataset.set(id, []);
			const jsZip = new JSZip();
			let zips = await jsZip.loadAsync(content, {base64: true});

			if (kind === InsightDatasetKind.Courses) {
				const courses = await addCourses(id, zips, this.dataset);
				return courses;
			} else {
				const rooms = await addRooms(id, zips, this.dataset);
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
		this.dataset.delete(id);
		return fs.remove(`./data/${id}`).then(() => id);
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		try {
			let result: InsightResult[] = [{incorrect: "result"}];
			if (typeof query === "object") {
				if (query == null) {
					throw new InsightError("query is null or undefined");
				}
				let queryCast: {[key: string]: any} = query as {[key: string]: any};
				let where = queryCast["WHERE"];
				let options = queryCast["OPTIONS"];
				if (where == null || options == null || Object.keys(queryCast).length !== 2) {
					throw new InsightError("incorrect first level keys");
				}
				// get id string
				// works because columns must be non-empty array
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
				// handling where clause
				let queriedData: Section[] | undefined;
				queriedData = this.handleWhere(where, idstring);
				if (queriedData == null) {
					throw new InsightError("queriedData is null");
				}
				result = this.handleOptions(options, queriedData, idstring);
			} else {
				throw new InsightError("invalid query type");
			}
			return Promise.resolve(result);
		} catch (error) {
			if (error instanceof ResultTooLargeError) {
				throw new ResultTooLargeError("result is too large");
			} else if (error instanceof InsightError) {
				throw new InsightError("string for now");
			} else {
				throw new InsightError("Uncaught error");
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

	private handleWhere(clause: object, idstring: string): Section[] | undefined {
		let where: {[key: string]: any} = clause as {[key: string]: any};
		return this.dataset.get(idstring)?.filter((obj) => {
			return this.handleWhereOperation(where, obj, idstring);
		});
	}

	private handleWhereOperation(where: {[p: string]: any}, obj: Section, idstr: string): boolean {
		let mfield: string[] = ["avg", "pass", "fail", "audit", "year"];
		let sfield: string[] = ["dept", "id", "instructor", "title", "uuid"];
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
				return handleMComparison("LT", where, idstr, mfield, obj);
			}
			case "GT": {
				return handleMComparison("GT", where, idstr, mfield, obj);
			}
			case "EQ": {
				return handleMComparison("EQ", where, idstr, mfield, obj);
			}
			case "IS": {
				return handleSComparison(where, idstr, sfield, obj);
			}
			case "NOT": {
				return !this.handleWhereOperation(where["NOT"], obj, idstr);
			}
			default: {
				throw new InsightError("invalid filter");
			}
		}
	}

	private handleLogicComparison(logicOp: string, where: {[p: string]: any}, obj: Section, idstr: string) {
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

	private handleOptions(clause: object, data: Section[], idstr: string): InsightResult[] {
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
				obj[key] = getSectionField(sec,field);
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
}
