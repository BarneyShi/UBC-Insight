import {
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import * as fs from "fs-extra";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

describe("InsightFacade", function () {
	let insightFacade: InsightFacade;

	const persistDir = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		courses: "./test/resources/archives/courses.zip",
		rooms: "./test/resources/archives/rooms.zip",
		roomsWithoutIndex: "./test/resources/archives/roomsWithoutIndex.zip",
		roomWithInvalidIndexHTML: "./test/resources/archives/roomWithInvalidIndexHTML.zip",
		hasNoValidRooms: "./test/resources/archives/hasNoValidRooms.zip",
		hasSomeInvalidRooms: "./test/resources/archives/hasSomeInvalidRooms.zip",
	};

	before(function () {
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, content);
		}
		// Just in case there is anything hanging around from a previous run
		fs.removeSync(persistDir);
	});

	// describe("Add/Remove/List Dataset", function () {
	// 	before(function () {
	// 		console.info(`Before: ${this.test?.parent?.title}`);
	// 	});
	//
	// 	beforeEach(function () {
	// 		// This section resets the insightFacade instance
	// 		// This runs before each test
	// 		console.info(`BeforeTest: ${this.currentTest?.title}`);
	// 		insightFacade = new InsightFacade();
	// 	});
	//
	// 	after(function () {
	// 		console.info(`After: ${this.test?.parent?.title}`);
	// 	});
	//
	// 	afterEach(function () {
	// 		// This section resets the data directory (removing any cached data)
	// 		// This runs after each test, which should make each test independent from the previous one
	// 		console.info(`AfterTest: ${this.currentTest?.title}`);
	// 		fs.removeSync(persistDir);
	// 	});
	//
	// 	// This is a unit test. You should create more like this!
	// 	it("Should add a valid dataset", function () {
	// 		const id: string = "courses";
	// 		const content: string = datasetContents.get("courses") ?? "";
	// 		const expected: string[] = [id];
	// 		return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).then((result: string[]) => {
	// 			expect(result).to.deep.equal(expected);
	// 		});
	// 	});
	//
	// 	it("Should fail with no index.htm", async function () {
	// 		try {
	// 			const content: string = datasetContents.get("roomsWithoutIndex") ?? "";
	// 			await insightFacade.addDataset("rooms", content, InsightDatasetKind.Rooms);
	// 			expect.fail("Should have failed!");
	// 		} catch (error) {
	// 			expect(error).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("Should add a valid ROOM dataset", function () {
	// 		const id: string = "rooms";
	// 		const content: string = datasetContents.get("rooms") ?? "";
	// 		const expected: string[] = [id];
	// 		return insightFacade.addDataset(id, content, InsightDatasetKind.Rooms).then((result: string[]) => {
	// 			expect(result).to.deep.equal(expected);
	// 		});
	// 	});
	//
	// 	it("Should add a valid ROOM and a Course dataset", async function () {
	// 		const roomContent = datasetContents.get("rooms") ?? "";
	// 		const courseContent = datasetContents.get("courses") ?? "";
	// 		await insightFacade.addDataset("rooms", roomContent, InsightDatasetKind.Rooms);
	// 		const ids = await insightFacade.addDataset("courses", courseContent, InsightDatasetKind.Courses);
	// 		expect(ids).to.have.members(["rooms", "courses"]);
	// 	});
	//
	// 	it("Should throw error when there is no index.htm", async function () {
	// 		try {
	// 			const content = datasetContents.get("roomsWithoutIndex") ?? "";
	// 			await insightFacade.addDataset("rooms", content, InsightDatasetKind.Rooms);
	// 			expect.fail("Should have thrown an error!");
	// 		} catch (error) {
	// 			expect(error).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("Should thrown error when index.htm is not a valid html", async function () {
	// 		try {
	// 			const content = datasetContents.get("roomWithInvalidIndexHTML") ?? "";
	// 			await insightFacade.addDataset("rooms", content, InsightDatasetKind.Rooms);
	// 			expect.fail("Should have thrown an error");
	// 		} catch (error) {
	// 			expect(error).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("Should throw an error with no valid rooms", async function () {
	// 		try {
	// 			const content = datasetContents.get("hasNoValidRooms") ?? "";
	// 			await insightFacade.addDataset("rooms", content, InsightDatasetKind.Rooms);
	// 			expect.fail("Should have thrown an error");
	// 		} catch (error) {
	// 			expect(error).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("Should skip invalid rooms", async function () {
	// 		const roomContent = datasetContents.get("hasSomeInvalidRooms") ?? "";
	// 		await insightFacade.addDataset("rooms", roomContent, InsightDatasetKind.Rooms);
	// 		const datasets = await insightFacade.listDatasets();
	// 		expect(datasets).to.deep.equal([{
	// 			id: "rooms",
	// 			kind: InsightDatasetKind.Rooms,
	// 			numRows: 10,
	// 		}]);
	// 	});
	//
	// 	it("Should remove dataset", async function () {
	// 		const roomContent = datasetContents.get("rooms") ?? "";
	// 		await insightFacade.addDataset("rooms", roomContent, InsightDatasetKind.Rooms);
	// 		const dataset = await insightFacade.listDatasets();
	// 		expect(dataset).to.deep.equal([{
	// 			id: "rooms",
	// 			kind: InsightDatasetKind.Rooms,
	// 			numRows: 364,
	// 		}]);
	// 		await insightFacade.removeDataset("rooms");
	// 		const dataset2 = await insightFacade.listDatasets();
	// 		expect(dataset2).to.deep.equal([]);
	// 	});
	// });

	/*
	 * This test suite dynamically generates tests from the JSON files in test/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			insightFacade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				insightFacade.addDataset("courses", datasetContents.get("courses") ?? "", InsightDatasetKind.Courses),
				insightFacade.addDataset("rooms",datasetContents.get("rooms") ?? "", InsightDatasetKind.Rooms)
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.removeSync(persistDir);
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => insightFacade.performQuery(input),
			"./test/resources/newQueries",
			{
				// assertOnResult(actual, expected) {
				// 	expect(actual).to.have.deep.members(expected);
				// 	expect(actual).to.have.same.length(expected.length);
				// },
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError(actual, expected) {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect(actual).to.be.instanceof(InsightError);
					}
				},
			}
		);
	});
	// describe("List Datasets", function () {
	// 	let facade: IInsightFacade = new InsightFacade();
	// 	let courses = getContentFromArchives("courses.zip");
	// 	beforeEach(function () {
	// 		fs.removeSync(persistDir);
	// 		facade = new InsightFacade();
	// 	});
	//
	// 	it("should list no datasets", function () {
	// 		return facade.listDatasets().then((insightDatasets) => {
	// 			expect(insightDatasets).to.deep.equal([]);
	// 		});
	// 	});
	//
	// 	it("should list one dataset", function () {
	// 		// add a dataset
	// 		return facade
	// 			.addDataset("courses", courses, InsightDatasetKind.Courses)
	// 			.then((addedIds) => facade.listDatasets())
	// 			.then((insightDatasets) => {
	// 				expect(insightDatasets).to.deep.equal([
	// 					{
	// 						id: "courses",
	// 						kind: InsightDatasetKind.Courses,
	// 						numRows: 64612,
	// 					},
	// 				]);
	// 			});
	// 	});
	//
	// 	it("Should list one rooms dataset", async function() {
	// 		const roomContent = datasetContents.get("rooms") ?? "";
	// 		await facade.addDataset("rooms", roomContent, InsightDatasetKind.Rooms);
	// 		const dataset = await facade.listDatasets();
	// 		expect(dataset).to.deep.equal([{
	// 			id: "rooms",
	// 			kind: InsightDatasetKind.Rooms,
	// 			numRows: 364,
	// 		}]);
	// 	});
	//
	// 	it("should list several datasets", function () {
	// 		return facade
	// 			.addDataset("courses", courses, InsightDatasetKind.Courses)
	// 			.then(() => {
	// 				return facade.addDataset("courses-2", courses, InsightDatasetKind.Courses);
	// 			})
	// 			.then(() => {
	// 				return facade.addDataset("rooms", datasetContents.get("rooms") ?? "", InsightDatasetKind.Rooms);
	// 			})
	// 			.then(() => {
	// 				return facade.listDatasets();
	// 			})
	// 			.then((insightDatasets) => {
	// 				const expectedDatasets: InsightDataset[] = [
	// 					{
	// 						id: "courses",
	// 						kind: InsightDatasetKind.Courses,
	// 						numRows: 64612,
	// 					},
	// 					{
	// 						id: "courses-2",
	// 						kind: InsightDatasetKind.Courses,
	// 						numRows: 64612,
	// 					},
	// 					{
	// 						id: "rooms",
	// 						kind: InsightDatasetKind.Rooms,
	// 						numRows: 364,
	// 					},
	// 				];
	//
	// 				expect(insightDatasets).to.be.an.instanceof(Array);
	// 				expect(insightDatasets).to.have.deep.members(expectedDatasets);
	// 				expect(insightDatasets).to.have.length(3);
	// 			});
	// 	});
	// });
});
