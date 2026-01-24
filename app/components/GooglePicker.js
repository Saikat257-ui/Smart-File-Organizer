"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function GooglePicker({ onPick, oauthToken: propOauthToken, developerKey: propDeveloperKey, appId: propAppId, onStatus }) {
  const { data: session } = useSession()
  const [pickerReady, setPickerReady] = useState(false)

  // Prefer props (Dashboard can pass them) but fall back to NEXT_PUBLIC_* env vars
  const apiKey = propDeveloperKey || process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID // still useful for other flows if needed
  // NOTE: appId for Picker is the numeric project number (not the OAuth client ID). Accept via prop or NEXT_PUBLIC_GOOGLE_PICKER_APP_ID
  const appId = propAppId || process.env.NEXT_PUBLIC_GOOGLE_PICKER_APP_ID

  useEffect(() => {
    // Load the Google API script if it's not already present
    if (!window.gapi) {
      const s = document.createElement('script')
      s.src = 'https://apis.google.com/js/api.js'
      s.async = true
      s.defer = true
      s.onload = () => {
        try {
          // Try to load the picker via gapi
          if (window.gapi && window.gapi.load) {
            window.gapi.load('picker', () => setPickerReady(true))
          } else {
            // Fallback: attempt to load the standalone picker script
            const p = document.createElement('script')
            p.src = 'https://www.gstatic.com/picker/picker.js'
            p.async = true
            p.defer = true
            p.onload = () => setPickerReady(Boolean(window.google && window.google.picker))
            document.body.appendChild(p)
          }
        } catch (e) {
          // fallback: google.picker may already be available
          setPickerReady(Boolean(window.google && window.google.picker))
        }
      }
      document.body.appendChild(s)
    } else {
        try {
        if (window.gapi && window.gapi.load) {
          window.gapi.load('picker', () => setPickerReady(true))
        } else if (window.google && window.google.picker) {
          setPickerReady(true)
        } else {
          // load standalone picker.js
          const p = document.createElement('script')
          p.src = 'https://www.gstatic.com/picker/picker.js'
          p.async = true
          p.defer = true
          p.onload = () => setPickerReady(Boolean(window.google && window.google.picker))
          document.body.appendChild(p)
        }
      } catch (e) {
        setPickerReady(Boolean(window.google && window.google.picker))
      }
    }
  }, [])

  const openPicker = () => {
    const oauthToken = propOauthToken || session?.accessToken

    const missing = []
    if (!pickerReady) missing.push('Google Picker API not loaded')
    if (!oauthToken) missing.push('user not signed in (no access token)')
    if (!apiKey) missing.push('NEXT_PUBLIC_GOOGLE_API_KEY (developer key)')
    if (onStatus) {
      onStatus({ pickerReady, hasToken: Boolean(oauthToken), hasKey: Boolean(apiKey), missing })
    }
    if (missing.length > 0) {
      // Show a clear, actionable message and don't open the Picker
      alert(
        'Google Picker not ready: ' + missing.join('; ') + '\n\n' +
        'To fix: set the missing NEXT_PUBLIC variables in your .env.local (for example\n' +
        'NEXT_PUBLIC_GOOGLE_API_KEY=your_developer_key) and restart the dev server.\n' +
        'If you see "user not signed in", sign in with Google first.'
      )
      return
    }

    // Build a basic Docs view (works for Drive files including Docs/Sheets/Drive files)
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)

    const builder = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(oauthToken)
      .setDeveloperKey(apiKey)
    // Only set appId if we have a numeric project number (optional)
    if (appId) builder.setAppId(appId)

    const picker = builder
      .setCallback((data) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const docs = (data.docs || []).map(d => ({
            id: d.id,
            name: d.name,
            mimeType: d.mimeType || d.type,
            url: d.url || d.embedUrl || null
          }))
          if (onPick) onPick(docs)
        }
      })
      .build()

    picker.setVisible(true)
  }

    return (
      <button
        type="button"
        onClick={openPicker}
        disabled={!pickerReady || !(propOauthToken || session?.accessToken) || !apiKey}
        title={!pickerReady || !(propOauthToken || session?.accessToken) || !apiKey
          ? 'Picker not ready: ensure you are signed in and NEXT_PUBLIC_GOOGLE_API_KEY is set'
          : 'Pick files from Google Drive'
        }
        className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Pick files from Google Drive
      </button>
    )
}
