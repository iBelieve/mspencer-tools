import { createFileRoute, Link, useRouter } from "@tanstack/react-router"

import { SITE_NAME } from "@/lib/site"

export const Route = createFileRoute("/")({
  component: Home,
})

function Home() {
  const router = useRouter()
  // Every route that declares a title in its staticData is a tool.
  // (Object.values would widen the routes to `any`, so go through typed keys.)
  const routes = router.routesByPath
  const tools = (Object.keys(routes) as (keyof typeof routes)[])
    .flatMap((path) => {
      const { title, description } = routes[path].options.staticData ?? {}
      return title ? [{ path, title, description }] : []
    })
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {SITE_NAME}
        </h1>
        <p className="text-muted-foreground">
          Small, single-purpose tools I've built, mostly with help from Claude.
        </p>
      </div>
      <ul className="divide-y border-y">
        {tools.map((tool) => (
          <li key={tool.path}>
            <Link to={tool.path} className="group block py-4">
              <span className="font-medium group-hover:underline">
                {tool.title}
              </span>
              {tool.description && (
                <span className="block text-sm text-muted-foreground">
                  {tool.description}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
