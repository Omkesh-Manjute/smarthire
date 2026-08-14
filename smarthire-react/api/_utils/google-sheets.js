import crypto from 'crypto';

function base64url(buf) {
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generates Google OAuth2 Access Token using Service Account JWT assertion (RS256)
 * @returns {Promise<string>} Access Token
 */
async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error('Google Service Account credentials not configured (GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY missing)');
  }

  const key = rawKey.replace(/\\n/g, '\n').replace(/"/g, '');

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64url(Buffer.from(JSON.stringify(header)));
  const encodedClaim = base64url(Buffer.from(JSON.stringify(claim)));
  const signInput = `${encodedHeader}.${encodedClaim}`;

  const signature = crypto.sign(
    'RSA-SHA256',
    Buffer.from(signInput),
    key
  );
  const encodedSignature = base64url(signature);

  const jwt = `${signInput}.${encodedSignature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    throw new Error(`Google OAuth token exchange failed: ${tokenResponse.status} - ${errText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

/**
 * Appends a new report row into Google Sheets
 * @param {object} report
 * @returns {Promise<object>} Google Sheets API response
 */
export async function insertReport(report) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error('GOOGLE_SHEET_ID environment variable is not configured');
  }

  const accessToken = await getAccessToken();
  const range = 'Sheet1!A:H';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [
        [
          'R-' + Date.now(),
          report.type,
          report.report_date,
          report.title,
          report.content,
          typeof report.raw === 'string' ? report.raw : JSON.stringify(report.raw),
          report.status,
          report.created_at || new Date().toISOString()
        ]
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Fetches the latest report of a specific type from Google Sheets
 * @param {string} type - 'ai-brief' or 'jobs'
 * @returns {Promise<object|null>} Latest report fields or null
 */
export async function getLatestReport(type) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error('GOOGLE_SHEET_ID environment variable is not configured');
  }

  const accessToken = await getAccessToken();
  const range = 'Sheet1!A:H';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const rows = data.values;

  if (!rows || rows.length <= 1) {
    return null;
  }

  const headers = rows[0];
  const reports = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const r = {};
    for (let j = 0; j < headers.length; j++) {
      r[headers[j]] = row[j] !== undefined ? row[j] : '';
    }

    if (r.raw) {
      try {
        r.raw = JSON.parse(r.raw);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }

    if (r.type === type) {
      reports.push(r);
    }
  }

  if (reports.length === 0) {
    return null;
  }

  reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return reports[0];
}

/**
 * Fetches all reports of a specific type from Google Sheets
 * @param {string} type - 'ai-brief', 'jobs', or 'verification'
 * @returns {Promise<Array>} Sorted list of reports
 */
export async function getReports(type) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error('GOOGLE_SHEET_ID environment variable is not configured');
  }

  const accessToken = await getAccessToken();
  const range = 'Sheet1!A:H';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const rows = data.values;

  if (!rows || rows.length <= 1) {
    return [];
  }

  const headers = rows[0];
  const reports = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const r = {};
    for (let j = 0; j < headers.length; j++) {
      r[headers[j]] = row[j] !== undefined ? row[j] : '';
    }

    if (r.raw) {
      try {
        r.raw = JSON.parse(r.raw);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }

    if (r.type === type) {
      reports.push(r);
    }
  }

  reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return reports;
}
