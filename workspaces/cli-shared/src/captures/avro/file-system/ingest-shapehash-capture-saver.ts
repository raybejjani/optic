import * as fs from 'fs';
import url from 'url';

import { getPathsRelativeToConfig } from '@useoptic/cli-config';
import { CaptureSaver } from './capture-saver';
import { DefaultQueryParser } from '../../../query/parsers/query-string/DefaultQueryParser';
import { IQueryParser } from '../../../query/query-parser-interfaces';
import { IArbitraryData } from '../../../optic-types';
//@ts-ignore
import { toBytes } from '@useoptic/shape-hash';
import { developerDebugLogger } from '../../../index';

// ingestShapehash reads in a jsonl file of shapehash encoded as json. It saves
// each entry as a synthetic interaction with persistenceManager.
// Note: It should be able to handle streams and can be called async while the
// UI is running.
export async function ingestShapehash(inFile: string, captureId: string) {
  let interactionCount = 0;
  let queryParser = new DefaultQueryParser();

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

        const entry = JSON.parse(line);
        developerDebugLogger('saw entry', { entry });
        const parsedUrl = url.parse(entry.url);

        const sample = {
          tags: [],
          uuid: captureId,
          request: {
            host: parsedUrl.host || '',
            method: entry.request.method,
            path: parsedUrl.pathname || '',
            headers: {
              asJsonString: null,
              asText: null,
              shapeHashV1Base64: null,
            },
            query: extractQueryParameters(entry.url, queryParser),
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

        developerDebugLogger('saving', { sample });
        captureSaver.save(sample);
        interactionCount++;
      }
    });
  });
}

function extractQueryParameters(
  rawUrl: string,
  queryParser: IQueryParser
): IArbitraryData {
  const rawQuery = url.parse(rawUrl).query;
  developerDebugLogger('extracting query params', { rawQuery });

  if (rawQuery) {
    const jsonLikeValue = queryParser.parse(rawQuery);
    return {
      asJsonString: JSON.stringify(jsonLikeValue),
      asText: rawQuery,
      shapeHashV1Base64:
        jsonLikeValue && toBytes(jsonLikeValue).toString('base64'),
    };
  } else {
    return {
      asJsonString: null,
      asText: null,
      shapeHashV1Base64: null,
    };
  }
}

// TODO: Use something like
//   private extractQueryParameters(req)
//   private extractBody(req)
// from workspaces/cli-shared/src/httptoolkit-capturing-proxy.ts

/**
 * Sample shapehash encoding of reuest/response from from scarf
 *
{
  "request": {
    "body": {
      "encoding": "string",
      "mimeType": "string",
      "text": "string"
    },
    "headers": [
      {
        "name": "Host",
        "value": "httpbin.org"
      },
      {
        "name": "User-Agent",
        "value": "curl/7.64.1"
      },
      {
        "name": "Accept",
        "value": "* /*"
      },
      {
        "name": "Content-Length",
        "value": "7"
      },
      {
        "name": "Content-Type",
        "value": "application/x-www-form-urlencoded"
      }
    ],
    "method": "PUT",
    "query": [
      {
        "name": "a",
        "value": "4"
      }
    ]
  },
  "response": {
    "body": {
      "encoding": "string",
      "mimeType": "string",
      "size": 1,
      "text": "string"
    },
    "headers": [
      {
        "name": "Date",
        "value": "Tue, 25 May 2021 16:38:54 GMT"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      },
      {
        "name": "Content-Length",
        "value": "443"
      },
      {
        "name": "Connection",
        "value": "keep-alive"
      },
      {
        "name": "Server",
        "value": "gunicorn/19.9.0"
      },
      {
        "name": "Access-Control-Allow-Origin",
        "value": "*"
      },
      {
        "name": "Access-Control-Allow-Credentials",
        "value": "true"
      }
    ],
    "status": 200
  },
  "tags": [],
  "url": "http://httpbin.org/put?a=4"
}
  **/
