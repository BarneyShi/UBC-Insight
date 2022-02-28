export abstract class Data {
	public abstract handleMComparison(
		mComparator: string, where: {[p: string]: any}, idstr: string): boolean;

	public abstract getSectionField(field: string): number | string;

	public abstract handleSComparison(where: {[p: string]: any}, idstr: string): boolean;
}
