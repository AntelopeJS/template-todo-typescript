import { EventProxy } from '.';
export declare namespace Events {
  /**
   * Event triggers when a module is constructed.
   *
   * @param module Module ID
   */
  const ModuleConstructed: EventProxy<(module: string) => void>;
  /**
   * Event triggers when a module is started.
   *
   * @param module Module ID
   */
  const ModuleStarted: EventProxy<(module: string) => void>;
  /**
   * Event triggers when a module is stopped.
   *
   * @param module Module ID
   */
  const ModuleStopped: EventProxy<(module: string) => void>;
  /**
   * Event triggers when a module is destroyed.
   *
   * @param module Module ID
   */
  const ModuleDestroyed: EventProxy<(module: string) => void>;
}
export interface ModuleDefinition {
  source: {
    type: string;
  } & Record<string, any>;
  config?: unknown;
  importOverrides?: Record<string, string[]>;
  disabledExports?: string[];
}
export type ModuleInfo = Required<ModuleDefinition> & {
  status: 'loaded' | 'constructed' | 'active' | 'unknown';
  localPath: string;
};
/**
 * List all loaded modules.
 *
 * @returns Module ID list
 */
export declare const ListModules: () => Promise<string[]>;
/**
 * Retrieve the configuration of a loaded module.
 *
 * @param module Module ID
 * @returns Configuration
 */
export declare const GetModuleInfo: (module: string) => Promise<ModuleInfo>;
/**
 * Load a new module with the given ID and configuration.
 *
 * @param module Module ID
 * @param configuration Module configuration
 * @param autostart Start immediately when loaded
 */
export declare const LoadModule: (
  module: string,
  configuration: ModuleDefinition,
  autostart?: boolean | undefined,
) => Promise<void>;
/**
 * Start a loaded module.
 *
 * @param module Module ID
 */
export declare const StartModule: (module: string) => Promise<void>;
/**
 * Stop a running module.
 *
 * @param module Module ID
 */
export declare const StopModule: (module: string) => Promise<void>;
/**
 * Destroy a stopped module.
 *
 * @param module Module ID
 */
export declare const DestroyModule: (module: string) => Promise<void>;
/**
 * Unload a module and retrigger its source mechanism.
 *
 * @param module Module ID
 */
export declare const ReloadModule: (module: string) => Promise<void>;
