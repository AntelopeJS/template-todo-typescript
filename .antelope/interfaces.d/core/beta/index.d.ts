import 'reflect-metadata';
import { Class } from './decorators';
interface InterfaceConnection {
  id?: string;
  path: string;
}
type Func<A extends any[] = any[], R = any> = (...args: A) => R;
/**
 * Proxy for an asynchronous function.
 *
 * Queues up calls while unattached, automatically unattaches when the source module is unloaded.
 */
export declare class AsyncProxy<T extends Func = Func, R = Awaited<ReturnType<T>>> {
  private callback?;
  private queue;
  /**
   * Attaches a callback to the proxy
   *
   * Automatically detached if the module calling this function gets unloaded and manualDetach is not set to true.
   *
   * @param callback Function to attach
   * @param manualDetach Don't detach automatically
   */
  onCall(callback: T, manualDetach?: boolean): void;
  /**
   * Manually detach the callback on this proxy.
   */
  detach(): void;
  /**
   * Call the function attached to this proxy.
   *
   * If a callback has not been attached yet, the call is queued up for later.
   */
  call(...args: Parameters<T>): Promise<R>;
  syncCall(...args: Parameters<T>): R;
}
type RegisterFunction = (id: any, ...args: any[]) => void;
type RID<T> = T extends (id: infer P, ...args: any[]) => void ? P : never;
type RArgs<T> = T extends (id: any, ...args: infer P) => void ? P : never;
/**
 * Proxy for a pair of register/unregister functions.
 */
export declare class RegisteringProxy<T extends RegisterFunction = RegisterFunction> {
  private registerCallback?;
  private unregisterCallback?;
  private registered;
  /**
   * Attaches a register callback to the proxy
   *
   * Automatically detached if the module calling this function gets unloaded and manualDetach is not set to true.
   *
   * @param callback Function to attach as the register callback
   * @param manualDetach Don't detach automatically
   */
  onRegister(callback: T, manualDetach?: boolean): void;
  /**
   * Attaches an unregister callback to the proxy
   *
   * Detached at the same time as the register callback.
   *
   * @param callback Function to attach as the unregister callback
   */
  onUnregister(callback: (id: RID<T>) => void): void;
  /**
   * Manually detach the callbacks on this proxy.
   */
  detach(): void;
  /**
   * Call the register callback attached to this proxy.
   *
   * If a callback has not been attached yet, the call is queued up for later.
   *
   * @param id Unique identifier used to unregister
   * @param args Extra arguments
   */
  register(id: RID<T>, ...args: RArgs<T>): void;
  /**
   * Call the unregister callback attached to this proxy.
   *
   * @param id Unique identifier to unregister
   */
  unregister(id: RID<T>): void;
}
type EventFunction = (...args: any[]) => void;
/**
 * Event handler list that automatically removes handlers from unloaded modules.
 */
export declare class EventProxy<T extends EventFunction = EventFunction> {
  private registered;
  constructor();
  /**
   * Call all the event handlers with the specified arguments.
   *
   * @param args Arguments
   */
  emit(...args: Parameters<T>): void;
  /**
   * Register a new handler for this event.
   *
   * @param func Handler
   */
  register(func: T): void;
  /**
   * Unregister a handler on this event.
   *
   * @param fn The handler that was passed to {@link register}
   */
  unregister(fn: T): void;
}
/**
 * Get the ID of the most recent module in the call stack.
 *
 * Used internally to automatically identify callbacks associated with module code.
 *
 * @param ignoreInterfaces Ignore interfaces in the call stack
 * @param startFrame Number of stack frames to skip
 * @returns
 */
export declare function GetResponsibleModule(ignoreInterfaces?: boolean, startFrame?: number): string | undefined;
/**
 * Get the typed metadata attached to an object.
 *
 * This function gets or creates an instance of the metadata class stored on the object under a unique symbol.
 *
 * The metadata class must export a static member `key` containing the symbol to use.
 *
 * Example:
 * ```ts
 * class Meta {
 *     public static key = Symbol();
 * }
 *
 * const obj = {};
 * const meta = GetMetadata(obj, Meta);
 * ```
 *
 * @param target Target object
 * @param meta Metadata class
 * @param inherit If creating the metadata instance, whether or not to inherit properties from the prototype of the object
 * @returns
 */
export declare function GetMetadata<T extends Record<string, any>, U extends Record<string, any>>(
  target: U,
  meta: Class<T, [U]> & {
    key: symbol;
  },
  inherit?: boolean,
): T;
/**
 * Creates an AsyncProxy callable like a regular async function.
 *
 * The underlying proxy can be acquired using the `proxy` property on the returned function.
 *
 * Used with {@link ImplementInterface} to simplify the process of writing interfaces.
 *
 * @returns Function
 */
export declare function InterfaceFunction<T extends Func = Func, R = Awaited<ReturnType<T>>>(): (
  ...args: Parameters<T>
) => Promise<R>;
export declare function SyncInterfaceFunction<T extends Func, R = ReturnType<T>>(): (...args: Parameters<T>) => R;
type InterfaceImplType<T> =
  T extends RegisteringProxy<infer P>
    ? {
        register: P;
        unregister: (id: RID<P>) => void;
      }
    : T extends EventProxy
      ? never
      : T extends (...args: any[]) => any
        ? T
        : T extends Record<string, any>
          ? InterfaceToImpl<T>
          : never;
type InterfaceToImpl<T> = T extends infer P
  ? {
      [K in keyof P]?: InterfaceImplType<P[K]>;
    }
  : never;
/**
 * Implement exported proxies in an interface using a corresponding implementation object.
 *
 * For each member of the interface, this function will attempt to implement it as follows:
 * - `RegisteringProxy`: `proxy.onRegister(implementation[key].register)` and
 *                       `proxy.onUnregister(implementation[key].unregister)`
 * - `InterfaceFunction`: `function.proxy.onCall(implementation[key])`
 * - `AsyncProxy`: `proxy.onCall(implementation[key])`
 * - `object`: `ImplementInterface(object, implementation[key])`
 *
 * Typically used with two direct `import` calls:
 * `await ImplementInterface(import('@ajs.local/...'), import('./implementations/...'));`
 *
 * @param declaration Interface object
 * @param implementation Implementation object
 */
export declare function ImplementInterface<T, T2 = InterfaceToImpl<Awaited<T>>>(
  declaration: T,
  implementation: T2 | Promise<T2>,
): Promise<{
  declaration: Awaited<T>;
  implementation: T2;
}>;
export declare function GetInterfaceInstances(interfaceID: string): InterfaceConnection[];
export declare function GetInterfaceInstance(
  interfaceID: string,
  connectionID: string,
): InterfaceConnection | undefined;
export {};
