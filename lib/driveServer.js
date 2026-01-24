// Server-side helper utilities for Drive API calls that use a server-only API key.
// These functions must only be imported/used from server-side code (API routes / server components).

export async function fetchPublicFileMetadata(fileId) {
  const key = process.env.GOOGLE_API_KEY_SERVER
  if (!key) throw new Error('Missing GOOGLE_API_KEY_SERVER in server env')

  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,webViewLink&key=${encodeURIComponent(key)}`
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Drive API error ${res.status}: ${body}`)
  }
  return res.json()
}

export async function fetchDriveDiscovery() {
  const key = process.env.GOOGLE_API_KEY_SERVER
  if (!key) throw new Error('Missing GOOGLE_API_KEY_SERVER in server env')
  const url = `https://www.googleapis.com/discovery/v1/apis/drive/v3/rest?key=${encodeURIComponent(key)}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Drive discovery error ${res.status}: ${body}`)
  }
  return res.json()
}
