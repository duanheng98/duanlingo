import { describe, expect, it } from 'vitest'
import {
  cloneDecks,
  mergeDecksPreservingBoth,
  normalizeDecks,
} from './decks.js'

const makeDeck = (id, title, overrides = {}) => ({
  id,
  title,
  language: 'German',
  words: [],
  ...overrides,
})

describe('normalizeDecks', () => {
  it.each([undefined, null, [], 'invalid', 42])('returns an empty map for %j', (value) => {
    expect(normalizeDecks(value)).toEqual({})
  })

  it('uses map keys as canonical IDs and normalizes every vocabulary item', () => {
    const raw = {
      deck_a: {
        id: 'stale-id',
        title: 'Basics',
        words: [{
          id: 1,
          target: 'Haus',
          gender: 'n',
          article: 'das',
          learningProgress: { select: 2 },
        }],
      },
      deck_b: {
        title: 'Without an embedded ID',
        words: [],
      },
    }

    const normalized = normalizeDecks(raw)

    expect(normalized.deck_a.id).toBe('deck_a')
    expect(normalized.deck_b.id).toBe('deck_b')
    expect(normalized.deck_a.words[0]).toMatchObject({
      id: 1,
      target: 'Haus',
      partOfSpeech: 'noun',
      article: 'das',
      learningProgress: {
        sentence: 0,
        select: 2,
        listening: 0,
        spelling: 0,
      },
    })
    expect(normalized.deck_a.words[0]).not.toHaveProperty('gender')
    expect(raw.deck_a.id).toBe('stale-id')
    expect(raw.deck_a.words[0]).toHaveProperty('gender', 'n')
  })

  it('turns malformed deck and words values into safe empty decks', () => {
    expect(normalizeDecks({ missing: null, malformed: { words: 'nope' } })).toEqual({
      missing: { id: 'missing', words: [] },
      malformed: { id: 'malformed', words: [] },
    })
  })
})

describe('cloneDecks', () => {
  it('returns a deeply independent normalized copy', () => {
    const source = {
      basics: makeDeck('basics', 'Basics', {
        settings: { dailyGoal: 5 },
        words: [{ id: 1, target: 'Haus', partOfSpeech: 'noun' }],
      }),
    }

    const cloned = cloneDecks(source)
    cloned.basics.settings.dailyGoal = 99
    cloned.basics.words[0].target = 'Baum'
    cloned.basics.words.push({ id: 2 })

    expect(source.basics.settings.dailyGoal).toBe(5)
    expect(source.basics.words).toEqual([{ id: 1, target: 'Haus', partOfSpeech: 'noun' }])
    expect(cloned).not.toBe(source)
    expect(cloned.basics).not.toBe(source.basics)
  })
})

describe('mergeDecksPreservingBoth', () => {
  it('adds non-conflicting guest decks and returns an identity ID mapping', () => {
    const cloud = { cloud: makeDeck('cloud', 'Cloud deck') }
    const guest = { guest: makeDeck('guest', 'Guest deck') }

    const result = mergeDecksPreservingBoth(cloud, guest, 'guest-user-123')

    expect(Object.keys(result.merged)).toEqual(['cloud', 'guest'])
    expect(result.merged.guest).toEqual(normalizeDecks(guest).guest)
    expect(result.idMap).toEqual({ guest: 'guest' })
  })

  it('deduplicates semantically identical decks with the same ID', () => {
    const cloud = {
      shared: {
        id: 'shared',
        title: 'Shared',
        language: 'German',
        words: [{ id: 1, target: 'Haus', gender: 'n' }],
      },
    }
    const guest = {
      shared: {
        words: [{ target: 'Haus', id: 1, partOfSpeech: 'noun' }],
        language: 'German',
        title: 'Shared',
        id: 'shared',
      },
    }

    const result = mergeDecksPreservingBoth(cloud, guest, 'guest-user-123')

    expect(Object.keys(result.merged)).toEqual(['shared'])
    expect(result.idMap).toEqual({ shared: 'shared' })
  })

  it('preserves the cloud deck and imports a conflicting guest deck under a deterministic ID', () => {
    const cloud = { shared: makeDeck('shared', 'Cloud version') }
    const guest = { shared: makeDeck('shared', 'Guest version') }
    const cloudSnapshot = structuredClone(cloud)

    const result = mergeDecksPreservingBoth(cloud, guest, 'guest-user-123')
    const importedId = 'guest_guest-us_shared'

    expect(result.idMap).toEqual({ shared: importedId })
    expect(result.merged.shared).toEqual(normalizeDecks(cloud).shared)
    expect(result.merged[importedId]).toMatchObject({
      id: importedId,
      title: 'Guest version (Guest import)',
    })
    expect(cloud).toEqual(cloudSnapshot)
    expect(guest.shared.title).toBe('Guest version')
  })

  it('does not overwrite an occupied import ID and chooses the first free suffix', () => {
    const cloud = {
      shared: makeDeck('shared', 'Cloud version'),
      'guest_guest-us_shared': makeDeck('guest_guest-us_shared', 'Unrelated cloud deck'),
      'guest_guest-us_shared_2': makeDeck('guest_guest-us_shared_2', 'Another cloud deck'),
    }
    const guest = { shared: makeDeck('shared', 'Guest version') }

    const result = mergeDecksPreservingBoth(cloud, guest, 'guest-user-123')

    expect(result.idMap.shared).toBe('guest_guest-us_shared_3')
    expect(result.merged['guest_guest-us_shared'].title).toBe('Unrelated cloud deck')
    expect(result.merged['guest_guest-us_shared_2'].title).toBe('Another cloud deck')
    expect(result.merged['guest_guest-us_shared_3'].title).toBe('Guest version (Guest import)')
  })

  it('is deterministic across transaction retries and idempotent after a committed merge', () => {
    const cloud = { shared: makeDeck('shared', 'Cloud version') }
    const guest = { shared: makeDeck('shared', 'Guest version') }

    const firstAttempt = mergeDecksPreservingBoth(cloud, guest, 'guest-user-123')
    const transactionRetry = mergeDecksPreservingBoth(cloud, guest, 'guest-user-123')
    const postCommitRetry = mergeDecksPreservingBoth(
      firstAttempt.merged,
      guest,
      'guest-user-123',
    )

    expect(transactionRetry).toEqual(firstAttempt)
    expect(postCommitRetry).toEqual(firstAttempt)
    expect(Object.keys(postCommitRetry.merged)).toHaveLength(2)
  })

  it('returns a complete idMap for remapping the guest current deck ID', () => {
    const cloud = {
      current: makeDeck('current', 'Cloud current'),
      cloudOnly: makeDeck('cloudOnly', 'Cloud only'),
    }
    const guest = {
      current: makeDeck('current', 'Guest current'),
      guestOnly: makeDeck('guestOnly', 'Guest only'),
    }

    const { merged, idMap } = mergeDecksPreservingBoth(cloud, guest, 'guest-user-123')
    const remappedGuestCurrentId = idMap.current

    expect(idMap).toEqual({
      current: 'guest_guest-us_current',
      guestOnly: 'guestOnly',
    })
    expect(remappedGuestCurrentId).toBe('guest_guest-us_current')
    expect(merged[remappedGuestCurrentId].title).toBe('Guest current (Guest import)')
    expect(merged.current.title).toBe('Cloud current')
    expect(merged.cloudOnly.title).toBe('Cloud only')
  })
})
