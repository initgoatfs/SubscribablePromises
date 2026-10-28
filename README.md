# Subscribable Promises

Easy library for dealing with JS async.

example:

```ts
import { SubscribablePromises } from './promisetest';
import { readFile } from 'node:fs/promises';

const sp = new SubscribablePromises();

sp.onceCompleted(
	sp.async(async () => {
		return await readFile('./README.md');
	}, 'fileread'),
	(rs) => {
		if (rs.status == 'rejected') throw new Error(rs.reason);
		console.log(rs.value.toString('utf-8'));
	},
);
```

## Usage

### Creating a task

```ts
const task = sp.async(async () => {
	return await fetchSomeData();
}, 'data-fetch');
```

### Subscribing to completion

```ts
sp.onceCompleted(task, (result) => {
	if (result.status === 'fulfilled') {
		console.log('Task completed:', result.value);
	} else {
		console.error('Task failed:', result.reason);
	}
});
```

### Grouping tasks by name

```ts
sp.async(async () => loadUser(), 'startup');
sp.async(async () => loadConfig(), 'startup');
sp.async(async () => initializeCache(), 'startup');
```

### Wait for promises

```ts
await sp.WaitForAllPromisesOfName('startup');
```

### Retrieve the promises associated with a name:

```ts
const promises = sp.AllPromisesOfName('startup');
```

