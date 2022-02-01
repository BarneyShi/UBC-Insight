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
				if (where == null || options == null) {
					throw new InsightError("no WHERE or no OPTIONS");
				}
				// handling where clause
				this.handleWhere(where);
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

	private getSectionMfield(section: {[key: string]: any}, mfield: string): Section {
		switch (mfield) {
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
			default: {
				throw new InsightError("Invalid mfield");
				break;
			}

		}
	}

	private handleWhere(clause: object): any {
		let where: {[key: string]: any} = clause as {[key: string]: any};
		let filter: any;
		switch (Object.keys(where)[0]) {
			case "AND": {
				break;
			}
			case "OR": {
				break;
			}
			case "LT": {
				break;
			}
			case "GT": {
				let mkey: string[] = Object.keys(where["GT"])[0].split("_");
				let idstring: string = mkey[0];
				let mfield: string = mkey[1];
				let queriedData = this.dataset.get(idstring)?.filter((obj) => {
					return this.getSectionMfield(obj,mfield) > where["GT"][Object.keys(where["GT"])[0]];
				});
				break;
			}
			case "EQ": {
				break;
			}
			case "IS": {
				break;
			}
			case "NOT": {
				break;
			}
			default: {
				throw new InsightError("invalid filter");
				break;
			}
		}
		return null;
	}
}
