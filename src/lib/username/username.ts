import { ADJECTIVES, ANIMALS } from "./words"

export const STYLES = ["pascal", "lower", "snake", "kebab"] as const
export type Style = (typeof STYLES)[number]

export const DIGIT_COUNTS = [0, 2, 3] as const
export type DigitCount = (typeof DIGIT_COUNTS)[number]

export interface UsernameOptions {
  style: Style
  digits: DigitCount
}

/**
 * The random pieces of one username. Both number lengths are rolled up front so
 * changing the style or digit count reformats the same name instead of rerolling it.
 */
export interface UsernameParts {
  adjective: string
  animal: string
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

export function generateParts(
  randomInt: RandomInt = cryptoRandomInt,
): UsernameParts {
  return {
    adjective: pick(ADJECTIVES, randomInt),
    animal: pick(ANIMALS, randomInt),
    twoDigits: 10 + randomInt(90),
    threeDigits: 100 + randomInt(900),
  }
}

export function formatUsername(
  parts: UsernameParts,
  { style, digits }: UsernameOptions,
): string {
  const number =
    digits === 2
      ? String(parts.twoDigits)
      : digits === 3
        ? String(parts.threeDigits)
        : ""
  const words = [parts.adjective, parts.animal]

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
