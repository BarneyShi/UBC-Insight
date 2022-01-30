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
							this.dataset.get(id)?.push(...jsons.result);
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
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}
}
