import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const cdnCache = new URL("../src/cdn-cache.js", import.meta.url).href;

// The source URLs are read from the environment at import time, so each case
// imports the module in a fresh process.
function routingUrl(env)
{
  const script = `
    const { ROUTING_CORE } = await import(${JSON.stringify(cdnCache)});
    process.stdout.write(ROUTING_CORE.url);
  `;
  const childEnv = { ...process.env, ...env };

  for (const key of Object.keys(childEnv))
  {
    if (childEnv[key] === undefined)
    {
      delete childEnv[key];
    }
  }

  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script],
    { encoding: "utf8", timeout: 10000, env: childEnv });

  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);

  return result.stdout;
}

test("routing core defaults to the viewer.diagrams.net CDN", function()
{
  assert.equal(routingUrl({ DRAWIO_ROUTING_URL: undefined }),
    "https://viewer.diagrams.net/js/libavoid-js/libavoid-routing.js");
});

test("DRAWIO_ROUTING_URL overrides the routing core source", function()
{
  const url = "http://localhost:8080/js/libavoid-js/libavoid-routing.js";

  assert.equal(routingUrl({ DRAWIO_ROUTING_URL: url }), url);
});
