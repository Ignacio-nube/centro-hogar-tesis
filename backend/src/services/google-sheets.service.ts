import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { getExportData } from './export-data.service'

interface GoogleAccessTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

function spreadsheetIdFromInput(value: string): string {
  const trimmed = value.trim()
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : trimmed
}

async function getAccessToken(): Promise<string> {
  if (!env.googleSheets.serviceAccountEmail || !env.googleSheets.privateKey) {
    throw new Error('Faltan credenciales de Google Sheets en variables de entorno')
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const assertion = jwt.sign(
    {
      iss: env.googleSheets.serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    },
    env.googleSheets.privateKey,
    { algorithm: 'RS256' }
  )

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`No se pudo obtener token de Google: ${text}`)
  }

  const data = (await res.json()) as GoogleAccessTokenResponse
  if (!data.access_token) throw new Error('Respuesta inválida de token de Google')

  return data.access_token
}

async function apiRequest<T>(
  token: string,
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google Sheets API error: ${text}`)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

function toSheetRows(rows: Record<string, unknown>[]): string[][] {
  if (rows.length === 0) return [['sin_datos']]

  const headers = Object.keys(rows[0])
  const values = rows.map((row) => headers.map((h) => {
    const value = row[h]
    if (value === null || value === undefined) return ''
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }))

  return [headers, ...values]
}

export const googleSheetsService = {
  parseSpreadsheetId(input: string): string {
    return spreadsheetIdFromInput(input)
  },

  async syncFull(spreadsheetInput: string): Promise<{ sheets: number; rows: number }> {
    const spreadsheetId = spreadsheetIdFromInput(spreadsheetInput)
    if (!spreadsheetId) throw new Error('Spreadsheet ID inválido')

    const token = await getAccessToken()
    const tables = await getExportData()

    const metadata = await apiRequest<any>(
      token,
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`
    )

    const existingNames = new Set<string>((metadata.sheets ?? []).map((s: any) => s.properties?.title).filter(Boolean))

    const missingSheets = tables
      .map((t) => t.sheetName)
      .filter((name) => !existingNames.has(name))

    if (missingSheets.length > 0) {
      await apiRequest(
        token,
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
        {
          method: 'POST',
          body: JSON.stringify({
            requests: missingSheets.map((name) => ({ addSheet: { properties: { title: name } } })),
          }),
        }
      )
    }

    const clearRanges = tables.map((t) => `${t.sheetName}!A1:ZZ1000000`)

    await apiRequest(
      token,
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchClear`,
      {
        method: 'POST',
        body: JSON.stringify({ ranges: clearRanges }),
      }
    )

    const data = tables.map((t) => ({
      range: `${t.sheetName}!A1`,
      majorDimension: 'ROWS',
      values: toSheetRows(t.rows),
    }))

    await apiRequest(
      token,
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
      {
        method: 'POST',
        body: JSON.stringify({
          valueInputOption: 'RAW',
          data,
        }),
      }
    )

    const totalRows = tables.reduce((acc, t) => acc + t.rows.length, 0)
    return { sheets: tables.length, rows: totalRows }
  },
}
