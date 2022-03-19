import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import chai, {expect, use, request} from "chai";
import chaiHttp from "chai-http";
import * as fs from "fs-extra";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;

	use(chaiHttp);
	chai.use(chaiHttp);

	const persistDir = "./data";

	const datasetContents = new Map<string, any>();
	const datasetsToLoad: {[key: string]: string} = {
		courses: "./test/resources/archives/courses.zip",
		rooms: "./test/resources/archives/rooms.zip",
		hasNoValidRooms: "./test/resources/archives/hasNoValidRooms.zip",
		noValidCourses: "./test/resources/archives/noValidCourses.zip"
	};

	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);

		// Resue code from InsightFacade.spec.ts
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]);
			datasetContents.set(key, content);
		}

		// TODO: start server here once and handle errors properly
		return server.start().then(() => {
			console.log("Server tests start successfully!");
		}).catch((err: Error) => {
			console.error(`Server tests failed to start: ${err.message}`);
		});
	});

	after(function () {
		// TODO: stop server here once!
		return server.stop().then(() => {
			console.log("Server tests has stopped!");
		}).catch((err: Error) => {
			console.log("Server tests failed to stop!");
		});
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what"s going on
	});

	afterEach(async function () {
		// might want to add some process logging here to keep track of what"s going on
		fs.removeSync(persistDir);
		const datasets = await facade.listDatasets();
		datasets.forEach((d) => facade.removeDataset(d.id));
	});

	it("PUT test for courses dataset", function () {
		try {
			return chai.request("http://localhost:4321")
				.put("/dataset/123/courses")
				.send(datasetContents.get("courses"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
					expect(res.body).to.have.property("result");
					expect(res.body.result).to.be.deep.equal(["123"]);
					console.log("Courses dataset with id courses added!");
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail(`Should have resolved with 200 status code: ${err.message}`);
				});
		} catch (err: any) {
			// and some more logging here!
			expect.fail(`Should have resolved with 200 status code: ${err.message}`);
		}
	});

	it("PUT test returns 400 error", function () {
		try {
			return chai.request("http://localhost:4321")
				.put("/dataset/noValidCourses/courses")
				.send(datasetContents.get("noValidCourses"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					expect(res.status).to.be.equal(400);
					expect(res.body).to.have.property("error");
					console.log("Put request rejected with 400 error");
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail(`Shouldn't have rejected with 400 status code: ${err.message}`);
				});
		} catch (err: any) {
			// and some more logging here!
			expect.fail(`Shouldn't have failed: ${err.message}`);
		}
	});

	it("DELETE request returns 200", function () {
		try {
			return chai.request("http://localhost:4321")
				.put("/dataset/courses/courses")
				.send(datasetContents.get("courses"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					expect(res.status).to.be.equal(200);
					console.log("Add a dataset for DELETE later");
					return chai.request("http://localhost:4321")
						.delete("/dataset/courses")
						.then(function (DeleteRes: ChaiHttp.Response) {
							expect(DeleteRes.status).to.be.equal(200);
							expect(DeleteRes.body).to.have.property("result");
							console.log("Courses dataset deleted!");
						})
						.catch(function (err) {
							expect.fail("Shouldn't have failed to delete courses: ", err.message);
						});
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail(`Shouldn't have rejected with 400 status code: ${err.message}`);
				});
		} catch (error: any) {
			expect.fail(`Shouldn't have rejected with 400 status code: ${error.message}`);
		}
	});

	it("DELETE request returns 404", function () {
		try {
			return chai.request("http://localhost:4321")
				.delete("/dataset/courses")
				.then(function (DeleteRes: ChaiHttp.Response) {
					expect(DeleteRes.status).to.be.equal(404);
					expect(DeleteRes.body).to.have.property("error");
					console.log("Courses dataset deleted!");
				})
				.catch(function (err) {
					expect.fail("Shouldn't have failed to delete courses: ", err.message);
				});
		} catch (error: any) {
			expect.fail(`Shouldn't have failed: ${error.message}`);
		}
	});

	it("GET request returns 200", async function () {
		try {
			await chai.request("http://localhost:4321").put("/dataset/courses/courses")
				.send(datasetContents.get("courses"))
				.set("Content-Type", "application/x-zip-compressed");
			await chai.request("http://localhost:4321").put("/dataset/courses1/courses")
				.send(datasetContents.get("courses"))
				.set("Content-Type", "application/x-zip-compressed");
			const res1: ChaiHttp.Response = await chai.request("http://localhost:4321").get("/datasets");
			expect(res1.status).to.be.equal(200);
			expect(res1.body).to.have.property("result");
			expect(res1.body.result).to.deep.equal([{id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612},
				{id: "courses1", kind: InsightDatasetKind.Courses, numRows: 64612}]);
		} catch (error: any) {
			expect.fail(`Shouldn't have failed: ${error.message}`);
		}
	});
});
