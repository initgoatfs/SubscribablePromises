import EventEmitter from 'node:events';

/**
 * Represents the result of a promise execution
 * @template T - The type of the resolved value
 */

type PromiseResult<T> =
	| { status: 'fulfilled'; value: T }
	| { status: 'rejected'; reason: any };

/**
 * Represents a promise event with a symbol identifier
 * @template T - The type of the resolved value
 */

type PromiseEvent<T> = {
	symbol: symbol;
	__resultType?: T;
};

/**
 * Represents a previous promise with its state and promise object
 */

interface PreviousPromise {
	state: 'done' | 'waiting';
	promise: Promise<unknown>;
}


/**
 * A class for managing subscribable promises with event-based notifications
 */
export class SubscribablePromises {
	private readonly emitter = new EventEmitter();
	private readonly previousPromises = new Map<symbol, PreviousPromise>();

	constructor() {}

	/**
	 * Registers a one-time listener for when a promise completes
	 * @param event - The promise event to listen to
	 * @param listener - The callback function to execute when the promise completes
	 * @returns This instance for chaining
	 */
	public onceCompleted<T>(
		event: PromiseEvent<T>,
		listener: (result: PromiseResult<T>) => void,
	): this {
		this.emitter.once(event.symbol, listener);
		return this;
	}

	/**
	 * Emits a promise result event
	 * @param event - The symbol identifying the event
	 * @param output - The result of the promise execution
	 * @returns This instance for chaining
	 */
	private emit<T>(event: symbol, output: PromiseResult<T>): this {
		this.emitter.emit(event, output);
		return this;
	}

	/**
	 * Creates and executes a promise, returning an event identifier
	 * @param promise - A function that returns a promise
	 * @param name - Optional name for the promise (used for grouping)
	 * @returns An object containing the symbol identifier for this promise
	 */
	public async<T>(
		promise: () => Promise<T>,
		name?: string | number,
	): PromiseEvent<T> {
		const sym = Symbol(name);

		this.waitpromise(promise, sym);

		return { symbol: sym };
	}

	/**
	 * Executes a promise and handles its result using event emission
	 * @param promiseFunc - A function that returns a promise
	 * @param sym - The symbol identifier for this promise
	 */
	private async waitpromise<T>(
		promiseFunc: () => Promise<T>,
		sym: symbol,
	): Promise<void> {
		const promise = promiseFunc();
		
		// Store the promise in previousPromises map
		this.previousPromises.set(sym, { state: 'waiting', promise });
		
		try {
			const value = await promise;
			this.emit(sym, { status: 'fulfilled', value });
		} catch (reason) {
			this.emit(sym, { status: 'rejected', reason });
		}
	}

	/**
	 * Waits for all promises with a specific name to complete
	 * @param name - The name of the promises to wait for
	 * @returns A promise that resolves when all matching promises have completed
	 */
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

	/**
	 * Gets all promises with a specific name
	 * @param name - The name of the promises to retrieve
	 * @returns An array of promises with the specified name
	 */
	public AllPromisesOfName(name: string | number): Promise<unknown>[] {
		const describedPromises = [...this.previousPromises.entries()].filter(
			([sym]) =>
				sym.description !== undefined &&
				sym.description === name.toString(),
		);

		return describedPromises.map((v) => v[1].promise);
	}
}