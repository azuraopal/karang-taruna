import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'postcss';
import type { Rule } from 'postcss';

const stylesheets = ['../src/index.css', '../src/App.css'].map((path) =>
  parse(readFileSync(new URL(path, import.meta.url), 'utf8')),
);
const enabled = 'button:not(:disabled):not([aria-disabled="true"])';

function ruleFor(selector: string, property?: string): Rule {
  const matches: Rule[] = [];
  for (const stylesheet of stylesheets) {
    stylesheet.walkRules((rule) => {
      if (rule.selector === selector && (!property || rule.nodes.some((node) => node.type === 'decl' && node.prop === property))) {
        matches.push(rule);
      }
    });
  }
  assert.equal(matches.length, 1, `Expected one rule for ${selector}`);
  return matches[0];
}

function declaration(rule: Rule, property: string) {
  const matches = rule.nodes.filter((node) => node.type === 'decl' && node.prop === property);
  assert.equal(matches.length, 1, `Expected ${property} in ${rule.selector}`);
  const value = matches[0];
  assert.equal(value.type, 'decl');
  return value;
}

test('buttons use short, explicit transitions on the resting rule for press and release', () => {
  const resting = ruleFor(enabled);
  assert.equal(resting.parent?.type, 'root', 'Feedback must not depend on hover capability');
  const transitions = declaration(resting, 'transition').value;
  const properties = transitions.split(/,(?![^()]*\))/).map((part) => part.trim().split(/\s+/)[0]);
  assert.deepEqual(properties, ['scale', 'translate', 'background-color', 'border-color', 'color', 'box-shadow', 'opacity']);
  assert.match(transitions, /scale 160ms cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)/);
  assert.match(transitions, /translate 160ms cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)/);
  for (const duration of transitions.matchAll(/(\d+)ms/g)) {
    assert.ok(Number(duration[1]) > 0 && Number(duration[1]) <= 200);
  }
  // Inline transforms driven by Framer Motion must not be CSS-transitioned too.
  assert.ok(!properties.includes('transform'));

  for (const stylesheet of stylesheets) {
    stylesheet.walkDecls(/^transition(?:-property)?$/, (decl) => {
      assert.doesNotMatch(decl.value, /\ball\b/, 'Never animate every property');
    });
  }
});

test('press feedback is small, works without hover, and does not change layout or click handling', () => {
  const pressed = ruleFor(`${enabled}:active`);
  assert.equal(pressed.parent?.type, 'root');
  const scale = Number(declaration(pressed, 'scale').value);
  assert.ok(scale >= 0.98 && scale < 1, 'Press scale should be subtle');
  assert.deepEqual(pressed.nodes.map((node) => node.type === 'decl' && node.prop), ['scale']);
  // No active-only transition: the resting transition also animates release.
  assert.ok(!pressed.nodes.some((node) => node.type === 'decl' && node.prop === 'transition'));
});

test('dashboard hover movement excludes disabled buttons and requires a mouse and full motion', () => {
  for (const group of ['dashboard-command', 'dashboard-launchpad']) {
    const hover = ruleFor(`.${group}__actions ${enabled}:hover`, 'translate');
    const movement = hover.nodes.filter((node) => node.type === 'decl' && node.prop === 'translate');
    assert.equal(movement.length, 1);
    assert.equal(hover.parent?.type, 'atrule');
    if (hover.parent?.type === 'atrule') {
      assert.equal(hover.parent.params, '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    }
  }
  // The old transform rules would compound the shared press scale or snap back.
  for (const stylesheet of stylesheets) {
    stylesheet.walkRules((rule) => {
      if (/\.dashboard-(?:command|launchpad)__actions button/.test(rule.selector)) {
        rule.walkDecls(/^(?:transform|transition)$/, () => {
          assert.fail(`Conflicting dashboard motion in ${rule.selector}`);
        });
      }
    });
  }
});

test('native, fieldset-disabled, and aria-disabled buttons stop transitions and inline motion', () => {
  // :disabled includes buttons disabled through a containing fieldset.
  const disabled = ruleFor('button:is(:disabled, [aria-disabled="true"])');
  assert.equal(disabled.parent?.type, 'root');
  for (const [property, expected] of Object.entries({ scale: '1', transform: 'none', animation: 'none', transition: 'none' })) {
    const decl = declaration(disabled, property);
    assert.equal(decl.value, expected);
    assert.ok(decl.important, `${property} must override inline motion and utility classes`);
  }
  const decoration = ruleFor('button:is(:disabled, [aria-disabled="true"])::before,\nbutton:is(:disabled, [aria-disabled="true"])::after');
  assert.equal(declaration(decoration, 'animation').value, 'none');
  assert.equal(declaration(decoration, 'transition').value, 'none');
});

test('reduced motion removes button movement and transitions, including decorations', () => {
  const reduced = ruleFor('button,\n  button::before,\n  button::after');
  assert.equal(reduced.parent?.type, 'atrule');
  if (reduced.parent?.type === 'atrule') {
    assert.equal(reduced.parent.name, 'media');
    assert.equal(reduced.parent.params, '(prefers-reduced-motion: reduce)');
  }
  for (const [property, expected] of Object.entries({ scale: '1', transform: 'none', animation: 'none', transition: 'none' })) {
    const decl = declaration(reduced, property);
    assert.equal(decl.value, expected);
    assert.ok(decl.important, `${property} must win over active states and inline motion`);
  }
});

test('keyboard focus retains a visible outline independently of motion settings', () => {
  const focus = ruleFor('button:focus-visible');
  assert.equal(focus.parent?.type, 'root');
  assert.match(declaration(focus, 'outline').value, /^[2-9]px solid /);
  assert.match(declaration(focus, 'outline-offset').value, /^[1-9]px$/);
});
