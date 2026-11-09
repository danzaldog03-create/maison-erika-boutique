const allowedNextPaths = new Set(['/', '/admin'])
const validationOrigin = 'https://maison-erika.invalid'

/**
 * Returns a known internal destination after OAuth. Query strings, fragments,
 * protocol-relative URLs, backslash paths, and every unlisted path fall back
 * to the admin landing page.
 */
export function resolveSafeNextPath(next: string | null): '/' | '/admin' {
  if (!next?.startsWith('/')) return '/admin'

  try {
    const candidate = new URL(next, validationOrigin)
    if (candidate.origin !== validationOrigin) return '/admin'
    if (candidate.search || candidate.hash) return '/admin'

    return allowedNextPaths.has(candidate.pathname)
      ? candidate.pathname as '/' | '/admin'
      : '/admin'
  } catch {
    return '/admin'
  }
}
