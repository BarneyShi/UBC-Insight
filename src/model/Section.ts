class Section {
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
}

export default Section;
