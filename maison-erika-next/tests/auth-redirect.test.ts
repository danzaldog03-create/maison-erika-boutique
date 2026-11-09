import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSafeNextPath } from '../lib/auth/safe-next.ts'

test('accepts only the OAuth destinations explicitly allowed by the app', () => {
  assert.equal(resolveSafeNextPath('/'), '/')
  assert.equal(resolveSafeNextPath('/admin'), '/admin')
})

test('rejects external and protocol-relative OAuth destinations', () => {
  for (const next of [
    'https://attacker.example',
    '//attacker.example',
    '/\\attacker.example',
    'admin',
    '/productos/anillo',
    '/admin?continue=https://attacker.example',
    '/admin#attacker',
  ]) {
    assert.equal(resolveSafeNextPath(next), '/admin', next)
  }
})
