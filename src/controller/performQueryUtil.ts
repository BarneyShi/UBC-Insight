import {Data} from "../model/Data";
import {InsightError, InsightResult} from "./IInsightFacade";
import Decimal from "decimal.js";

function handleWhereOperation(where: {[p: string]: any}, obj: Data, idstr: string): boolean {
	if (Object.keys(where).length === 0) {
		return true;
	} else if (Object.keys(where).length > 1) {
		throw new InsightError("where has too many filters");
	}
	switch (Object.keys(where)[0]) {
		case "AND": {
			return handleLogicComparison("AND", where, obj, idstr);
		}
		case "OR": {
			return handleLogicComparison("OR", where, obj, idstr);
		}
		case "LT": {
			return obj.handleMComparison("LT", where, idstr);
		}
		case "GT": {
			return obj.handleMComparison("GT", where, idstr);
		}
		case "EQ": {
			return obj.handleMComparison("EQ", where, idstr);
		}
		case "IS": {
			return obj.handleSComparison(where, idstr);
		}
		case "NOT": {
			return !handleWhereOperation(where["NOT"], obj, idstr);
		}
		default: {
			throw new InsightError("invalid filter");
		}
	}
}

function handleLogicComparison(logicOp: string, where: {[p: string]: any}, obj: Data, idstr: string) {
	let result: boolean;
	// source: https://stackoverflow.com/questions/24403732/how-to-check-if-array-is-empty-or-does-not-exist
	if (!Array.isArray(where[logicOp]) || !where[logicOp].length) {
		throw new InsightError("Logic has <1 filter");
	}
	if (logicOp === "AND") {
		result = true;
		for (let filter of where[logicOp]) {
			result &&= handleWhereOperation(filter, obj, idstr);
		}
	} else {
		result = false;
		for (let filter of where[logicOp]) {
			result ||= handleWhereOperation(filter, obj, idstr);
		}
	}
	return result;
}

function handleOrder(options: {[p: string]: any}, order: any, columns: any, ret: InsightResult[]) {
	if ((Object.keys(options).length === 2) && order != null) {
		if (typeof order === "object") {
			let dir = order["dir"];
			let keys = order["keys"];
			if (dir == null || keys == null || Object.keys(order).length !== 2) {
				throw new InsightError("incorrect order keys");
			}
			if (!Array.isArray(keys) || !keys.length) {
				throw new InsightError("No key in group");
			}
			// check that all order keys are in columns
			// source: https://stackoverflow.com/questions/38811421/how-to-check-if-an-array-is-a-subset-of-another-array-in-javascript
			if (!(keys.every((val) => columns.includes(val)))) {
				throw new InsightError("order keys not in columns");
			}
			if (dir === "UP") {
				for (let kee of keys.reverse()) {
					// source:https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value

					ret.sort((a, b) => (a[kee] > b[kee]) ? 1 : ((b[kee] > a[kee]) ? -1 : 0));
				}
			} else if (dir === "DOWN") {
				for (let kee of keys.reverse()) {
					ret.sort((a, b) => (a[kee] < b[kee]) ? 1 : ((b[kee] < a[kee]) ? -1 : 0));
				}
			} else {
				throw new InsightError("incorrect direction");
			}
		} else if (columns.includes(order)) {
			ret.sort((a, b) => (a[order] > b[order]) ? 1 : ((b[order] > a[order]) ? -1 : 0));
		} else {
			throw new InsightError("order not in columns");
		}
	} else if (Object.keys(options).length > 1) {
		throw new InsightError("Invalid keys in options");
	}
}

function handleColumns<S, U, This, A, D>(
	transformations: object, transform: {[p: string]: any}, columns: any,
	data: InsightResult[] | undefined, idstr: string) {
	let ret: InsightResult[] = [];
	if (transformations != null) {
		let groupKeys = transform["GROUP"];
		let applyKeys = Object.keys(Object.assign({}, ...transform["APPLY"]));
		for (let key of columns) {
			if (!(groupKeys.includes(key) || applyKeys.includes(key))) {
				throw new InsightError("Keys in COLUMNS must be" +
					" in GROUP or APPLY when TRANSFORMATIONS is present");
			}
		}
		data?.forEach((dat) => {
			let obj: {[key: string]: any} = {};
			for (let key of columns) {
				obj[key] = dat[key];
			}
			ret.push(obj);
		});
	} else {
		data?.forEach((sec) => {
			let obj: {[key: string]: any} = {};
			for (let key of columns) {
				let [idstring, field] = key.split("_");
				if (idstring !== idstr) {
					throw new InsightError("references multiple datasets");
				}
				let dat: Data = sec as unknown as Data;
				obj[key] = dat.getSectionField(field);
			}
			ret.push(obj);
		});
	}
	return ret;
}


