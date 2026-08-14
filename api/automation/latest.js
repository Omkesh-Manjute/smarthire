import { getLatestReport } from '../_utils/google-sheets.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { type } = req.query;

  if (!type) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter "type" is required',
    });
  }

  const validTypes = ['ai-brief', 'jobs'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid type parameter. Supported types: ${validTypes.join(', ')}`,
    });
  }

  try {
    const report = await getLatestReport(type);

    return res.status(200).json({
      success: true,
      report: report || null,
    });
  } catch (error) {
    console.error('Airtable Fetch Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch latest report from database',
      error: error.message,
    });
  }
}
