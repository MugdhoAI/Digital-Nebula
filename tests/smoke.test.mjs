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

test('animation loop tracks the pending requestAnimationFrame id', () => {
    assert.match(html, /let animationFrameId = null/);
    assert.match(html, /animationFrameId = requestAnimationFrame\(animate\)/);
    assert.match(html, /if \(!isRunning\(\)\) \{\s*animationFrameId = null;/);
});

test('startAnimation guards against a second concurrent loop', () => {
    assert.match(html, /function startAnimation\(\) \{\s*if \(!isRunning\(\)\) return;\s*if \(animationFrameId !== null\) return;/);
    assert.match(html, /startAnimation\(\);\s*<\/script>/);
});

test('repeated hide and show cycles keep a single animation loop', () => {
    // Simulate the browser behaviour that caused the bug: a frame queued
    // before the tab hides stays pending while hidden, and the
    // visibilitychange handler calls startAnimation on every show.
    // With the guard, the pending count must never exceed one.
    let hiddenPaused = false;
    let paused = false;
    let animationFrameId = null;
    let nextId = 1;
    const pending = new Map();
    let renders = 0;

    const isRunning = () => !paused && !hiddenPaused;
    function requestAnimationFrameSim(cb) {
        const id = nextId++;
        pending.set(id, cb);
        return id;
    }
    function animate() {
        if (!isRunning()) {
            animationFrameId = null;
            return;
        }
        animationFrameId = requestAnimationFrameSim(animate);
        renders += 1;
    }
    function startAnimation() {
        if (!isRunning()) return;
        if (animationFrameId !== null) return;
        animate();
    }
    function stepFrame() {
        // Fire the currently pending callbacks as the browser would on
        // the next visible frame tick.
        const callbacks = [...pending.values()];
        pending.clear();
        for (const cb of callbacks) cb();
    }

    startAnimation();
    assert.equal(pending.size, 1);
    stepFrame();
    assert.equal(pending.size, 1);

    for (let cycle = 0; cycle < 5; cycle += 1) {
        // Hide: the pending frame survives, it is not cancelled.
        hiddenPaused = true;
        assert.equal(pending.size, 1, `cycle ${cycle}: frame survives hide`);
        // Show: restart attempt must be blocked by the guard.
        hiddenPaused = false;
        startAnimation();
        assert.equal(pending.size, 1, `cycle ${cycle}: no second loop after show`);
        // Extra restart attempts, as from a pause toggle, also blocked.
        startAnimation();
        assert.equal(pending.size, 1, `cycle ${cycle}: repeated starts stay single`);
        stepFrame();
        assert.equal(pending.size, 1, `cycle ${cycle}: loop continues singly`);
    }

    // Five cycles plus the two initial frames: exactly one render per
    // animate call, no multiplication from stacked loops.
    assert.equal(renders, 7);
});

test('the module script parses', () => {
    const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
    assert.ok(match, 'module script found');
    const dir = mkdtempSync(join(tmpdir(), 'nebula-smoke-'));
    const file = join(dir, 'nebula.mjs');
    writeFileSync(file, match[1]);
    execFileSync(process.execPath, ['--check', file], { encoding: 'utf8' });
});
