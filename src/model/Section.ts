import Room from "./Room";
import {InsightError} from "../controller/IInsightFacade";
import {Data} from "./Data";

class Section implements Data {
	private readonly _dept: string;
	private readonly _id: string;
	private readonly _avg: number;
	private readonly _instructor: string;
	private readonly _title: string;
	private readonly _pass: number;
	private readonly _fail: number;
	private readonly _audit: number;
	private readonly _uuid: string;
	private readonly _year: number;

	constructor(
		dept: string,
		id: string,
		avg: number,
		instructor: string,
		title: string,
		pass: number,
		fail: number,
		audit: number,
		uuid: string,
		year: number
	) {
		this._dept = dept;
		this._id = id;
		this._avg = avg;
		this._instructor = instructor;
		this._title = title;
		this._pass = pass;
		this._fail = fail;
		this._audit = audit;
		this._uuid = uuid;
		this._year = year;
	}

	public get dept(): string {
		return this._dept;
	}

	public get id(): string {
		return this._id;
	}

	public get avg(): number {
		return this._avg;
	}

	public get instructor(): string {
		return this._instructor;
	}

	public get title(): string {
		return this._title;
	}

	public get pass(): number {
		return this._pass;
	}

	public get fail(): number {
		return this._fail;
	}

	public get audit(): number {
		return this._audit;
	}

	public get uuid(): string {
		return this._uuid;
	}

	public get year(): number {
		return this._year;
	}

	public handleMComparison(
		mComparator: string, where: {[p: string]: any}, idstr: string) {
		let mfield: string[] = ["avg", "pass", "fail", "audit", "year"];
		let mkey: string[] = Object.keys(where[mComparator])[0].split("_");
		let [idstring, field] = mkey;
		if (idstring !== idstr) {
			throw new InsightError("references multiple datasets");
		}
		if (!(typeof where[mComparator][Object.keys(where[mComparator])[0]] === "number")) {
			throw new InsightError("invalid mcomparator type");
		}
		if (!mfield.includes(field)) {
			throw new InsightError("not an mfield");
		}
		if (mComparator === "GT") {
			return this.getSectionField(field) > where[mComparator][Object.keys(where[mComparator])[0]];
		} else if (mComparator === "LT") {
			return this.getSectionField(field) < where[mComparator][Object.keys(where[mComparator])[0]];
		} else {
			return this.getSectionField(field) === where[mComparator][Object.keys(where[mComparator])[0]];
		}
	}

	public handleSComparison(where: {[p: string]: any}, idstr: string) {
		let sfield: string[] = ["dept", "id", "instructor", "title", "uuid"];
		let mkey: string[] = Object.keys(where["IS"])[0].split("_");
		let [idstring, field] = mkey;
		if (idstring !== idstr) {
			throw new InsightError("references multiple datasets");
		}
		let strMatch: string = where["IS"][Object.keys(where["IS"])[0]];
		if (strMatch == null) {
			throw new InsightError("invalid skey type");
		}
		if (!sfield.includes(field)) {
			throw new InsightError("not an mfield");
		}
		if ((strMatch.match(/\*/g) || []).length > 2 ||
			(strMatch.includes("*") && !strMatch.split("*").includes(""))) {
			throw new InsightError("asterisk issues");
		}
		let regMatch = new RegExp("^" + strMatch.replace(/\*/g, ".*") + "$");
		return regMatch.test(this.getSectionField(field).toString());
	}


	// public groupDataHelper(r: Section, groupKey: string): Section {
	// 	{
	// 		r.getSectionField(this.getSectionField(groupKey)) = r[this.getSectionField(groupKey)] || [];
	// 		r[this.getSectionField(groupKey)].push(this);
	// 		return r;
	// 	}, Object.create(null));
	// }


	public getSectionField(field: string): number | string {
		switch (field) {
			case "avg": {
				return this.avg;
			}
			case "pass": {
				return this.pass;
			}
			case "fail": {
				return this.fail;
			}
			case "audit": {
				return this.audit;
			}
			case "year": {
				return Number(this.year);
			}
			case "dept": {
				return this.dept;
			}
			case "id": {
				return this.id;
			}
			case "instructor": {
				return this.instructor;
			}
			case "title": {
				return this.title;
			}
			case "uuid": {
				return this.uuid.toString();
			}
			default: {
				throw new InsightError("Invalid field");
			}
		}
	}
}

export default Section;
