const LEARNING_PROGRESS_DEFAULTS = Object.freeze({
  sentence: 0,
  select: 0,
  listening: 0,
  spelling: 0,
})

const REVIEW_PROGRESS_DEFAULTS = Object.freeze({
  spelling: 0,
  select: 0,
  reverseSelect: 0,
  sentence: 0,
})

const HELL_PROGRESS_DEFAULTS = Object.freeze({
  spelling: 0,
  listening: 0,
})

const REQUIRED_INPUT_FIELDS = ['target', 'translation', 'example']

const LEGACY_PART_OF_SPEECH = Object.freeze({
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  phr: 'phrase',
  other: 'other',
})

const NOUN_ARTICLE_RULES = Object.freeze({
  german: Object.freeze({
    required: true,
    label: 'German',
    articles: Object.freeze({
      der: 'masculine',
      die: 'feminine',
      das: 'neuter',
    }),
  }),
  spanish: Object.freeze({
    required: false,
    label: 'Spanish',
    articles: Object.freeze({
      el: 'masculine',
      la: 'feminine',
      los: 'masculine',
      las: 'feminine',
      un: 'masculine',
      una: 'feminine',
      unos: 'masculine',
      unas: 'feminine',
    }),
  }),
  french: Object.freeze({
    required: false,
    label: 'French',
    articles: Object.freeze({
      le: 'masculine',
      la: 'feminine',
      "l'": 'unknown',
      les: 'unknown',
      un: 'masculine',
      une: 'feminine',
      des: 'unknown',
    }),
  }),
  italian: Object.freeze({
    required: false,
    label: 'Italian',
    articles: Object.freeze({
      il: 'masculine',
      lo: 'masculine',
      "l'": 'unknown',
      i: 'masculine',
      gli: 'masculine',
      la: 'feminine',
      le: 'feminine',
      un: 'masculine',
      uno: 'masculine',
      una: 'feminine',
      "un'": 'feminine',
    }),
  }),
  dutch: Object.freeze({
    required: false,
    label: 'Dutch',
    articles: Object.freeze({
      de: 'common',
      het: 'neuter',
      een: 'unknown',
    }),
  }),
  swedish: Object.freeze({
    required: false,
    label: 'Swedish',
    articles: Object.freeze({
      en: 'common',
      ett: 'neuter',
    }),
  }),
})

const REQUIRED_INPUT_MESSAGES = Object.freeze({
  target: 'Target is required.',
  translation: 'Translation is required.',
  example: 'Example is required.',
})

const SPECIAL_CHARACTERS = Object.freeze({
  german: Object.freeze(['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü']),
  spanish: Object.freeze(['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ü', 'Ñ', '¿', '¡']),
  italian: Object.freeze(['à', 'è', 'é', 'ì', 'ò', 'ù', 'À', 'È', 'É', 'Ì', 'Ò', 'Ù']),
  french: Object.freeze([
    'à', 'â', 'æ', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'œ', 'ù', 'û', 'ü', 'ÿ',
    'À', 'Â', 'Æ', 'Ç', 'É', 'È', 'Ê', 'Ë', 'Î', 'Ï', 'Ô', 'Œ', 'Ù', 'Û', 'Ü', 'Ÿ',
  ]),
  dutch: Object.freeze(['é', 'è', 'ë', 'ï', 'ö', 'É', 'È', 'Ë', 'Ï', 'Ö']),
  russian: Object.freeze(['ё', 'Ё']),
  polish: Object.freeze(['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż', 'Ą', 'Ć', 'Ę', 'Ł', 'Ń', 'Ó', 'Ś', 'Ź', 'Ż']),
  czech: Object.freeze([
    'á', 'č', 'ď', 'é', 'ě', 'í', 'ň', 'ó', 'ř', 'š', 'ť', 'ú', 'ů', 'ý', 'ž',
    'Á', 'Č', 'Ď', 'É', 'Ě', 'Í', 'Ň', 'Ó', 'Ř', 'Š', 'Ť', 'Ú', 'Ů', 'Ý', 'Ž',
  ]),
  swedish: Object.freeze(['å', 'ä', 'ö', 'Å', 'Ä', 'Ö']),
})

