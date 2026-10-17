import { describe, expect, it } from "vitest"

import {
  cryptoRandomInt,
  formatUsername,
  generateParts,
  type UsernameParts,
} from "./username"
import { ADJECTIVES, ANIMALS } from "./words"

const parts: UsernameParts = {
  adjective: "Brave",
  animal: "Otter",
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
    expect(generateParts(() => 0)).toEqual({
      adjective: ADJECTIVES[0],
      animal: ANIMALS[0],
      twoDigits: 10,
      threeDigits: 100,
    })
  })

  it("uses the highest values when randomness is maxed out", () => {
    expect(generateParts((max) => max - 1)).toEqual({
      adjective: ADJECTIVES.at(-1),
      animal: ANIMALS.at(-1),
      twoDigits: 99,
      threeDigits: 999,
    })
  })

  it("never produces leading zeros with real randomness", () => {
    for (let i = 0; i < 1000; i++) {
      const { twoDigits, threeDigits } = generateParts()
      expect(String(twoDigits)).toMatch(/^[1-9]\d$/)
      expect(String(threeDigits)).toMatch(/^[1-9]\d\d$/)
    }
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
  ["ADJECTIVES", ADJECTIVES],
  ["ANIMALS", ANIMALS],
])("%s word list", (_name, words: readonly string[]) => {
  it("has at least 140 words", () => {
    expect(words.length).toBeGreaterThanOrEqual(140)
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
