import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
} from "@tanstack/react-router"

import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "@/components/ui/sonner"
import { pageTitle, SITE_NAME } from "@/lib/site"

export const Route = createRootRoute({
  head: () => ({ meta: [{ title: pageTitle() }] }),
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <ThemeProvider>
      <HeadContent />
      <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4">
        <header className="flex items-center justify-between py-4">
          <Link
            to="/"
            className="font-heading font-semibold tracking-tight hover:underline"
          >
            {SITE_NAME}
          </Link>
          <ThemeToggle />
        </header>
        <main className="flex-1 pt-6 pb-16">
          <Outlet />
        </main>
      </div>
      <Toaster position="bottom-center" />
    </ThemeProvider>
  )
}

function NotFound() {
  return (
    <div className="space-y-2">
      <h1 className="font-heading text-2xl font-semibold">Not found</h1>
      <p className="text-muted-foreground">
        There's no tool here.{" "}
        <Link to="/" className="underline underline-offset-4">
          See all tools
        </Link>
        .
      </p>
    </div>
  )
}
