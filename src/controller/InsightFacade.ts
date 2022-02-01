import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import Section from "../model/Section";
import JSZip from "jszip";
import * as fs from "fs-extra";
// import section from "../model/Section";

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
			if (
				id.match(/_/g) !== null ||
				id.match(/^\s*$/g) !== null ||
				kind === InsightDatasetKind.Rooms ||
				(fs.existsSync("./data") && fs.readdirSync("./data").includes(id))
			) {
				throw new Error("Invalid id or kind.");
			}

			this.dataset.set(id, []);
			const jsZip = new JSZip();
			let zips = await jsZip.loadAsync(content, {base64: true});

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
							this.dataset.get(id)?.push(...jsons.result.map((e: any) => this.setSection(e)));
							// Persit to ./data
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
				if (this.dataset.get(id)?.length === 0) {
					throw new InsightError("No valid sections in dataset!");
				}
				return ids;
			});
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
		let result: InsightResult[] = [{incorrect: "result"}];
		try {
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
				// handling where clause
				let queriedData: Section[] |undefined ;
				queriedData = this.handleWhere(where);
				result = this.handleOptions(options, queriedData);
			} else {
				throw new InsightError("invalid query type");
			}
			return Promise.resolve(result);
		} catch (error) {
			throw new InsightError(error as string);
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

	private setSection(section: {[key: string]: any}): Section {
		const s: Section = new Section(
			section.Subject,
			section.Course,
			section.Avg,
			section.Professor,
			section.Title,
			section.Pass,
			section.Fail,
			section.Audit,
			section.id,
			section.Year
		);
		return s;
	}

	private getSectionField(section: {[key: string]: any}, field: string): Section {
		switch (field) {
			case "avg": {
				return section.avg;
				break;
			}
			case "pass": {
				return section.pass;
				break;
			}
			case "fail": {
				return section.fail;
				break;
			}
			case "audit": {
				return section.audit;
				break;
			}
			case "year": {
				return section.year;
				break;
			}
			case "dept": {
				return section.dept;
				break;
			}
			case "id": {
				return section.id;
				break;
			}
			case "instructor": {
				return section.instructor;
				break;
			}
			case "title": {
				return section.title;
				break;
			}
			case "uuid": {
				return section.uuid;
				break;
			}
			default: {
				throw new InsightError("Invalid field");
				break;
			}

		}
	}

	private handleWhere(clause: object): Section[] | undefined {
		let where: {[key: string]: any} = clause as {[key: string]: any};
		return this.dataset.get("courses")?.filter((obj) => {
			return this.handleWhereOperation(where, obj);
		});
	}

	private handleWhereOperation(where: {[p: string]: any}, obj: Section): boolean {
		switch (Object.keys(where)[0]) {
			case "AND": {
				return this.handleWhereOperation(where["AND"][0], obj)
					&& this.handleWhereOperation(where["AND"][1], obj);
				break;
			}
			case "OR": {
				return this.handleWhereOperation(where["OR"][0], obj)
					|| this.handleWhereOperation(where["OR"][1], obj);
				break;
			}
			case "LT": {
				let mkey: string[] = Object.keys(where["LT"])[0].split("_");
				let [idstring, mfield] = mkey;
				return this.getSectionField(obj, mfield) < where["LT"][Object.keys(where["LT"])[0]];
				break;
			}
			case "GT": {
				let mkey: string[] = Object.keys(where["GT"])[0].split("_");
				let idstring: string = mkey[0];
				let mfield: string = mkey[1];
				return this.getSectionField(obj, mfield) > where["GT"][Object.keys(where["GT"])[0]];
				break;
			}
			case "EQ": {
				let mkey: string[] = Object.keys(where["EQ"])[0].split("_");
				let idstring: string = mkey[0];
				let mfield: string = mkey[1];
				return this.getSectionField(obj, mfield) === where["EQ"][Object.keys(where["EQ"])[0]];
				break;
			}
			case "IS": {
				let mkey: string[] = Object.keys(where["IS"])[0].split("_");
				let idstring: string = mkey[0];
				let mfield: string = mkey[1];
				return this.getSectionField(obj, mfield) === where["IS"][Object.keys(where["IS"])[0]];
				break;
			}
			case "NOT": {
				return !this.handleWhereOperation(where["NOT"], obj);
				break;
			}
			default: {
				throw new InsightError("invalid filter");
				break;
			}
		}
		return false;
	}

	private handleWhereOp(where: {[p: string]: any}, op: string, obj: Section) {
		let mkey: string[] = Object.keys(where[op])[0].split("_");
		let idstring: string = mkey[0];
		let mfield: string = mkey[1];
		return this.getSectionField(obj, mfield) > where[op][Object.keys(where[op])[0]];
	}

	private handleOptions(clause: object, data: Section[] | undefined): InsightResult[] {
		let options: {[key: string]: any} = clause as {[key: string]: any};
		let columns = options["COLUMNS"];
		let order = options["ORDER"];
		if (columns === undefined || columns.length === 0) {
			throw new InsightError("No key in columns");
		}
		data?.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
		let ret: InsightResult[] = [];
		data?.forEach((sec) => {
			let obj: {[key: string]: any} = {};
			for (let key of columns) {
				let field: string = key.split("_")[1];
				obj[key] = this.getSectionField(sec,field);
			}
			ret.push(obj);
		});

		if (order) {
			if (!columns.includes(order)) {
				throw new InsightError("order not in columns");
			}

			// source:https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
			ret.sort((a,b) => (a[order] > b[order]) ? 1 : ((b[order] > a[order]) ? -1 : 0));
		}

		return ret;
	}
}