const LANGUAGE_ALIASES = Object.freeze({
  de: 'german',
  deutsch: 'german',
  german: 'german',
  es: 'spanish',
  espanol: 'spanish',
  'español': 'spanish',
  spanish: 'spanish',
  it: 'italian',
  italiano: 'italian',
  italian: 'italian',
  fr: 'french',
  francais: 'french',
  'français': 'french',
  french: 'french',
  nl: 'dutch',
  nederlands: 'dutch',
  dutch: 'dutch',
  ru: 'russian',
  russian: 'russian',
  'русский': 'russian',
  pl: 'polish',
  polish: 'polish',
  polski: 'polish',
  cs: 'czech',
  czech: 'czech',
  cestina: 'czech',
  'čeština': 'czech',
  sv: 'swedish',
  swedish: 'swedish',
  svenska: 'swedish',
})

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const normalizeText = (value) => (
  typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').replaceAll('’', "'")
    : ''
)

const normalizeArticle = (value) => normalizeText(value).toLowerCase()

const canonicalLanguage = (language) => {
  if (typeof language !== 'string') return ''

  const normalizedLanguage = language.trim().toLowerCase()
  const baseLanguage = normalizedLanguage.split(/[-_]/, 1)[0]
  return LANGUAGE_ALIASES[normalizedLanguage] ?? LANGUAGE_ALIASES[baseLanguage] ?? ''
}

const extractArticle = (target, rules) => {
  if (!target || !rules) return null

  const lowerTarget = target.toLowerCase()
  const articles = Object.keys(rules.articles).sort((left, right) => right.length - left.length)

  for (const article of articles) {
    if (article.endsWith("'")) {
      if (lowerTarget.startsWith(article)) {
        return {
          article,
          noun: target.slice(article.length).trim(),
        }
      }
      continue
    }

    if (lowerTarget === article) return { article, noun: '' }
    if (lowerTarget.startsWith(`${article} `)) {
      return {
        article,
        noun: target.slice(article.length).trim(),
      }
    }
  }

  return null
}

const joinArticleAndNoun = (article, noun) => (
  article.endsWith("'") ? `${article}${noun}` : `${article} ${noun}`
)

const normalizeGrammaticalGender = (value) => {
  const normalized = normalizeText(value).toLowerCase()
  return normalized || 'unknown'
}

/**
 * Parses a noun entry into a consistent article, noun, and grammatical gender.
 * German requires a definite article; supported article-bearing languages parse
 * an article when present, while article-less languages accept a bare noun.
 */
export const parseNounEntry = (input, language) => {
  const source = isRecord(input) ? input : {}
  const rawTarget = isRecord(input)
    ? (source.target ?? source.german ?? source.noun)
    : input
  const target = normalizeText(rawTarget)
  const explicitArticle = isRecord(input) && source.article != null
    ? normalizeArticle(source.article)
    : ''
  const rules = NOUN_ARTICLE_RULES[canonicalLanguage(language)]
  const parsedTarget = extractArticle(target, rules)
  const errors = {}

  let noun = parsedTarget?.noun ?? target
  let article = parsedTarget?.article ?? null

  if (explicitArticle) {
    if (!rules || !Object.hasOwn(rules.articles, explicitArticle)) {
      const languageLabel = rules?.label ?? 'This language'
      errors.article = `${languageLabel} does not recognize the article "${explicitArticle}".`
      article = null
    } else {
      article = explicitArticle
      noun = parsedTarget?.noun ?? target
    }
  }

  if (!target) errors.target = 'Noun is required.'

  if (rules?.required && !article) {
    errors.article = 'German nouns must start with der, die, or das.'
  }

  if (article && !noun) errors.noun = 'Noun is required after the article.'

  const grammaticalGender = article && rules
    ? rules.articles[article] ?? 'unknown'
    : 'unknown'
  const normalizedTarget = article && noun
    ? joinArticleAndNoun(article, noun)
    : target

  return {
    value: {
      target: normalizedTarget,
      noun,
      article,
      grammaticalGender,
    },
    errors,
  }
}

const normalizeLegacyGermanNoun = (germanValue, articleValue) => {
  let german = normalizeText(germanValue)
  let article = normalizeArticle(articleValue)
  let grammaticalGender = NOUN_ARTICLE_RULES.german.articles[article]

  if (german && article && grammaticalGender) {
    const parsed = parseNounEntry({ target: german, article }, 'German')
    if (!parsed.errors.article && !parsed.errors.noun) german = parsed.value.target
  } else if (german && !article) {
    const parsed = parseNounEntry(german, 'German')
    if (!parsed.errors.article && !parsed.errors.noun) {
      german = parsed.value.target
      article = parsed.value.article
      grammaticalGender = parsed.value.grammaticalGender
    }
  }

  return { german, article, grammaticalGender }
}

