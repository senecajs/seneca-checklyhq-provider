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

    const load = await seneca.entity("provider/checklyhq/checks").load$({apiCheckUrlFilterPattern : CONFIG.CHECKLYHQ_CHECK_NAME})
    expect(null == load).toBeFalsy()

  })

  // IMPORTANT: This test creates a real project on checklyhq. There is no SandBox on checklyhq (2022-01-25).
  test('checks-basic-save', async () => {
    if (!ENV) return;
    if (!CONFIG) return;

    const seneca = await makeSeneca()

    const save = await seneca.entity("provider/checklyhq/check").save$(CONFIG.CHECKLYHQ_PROJECT_NAME)
    console.log(save)
    expect(save.id).toBeDefined()

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
      }
    })
    .use('provider', {
      provider: {
        checklyhq: {
          keys: {
            token: { value: ENV.CHECKLYHQ_TOKEN },
            checkname: { value: CONFIG.CHECKLYHQ_CHECK_NAME },
            account: { value: CONFIG.CHECKLYHQ_ACC }
          }
        }
      }
    })
    .use(ChecklyhqProvider)

  return seneca.ready()
}