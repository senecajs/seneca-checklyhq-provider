/* Copyright © 2022 Seneca Project Contributors, MIT License. */
import { ChecklyhqProviderOptions } from './types'
import { getJSON, makeConfig, makeUrl, postJSON } from './utils'

const Pkg = require('../package.json')

function ChecklyhqProvider(this: any, options: ChecklyhqProviderOptions) {
  const seneca: any = this

  const entityBuilder = this.export('provider/entityBuilder')

  seneca.message('sys:provider,provider:checklyhq,get:info', get_info)

  async function get_info(this: any, _msg: any) {
    return {
      ok: true,
      name: 'checklyhq',
      version: Pkg.version,
      mark: 'checklyhq-provider',
    }
  }

  entityBuilder(this, {
    provider: {
      name: 'checklyhq'
    },
    entity: {
      checks: {
        cmd: {
          list: {
            action: async function(this: any, entize: any, msg: any) {
              const res: any = await getJSON(makeUrl('checks', msg.q, options), options, makeConfig(this))
              let checks = res
              let list = checks.map((data: any) => entize(data))
              
              return list
            },
          },
          load: {
            action: async function(this: any, entize: any, msg: any) {
              const res: any = await getJSON(makeUrl('checks', msg.q, options), options, makeConfig(this))
              let load = res ? entize(res) : null

              return load
            },
          },
          save: {
            action: async function(this: any, entize: any, msg: any) {
              const body = this.util.deep(
                options.entity.checks.save,
                msg.ent.data$(false)
                )
              console.log(options)
              console.log(body)

              const res: any = await postJSON(makeUrl('checks/api', msg.q, options), makeConfig(this,{
                body
              }), options)

              const project = res
              return entize(project)
            },
          }
        }
      }
    }
  })



  seneca.prepare(async function(this: any) {
    let res = await this.post('sys:provider,get:keymap,provider:checklyhq')

    if (!res.ok) {
      throw this.fail('keymap')
    }

    const auth = res.keymap.token.value

    this.shared.headers = {
      Authorization: 'Bearer ' + auth,
      "X-Checkly-Account": res.keymap.account.value
    }

    // this.shared.primary = { 
    //   name: res.keymap.checkname.value,
    // }

  })


  return {
    exports: {
      makeUrl,
      makeConfig,
      getJSON,
      postJSON,
    }
  }
}


// Default options.
const defaults: ChecklyhqProviderOptions = {

  // Vercel checks API Endpoint /
  url: 'https://api.checklyhq.com/v1/',
  
  // Use global fetch by default - if exists
  fetch: ('undefined' === typeof fetch ? undefined : fetch),

  entity: {
    checks: {
      save: {
        // Default fields
      }
    }
  },

  // TODO: Enable debug logging
  debug: false
}


Object.assign(ChecklyhqProvider, { defaults })

export default ChecklyhqProvider

if ('undefined' !== typeof (module)) {
  module.exports = ChecklyhqProvider
}
