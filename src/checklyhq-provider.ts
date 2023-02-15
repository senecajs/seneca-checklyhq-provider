/* Copyright © 2022 Seneca Project Contributors, MIT License. */
import fetch from "node-fetch";

const Pkg = require("../package.json");

type ChecklyhqProviderOptions = {
  url: string;
  fetch?: any;
  debug: boolean;
};

function ChecklyhqProvider(this: any, options: ChecklyhqProviderOptions) {
  const seneca: any = this;

  const makeUtils = this.export("provider/makeUtils");

  const { makeUrl, getJSON, postJSON, deleteJSON, entityBuilder } = makeUtils({
    name: "checklyhq",
    url: options.url,
  });

  seneca.message("sys:provider,provider:checklyhq,get:info", get_info);

  const makeConfig = (config?: any) =>
    seneca.util.deep(
      {
        headers: {
          ...seneca.shared.headers,
        },
      },
      config
    );

  async function get_info(this: any, _msg: any) {
    return {
      ok: true,
      name: "checklyhq",
      version: Pkg.version,
      mark: "checklyhq-provider",
    };
  }

  entityBuilder(this, {
    provider: {
      name: "checklyhq",
    },
    entity: {
      checks: {
        cmd: {
          list: {
            action: async function (this: any, entize: any, msg: any) {
              const res: any = await getJSON(makeUrl("checks", msg.q), makeConfig());
              const checks = [...res];
              const list = checks.map((data: any) => entize(data));

              return list;
            },
          },
          load: {
            action: async function (this: any, entize: any, msg: any) {
              const res: any = await getJSON(makeUrl("checks", msg.q.id), makeConfig());
              const load = res ? entize(res) : null;

              return load;
            },
          },
          save: {
            action: async function (this: any, entize: any, msg: any) {
              //These three properties are required to create a check
              const body = { name: msg.ent.name, request: msg.ent.request, locations: msg.ent.locations };
              const res: any = await postJSON(makeUrl("checks/api", msg.q), makeConfig({ body }));
              const save = res ? entize(res) : null;

              return entize(save);
            },
          },
          remove: {
            action: async function (this: any, entize: any, msg: any) {
              const res: any = await deleteJSON(makeUrl("checks", msg.q.id), makeConfig());
              const remove = res ? entize(res) : null;

              return entize(remove);
            },
          },
        },
      },
    },
  });

  seneca.prepare(async function (this: any) {
    let res = await this.post("sys:provider,get:keymap,provider:checklyhq");

    if (!res.ok) {
      throw this.fail("keymap");
    }

    const auth = res.keymap.token.value;

    this.shared.headers = {
      Authorization: "Bearer " + auth,
      "X-Checkly-Account": res.keymap.account_id.value,
    };
  });
}

// Default options.
const defaults: ChecklyhqProviderOptions = {
  // Checkly checks API Endpoint /
  url: "https://api.checklyhq.com/v1/",

  // Use global fetch by default - if exists
  fetch: "undefined" === typeof fetch ? undefined : fetch,

  // TODO: Enable debug logging
  debug: false,
};

Object.assign(ChecklyhqProvider, { defaults });

export default ChecklyhqProvider;

if ("undefined" !== typeof module) {
  module.exports = ChecklyhqProvider;
}
