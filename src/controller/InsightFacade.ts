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
		if (id.match(/_/g) !== null || id.match(/^\s*$/g) !== null) {
			throw new InsightError("Invalid id!");
		}
		if (kind === InsightDatasetKind.Rooms) {
			throw new InsightError("Kind must be Course!");
		}

		// Add dataset to Map() & /data folder;
		this.dataset.set(id, []);
		const jsZip = new JSZip();
		const zips = await jsZip.loadAsync(content, {base64: true});
		let promises: Array<Promise<void>> = [];
		let ids: string[] = [];
		zips.forEach((relativePath, file) => {
			if (relativePath.match(/^courses/g) !== null) {
				const promise = file.async("text").then((data) => {
					this.dataset.get(id)?.push(...JSON.parse(data).result);
				});
				promises.push(promise);
			}
		});

		// Wait till all `file.async` have resolved in `forEach()`.
		Promise.allSettled(promises).then(() => {
			console.log("Contains" + this.dataset.get(id)?.length + "sections.");
		});
		return Promise.reject("Not implemented");
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
