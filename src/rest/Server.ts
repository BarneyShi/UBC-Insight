import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightResult, NotFoundError} from "../controller/IInsightFacade";
import {initInMemoryDatasets} from "../controller/initDatasetUtil";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private insightFacade: InsightFacade;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.insightFacade = new InsightFacade();

		this.registerMiddleware();
		this.registerRoutes();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		this.express.use(express.static("./frontend/public"));
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		// Init in memory dataset in case the server got shut down unexpectedly.
		initInMemoryDatasets(this.insightFacade.dataset, this.insightFacade.roomDataset);
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express.listen(this.port, () => {
					console.info(`Server::start() - server listening on port: ${this.port}`);
					resolve();
				}).on("error", (err: Error) => {
					// catches errors in server start
					console.error(`Server::start() - server ERROR: ${err.message}`);
					reject(err);
				});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);

		this.express.put("/dataset/:id/:kind", async (req: any, res: any) => {
			try {
				const data = req.body;
				const base64 = Buffer.from(data).toString("base64");
				const id = req.params.id;
				const kind = (req.params.kind === "rooms") ? InsightDatasetKind.Rooms : InsightDatasetKind.Courses;
				const result = await this.insightFacade.addDataset(id, base64, kind);
				res.status(200).send({result});
				console.log(`Add new ${kind} dataset ${id}`);
			} catch (error: any) {
				console.log(`Add dataset error: ${error.message}`);
				res.status(400).send({error: error.message});
			}
		});
		this.express.delete("/dataset/:id", async (req: any, res: any) => {
			try {
				const result = await this.insightFacade.removeDataset(req.params.id);
				res.status(200).send({result});
				console.log(`Delete dataset ${req.params.id}`);
			} catch (error: any) {
				if (error instanceof NotFoundError) {
					res.status(404).send({error: error.message});
				} else {
					res.status(400).send({error: error.message});
				}
			}
		});
		this.express.get("/datasets", async (req: any, res: any) => {
			try {
				const result = await this.insightFacade.listDatasets();
				res.status(200).send({result});
				console.log("List all datasets");
			} catch (error: any) {
				res.status(400).send({error: error.message});
			}
		});
		this.express.post("/query", async (req: any, res: any) => {
			try {
				const json = req.body;
				const result: InsightResult[] = await this.insightFacade.performQuery(json);
				res.status(200).send({result});
				console.log("Query");
			} catch (error: any) {
				res.status(400).send({error: error.message});
			}
		});
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}
}
