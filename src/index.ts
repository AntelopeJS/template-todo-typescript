import { CreateDatabaseSchemaInstance } from '@antelopejs/interface-database-decorators';
import './db';
import './routes';
import './data-api';

export function construct(): void {}

export async function start(): Promise<void> {
  await CreateDatabaseSchemaInstance('default', 'default');
}

export function destroy(): void {}

export function stop(): void {}
