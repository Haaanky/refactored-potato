import { describe, it, expect } from 'vitest'
import { sha256 } from '../lib/crypto'

describe('sha256', () => {
  it('returns a 64-character hex string', async () => {
    expect(await sha256('hello')).toHaveLength(64)
    expect(await sha256('hello')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic', async () => {
    expect(await sha256('pw')).toBe(await sha256('pw'))
  })

  it('differs for different inputs', async () => {
    expect(await sha256('a')).not.toBe(await sha256('b'))
  })

  it('matches known vector for empty string', async () => {
    expect(await sha256('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })
})
