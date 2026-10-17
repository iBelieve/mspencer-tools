import {
  ADJECTIVES,
  ANIMALS,
  COLORS,
  ECHO_PAIRS,
  NATURE_FIRSTS,
  NATURE_SECONDS,
  SPACE_FIRSTS,
  SPACE_SECONDS,
} from "./words"

export const STYLES = ["pascal", "lower", "snake", "kebab"] as const
export type Style = (typeof STYLES)[number]

export const DIGIT_COUNTS = [0, 2, 3] as const
export type DigitCount = (typeof DIGIT_COUNTS)[number]

/** Each pattern pairs a list of first words with a list of second words. */
export const PATTERN_WORDS = {
  animal: { firsts: ADJECTIVES, seconds: ANIMALS }, // BraveOtter
  nature: { firsts: NATURE_FIRSTS, seconds: NATURE_SECONDS }, // MapleLeaf
  color: { firsts: COLORS, seconds: ANIMALS }, // IndigoOwl
  space: { firsts: SPACE_FIRSTS, seconds: SPACE_SECONDS }, // CosmicComet
} as const satisfies Record<
  string,
  { firsts: readonly string[]; seconds: readonly string[] }
>
export type Pattern = keyof typeof PATTERN_WORDS
export const PATTERNS = Object.keys(PATTERN_WORDS) as Pattern[]

/** "mix" picks a random pattern for each username. */
export const PATTERN_CHOICES = ["mix", ...PATTERNS] as const
export type PatternChoice = (typeof PATTERN_CHOICES)[number]

export interface GenerateOptions {
  pattern: PatternChoice
  /** Both words start with the same letter, e.g. SwiftSwan. */
  alliterate: boolean
}

export interface FormatOptions {
  style: Style
  digits: DigitCount
}

/**
 * The random pieces of one username. Both number lengths are rolled up front so
 * changing the style or digit count reformats the same name instead of rerolling it.
 */
export interface UsernameParts {
  first: string
  second: string
  /** 10–99, never a leading zero. */
  twoDigits: number
  /** 100–999, never a leading zero. */
  threeDigits: number
}

/** Returns a uniformly random integer in [0, max). */
export type RandomInt = (max: number) => number

/** Unbiased random integer in [0, max) from the Web Crypto API. */
export const cryptoRandomInt: RandomInt = (max) => {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) {
    throw new RangeError(`max must be an integer in (0, 2^32], got ${max}`)
  }
  // Rejection sampling: discard values from the final partial range to avoid modulo bias.
  const limit = 2 ** 32 - (2 ** 32 % max)
  const buffer = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buffer)
    const value = buffer[0] ?? 0
    if (value < limit) return value % max
  }
}

function pick<T>(items: readonly T[], randomInt: RandomInt): T {
  const item = items[randomInt(items.length)]
  if (item === undefined) throw new Error("Cannot pick from an empty list")
  return item
}

const initial = (word: string) => word.charAt(0)

const echoPairs = new Set(ECHO_PAIRS.map(([a, b]) => `${a}+${b}`))

/** Avoids pairs that repeat themselves, like Blue + Bluejay or Martian + Mars. */
function overlaps(first: string, second: string) {
  const a = first.toLowerCase()
  const b = second.toLowerCase()
  return a.includes(b) || b.includes(a) || echoPairs.has(`${first}+${second}`)
}

function pickWords(
  pattern: Pattern,
  alliterate: boolean,
  randomInt: RandomInt,
): { first: string; second: string } {
  const { firsts, seconds } = PATTERN_WORDS[pattern]
  for (let attempt = 0; attempt < 100; attempt++) {
    if (!alliterate) {
      const first = pick(firsts, randomInt)
      const second = pick(seconds, randomInt)
      if (!overlaps(first, second)) return { first, second }
      continue
    }
    // Only first words whose letter also starts some second word can alliterate.
    const secondInitials = new Set(seconds.map(initial))
    const first = pick(
      firsts.filter((w) => secondInitials.has(initial(w))),
      randomInt,
    )
    const second = pick(
      seconds.filter((w) => initial(w) === initial(first)),
      randomInt,
    )
    if (!overlaps(first, second)) return { first, second }
  }
  throw new Error(`Couldn't find a usable word pair for "${pattern}"`)
}

export function generateParts(
  { pattern, alliterate }: GenerateOptions,
  randomInt: RandomInt = cryptoRandomInt,
): UsernameParts {
  const resolved = pattern === "mix" ? pick(PATTERNS, randomInt) : pattern
  return {
    ...pickWords(resolved, alliterate, randomInt),
    twoDigits: 10 + randomInt(90),
    threeDigits: 100 + randomInt(900),
  }
}

export function formatUsername(
  parts: UsernameParts,
  { style, digits }: FormatOptions,
): string {
  const number =
    digits === 2
      ? String(parts.twoDigits)
      : digits === 3
        ? String(parts.threeDigits)
        : ""
  const words = [parts.first, parts.second]

  switch (style) {
    case "pascal":
      return words.join("") + number
    case "lower":
      return (words.join("") + number).toLowerCase()
    case "snake":
      return [...words, number].filter(Boolean).join("_").toLowerCase()
    case "kebab":
      return [...words, number].filter(Boolean).join("-").toLowerCase()
  }
}
