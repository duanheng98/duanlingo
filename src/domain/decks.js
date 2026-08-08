import { normalizeVocabItem } from './vocabulary.js'

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const cloneValue = (value) => {
  if (Array.isArray(value)) return value.map(cloneValue)
  if (value instanceof Date) return new Date(value.getTime())
  if (!isRecord(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)]),
  )
}

const valuesEqual = (left, right) => {
  if (Object.is(left, right)) return true

  if (left instanceof Date || right instanceof Date) {
    return left instanceof Date
      && right instanceof Date
      && left.getTime() === right.getTime()
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false
    return left.every((value, index) => valuesEqual(value, right[index]))
  }

  if (!isRecord(left) || !isRecord(right)) return false

  const leftKeys = Object.keys(left).sort()
  const rightKeys = Object.keys(right).sort()
  if (leftKeys.length !== rightKeys.length) return false

  return leftKeys.every((key, index) => (
    key === rightKeys[index] && valuesEqual(left[key], right[key])
  ))
}

const setOwn = (record, key, value) => {
  Object.defineProperty(record, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  })
}

/**
 * Converts a persisted deck map to a predictable, non-mutating shape.
 */
export const normalizeDecks = (rawDecks) => {
  if (!isRecord(rawDecks)) return {}

  return Object.fromEntries(
    Object.entries(rawDecks).map(([deckId, deck]) => {
      const safeDeck = isRecord(deck) ? deck : {}
      const words = Array.isArray(safeDeck.words)
        ? safeDeck.words.map(normalizeVocabItem)
        : []

      return [deckId, {
        ...safeDeck,
        id: deckId,
        words,
      }]
    }),
  )
}

/**
 * Produces a deep copy of normalized, serializable deck data.
 */
export const cloneDecks = (decks) => cloneValue(normalizeDecks(decks))

const importedDeckId = (guestUid, originalId, suffix) => {
  const sourceId = String(guestUid ?? 'unknown').slice(0, 8) || 'unknown'
  const baseId = `guest_${sourceId}_${originalId}`
  return suffix === 1 ? baseId : `${baseId}_${suffix}`
}

const asImportedDeck = (guestDeck, id) => ({
  ...cloneValue(guestDeck),
  id,
  title: `${guestDeck.title || 'Untitled'} (Guest import)`,
})

/**
 * Adds guest decks to a cloud deck map without replacing any cloud entry.
 *
 * Conflicting IDs are mapped to deterministic import IDs. If a previous merge
 * already created the matching import, it is reused so transaction retries and
 * post-commit retries are idempotent. `idMap` lets callers remap a guest user's
 * current deck ID to its location in the merged map.
 */
export const mergeDecksPreservingBoth = (cloudDecks, guestDecks, guestUid) => {
  const merged = cloneDecks(cloudDecks)
  const normalizedGuestDecks = cloneDecks(guestDecks)
  const idMap = new Map()

  for (const [originalId, guestDeck] of Object.entries(normalizedGuestDecks)) {
    if (!Object.hasOwn(merged, originalId)) {
      setOwn(merged, originalId, {
        ...cloneValue(guestDeck),
        id: originalId,
      })
      idMap.set(originalId, originalId)
      continue
    }

    if (valuesEqual(merged[originalId], guestDeck)) {
      idMap.set(originalId, originalId)
      continue
    }

    let suffix = 1
    while (true) {
      const candidateId = importedDeckId(guestUid, originalId, suffix)
      const candidateDeck = asImportedDeck(guestDeck, candidateId)

      if (!Object.hasOwn(merged, candidateId)) {
        setOwn(merged, candidateId, candidateDeck)
        idMap.set(originalId, candidateId)
        break
      }

      if (valuesEqual(merged[candidateId], candidateDeck)) {
        idMap.set(originalId, candidateId)
        break
      }

      suffix += 1
    }
  }

  return {
    merged,
    idMap: Object.fromEntries(idMap),
  }
}
