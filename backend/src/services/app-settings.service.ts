import { pool } from '../config/database'

const KEY_SPREADSHEET_ID = 'google_sheets_spreadsheet_id'
const KEY_LAST_SYNC_AT = 'google_sheets_last_sync_at'
const KEY_LAST_SYNC_STATUS = 'google_sheets_last_sync_status'
const KEY_LAST_SYNC_MESSAGE = 'google_sheets_last_sync_message'

export interface GoogleSheetsSettings {
  spreadsheetId: string
  lastSyncAt: string | null
  lastSyncStatus: 'ok' | 'error' | null
  lastSyncMessage: string | null
}

async function ensureSettingsTable(): Promise<void> {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS app_settings (
      key_name VARCHAR(100) NOT NULL,
      value_text TEXT NULL,
      updated_by INT UNSIGNED NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (key_name),
      CONSTRAINT fk_app_settings_updated_by
        FOREIGN KEY (updated_by) REFERENCES usuarios(id)
        ON UPDATE CASCADE ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  )
}

async function getValue(key: string): Promise<string | null> {
  const [rows] = await pool.execute<any[]>(
    'SELECT value_text FROM app_settings WHERE key_name = ? LIMIT 1',
    [key]
  )
  return rows[0]?.value_text ?? null
}

async function setValue(key: string, value: string | null, updatedBy: number): Promise<void> {
  await pool.execute(
    `INSERT INTO app_settings (key_name, value_text, updated_by)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value_text = VALUES(value_text), updated_by = VALUES(updated_by)`,
    [key, value, updatedBy]
  )
}

export const appSettingsService = {
  async getGoogleSheetsSettings(): Promise<GoogleSheetsSettings> {
    await ensureSettingsTable()

    const [spreadsheetId, lastSyncAt, lastSyncStatus, lastSyncMessage] = await Promise.all([
      getValue(KEY_SPREADSHEET_ID),
      getValue(KEY_LAST_SYNC_AT),
      getValue(KEY_LAST_SYNC_STATUS),
      getValue(KEY_LAST_SYNC_MESSAGE),
    ])

    return {
      spreadsheetId: spreadsheetId ?? '',
      lastSyncAt,
      lastSyncStatus: (lastSyncStatus === 'ok' || lastSyncStatus === 'error' ? lastSyncStatus : null),
      lastSyncMessage,
    }
  },

  async setGoogleSheetsSpreadsheetId(spreadsheetId: string, userId: number): Promise<void> {
    await ensureSettingsTable()
    await setValue(KEY_SPREADSHEET_ID, spreadsheetId, userId)
  },

  async getGoogleSheetsSpreadsheetId(): Promise<string> {
    await ensureSettingsTable()
    const spreadsheetId = await getValue(KEY_SPREADSHEET_ID)
    return spreadsheetId ?? ''
  },

  async setGoogleSheetsSyncResult(
    result: { status: 'ok' | 'error'; message: string },
    userId: number
  ): Promise<void> {
    await ensureSettingsTable()

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    await Promise.all([
      setValue(KEY_LAST_SYNC_AT, now, userId),
      setValue(KEY_LAST_SYNC_STATUS, result.status, userId),
      setValue(KEY_LAST_SYNC_MESSAGE, result.message, userId),
    ])
  },
}
