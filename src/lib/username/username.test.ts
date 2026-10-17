import { describe, expect, it } from "vitest"

import {
  cryptoRandomInt,
  formatUsername,
  generateParts,
  PATTERN_WORDS,
  PATTERNS,
  type UsernameParts,
} from "./username"
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

const parts: UsernameParts = {
  first: "Brave",
  second: "Otter",
  twoDigits: 42,
  threeDigits: 817,
}

describe("formatUsername", () => {
  it.each([
    ["pascal", 2, "BraveOtter42"],
    ["pascal", 3, "BraveOtter817"],
    ["pascal", 0, "BraveOtter"],
    ["lower", 2, "braveotter42"],
    ["lower", 0, "braveotter"],
    ["snake", 2, "brave_otter_42"],
    ["snake", 0, "brave_otter"],
    ["kebab", 3, "brave-otter-817"],
    ["kebab", 0, "brave-otter"],
  ] as const)("%s style with %i digits → %s", (style, digits, expected) => {
    expect(formatUsername(parts, { style, digits })).toBe(expected)
  })
})

describe("generateParts", () => {
  it("uses the lowest values when randomness is all zeros", () => {
    expect(
      generateParts({ pattern: "animal", alliterate: false }, () => 0),
    ).toEqual({
      first: ADJECTIVES[0],
      second: ANIMALS[0],
      twoDigits: 10,
      threeDigits: 100,
    })
  })

  it("uses the highest values when randomness is maxed out", () => {
    expect(
      generateParts({ pattern: "nature", alliterate: false }, (max) => max - 1),
    ).toEqual({
      first: NATURE_FIRSTS.at(-1),
      second: NATURE_SECONDS.at(-1),
      twoDigits: 99,
      threeDigits: 999,
    })
  })

  it("never produces leading zeros with real randomness", () => {
    for (let i = 0; i < 1000; i++) {
      const { twoDigits, threeDigits } = generateParts({
        pattern: "mix",
        alliterate: false,
      })
      expect(String(twoDigits)).toMatch(/^[1-9]\d$/)
      expect(String(threeDigits)).toMatch(/^[1-9]\d\d$/)
    }
  })

  it.each(PATTERNS)("draws %s words from that pattern's lists", (pattern) => {
    const { firsts, seconds } = PATTERN_WORDS[pattern]
    for (let i = 0; i < 200; i++) {
      const { first, second } = generateParts({ pattern, alliterate: false })
      expect(firsts).toContain(first)
      expect(seconds).toContain(second)
    }
  })

  it("mixes every pattern", () => {
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) {
      const { first, second } = generateParts({
        pattern: "mix",
        alliterate: false,
      })
      for (const pattern of PATTERNS) {
        const firsts: readonly string[] = PATTERN_WORDS[pattern].firsts
        const seconds: readonly string[] = PATTERN_WORDS[pattern].seconds
        if (firsts.includes(first) && seconds.includes(second)) {
          seen.add(pattern)
        }
      }
    }
    expect([...seen].sort()).toEqual([...PATTERNS].sort())
  })

  it.each(["mix", ...PATTERNS] as const)(
    "alliterates in %s pattern",
    (pattern) => {
      for (let i = 0; i < 300; i++) {
        const { first, second } = generateParts({ pattern, alliterate: true })
        expect(second[0]).toBe(first[0])
      }
    },
  )

  it("never pairs words that contain each other", () => {
    // Blue + Bluejay is the known case: rig the first two rolls to pick it,
    // then let later rolls fall through to the end of each list.
    const rolls = [COLORS.indexOf("Blue"), ANIMALS.indexOf("Bluejay")]
    const { first, second } = generateParts(
      { pattern: "color", alliterate: false },
      (max) => rolls.shift() ?? max - 1,
    )
    expect(`${first}${second}`).not.toBe("BlueBluejay")
  })

  it.each(ECHO_PAIRS)("never pairs %s with %s", (echoFirst, echoSecond) => {
    // Find a pattern that could produce the pair, then rig the rolls to pick it.
    const pattern = PATTERNS.find(
      (p) =>
        (PATTERN_WORDS[p].firsts as readonly string[]).includes(echoFirst) &&
        (PATTERN_WORDS[p].seconds as readonly string[]).includes(echoSecond),
    )
    if (!pattern) throw new Error(`No pattern has ${echoFirst} + ${echoSecond}`)
    const { firsts, seconds } = PATTERN_WORDS[pattern]
    const rolls = [
      (firsts as readonly string[]).indexOf(echoFirst),
      (seconds as readonly string[]).indexOf(echoSecond),
    ]
    const { first, second } = generateParts(
      { pattern, alliterate: false },
      (max) => rolls.shift() ?? max - 1,
    )
    expect([first, second]).not.toEqual([echoFirst, echoSecond])
  })
})

describe("cryptoRandomInt", () => {
  it("stays within [0, max)", () => {
    for (let i = 0; i < 1000; i++) {
      const value = cryptoRandomInt(7)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(7)
    }
  })

  it.each([0, -1, 1.5, 2 ** 32 + 1])("rejects max = %d", (max) => {
    expect(() => cryptoRandomInt(max)).toThrow(RangeError)
  })
})

describe.each([
  ["ADJECTIVES", ADJECTIVES, 140],
  ["ANIMALS", ANIMALS, 140],
  ["NATURE_FIRSTS", NATURE_FIRSTS, 50],
  ["NATURE_SECONDS", NATURE_SECONDS, 50],
  ["COLORS", COLORS, 35],
  ["SPACE_FIRSTS", SPACE_FIRSTS, 20],
  ["SPACE_SECONDS", SPACE_SECONDS, 45],
])("%s word list", (_name, words: readonly string[], minimum) => {
  it(`has at least ${minimum} words`, () => {
    expect(words.length).toBeGreaterThanOrEqual(minimum)
  })

  it("has no duplicates", () => {
    expect(new Set(words).size).toBe(words.length)
  })

  it("only has single Capitalized words of 2–8 letters", () => {
    for (const word of words) expect(word).toMatch(/^[A-Z][a-z]{1,7}$/)
  })

  it("is sorted alphabetically", () => {
    expect(words).toEqual([...words].sort())
  })
})

describe("pattern word lists", () => {
  it.each(PATTERNS)(
    "%s firsts and seconds don't share words, so a name can't repeat itself",
    (pattern) => {
      const seconds = new Set<string>(PATTERN_WORDS[pattern].seconds)
      expect(
        PATTERN_WORDS[pattern].firsts.filter((w) => seconds.has(w)),
      ).toEqual([])
    },
  )

  it.each([
    ["ADJECTIVES", ADJECTIVES],
    ["NATURE_FIRSTS", NATURE_FIRSTS],
  ])("%s includes every space modifier", (_name, words) => {
    for (const word of SPACE_FIRSTS) expect(words).toContain(word)
  })
})
