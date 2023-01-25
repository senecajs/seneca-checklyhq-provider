
// IMPORTANT: assumes node-fetch@2
const Fetch = require('node-fetch')

const Seneca = require('seneca')

// global.fetch = Fetch


Seneca({ legacy: false })
  .test()
  .use('promisify')
  .use('entity')
  .use('env', {
    // debug: true,
    file: [__dirname + '/local-env.js;?'],
    var: {
      $CHECKLYHQ_TOKEN: String,
      $CHECKLYHQ_CHECK_NAME: String,
      $CHECKLYHQ_ACC: String,
    }
  })
  .use('provider', {
    provider: {
      checklyhq: {
        keys: {
          token: { value: '$CHECKLYHQ_TOKEN' },
          checkname: { value: '$CHECKLYHQ_CHECK_NAME' },
          account: { value: '$CHECKLYHQ_ACC' },
        }
      }
    }
  })
  .use('../',)
  .ready(async function() {
    const seneca = this

    console.log(await seneca.post('sys:provider,provider:checklyhq,get:info'))

    try {
      order = await order.save$()
      console.log('order',order)
    }
    catch(e) {
      console.log(e.message)
      console.log(e.status)
      console.log(e.body)
    }

  })

