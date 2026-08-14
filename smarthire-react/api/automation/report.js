import { insertReport } from '../_utils/google-sheets.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 1. Verify Authentication Secret
  const secretHeader = req.headers['x-automation-secret'];
  const automationSecret = process.env.AUTOMATION_SECRET;

  if (!automationSecret) {
    console.error('AUTOMATION_SECRET is not configured in Vercel environment variables.');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: AUTOMATION_SECRET not configured',
    });
  }

  if (secretHeader !== automationSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid x-automation-secret header',
    });
  }

  // 2. Extract and Validate Body Fields
  const { type, report_date, title, content, raw, status, created_at } = req.body;

  if (!type || !report_date || !title || !content || !status) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields. Required fields: type, report_date, title, content, status',
    });
  }

  const validTypes = ['ai-brief', 'jobs'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid report type. Allowed types: ${validTypes.join(', ')}`,
    });
  }

  try {
    // 3. Save into Airtable
    const data = await insertReport({
      type,
      report_date,
      title,
      content,
      raw: raw || {},
      status,
      created_at: created_at || new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: 'Automation report saved successfully',
      id: data.records?.[0]?.id,
    });
  } catch (error) {
    console.error('Airtable Insertion Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to store report in database',
      error: error.message,
    });
  }
}
