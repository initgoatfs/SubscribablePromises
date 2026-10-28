import EventEmitter from 'node:events';

type PromiseResult<T> =
	| { status: 'fulfilled'; value: T }
	| { status: 'rejected'; reason: any };

type PromiseEvent<T> = {
	symbol: symbol;
	__resultType?: T;
};

interface PreviousPromise {
	state: 'done' | 'waiting';
	promise: Promise<unknown>;
}

export class SubscribablePromises {
	private readonly emitter = new EventEmitter();
	private readonly previousPromises = new Map<symbol, PreviousPromise>();

	constructor() {}

	public onceCompleted<T>(
		event: PromiseEvent<T>,
		listener: (result: PromiseResult<T>) => void,
	): this {
		this.emitter.once(event.symbol, listener);
		return this;
	}

	private emit<T>(event: symbol, output: PromiseResult<T>): this {
		this.emitter.emit(event, output);
		return this;
	}

	public async<T>(
		promise: () => Promise<T>,
		name?: string | number,
	): PromiseEvent<T> {
		const sym = Symbol(name);

		this.waitpromise(promise, sym);

		return { symbol: sym };
	}

	private async waitpromise<T>(
		promiseFunc: () => Promise<T>,
		sym: symbol,
	): Promise<void> {
		try {
			const value = await promiseFunc();
			this.emit(sym, { status: 'fulfilled', value });
		} catch (reason) {
			this.emit(sym, { status: 'rejected', reason });
		}
	}

	public async WaitForAllPromisesOfName(
		name: string | number,
	): Promise<void> {
		const describedPromises = [...this.previousPromises.entries()].filter(
			([sym]) =>
				sym.description !== undefined &&
				sym.description === name.toString(),
		);

		const waitingPromises = describedPromises.map((v) => v[1].promise);

		await Promise.all(waitingPromises);
	}

	public AllPromisesOfName(name: string | number): Promise<unknown>[] {
		const describedPromises = [...this.previousPromises.entries()].filter(
			([sym]) =>
				sym.description !== undefined &&
				sym.description === name.toString(),
		);

		return describedPromises.map((v) => v[1].promise);
	}
}
