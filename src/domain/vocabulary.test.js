import { describe, expect, it } from 'vitest'
import {
  getMemoryTargetCount,
  getSpecialCharacters,
  normalizeVocabItem,
  parseNounEntry,
  validateVocabInput,
} from './vocabulary.js'

describe('normalizeVocabItem', () => {
  it('migrates legacy gender data, preserves article, and does not mutate the source', () => {
    const source = {
      id: 7,
      target: 'Haus',
      translation: 'house',
      gender: 'n',
      article: 'das',
    }

    const normalized = normalizeVocabItem(source)

    expect(normalized).toMatchObject({
      id: 7,
      target: 'Haus',
      translation: 'house',
      partOfSpeech: 'noun',
      article: 'das',
      grammaticalGender: 'neuter',
    })
    expect(normalized).not.toHaveProperty('gender')
    expect(source).toEqual({
      id: 7,
      target: 'Haus',
      translation: 'house',
      gender: 'n',
      article: 'das',
    })
  })

  it('prefers the current partOfSpeech field over legacy gender', () => {
    expect(normalizeVocabItem({ gender: 'adj', partOfSpeech: 'noun' })).toMatchObject({
      partOfSpeech: 'noun',
    })
  })

  it('combines a separate legacy German article and noun into one complete target', () => {
    const source = {
      german: '  Hund ',
      article: ' Der ',
      gender: 'n',
    }

    expect(normalizeVocabItem(source)).toMatchObject({
      german: 'der Hund',
      article: 'der',
      grammaticalGender: 'masculine',
      partOfSpeech: 'noun',
    })
    expect(source).toEqual({ german: '  Hund ', article: ' Der ', gender: 'n' })
  })

  it('does not duplicate an article already present in the German target', () => {
    expect(normalizeVocabItem({
      german: 'Die   Frau',
      article: 'die',
      gender: 'n',
    })).toMatchObject({
      german: 'die Frau',
      article: 'die',
      grammaticalGender: 'feminine',
    })
  })

  it('derives article and grammatical gender from an already complete German target', () => {
    expect(normalizeVocabItem({ german: 'das Kind', gender: 'n' })).toMatchObject({
      german: 'das Kind',
      article: 'das',
      grammaticalGender: 'neuter',
      partOfSpeech: 'noun',
    })
  })

  it('never treats legacy gender as grammatical gender', () => {
    expect(normalizeVocabItem({ german: 'lernen', gender: 'v' })).toMatchObject({
      german: 'lernen',
      partOfSpeech: 'verb',
      grammaticalGender: 'unknown',
    })
  })

  it('canonicalizes legacy partOfSpeech codes and safely fills missing text', () => {
    expect(normalizeVocabItem({ partOfSpeech: 'v', german: null, example: 42 })).toMatchObject({
      german: '',
      english: '',
      example: '',
      article: '',
      partOfSpeech: 'verb',
    })
  })

  it('deeply completes every progress object while retaining supplied and custom values', () => {
    const normalized = normalizeVocabItem({
      learningProgress: { select: 3, spelling: undefined, customExercise: 1 },
      reviewProgress: { reverseSelect: 2, sentence: null },
      hellProgress: { listening: 4 },
    })

    expect(normalized.learningProgress).toEqual({
      sentence: 0,
      select: 3,
      listening: 0,
      spelling: 0,
      customExercise: 1,
    })
    expect(normalized.reviewProgress).toEqual({
      spelling: 0,
      select: 0,
      reverseSelect: 2,
      sentence: 0,
    })
    expect(normalized.hellProgress).toEqual({
      spelling: 0,
      listening: 4,
    })
  })

  it('applies all scalar and collection defaults without replacing explicit falsy values', () => {
    const normalized = normalizeVocabItem({
      status: 0,
      familiarity: 0,
      isNigate: false,
      isStarred: false,
      isCustomized: false,
      isDeleted: false,
      successStreak: 0,
      lastReviewed: 0,
    })

    expect(normalized).toMatchObject({
      partOfSpeech: 'other',
      status: 0,
      familiarity: 0,
      reviewDates: [],
      isNigate: false,
      isStarred: false,
      isCustomized: false,
      isDeleted: false,
      successStreak: 0,
      lastReviewed: 0,
    })
  })

  it('clones nested defaults and review dates so normalized records do not share mutable state', () => {
    const reviewDates = ['2026-08-08']
    const first = normalizeVocabItem({ reviewDates })
    const second = normalizeVocabItem()

    first.learningProgress.select = 9
    first.reviewDates.push('2026-08-09')

    expect(second.learningProgress.select).toBe(0)
    expect(reviewDates).toEqual(['2026-08-08'])
    expect(first.reviewDates).not.toBe(reviewDates)
  })

  it('handles null and malformed progress values defensively', () => {
    expect(normalizeVocabItem(null)).toMatchObject({
      partOfSpeech: 'other',
      learningProgress: { sentence: 0, select: 0, listening: 0, spelling: 0 },
      reviewProgress: { spelling: 0, select: 0, reverseSelect: 0, sentence: 0 },
      hellProgress: { spelling: 0, listening: 0 },
    })

    expect(normalizeVocabItem({
      learningProgress: [],
      reviewProgress: 'invalid',
      hellProgress: null,
    })).toMatchObject({
      learningProgress: { sentence: 0, select: 0, listening: 0, spelling: 0 },
      reviewProgress: { spelling: 0, select: 0, reverseSelect: 0, sentence: 0 },
      hellProgress: { spelling: 0, listening: 0 },
    })
  })
})

