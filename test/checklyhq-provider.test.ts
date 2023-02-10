/* Copyright © 2022 Seneca Project Contributors, MIT License. */

import * as Fs from 'fs'

const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')

import ChecklyhqProvider from '../src/checklyhq-provider'
import ChecklyhqProviderDoc from '../src/ChecklyhqProvider-doc'

const BasicMessages = require('./basic.messages.js')

// Only run some tests locally (not on Github Actions).
const ENV: any = {}
const CONFIG: any = {}

// Get env vars from local-env.js.
if (Fs.existsSync(__dirname + '/local-env.js')) {
  Object.assign(ENV, require(__dirname + '/local-env.js'))
}
// Get CONFIGS from local-config.js.
if (Fs.existsSync(__dirname + '/local-config.js')) {
  Object.assign(CONFIG, require(__dirname + '/local-config.js'))
}


describe('checklyhq-provider', () => {

  test('happy', async () => {
    expect(ChecklyhqProvider).toBeDefined()
    expect(ChecklyhqProviderDoc).toBeDefined()

    const seneca = await makeSeneca()

    expect(await seneca.post('sys:provider,provider:checklyhq,get:info'))
      .toMatchObject({
        ok: true,
        name: 'checklyhq',
      })

  })


  test('messages', async () => {
    const seneca = await makeSeneca()
    await (SenecaMsgTest(seneca, BasicMessages)())
  })


  test('checks-basic-list', async () => {
    if (!ENV) return;

    const seneca = await makeSeneca()

    const list = await seneca.entity("provider/checklyhq/checks").list$()
    expect(list.length > 0).toBeTruthy()

  })

  test('checks-basic-load', async () => {
    if (!ENV) return;
    if (!CONFIG) return;

    const seneca = await makeSeneca()

    const load = await seneca.entity("provider/checklyhq/checks").load$(CONFIG.CHECKLYHQ_CHECK_ID)
    expect(null == load).toBeFalsy()

  })

  test('checks-basic-save-remove', async () => {
    if (!ENV) return;
    if (!CONFIG) return;

    const seneca = await makeSeneca()

    const senecaEntity = await seneca.entity("provider/checklyhq/checks")

    //These three properties are required to create a check
    senecaEntity.name = CONFIG.CHECKLYHQ_CHECK_NAME
    senecaEntity.request = CONFIG.CHECKLYHQ_CHECK_REQUEST
    senecaEntity.locations = CONFIG.CHECKLYHQ_CHECK_LOCATIONS

    const save = await senecaEntity.save$()
    expect(save.id).toBeDefined()

    const remove = await seneca.entity("provider/checklyhq/checks").remove$(save.id)
    expect(remove.type === 'invalid-json').toBeTruthy()

  })

})


async function makeSeneca() {
  const seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity')
    .use('env', {
      // debug: true,
      file: [__dirname + '/local-env.js;?'],
      var: {
        $CHECKLYHQ_TOKEN: String,
        $CHECKLYHQ_ACCID: String,
      }
    })
    .use('provider', {
      provider: {
        checklyhq: {
          keys: {
            token: { value: ENV.CHECKLYHQ_TOKEN },
            account_id: { value: ENV.CHECKLYHQ_ACCID },
          }
        }
      }
    })
    .use(ChecklyhqProvider)

  return seneca.ready()
}