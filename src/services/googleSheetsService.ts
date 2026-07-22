/**
 * Google Sheets Export & Event Archival Service
 * Handles exporting post-event feedback, attendance stats, theme metadata,
 * and comments to Google Sheets before automatic event deletion.
 */

import { EventModel, Guest, GuestbookEntry } from '../types';

export interface ArchiveExportData {
  event: EventModel;
  guests: Guest[];
  guestbookEntries?: GuestbookEntry[];
  rating?: number;
  comments?: string;
}

export interface GoogleSheetsExportResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  message: string;
  exportedRow?: (string | number)[];
}

// In-memory token cache
let cachedAccessToken: string | null = null;

export const setGoogleAccessToken = (token: string) => {
  cachedAccessToken = token;
};

export const getGoogleAccessToken = () => cachedAccessToken;

/**
 * Initiates Google OAuth Token flow using Google Identity Services (GIS)
 */
export async function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (cachedAccessToken) {
      return resolve(cachedAccessToken);
    }

    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      // Fallback if GIS isn't loaded yet
      return reject(new Error("Google Identity Services script not ready. Please try again."));
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: '80446b20-4923-47ea-b1e4-e8d8c93d55d1.apps.googleusercontent.com', // AI Studio workspace OAuth client
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
          } else if (response.access_token) {
            cachedAccessToken = response.access_token;
            resolve(response.access_token);
          } else {
            reject(new Error("Failed to retrieve Google OAuth access token."));
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Formats event data into a clean Google Sheets row
 */
export function buildArchiveRow(data: ArchiveExportData): (string | number)[] {
  const { event, guests, guestbookEntries = [], rating = 5, comments = '' } = data;

  // Calculate attended headcount (RSVP accepted + accepted companions)
  const acceptedGuests = guests.filter(g => g.rsvpStatus === 'accepted');
  const primaryAttendedCount = acceptedGuests.length;
  const companionsAttendedCount = acceptedGuests.reduce((sum, g) => sum + (g.companionsCount || 0), 0);
  const totalAttended = primaryAttendedCount + companionsAttendedCount;

  // Format couple/host names
  const hostNames = event.type === 'wedding'
    ? `${event.brideName || 'Bride'} & ${event.groomName || 'Groom'}`
    : (event.birthdayPerson || event.name);

  // Guestbook comments summary
  const guestbookSummary = guestbookEntries.map(e => `[${e.name}]: "${e.message}"`).join(' | ');
  const combinedComments = [
    comments ? `Client Note: ${comments}` : '',
    guestbookSummary ? `Guestbook: ${guestbookSummary}` : ''
  ].filter(Boolean).join('\n---\n') || 'No additional comments provided.';

  return [
    event.id,
    event.name,
    hostNames,
    event.venue || 'N/A',
    event.date || 'N/A',
    totalAttended,
    event.themeId || 'default',
    `${rating} / 5 Stars`,
    combinedComments,
    new Date().toLocaleString()
  ];
}

/**
 * Exports event archive data to a Google Sheets document
 */
export async function exportEventToGoogleSheets(
  data: ArchiveExportData,
  tokenOverride?: string
): Promise<GoogleSheetsExportResult> {
  const rowValues = buildArchiveRow(data);
  let accessToken = tokenOverride || cachedAccessToken;

  if (!accessToken) {
    try {
      accessToken = await requestGoogleAccessToken();
    } catch (e) {
      console.warn("Google OAuth popup bypassed or unavailable. Proceeding with structured export download fallback.", e);
    }
  }

  // If we have an active access token, call official Google Sheets API
  if (accessToken) {
    try {
      // 1. Search for existing "Pam's Events - Post-Event Archives & Feedback" spreadsheet in Drive
      const driveSearchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='Pam%27s%20Events%20-%20Post-Event%20Archives%20%26%20Feedback'%20and%20mimeType='application/vnd.google-apps.spreadsheet'%20and%20trashed=false`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      let spreadsheetId: string | null = null;
      let spreadsheetUrl: string | null = null;

      if (driveSearchRes.ok) {
        const searchData = await driveSearchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          spreadsheetId = searchData.files[0].id;
          spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
        }
      }

      // 2. If spreadsheet does not exist, create a new one with column headers
      if (!spreadsheetId) {
        const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: {
              title: "Pam's Events - Post-Event Archives & Feedback"
            },
            sheets: [
              {
                properties: { title: "Archives & Loop Feedback" },
                data: [
                  {
                    startRow: 0,
                    startColumn: 0,
                    rowData: [
                      {
                        values: [
                          { userEnteredValue: { stringValue: "Event ID" } },
                          { userEnteredValue: { stringValue: "Event Name" } },
                          { userEnteredValue: { stringValue: "Couple / Host Names" } },
                          { userEnteredValue: { stringValue: "Location / Venue" } },
                          { userEnteredValue: { stringValue: "Event Date" } },
                          { userEnteredValue: { stringValue: "Attended Guests" } },
                          { userEnteredValue: { stringValue: "Theme Used" } },
                          { userEnteredValue: { stringValue: "Rating" } },
                          { userEnteredValue: { stringValue: "Comments & Guestbook Feedback" } },
                          { userEnteredValue: { stringValue: "Export Timestamp" } }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          })
        });

        if (!createRes.ok) {
          throw new Error(`Google Sheets API Creation failed with status ${createRes.status}`);
        }

        const createData = await createRes.json();
        spreadsheetId = createData.spreadsheetId;
        spreadsheetUrl = createData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      }

      // 3. Append the event row to the spreadsheet
      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [rowValues]
          })
        }
      );

      if (!appendRes.ok) {
        throw new Error(`Google Sheets Append failed with status ${appendRes.status}`);
      }

      return {
        success: true,
        spreadsheetId,
        spreadsheetUrl: spreadsheetUrl!,
        message: "Successfully exported event archive and feedback to Google Sheets!",
        exportedRow: rowValues
      };

    } catch (err: any) {
      console.error("Direct Google Sheets API request encountered an error:", err);
    }
  }

  // Local CSV & Google Sheets CSV format export fallback
  triggerLocalCsvDownload(data, rowValues);

  return {
    success: true,
    message: "Exported event archive to downloadable CSV format (ready for Google Sheets import).",
    exportedRow: rowValues
  };
}

/**
 * Downloads a local CSV file compatible with Google Sheets
 */
function triggerLocalCsvDownload(data: ArchiveExportData, rowValues: (string | number)[]) {
  const headers = ["Event ID", "Event Name", "Couple / Host Names", "Location / Venue", "Event Date", "Attended Guests", "Theme Used", "Rating", "Comments & Guestbook Feedback", "Export Timestamp"];
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    rowValues.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${data.event.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_google_sheets_archive.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
