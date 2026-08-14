const PAT = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'automation_reports';

/**
 * Inserts a new report row into Airtable
 * @param {object} report
 * @returns {Promise<object>} Airtable response JSON
 */
export async function insertReport(report) {
  if (!PAT || !BASE_ID) {
    throw new Error('Airtable credentials not configured on server (AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_BASE_ID missing)');
  }
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            type: report.type,
            report_date: report.report_date,
            title: report.title,
            content: report.content,
            raw: typeof report.raw === 'string' ? report.raw : JSON.stringify(report.raw),
            status: report.status,
            created_at: report.created_at || new Date().toISOString(),
          }
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
  }
  return await response.json();
}

/**
 * Fetches the latest report of a specific type from Airtable
 * @param {string} type - 'ai-brief' or 'jobs'
 * @returns {Promise<object|null>} Latest report fields or null
 */
export async function getLatestReport(type) {
  if (!PAT || !BASE_ID) {
    throw new Error('Airtable credentials not configured on server (AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_BASE_ID missing)');
  }
  
  // Clean type input and use in query formula
  const cleanType = type.replace(/'/g, "\\'");
  const filterFormula = `{type} = '${cleanType}'`;
  
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=created_at&sort[0][direction]=desc&maxRecords=1`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PAT}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (data.records && data.records.length > 0) {
    const record = data.records[0];
    return {
      id: record.id,
      ...record.fields,
    };
  }
  return null;
}
