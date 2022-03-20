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
		noValidCourses: "./test/resources/archives/noValidCourses.zip",
	};

	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);

		// Resue code from InsightFacade.spec.ts
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]);
			datasetContents.set(key, content);
		}

		return server
			.start()
			.then(() => {
				console.log("Server tests start successfully!");
			})
			.catch((err: Error) => {
				console.error(`Server tests failed to start: ${err.message}`);
			});
	});

	after(function () {
		// Clean persistDir once.
		fs.removeSync(persistDir);
		return server
			.stop()
			.then(() => {
				console.log("Server tests has stopped!");
			})
			.catch((err: Error) => {
				console.log("Server tests failed to stop!");
			});
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what"s going on
	});

	afterEach(async function () {
		// might want to add some process logging here to keep track of what"s going on
	});

	it("PUT test for courses dataset", async function () {
		try {
			const res: ChaiHttp.Response = await chai
				.request("http://localhost:4321")
				.put("/dataset/courses/courses")
				.send(datasetContents.get("courses"))
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property("result");
			expect(res.body.result).to.be.deep.equal(["courses"]);
			console.log("Courses dataset with id courses added!");
		} catch (err: any) {
			// and some more logging here!
			expect.fail(`Should have resolved with 200 status code: ${err.message}`);
		}
	});

	it("PUT test for room dataset", async function () {
		try {
			const res: ChaiHttp.Response = await chai
				.request("http://localhost:4321")
				.put("/dataset/rooms/rooms")
				.send(datasetContents.get("rooms"))
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property("result");
			expect(res.body.result).to.be.deep.members(["rooms", "courses"]);
			console.log("Rooms dataset with id rooms added!");
		} catch (err: any) {
			expect.fail(`Should have resolved with 200 status code: ${err.message}`);
		}
	});

	it("PUT test returns 400 error", function () {
		try {
			return chai
				.request("http://localhost:4321")
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

	it("DELETE request returns 200", async function () {
		try {
			const res = await chai.request("http://localhost:4321").delete("/dataset/rooms");
			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property("result");
		} catch (error: any) {
			expect.fail(`Shouldn't have rejected with 400 status code: ${error.message}`);
		}
	});

	it("DELETE request returns 404", function () {
		try {
			return chai
				.request("http://localhost:4321")
				.delete("/dataset/rooms")
				.then(function (DeleteRes: ChaiHttp.Response) {
					expect(DeleteRes.status).to.be.equal(404);
					expect(DeleteRes.body).to.have.property("error");
					console.log("Rooms dataset deleted!");
				})
				.catch(function (err) {
					expect.fail("Shouldn't have failed to delete rooms: ", err.message);
				});
		} catch (error: any) {
			expect.fail(`Shouldn't have failed: ${error.message}`);
		}
	});

	it("GET request returns 200", async function () {
		try {
			const res1: ChaiHttp.Response = await chai.request("http://localhost:4321").get("/datasets");
			expect(res1.body).to.have.property("result");
			expect(res1.body.result).to.deep.members([
				{id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612},
			]);
			expect(res1.status).to.be.equal(200);
		} catch (error: any) {
			expect.fail(`Shouldn't have failed: ${error.message}`);
		}
	});

	it("POST request returns 200 with the correct result", async function () {
		try {
			const query = {
				WHERE: {
					GT: {
						courses_avg: 99,
					},
				},
				OPTIONS: {
					COLUMNS: ["courses_dept", "courses_avg"],
					ORDER: "courses_avg",
				},
			};
			const res: ChaiHttp.Response = await chai
				.request("http://localhost:4321")
				.post("/query")
				.send(query)
				.set("Content-Type", "application/json");
			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property("result");
			expect(res.body.result).to.deep.members([
				{courses_dept: "cnps", courses_avg: 99.19},
				{courses_dept: "math", courses_avg: 99.78},
				{courses_dept: "math", courses_avg: 99.78},
			]);
		} catch (error: any) {
			expect.fail(`Shouldn't have failed: ${error.message}`);
		}
	});

	it("POST /query rejects with 400", async function () {
		try {
			const query = {};
			const res: ChaiHttp.Response = await chai
				.request("http://localhost:4321")
				.post("/query")
				.send(query)
				.set("Content-Type", "application/json");
			expect(res.status).to.be.equal(400);
			expect(res.body).to.have.property("error");
		} catch (error: any) {
			expect.fail(`Shouldn't have failed: ${error.message}`);
		}
	});
});