const mergeProgress = (defaults, progress) => {
  const merged = {
    ...defaults,
    ...(isRecord(progress) ? progress : {}),
  }

  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (merged[key] == null) merged[key] = defaultValue
  }

  return merged
}

/**
 * Converts persisted vocabulary records to the current shape without mutating
 * the caller's object. The legacy `gender` property represented part of speech,
 * so it is removed after being migrated to `partOfSpeech`.
 */
export const normalizeVocabItem = (item = {}) => {
  const source = isRecord(item) ? item : {}
  const {
    gender: legacyPartOfSpeech,
    learningProgress,
    reviewProgress,
    hellProgress,
    reviewDates,
    ...rest
  } = source
  const rawPartOfSpeech = normalizeText(source.partOfSpeech ?? legacyPartOfSpeech).toLowerCase()
  const partOfSpeech = LEGACY_PART_OF_SPEECH[rawPartOfSpeech]
    ?? (Object.values(LEGACY_PART_OF_SPEECH).includes(rawPartOfSpeech) ? rawPartOfSpeech : 'other')
  const legacyGermanNoun = normalizeLegacyGermanNoun(source.german, source.article)

  return {
    ...rest,
    german: legacyGermanNoun.german,
    english: typeof source.english === 'string' ? source.english : '',
    example: typeof source.example === 'string' ? source.example : '',
    article: legacyGermanNoun.article,
    grammaticalGender: legacyGermanNoun.grammaticalGender
      ?? normalizeGrammaticalGender(source.grammaticalGender),
    partOfSpeech,
    status: source.status ?? 0,
    familiarity: source.familiarity ?? 0,
    learningProgress: mergeProgress(LEARNING_PROGRESS_DEFAULTS, learningProgress),
    reviewProgress: mergeProgress(REVIEW_PROGRESS_DEFAULTS, reviewProgress),
    hellProgress: mergeProgress(HELL_PROGRESS_DEFAULTS, hellProgress),
    reviewDates: Array.isArray(reviewDates) ? [...reviewDates] : [],
    isNigate: source.isNigate ?? false,
    isStarred: source.isStarred ?? false,
    isCustomized: source.isCustomized ?? false,
    isDeleted: source.isDeleted ?? false,
    successStreak: source.successStreak ?? 0,
    cumulativeFailures: source.cumulativeFailures ?? 0,
    lastReviewed: source.lastReviewed ?? 0,
    lastInteraction: source.lastInteraction ?? 0,
  }
}

/**
 * Trims form values and reports validation failures by field name.
 */
export const validateVocabInput = (input = {}) => {
  const source = isRecord(input) ? input : {}
  const value = Object.fromEntries(
    Object.entries(source).map(([key, fieldValue]) => [
      key,
      typeof fieldValue === 'string' ? fieldValue.trim() : fieldValue,
    ]),
  )
  const errors = {}

  for (const field of REQUIRED_INPUT_FIELDS) {
    value[field] = typeof value[field] === 'string' ? value[field] : ''
    if (!value[field]) errors[field] = REQUIRED_INPUT_MESSAGES[field]
  }

  return { value, errors }
}

/**
 * Returns a new array so consumers can safely reorder or extend the result.
 * Language names, native names, ISO codes, and locale strings are accepted.
 */
export const getSpecialCharacters = (language) => {
  if (typeof language !== 'string') return []

  const normalizedLanguage = language.trim().toLowerCase()
  const baseLanguage = normalizedLanguage.split(/[-_]/, 1)[0]
  const canonicalLanguage = LANGUAGE_ALIASES[normalizedLanguage] ?? LANGUAGE_ALIASES[baseLanguage]

  return [...(SPECIAL_CHARACTERS[canonicalLanguage] ?? [])]
}

const normalizeCount = (value, fallback = 0) => (
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback
)

/**
 * Determines how many vocabulary words should be used to build a memory board.
 */
export const getMemoryTargetCount = (wordCount, max = 8) => Math.min(
  normalizeCount(wordCount),
  normalizeCount(max, 8),
)
