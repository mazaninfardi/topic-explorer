import { describe, expect, it } from 'vitest'
import { selectSalientTerms, splitSentences } from '../content/text'
import { MockContentSource } from '../content/MockContentSource'
import { TOO_SHORT_MESSAGE } from '../content/ContentSource'

describe('splitSentences', () => {
  it('splits on sentence boundaries and trims', () => {
    expect(splitSentences('One thing. Two things!  Three?')).toEqual([
      'One thing.',
      'Two things!',
      'Three?',
    ])
  })

  it('ignores empty/whitespace input', () => {
    expect(splitSentences('   ')).toEqual([])
  })
})

describe('selectSalientTerms', () => {
  it('is deterministic: longest non-stopwords first, ties by appearance', () => {
    expect(
      selectSalientTerms('The transformer architecture relies on attention mechanisms.'),
    ).toEqual(['architecture', 'transformer', 'mechanisms', 'attention'])
  })
})

describe('MockContentSource.deriveWhat', () => {
  const source = new MockContentSource()

  it('builds What from the first and last sentence', () => {
    const data = source.deriveWhat('Alpha begins. Middle filler here. Omega ends.')
    expect(data.kind).toBe('what')
    expect(data.text).toBe('Alpha begins. Omega ends.')
    expect(data.terms.length).toBeGreaterThan(0)
  })

  it('rejects too-short input with a clear message', () => {
    expect(() => source.deriveWhat('Only one sentence here.')).toThrowError(TOO_SHORT_MESSAGE)
  })
})

describe('MockContentSource.defineTerm', () => {
  it('returns a salient-term node that itself carries terms', () => {
    const data = new MockContentSource().defineTerm('entropy')
    expect(data.kind).toBe('salient-term')
    expect(data.terms.length).toBeGreaterThan(0)
  })
})
