import { createFileRoute, stripSearchParams } from "@tanstack/react-router"
import { CopyIcon, RefreshCwIcon } from "lucide-react"
import { useCallback, useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  DIGIT_COUNTS,
  formatUsername,
  generateParts,
  PATTERN_CHOICES,
  STYLES,
  type DigitCount,
  type GenerateOptions,
  type PatternChoice,
  type Style,
  type UsernameParts,
} from "@/lib/username/username"
import { pageTitle } from "@/lib/site"

const TITLE = "Username Generator"
const BATCH_SIZE = 10

const defaultSearch = {
  pattern: "mix",
  style: "pascal",
  digits: 2,
  alliterate: false,
} as const

const searchSchema = z.object({
  pattern: z
    .enum(PATTERN_CHOICES)
    .default(defaultSearch.pattern)
    .catch(defaultSearch.pattern),
  style: z.enum(STYLES).default(defaultSearch.style).catch(defaultSearch.style),
  digits: z
    .union(DIGIT_COUNTS.map((n) => z.literal(n)))
    .default(defaultSearch.digits)
    .catch(defaultSearch.digits),
  alliterate: z
    .boolean()
    .default(defaultSearch.alliterate)
    .catch(defaultSearch.alliterate),
})

export const Route = createFileRoute("/username-generator")({
  staticData: {
    title: TITLE,
    description: "Random, friendly usernames like BraveOtter42 or NorthStar17.",
  },
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  head: () => ({ meta: [{ title: pageTitle(TITLE) }] }),
  component: UsernameGenerator,
})

const PATTERN_LABELS: Record<PatternChoice, string> = {
  mix: "Mix",
  animal: "Animal",
  nature: "Nature",
  color: "Color",
}

const STYLE_LABELS: Record<Style, string> = {
  pascal: "PascalCase",
  lower: "lowercase",
  snake: "snake_case",
  kebab: "kebab-case",
}

const DIGIT_LABELS: Record<DigitCount, string> = {
  0: "None",
  2: "2",
  3: "3",
}

function generateBatch(options: GenerateOptions): UsernameParts[] {
  return Array.from({ length: BATCH_SIZE }, () => generateParts(options))
}

function UsernameGenerator() {
  const { pattern, style, digits, alliterate } = Route.useSearch()
  const navigate = Route.useNavigate()
  const alliterateId = useId()

  // Pattern and alliteration change which words are picked, so they reroll the
  // batch; style and digits only reformat it.
  const batchKey = `${pattern}:${String(alliterate)}`
  const [state, setState] = useState(() => ({
    key: batchKey,
    batch: generateBatch({ pattern, alliterate }),
  }))
  if (state.key !== batchKey) {
    setState({ key: batchKey, batch: generateBatch({ pattern, alliterate }) })
  }
  const { batch } = state

  const regenerate = useCallback(() => {
    setState({ key: batchKey, batch: generateBatch({ pattern, alliterate }) })
  }, [batchKey, pattern, alliterate])

  // Space regenerates, unless focus is on something Space already activates.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== " " || event.repeat) return
      if (
        event.target instanceof Element &&
        event.target.closest(
          "button, input, textarea, select, a, [role=menuitem]",
        )
      ) {
        return
      }
      event.preventDefault()
      regenerate()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [regenerate])

  async function copy(username: string) {
    try {
      await navigator.clipboard.writeText(username)
      toast.success(`Copied ${username}`)
    } catch {
      toast.error("Couldn't copy to the clipboard")
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {TITLE}
        </h1>
        <p className="text-muted-foreground">
          Two words and a number. Click a name to copy it.
        </p>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <OptionGroup
          label="Pattern"
          options={PATTERN_CHOICES}
          labels={PATTERN_LABELS}
          value={pattern}
          onChange={(next) => {
            void navigate({
              search: (prev) => ({ ...prev, pattern: next }),
              replace: true,
            })
          }}
        />
        <OptionGroup
          label="Style"
          options={STYLES}
          labels={STYLE_LABELS}
          value={style}
          onChange={(next) => {
            void navigate({
              search: (prev) => ({ ...prev, style: next }),
              replace: true,
            })
          }}
        />
        <OptionGroup
          label="Digits"
          options={DIGIT_COUNTS}
          labels={DIGIT_LABELS}
          value={digits}
          onChange={(next) => {
            void navigate({
              search: (prev) => ({ ...prev, digits: next }),
              replace: true,
            })
          }}
        />
        <div className="flex items-center gap-2 self-end sm:h-8">
          <Switch
            id={alliterateId}
            checked={alliterate}
            onCheckedChange={(checked) => {
              void navigate({
                search: (prev) => ({ ...prev, alliterate: checked }),
                replace: true,
              })
            }}
          />
          <Label htmlFor={alliterateId}>Alliterate</Label>
        </div>
      </div>

      <ul className="divide-y overflow-hidden rounded-lg border">
        {batch.map((parts, i) => {
          const username = formatUsername(parts, { style, digits })
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => void copy(username)}
                className="group flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left font-mono text-lg transition-colors outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <span className="truncate">{username}</span>
                <CopyIcon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                />
                <span className="sr-only">Copy</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center gap-3">
        <Button onClick={regenerate}>
          <RefreshCwIcon data-icon="inline-start" />
          Generate
        </Button>
        <span className="text-sm text-muted-foreground">
          or press{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
            Space
          </kbd>
        </span>
      </div>
    </div>
  )
}

/** A labelled single-select toggle group over a fixed set of string or number options. */
function OptionGroup<T extends string | number>({
  label,
  options,
  labels,
  value,
  onChange,
}: {
  label: string
  options: readonly T[]
  labels: Record<T, string>
  value: T
  onChange: (value: T) => void
}) {
  const labelId = useId()

  return (
    <div className="w-full space-y-2 sm:w-auto">
      <Label id={labelId}>{label}</Label>
      <ToggleGroup
        aria-labelledby={labelId}
        variant="outline"
        spacing={0}
        className="w-full sm:w-fit"
        // Base UI toggle values are strings; map back to the typed option.
        value={[String(value)]}
        onValueChange={([next]) => {
          const option = options.find((o) => String(o) === next)
          if (option !== undefined) onChange(option)
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option}
            value={String(option)}
            className="min-w-12 flex-1 px-2 sm:flex-none sm:px-2.5"
          >
            {labels[option]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
