import {InsightError} from "../controller/IInsightFacade";
import {Data} from "./Data";

class Room implements Data {
	private readonly _fullname: string;
	private readonly _shortname: string;
	private readonly _number: string;
	private readonly _name: string;
	private readonly _address: string;
	private readonly _lat: number;
	private readonly _lon: number;
	private readonly _seats: number;
	private readonly _type: string;
	private readonly _furniture: string;
	private readonly _href: string;

	constructor(
		fullname: string,
		shortname: string,
		number: string,
		address: string,
		lat: number,
		lon: number,
		seats: number,
		type: string,
		furniture: string,
		href: string
	) {
		this._fullname = fullname;
		this._shortname = shortname;
		this._number = number;
		this._name = shortname + "_" + number;
		this._address = address;
		this._lat = lat;
		this._lon = lon;
		this._seats = seats;
		this._type = type;
		this._furniture = furniture;
		this._href = href;
	}

	public get fullname(): string {
		return this._fullname;
	}

	public get shortname(): string {
		return this._shortname;
	}

	public get number(): string {
		return this._number;
	}

	public get name(): string {
		return this._name;
	}

	public get address(): string {
		return this._address;
	}

	public get lat(): number {
		return this._lat;
	}

	public get lon(): number {
		return this._lon;
	}

	public get seats(): number {
		return this._seats;
	}

	public get type(): string {
		return this._type;
	}

	public get furniture(): string {
		return this._furniture;
	}

	public get href(): string {
		return this._href;
	}


	public handleMComparison(
		mComparator: string, where: {[p: string]: any}, idstr: string) {
		let mfield: string[] = ["lat", "lon", "seats"];
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
		let sfield: string[] = ["fullname", "shortname", "number",
			"name", "address", "type", "furniture", "href"];
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

	public getSectionField(field: string): number | string {
		switch (field) {
			case "fullname": {
				return this.fullname;
			}
			case "shortname": {
				return this.shortname;
			}
			case "number": {
				return this.number;
			}
			case "name": {
				return this.name;
			}
			case "address": {
				return this.address;
			}
			case "lat": {
				return this.lat;
			}
			case "lon": {
				return this.lon;
			}
			case "seats": {
				return this.seats;
			}
			case "type": {
				return this.type;
			}
			case "furniture": {
				return this.furniture;
			}
			case "href": {
				return this.href;
			}
			default: {
				throw new InsightError("Invalid field");
			}
		}
	}
}

export default Room;
