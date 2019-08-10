import { Command, flags } from '@oclif/command'
import * as fs from 'fs-extra'
import * as clipboardy from 'clipboardy'
// @ts-ignore
import * as niceTry from 'nice-try'
import * as path from 'path'
// @ts-ignore
import cli from 'cli-ux'
import * as fetch from 'node-fetch'
import { getPaths } from '../Paths'
import { prepareEvents } from '../PersistUtils'
import * as yaml from 'js-yaml'
import analytics from '../lib/analytics'

export interface IApiCliProxyConfig {
  target: string
  port: number
}
export interface IApiCliCommandsConfig {
  start: string
}
export interface IApiCliConfig {
  name: string
  proxy: IApiCliProxyConfig
  commands: IApiCliCommandsConfig
}

export default class Init extends Command {

  static description = 'add Optic to your API'

  static flags = {
    paste: flags.boolean({}),
    import: flags.string(),
  }

  static args = []

  async run() {
    const { flags } = this.parse(Init)
    if (flags.paste) {
      analytics.track('init from web')
      await this.webImport()
    } else if (flags.import) {
      analytics.track('init from local oas')
      await this.importOas(flags.import)
    } else {
      analytics.track('init blank')
      await this.blankWithName()
    }
    const {basePath} = await getPaths()

    this.log('\n')
    this.log(`API Spec successfully added to ${basePath} !`)
    this.log(` - Run 'api start' to run your API.`)
    this.log(` - Run 'api spec' to view and edit the specification`)
  }

  async blankWithName() {
    const name = await cli.prompt('What is the name of this API?')
    analytics.track('init setup name', {name})
    const command = await cli.prompt('What command is used to start the API? (e.g. npm start)', {default: 'npm start'})
    analytics.track('init setup command', {command})
    const proxyTarget = await cli.prompt('API server location (e.g. http://localhost:3000)', {default: 'http://localhost:3000'})
    analytics.track('init setup proxyTarget', {proxyTarget})
    const proxyPort = 30333
    this.log('Optic is setup!')
    const config: IApiCliConfig = {
      name,
      commands: {
        start: command
      },
      proxy: {
        target: proxyTarget,
        port: proxyPort
      }
    }
    const events = [
      { APINamed: { name } }
    ]
    this.createFileTree(events, config)
  }

  webImport() {
    const events = niceTry(() => {
      const clipboardContents = clipboardy.readSync()
      const parsedJson = JSON.parse(clipboardContents)
      if (Array.isArray(parsedJson) && parsedJson.every(i => typeof i === 'object')) {
        return parsedJson
      }
    })
    if (!events) {
      this.error('Website state not found in clipboard. Press "Copy State" on the webapp.')
    }
    this.createFileTree(events)
  }

  async createFileTree(events: any[], config?: IApiCliConfig) {
    const {readmePath, specStorePath, configPath, gitignorePath} = await getPaths()
    const readmeContents = await fs.readFile(path.join(__dirname, '../../resources/docs-readme.md'))
    const files = [
      {
        path: gitignorePath,
        contents: `
sessions/
`
      },
      {
        path: specStorePath,
        contents: prepareEvents(events)
      },
      {
        path: readmePath,
        contents: readmeContents
      }
    ]
    if (config) {
      files.push({
        path: configPath,
        contents: yaml.safeDump(config)
      })
    }
    files.forEach(async (file) => {
      await fs.ensureFile(file.path)
      await fs.writeFile(file.path, file.contents)
    })
  }

  async importOas(oasFilePath: string) {

    const absolutePath = path.resolve(oasFilePath)
    const fileContents = niceTry(() => fs.readFileSync(absolutePath).toString())
    if (!fileContents) {
      return this.error(`No OpenAPI file found at ${absolutePath}`)
    }

    cli.action.start('Parsing OpenAPI file (this takes a few seconds)')

    // @ts-ignore
    const response = await fetch('https://ayiz1s0f8f.execute-api.us-east-2.amazonaws.com/production/oas/coversion/events', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({fileContents})
    });

    cli.action.stop()

    if (response.status === 200) {
      const events = await response.json()
      return await this.createFileTree(events)
    } else {
      return this.error(`OAS parse error` + await response.text())
    }

  }
}
