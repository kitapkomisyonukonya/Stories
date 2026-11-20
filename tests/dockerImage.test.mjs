import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// The runtime image copies the server modules from deploy/. A module imported by server.mjs but
// left out of the image starts locally and in the tests, yet the container fails on Cloud Run.
test('the image copies every server module that server.mjs imports', () => {
  const dockerfile = readFileSync('Dockerfile', 'utf8');
  const copied = new Set();
  for (const line of dockerfile.split('\n')) {
    const match = /^COPY\s+(?!--from)(.+)\s+\S+$/.exec(line.trim());
    if (!match) continue;
    for (const source of match[1].split(/\s+/)) {
      if (source === 'deploy/*.mjs') {
        for (const name of readdirSync('deploy')) if (name.endsWith('.mjs')) copied.add(`deploy/${name}`);
      } else if (source === 'deploy/panel') {
        for (const name of readdirSync('deploy/panel')) copied.add(`deploy/panel/${name}`);
      } else copied.add(source);
    }
  }
  const seen = new Set();
  const visit = file => {
    if (seen.has(file)) return;
    seen.add(file);
    assert.ok(copied.has(file), `${file} is imported by the server but not copied into the image`);
    const dir = file.slice(0, file.lastIndexOf('/'));
    for (const [, spec] of readFileSync(file, 'utf8').matchAll(/from\s+'(\.{1,2}\/[^']+)'/g)) {
      const out = [];
      for (const part of `${dir}/${spec}`.split('/')) {
        if (part === '.') continue;
        if (part === '..') out.pop();
        else out.push(part);
      }
      visit(out.join('/'));
    }
  };
  visit('deploy/server.mjs');
});
