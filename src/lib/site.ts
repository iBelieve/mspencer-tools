export const SITE_NAME = "Michael Spencer's Tools"

export function pageTitle(title?: string) {
  return title ? `${title} · ${SITE_NAME}` : SITE_NAME
}