describe('parseNounEntry', () => {
  it.each([
    [' DER   Hund ', 'der Hund', 'Hund', 'der', 'masculine'],
    ['die Straße', 'die Straße', 'Straße', 'die', 'feminine'],
    ['Das Kind', 'das Kind', 'Kind', 'das', 'neuter'],
  ])('normalizes German noun entry %j', (input, target, noun, article, grammaticalGender) => {
    expect(parseNounEntry(input, 'German')).toEqual({
      value: { target, noun, article, grammaticalGender },
      errors: {},
    })
  })

  it('accepts a German article supplied separately without duplicating it', () => {
    expect(parseNounEntry({ target: 'der Hund', article: ' DER ' }, 'de-DE')).toEqual({
      value: {
        target: 'der Hund',
        noun: 'Hund',
        article: 'der',
        grammaticalGender: 'masculine',
      },
      errors: {},
    })
  })

  it.each(['Hund', 'ein Hund'])('reports an article error for German input %j', (input) => {
    const result = parseNounEntry(input, 'German')

    expect(result.value.article).toBeNull()
    expect(result.value.grammaticalGender).toBe('unknown')
    expect(result.errors.article).toBe('German nouns must start with der, die, or das.')
  })

  it('reports an error when an article is not followed by a noun', () => {
    const result = parseNounEntry('das', 'German')

    expect(result.value).toEqual({
      target: 'das',
      noun: '',
      article: 'das',
      grammaticalGender: 'neuter',
    })
    expect(result.errors).toEqual({ noun: 'Noun is required after the article.' })
  })

  it('reports both noun and article requirements for empty German input', () => {
    expect(parseNounEntry('   ', 'German').errors).toEqual({
      target: 'Noun is required.',
      article: 'German nouns must start with der, die, or das.',
    })
  })

  it.each([
    ['Russian', ' дом ', 'дом'],
    ['pl-PL', 'dom', 'dom'],
    ['Čeština', 'dům', 'dům'],
  ])('does not require an article for %s', (language, input, target) => {
    expect(parseNounEntry(input, language)).toEqual({
      value: {
        target,
        noun: target,
        article: null,
        grammaticalGender: 'unknown',
      },
      errors: {},
    })
  })

  it.each([
    ['Spanish', 'La casa', 'la casa', 'casa', 'la', 'feminine'],
    ['French', 'L’homme', "l'homme", 'homme', "l'", 'unknown'],
    ['Italian', 'lo zaino', 'lo zaino', 'zaino', 'lo', 'masculine'],
    ['Dutch', 'het huis', 'het huis', 'huis', 'het', 'neuter'],
    ['Swedish', 'ett hus', 'ett hus', 'hus', 'ett', 'neuter'],
  ])('parses an explicit %s article', (language, input, target, noun, article, grammaticalGender) => {
    expect(parseNounEntry(input, language)).toEqual({
      value: { target, noun, article, grammaticalGender },
      errors: {},
    })
  })

  it('allows a bare noun in an optional-article language', () => {
    expect(parseNounEntry('casa', 'Spanish')).toEqual({
      value: {
        target: 'casa',
        noun: 'casa',
        article: null,
        grammaticalGender: 'unknown',
      },
      errors: {},
    })
  })

  it('rejects an explicitly supplied article that the language does not recognize', () => {
    const result = parseNounEntry({ target: 'casa', article: 'der' }, 'Spanish')

    expect(result.value.article).toBeNull()
    expect(result.errors.article).toBe('Spanish does not recognize the article "der".')
  })
})

