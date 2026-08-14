import { getReports } from '../_utils/google-sheets.js';

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

  const validTypes = ['ai-brief', 'jobs', 'verification'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid type parameter. Supported types: ${validTypes.join(', ')}`,
    });
  }

  try {
    const reports = await getReports(type);

    return res.status(200).json({
      success: true,
      reports: reports || [],
    });
  } catch (error) {
    console.error('Google Sheets Fetch Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reports list from database',
      error: error.message,
    });
  }
}