function handleApply(apply: any[] | {[p: string]: any}, groupedData: Data, group: any, idstring: string) {
	let ret: InsightResult[] = [];
	// check for duplicates
	// source: https://stackoverflow.com/questions/7376598/in-javascript-how-do-i-check-if-an-array-has-duplicate-values
	let applyKeys = [...apply.map((o: {[x: string]: any;}) => Object.keys(o)[0])];
	if (new Set(applyKeys).size !== applyKeys.length) {
		throw new InsightError("Duplicate apply keys");
	}
	for (let [key, value] of Object.entries(groupedData)) {
		let newObj: {[key: string]: any} = {};
		// let keyArr: string[] = key.split("-");
		for (let item of group) {
			newObj[item] = value[0].getSectionField(item.split("_")[1]);
		}
		apply.forEach((obj: object) => {
			if (Object.keys(obj).length !== 1) {
				throw new InsightError("Apply rule should have 1 key");
			}
			newObj[Object.keys(obj)[0]] = handleApplyOp(obj, value, idstring);
		});
		ret.push(newObj);
	}
	return ret;
}

function handleGroup(group: any, idstring: string, queriedData: Data[]) {
	let idstr: string[] = [...group.map((o: string) => o.split("_")[0])];
	if (!(idstr.every((val) => val === idstring))) {
		throw new InsightError("References multiple datasets in group");
	}
	let fieldsArr: string[] = [...group.map((o: string) => o.split("_")[1])];

	// source: https://stackoverflow.com/questions/40774697/how-can-i-group-an-array-of-objects-by-key
	let groupedData = queriedData.reduce(function (r, a) {
		let fields: number | string = a.getSectionField(fieldsArr[0]);
		for (let f of fieldsArr.slice(1)) {
			fields += "-" + a.getSectionField(f);
		}
		r[fields] = r[fields] || [];
		r[fields].push(a);
		return r;
	}, Object.create(null));
	return groupedData;
}

function handleApplyOp(obj: object, value: any, idstring: string): string | number {
	let inobj = Object.values(obj)[0];
	if (Object.keys(inobj).length !== 1) {
		throw new InsightError("apply body should have 1 key");
	}
	let op = Object.keys(inobj)[0];
	let [idstr, field] = (Object.values(inobj)[0] as string).split("_");
	if (idstr !== idstring) {
		throw new InsightError("references multiple datasets in apply rule");
	}
	field = "_" + field;
	switch (op) {
		case "MAX": {
			if (!(value.every((dat: Data) => typeof dat.getSectionField(field.substring(1)) === "number"))) {
				throw new InsightError("invalid key type in apply operation");
			}
			return Math.max(...value.map((dat: Data) => dat.getSectionField(field.substring(1))));
		}
		case "MIN": {
			if (!(value.every((dat: Data) => typeof dat.getSectionField(field.substring(1)) === "number"))) {
				throw new InsightError("invalid key type in apply operation");
			}
			return Math.min(...value.map((dat: Data) => dat.getSectionField(field.substring(1))));
		}
		case "AVG": {
			if (!(value.every((dat: Data) => typeof dat.getSectionField(field.substring(1)) === "number"))) {
				throw new InsightError("invalid key type in apply operation");
			}
			return calcAvg([...value.map((dat: Data) => dat.getSectionField(field.substring(1)))]);
		}
		case "SUM": {
			if (!(value.every((dat: Data) => typeof dat.getSectionField(field.substring(1)) === "number"))) {
				throw new InsightError("invalid key type in apply operation");
			}
			let sumOf = [...value.map((dat: Data) => dat.getSectionField(field.substring(1)))]
				.reduce((sum: any, a: any) => sum + a, 0);
			return Number(sumOf.toFixed(2));
		}
		case "COUNT": {
			return new Set([...value.map((dat: Data) => dat.getSectionField(field.substring(1)))]).size;
		}
		default: {
			throw new InsightError("Invalid apply rule");
		}
	}
}

function calcAvg(param: number[]): number {
	let total = new Decimal(0);
	let dec = new Decimal(0);
	for (let val of param) {
		dec = new Decimal(val);
		total = Decimal.add(total,val);
	}
	let avg = total.toNumber() / param.length;
	return Number(avg.toFixed(2));
}

function correctType(val: string, smkey: any): number | string {
	let field: string = smkey.split("_")[1];
	switch (field) {
		case "avg": {return Number(val);}
		case "pass": {return Number(val);}
		case "fail": {return Number(val);}
		case "audit": {return Number(val);}
		case "year": {return Number(val);}
		case "dept": {return val;}
		case "id": {return val;}
		case "instructor": {return val;}
		case "title": {return val;}
		case "uuid": {return val;}
		case "fullname": {return val;}
		case "shortname": {return val;}
		case "number": {return val;}
		case "name": {return val;}
		case "address": {return val;}
		case "lat": {return Number(val);}
		case "lon": {return Number(val);}
		case "seats": {return Number(val);}
		case "type": {return val;}
		case "furniture": {return val;}
		case "href": {return val;}
		default: {throw new InsightError("Should be unreachable");}
	}
}

export {handleWhereOperation, handleLogicComparison,
	handleOrder, handleColumns, handleApply, handleApplyOp, handleGroup, calcAvg, correctType};
