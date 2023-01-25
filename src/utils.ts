import { ChecklyhqProviderOptions } from "./types";

export const makeUrl = (suffix: string, q: any, options: ChecklyhqProviderOptions) => {
  let url = options.url + suffix;
  if (q) {
    if ("string" === typeof q) {
      url += "/" + encodeURIComponent(q);
    } else if ("object" === typeof q && 0 < Object.keys(q).length) {
      url +=
      "?" +
      Object.entries(q)
      .reduce((u: any, kv: any) => (u.append(kv[0], kv[1]), u), new URLSearchParams())
      .toString();
    }
  }

  return url;
};

export const makeConfig = (seneca: any, config?: any) =>
  seneca.util.deep(
    {
      headers: {
        ...seneca.shared.headers,
      },
    },
    config
  );

export const getJSON = async (url: string, options: ChecklyhqProviderOptions, config?: any) => {
  const res = await options.fetch(url, config);

  if (200 == res.status) {
    let json: any = await res.json();
    return json;
  } else {
    let err: any = new Error("ChecklyhqProvider " + res.status);
    err.vercelResponse = res;
    throw err;
  }
};

export const postJSON = async (url: string, config: any, options: ChecklyhqProviderOptions) => {
  config.method = config.method || "post";

  config.body = "string" === typeof config.body ? config.body : JSON.stringify(config.body);

  config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";

  let res = await options.fetch(url, config);

  if (200 <= res.status && res.status < 300) {
    let json: any = await res.json();
    return json;
  } else {
    let err: any = new Error("ChecklyhqProvider " + res.status);
    try {
      err.body = await res.json();
    } catch (e: any) {
      err.body = await res.text();
    }
    err.status = res.status;
    throw err;
  }
};
