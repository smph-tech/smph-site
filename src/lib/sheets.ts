import { google } from 'googleapis';
import { SHEET_HEADERS } from './sheet-row';
import type { SheetsConfig } from './env';

const quoteTab = (tab: string) => `'${tab.replace(/'/g, "''")}'`;

/** Appends one row. Writes the header row first if the tab is empty. */
export async function appendEnquiryRow(cfg: SheetsConfig, row: string[]): Promise<void> {
  const auth = new google.auth.JWT({
    email: cfg.clientEmail,
    key: cfg.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const tab = quoteTab(cfg.tab);

  const head = await sheets.spreadsheets.values.get({
    spreadsheetId: cfg.sheetId,
    range: `${tab}!A1:H1`,
  });
  if (!head.data.values?.[0]?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: cfg.sheetId,
      range: `${tab}!A1:H1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[...SHEET_HEADERS]] },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: cfg.sheetId,
    range: `${tab}!A:H`,
    // Safe because every cell went through sanitizeCell() first.
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}
