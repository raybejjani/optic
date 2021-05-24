import * as fs from 'fs';

import { getPathsRelativeToConfig } from '@useoptic/cli-config';
import { CaptureSaver } from './capture-saver';

// ingestShapehash reads in a jsonl file of shapehash encoded as json. It saves
// each entry as a synthetic interaction with persistenceManager.
// Note: It should be able to handle streams and can be called async while the
// UI is running.
export async function ingestShapehash(inFile: string, captureId: string) {
  let interactionCount = 0;

  let {
    capturesPath: capturesBaseDirectory,
    opticIgnorePath,
    configPath,
  } = await getPathsRelativeToConfig();

  const captureSaver = new CaptureSaver({
    captureBaseDirectory: capturesBaseDirectory,
    captureId,
  });
  await captureSaver.init();

  let s = fs.createReadStream(inFile);
  return new Promise((resolve, reject) => {
    s.on('error', function (err) {
      reject(`Cannot read shapeshash file/stream: ${err}`);
    });

    s.on('end', function () {
      resolve(interactionCount);
    });

    let leftoverChunk: string;
    s.on('data', (chunk) => {
      // Append to the previous data in case we had a leftover line-part
      leftoverChunk += chunk.toString();

      // Iterate over "lines" -> objects -> sample, the format we use internally
      const split = chunk.toString().split(/\r?\n/);
      for (let line of split) {
        // If a line doesn't end with a closed object, keep it around.
        if (!line.endsWith('}')) {
          leftoverChunk = line;
          return;
        }

        const parsedJson = JSON.parse(line);
        const entry = parsedJson.log.entries[0];
        const sample = {
          tags: [],
          uuid: captureId,
          request: {
            host: 'FML: hostname',
            method: entry.method || 'UNK',
            path: '/it/works',
            headers: {
              asJsonString: null,
              asText: null,
              shapeHashV1Base64: null,
            },
            query: {
              asJsonString: null,
              asText: null,
              shapeHashV1Base64: null,
            },
            body: {
              contentType: null,
              value: {
                asText: null,
                asJsonString: null,
                shapeHashV1Base64: null,
              },
            },
          },
          response: {
            statusCode: 200,
            headers: {
              shapeHashV1Base64: null,
              asJsonString: null,
              asText: null,
            },
            body: {
              contentType: null,
              value: {
                asText: null,
                asJsonString: null,
                shapeHashV1Base64: null,
              },
            },
          },
        };

        captureSaver.save(sample);
        interactionCount++;
      }
    });
  });
}

// TODO: Use something like
//   private extractQueryParameters(req)
//   private extractBody(req)
// from workspaces/cli-shared/src/httptoolkit-capturing-proxy.ts

/**
 * Sample shapehash encoding of a scoop.Har from scarf
 *
 *{
  "log": {
    "browser": {
      "comment": "string",
      "name": "string",
      "version": "string"
    },
    "creator": {
      "name": "string",
      "version": "string"
    },
    "entries": [
      {
        "cache": {},
        "pageref": "string",
        "request": {
          "bodySize": 1,
          "cookies": [],
          "headers": [
            {
              "name": "string",
              "value": "string"
            },
            {
              "name": "string",
              "value": "string"
            },
            {
              "name": "string",
              "value": "string"
            },
            {
              "name": "string",
              "value": "string"
            },
            {
              "name": "string",
              "value": "string"
            }
          ],
          "headersSize": 1,
          "httpVersion": "string",
          "method": "string",
          "postData": {
            "encoding": "string",
            "mimeType": "string",
            "text": "string"
          },
          "queryString": [],
          "url": "string"
        },
        "response": {
          "bodySize": 1,
          "content": {
            "encoding": "string",
            "mimeType": "string",
            "size": 1,
            "text": "string"
          },
          "cookies": [],
          "headers": [
            {
              "name": "string",
              "value": "string"
            },
            {
              "name": "string",
              "value": "string"
            },
            {
              "name": "string",
              "value": "string"
            },
            {
              "name": "string",
              "value": "string"
            },
            {
              "name": "string",
              "value": "string"
            },
            {
              "name": "string",
              "value": "string"
            },
            {
              "name": "string",
              "value": "string"
            }
          ],
          "headersSize": 1,
          "httpVersion": "string",
          "redirectURL": "string",
          "status": 1,
          "statusText": "string"
        },
        "serverIPAddress": "string",
        "startedDateTime": "string",
        "time": 1,
        "timings": {
          "receive": 1,
          "send": 1,
          "wait": 1
        }
      }
    ],
    "pages": [
      {
        "id": "string",
        "pageTimings": {},
        "startedDateTime": "string",
        "title": "string"
      }
    ],
    "version": "string"
  }
}
**/
