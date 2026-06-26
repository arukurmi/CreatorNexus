// Convert an "@handle" into a public Instagram profile URL.
export function instagramUrl(handle: string): string {
  const username = handle.replace(/^@/, '')
  return `https://instagram.com/${username}`
}
