#!/usr/bin/env node
/*
Auto Tagging CLI
- Calls Strapi internal service to auto-tag articles
- Supports dry run, site filtering, minScore, and optional mapping file

Usage:
  node ./scripts/auto-tag.js --site=demo1.local --dry=true --minScore=2
  node ./scripts/auto-tag.js --map=./tag-rules.json --limit=500
*/

const { createStrapi } = require('@strapi/strapi');
const path = require('path');

function getArg(name, defVal) {
  const raw = process.argv.find(a => a.startsWith(`--${name}=`));
  if (!raw) return defVal;
  const v = raw.split('=').slice(1).join('=');
  return v === undefined || v === '' ? defVal : v;
}

(async () => {
  const site = getArg('site', '');
  const dry = String(getArg('dry', 'false')).toLowerCase() === 'true';
  const minScore = parseInt(getArg('minScore', '2'), 10);
  const limit = parseInt(getArg('limit', '0'), 10) || undefined;
  const mapPath = getArg('map', '');

  const strapi = await createStrapi().load();
  await strapi.start();
  try {
    const res = await strapi.service('api::internal.internal').autoTag({
      siteDomain: site || undefined,
      dryRun: dry,
      minScore,
      limit,
      mapPath: mapPath || undefined,
    });
    console.log('[AutoTag] done:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('[AutoTag] error:', e?.message || e);
    process.exitCode = 1;
  } finally {
    await strapi.destroy();
  }
})();