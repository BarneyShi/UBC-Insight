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
import {Data} from "../model/Data";
import Decimal from "decimal.js";
import {handleApply, handleColumns, handleGroup, handleOrder, handleWhereOperation} from "./performQueryUtil";
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
				if (transformations == null) {
					if (Object.keys(queryCast).length !== 2) {
						throw new InsightError("incorrect number of first lvl keys");
					}
				} else {
					if (Object.keys(queryCast).length !== 3) {
						throw new InsightError("incorrect number of first lvl keys");
					}
				}
				// handling each key
				let idstring: string = this.getIdString(transformations, options);
				let queriedData: Data[] | undefined;
				queriedData = this.handleWhere(where, idstring);
				if (queriedData == null) {
					throw new InsightError("queriedData is null");
				}
				let transformedData: InsightResult[] | undefined;
				transformedData = this.handleTransformations(transformations, queriedData, idstring);
				result = this.handleOptions(options, transformedData, idstring, transformations);
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
			if (fs.existsSync(`./data/${key}`)) {
				const d: InsightDataset = {id: key, kind: InsightDatasetKind.Courses, numRows: val.length};
				res.push(d);
			} else {
				this.dataset.delete(key);
			}
		}
		for (const [key, val] of this.roomDataset) {
			if (fs.existsSync(`./data/${key}`)) {
				const d: InsightDataset = {id: key, kind: InsightDatasetKind.Rooms, numRows: val.length};
				res.push(d);
			} else {
				this.dataset.delete(key);
			}
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

	// get id string: works because columns must be non-empty array
	// if transformations !null, then group must be non-empty array
	private getIdString(transformations: {[x: string]: any;} | null, options: {[x: string]: string[];}): string {
		let idstring: string;
		if (transformations == null) {
			if (options["COLUMNS"] == null) {
				throw new InsightError("no columns");
			}
			if ((options["COLUMNS"][0].match(/_/g) || []).length !== 1) {
				throw new InsightError("incorrect number of underscores");
			}
			idstring = options["COLUMNS"][0].split("_")[0];
			if (idstring == null || idstring === "" || /\s/g.test(idstring)) {
				throw new InsightError("invalid idstring");
			}
		} else {
			let group = transformations["GROUP"];
			if (group == null) {
				throw new InsightError("incorrect transformation keys");
			}
			if (!Array.isArray(group) || !group.length) {
				throw new InsightError("No key in group");
			}
			idstring = group[0].split("_")[0];
			if (idstring == null || idstring === "" || /\s/g.test(idstring)) {
				throw new InsightError("invalid idstring");
			}
		}
		return idstring;
	}

	private handleWhere(clause: object, idstring: string): Data[] | undefined {
		let where: {[key: string]: any} = clause as {[key: string]: any};
		if (this.dataset.get(idstring)) {
			return this.dataset.get(idstring)?.filter((obj) => {
				return handleWhereOperation(where, obj, idstring);
			});
		} else if (this.roomDataset.get(idstring)) {
			return this.roomDataset.get(idstring)?.filter((obj) => {
				return handleWhereOperation(where, obj, idstring);
			});
		}
		return undefined;
	}

	private handleOptions(
		clause: object, data: InsightResult[] | undefined, idstr: string, transformations: object): InsightResult[] {
		// define options and transformations keys
		let options: {[key: string]: any} = clause as {[key: string]: any};
		let transform: {[key: string]: any} = transformations as {[key: string]: any};
		let columns = options["COLUMNS"];
		let order = options["ORDER"];
		// source: https://stackoverflow.com/questions/24403732/how-to-check-if-array-is-empty-or-does-not-exist
		if (!Array.isArray(columns) || !columns.length) {
			throw new InsightError("No key in columns");
		}
		let ret = handleColumns(transformations, transform, columns, data, idstr);
		handleOrder(options, order, columns, ret);
		if (ret.length > 5000) {
			throw new ResultTooLargeError("TooLarge");
		}
		return ret;
	}

	private handleTransformations(clause: any, queriedData: Data[], idstring: string): InsightResult[] | undefined {
		if (clause == null) {
			return queriedData as unknown as InsightResult[];
		}
		let transformations: {[key: string]: any} = clause as {[key: string]: any};
		// define transformation keys
		let group = transformations["GROUP"];
		let apply: {[key: string]: any} = transformations["APPLY"] as {[key: string]: any};
		if (group == null || apply == null || Object.keys(transformations).length !== 2) {
			throw new InsightError("incorrect transformation keys");
		}
		if (!Array.isArray(group) || !group.length) {
			throw new InsightError("No key in group");
		}
		if (!Array.isArray(apply)) {
			throw new InsightError("apply not an array");
		}
		let groupedData = handleGroup(group, idstring, queriedData);
		let ret = handleApply(apply, groupedData, group, idstring);
		return ret;
	}
}