describe('validateVocabInput', () => {
  it('trims string values, preserves metadata, and returns no errors for valid input', () => {
    const input = {
      target: '  Straße  ',
      translation: '  street  ',
      example: '  Die Straße ist lang.  ',
      article: '  die  ',
      partOfSpeech: '  noun  ',
      familiarity: 2,
    }

    expect(validateVocabInput(input)).toEqual({
      value: {
        target: 'Straße',
        translation: 'street',
        example: 'Die Straße ist lang.',
        article: 'die',
        partOfSpeech: 'noun',
        familiarity: 2,
      },
      errors: {},
    })
    expect(input.target).toBe('  Straße  ')
  })

  it('reports each required field after whitespace has been removed', () => {
    expect(validateVocabInput({
      target: '   ',
      translation: '\n',
      example: '\t',
    })).toEqual({
      value: { target: '', translation: '', example: '' },
      errors: {
        target: 'Target is required.',
        translation: 'Translation is required.',
        example: 'Example is required.',
      },
    })
  })

  it('treats missing and non-string required values as empty strings', () => {
    expect(validateVocabInput({ target: 123, translation: null })).toEqual({
      value: { target: '', translation: '', example: '' },
      errors: {
        target: 'Target is required.',
        translation: 'Translation is required.',
        example: 'Example is required.',
      },
    })
    expect(validateVocabInput(null).errors).toEqual({
      target: 'Target is required.',
      translation: 'Translation is required.',
      example: 'Example is required.',
    })
  })
})

describe('getSpecialCharacters', () => {
  it('returns the supported German characters for names and locale codes', () => {
    const expected = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü']

    expect(getSpecialCharacters('German')).toEqual(expected)
    expect(getSpecialCharacters('de-DE')).toEqual(expected)
    expect(getSpecialCharacters(' Deutsch ')).toEqual(expected)
  })

  it('supports native language names and case-insensitive ISO codes', () => {
    expect(getSpecialCharacters('POLSKI')).toContain('ł')
    expect(getSpecialCharacters('pl-PL')).toContain('Ł')
    expect(getSpecialCharacters('čeština')).toContain('ř')
    expect(getSpecialCharacters('sv_SE')).toEqual(['å', 'ä', 'ö', 'Å', 'Ä', 'Ö'])
  })

  it('supports the Russian yo characters and returns an empty array for unknown languages', () => {
    expect(getSpecialCharacters('Russian')).toEqual(['ё', 'Ё'])
    expect(getSpecialCharacters('unknown')).toEqual([])
    expect(getSpecialCharacters(null)).toEqual([])
  })

  it('returns a fresh array that cannot mutate the stored palette', () => {
    const characters = getSpecialCharacters('German')
    characters.push('x')

    expect(getSpecialCharacters('German')).not.toContain('x')
  })
})

describe('getMemoryTargetCount', () => {
  it.each([
    [0, undefined, 0],
    [3, undefined, 3],
    [8, undefined, 8],
    [12, undefined, 8],
    [12, 5, 5],
    [3, 5, 3],
    [5.9, 8, 5],
    [-4, 8, 0],
    [4, 0, 0],
  ])('returns %s words with max %s as %s', (wordCount, max, expected) => {
    expect(getMemoryTargetCount(wordCount, max)).toBe(expected)
  })

  it('uses safe fallbacks for non-finite values', () => {
    expect(getMemoryTargetCount(Number.NaN)).toBe(0)
    expect(getMemoryTargetCount(Number.POSITIVE_INFINITY)).toBe(0)
    expect(getMemoryTargetCount(10, Number.NaN)).toBe(8)
  })
})
