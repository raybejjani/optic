import { Command, flags } from '@oclif/command';
import { ensureDaemonStarted } from '@useoptic/cli-server';
import { ingestShapehash } from '@useoptic/cli-shared/build/captures/avro/file-system/ingest-shapehash-capture-saver';
import { LiveTrafficIngestedWithLocalCli } from '@useoptic/analytics/lib/events/tasks';
import { lockFilePath } from '../../shared/paths';
import { Config } from '../../config';
import { cleanupAndExit, makeUiBaseUrl } from '@useoptic/cli-shared';
import { getPathsRelativeToConfig, readApiConfig } from '@useoptic/cli-config';
import { Client } from '@useoptic/cli-client';
import { trackUserEvent } from '../../shared/analytics';
import openBrowser from 'react-dev-utils/openBrowser';
import { linkToCapture } from '../../shared/ui-links';
export default class IngestShapehash extends Command {
  static description = 'Ingest a shapehash file';
  static hidden: boolean = true;

  static flags = {
    filepath: flags.string({ required: true, char: 'i' }),
    captureId: flags.string({ required: true, char: 'c' }),
  };

  async run() {
    try {
      const {
        flags: { filepath, captureId },
      } = this.parse(IngestShapehash);

      let interactionCount = await ingestShapehash(filepath, captureId);

      const daemonState = await ensureDaemonStarted(
        lockFilePath,
        Config.apiBaseUrl
      );

      const apiBaseUrl = `http://localhost:${daemonState.port}/api`;
      const paths = await getPathsRelativeToConfig();
      const cliClient = new Client(apiBaseUrl);
      const cliSession = await cliClient.findSession(paths.cwd, null, null);
      const uiBaseUrl = makeUiBaseUrl(daemonState);
      openBrowser(linkToCapture(uiBaseUrl, cliSession.session.id, captureId));

      const apiCfg = await readApiConfig(paths.configPath);

      /*
        captureId: Joi.string().required(),
        interactionCount: Joi.number().required()
      */
      await trackUserEvent(
        apiCfg.name,
        LiveTrafficIngestedWithLocalCli.withProps({
          captureId,
          interactionCount,
        })
      );

      cleanupAndExit();
    } catch (e) {
      console.log('FML');
      this.error(e);
    }
  }
}
