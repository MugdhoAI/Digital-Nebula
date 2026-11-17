import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const html = readFileSync(new URL('../nebula.html', import.meta.url), 'utf8');

test('nebula.html loads Three.js and creates 15,000 particles', () => {
    assert.match(html, /three@0\.160\.0/);
    assert.match(html, /particlesCount = 15000/);
    assert.match(html, /new THREE\.Points\(/);
});

test('pointer, keyboard, resize and visibility handlers are wired', () => {
    assert.match(html, /addEventListener\('pointermove'/);
    assert.match(html, /addEventListener\('pointerleave'/);
    assert.match(html, /addEventListener\('keydown'/);
    assert.match(html, /addEventListener\('resize'/);
    assert.match(html, /addEventListener\('visibilitychange'/);
});

test('HUD shows the particle count and a pause button', () => {
    assert.match(html, /id="particle-count"/);
    assert.match(html, /15,000 particles/);
    assert.match(html, /id="pause-button"/);
});

test('the module script parses', () => {
    const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
    assert.ok(match, 'module script found');
    const dir = mkdtempSync(join(tmpdir(), 'nebula-smoke-'));
    const file = join(dir, 'nebula.mjs');
    writeFileSync(file, match[1]);
    execFileSync(process.execPath, ['--check', file], { encoding: 'utf8' });
});
