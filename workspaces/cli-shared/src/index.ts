import {
  getPathsRelativeToConfig,
  IApiCliConfig,
  IIgnoreRunnable,
  InvalidOpticConfigurationSyntaxError,
  IOpticTaskRunnerConfig,
  OpticConfigurationLocationFailure,
  readApiConfig,
} from '@useoptic/cli-config';
////////////////////////////////////////////////////////////////////////////////
import { Command } from '@oclif/command';

export { Command };
////////////////////////////////////////////////////////////////////////////////

export { Client as SaasClient } from './saas-client';

////////////////////////////////////////////////////////////////////////////////
export { CommandAndProxySessionManager } from './command-and-proxy-session-manager';
export { CommandSession } from './command-session';
export { HttpToolkitCapturingProxy } from './httptoolkit-capturing-proxy';
////////////////////////////////////////////////////////////////////////////////

import { developerDebugLogger, userDebugLogger } from './logger';
import { colors, fromOptic, promiseFromOptic } from './conversation';

export { developerDebugLogger, userDebugLogger, promiseFromOptic };

////////////////////////////////////////////////////////////////////////////////

export interface ICaptureManifest {
  samples: IHttpInteraction[];
}

export interface ICaptureLoader {
  load(): Promise<ICaptureManifest>;

  loadWithFilter(filter: IIgnoreRunnable): Promise<ICaptureManifest>;
}

export interface ICaptureSaver {
  init(): Promise<void>;

  save(sample: IHttpInteraction): Promise<void>;

  cleanup(): Promise<void>;
}

////////////////////////////////////////////////////////////////////////////////

export interface ICliDaemonState {
  port: number;
  pid: number;
}

export function makeUiBaseUrl(daemonState: ICliDaemonState) {
  if (process.env.OPTIC_UI_HOST) {
    return process.env.OPTIC_UI_HOST;
  }
  return `http://localhost:${daemonState.port}`;
}

////////////////////////////////////////////////////////////////////////////////

export interface IOpticTaskRunner {
  foundDiff: boolean;
  run(
    cli: Command,
    cliConfig: IApiCliConfig,
    taskConfig: IOpticTaskRunnerConfig,
    commandToRunWhenStarted?: string
  ): Promise<void>;
}

////////////////////////////////////////////////////////////////////////////////
export { CaptureSaver as SaasCaptureSaver } from './captures/avro/saas/capture-saver';
export { CaptureSaver as FileSystemAvroCaptureSaver } from './captures/avro/file-system/capture-saver';
export { CaptureLoader as FileSystemAvroCaptureLoader } from './captures/avro/file-system/capture-loader';
export { ShapehashReader } from './captures/avro/file-system/shapehash-reader';
////////////////////////////////////////////////////////////////////////////////
export { fromOptic, errorFromOptic, warningFromOptic } from './conversation';

////////////////////////////////////////////////////////////////////////////////

export async function loadPathsAndConfig(cli: Command) {
  try {
    const paths = await getPathsRelativeToConfig();
    const config = await readApiConfig(paths.configPath);
    return {
      paths,
      config,
    };
  } catch (e) {
    userDebugLogger(e);
    if (e instanceof OpticConfigurationLocationFailure) {
      cli.log(
        fromOptic(
          `No Optic project found in this directory. Learn to add Optic to your project here ${colors.underline(
            'https://www.useoptic.com/docs/'
          )}`
        )
      );
    } else if (e instanceof InvalidOpticConfigurationSyntaxError) {
      cli.log(fromOptic(`The contents of optic.yml are not valid YAML`));
    }
    return await cleanupAndExit();
  }
}

export function cleanupAndExit(code: number = 0) {
  return process.exit(code);
}

////////////////////////////////////////////////////////////////////////////////
export async function delay(milliseconds: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, milliseconds);
  });
}

////////////////////////////////////////////////////////////////////////////////

import * as uuid from 'uuid';
import { IHttpInteraction } from './optic-types';

export interface IdGenerator<T> {
  nextId(): T;
}

export class DefaultIdGenerator implements IdGenerator<string> {
  nextId() {
    return uuid.v4();
  }
}

////////////////////////////////////////////////////////////////////////////////

export {
  create as createCliConfig,
  CliConfigObject,
  Env,
  isEnvTrue,
  isEnvFalse,
  PackageJson,
} from './config';
