import { RegisterSchema } from '@antelopejs/interface-database-decorators';
import './db';
import './routes';
import './data-api';

export function construct(): void {}

export async function start(): Promise<void> {
  await RegisterSchema('default');
}

export function destroy(): void {}

export function stop(): void {}
