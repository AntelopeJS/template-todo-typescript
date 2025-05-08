import { InitializeDatabaseFromSchema } from '@ajs/database-decorators/beta';
import './db';
import './routes';
import './data-api';

export function construct(): void {}

export async function start(): Promise<void> {
  await InitializeDatabaseFromSchema('default', 'default');
}

export function destroy(): void {}

export function stop(): void {}
