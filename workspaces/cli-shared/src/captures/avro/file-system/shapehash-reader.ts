import * as fs from 'fs';

import { ICaptureSaver } from '../../../index';

export class ShapehashReader {
  constructor(private persistenceManager: ICaptureSaver) {}

  async run(inFile: string): Promise<Buffer> {
    let s = fs.createReadStream(inFile);
    return new Promise((resolve, reject) => {
      s.on('error', function (err) {
        console.log(`FML saw error: ${err}`);
        reject(err);
      });

      s.on('end', function () {
        console.log('FML saw end');
        resolve();
      });

      let leftoverChunk: string;
      s.on('data', (chunk) => {
        console.log(`FML saw chunk: ||${chunk.toString()}||`);
        console.log(`FML saw chunk`);
        // Append to the previous data
        leftoverChunk += chunk.toString();

        // Iterate over "lines" -> objects
        const split = chunk.toString().split(/\r?\n/);
        console.log(`FML saw split: ${split}`);
        for (let line of split) {
          console.log(`FML saw line: ${line}`);
          // If a line doesn't end with a closed object, keep it around.
          if (!line.endsWith('}')) {
            leftoverChunk = line;
            return;
          }

          const parsed = JSON.parse(line);
          const entry = parsed.log.entries[0];
          const sample = {
            tags: [],
            uuid: '1',
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

          this.persistenceManager.save(sample);
        }
      });
    });
  }

  //private extractQueryParameters(req) {
  //  const rawQuery = url_1.default.parse(req.url).query;
  //  index_1.developerDebugLogger('extracting query params', { rawQuery });
  //  if (rawQuery) {
  //    const jsonLikeValue = this.config.queryParser.parse(rawQuery);
  //    return {
  //      asJsonString: this.config.flags.includeQueryString
  //        ? JSON.stringify(jsonLikeValue)
  //        : null,
  //      asText: this.config.flags.includeQueryString ? rawQuery : null,
  //      shapeHashV1Base64:
  //        jsonLikeValue &&
  //        shape_hash_1.toBytes(jsonLikeValue).toString('base64'),
  //    };
  //  } else {
  //    return {
  //      asJsonString: null,
  //      asText: null,
  //      shapeHashV1Base64: null,
  //    };
  //  }
  //}

  //private extractBody(req) {
  //  if (req.headers['content-type'] || req.headers['transfer-encoding']) {
  //    const contentType = whatwg_mimetype_1.default.parse(
  //      req.headers['content-type'] || ''
  //    );
  //    const json = req.body.json || null;
  //    index_1.developerDebugLogger(
  //      json && shape_hash_1.toBytes(json).toString('base64')
  //    );
  //    return {
  //      contentType:
  //        (req.body.text &&
  //          (contentType === null || contentType === void 0
  //            ? void 0
  //            : contentType.essence)) ||
  //        null,
  //      value: {
  //        shapeHashV1Base64:
  //          this.config.flags.includeShapeHash && json
  //            ? shape_hash_1.toBytes(json).toString('base64')
  //            : null,
  //        asJsonString:
  //          this.config.flags.includeJsonBody && json
  //            ? JSON.stringify(json)
  //            : null,
  //        asText:
  //          this.config.flags.includeTextBody && json
  //            ? null
  //            : req.body.text || null,
  //      },
  //    };
  //  }
  //  return {
  //    contentType: null,
  //    value: {
  //      asText: null,
  //      asJsonString: null,
  //      shapeHashV1Base64: null,
  //    },
  //  };
  //}
}

/**
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
