class Room {
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
}

export default Room;
