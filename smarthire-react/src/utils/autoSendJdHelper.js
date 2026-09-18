/**
 * Auto-Send Job Description to Candidate upon Requisition Assignment
 * Dispatches via logged-in recruiter's configured Yahoo/SMTP account
 */
export async function autoSendJobDescriptionToCandidate({ candidate, job, recruiterUser, customNote = '' }) {
  if (!candidate || !candidate.email) {
    console.warn('⚠️ Cannot auto-send JD: Candidate email is missing');
    return { success: false, message: 'Candidate email is missing' };
  }

  const candName = candidate.name || candidate.extracted_profile?.name || 'Candidate';
  const candEmail = candidate.email.trim();

  // Resolve recruiter details
  const myName = recruiterUser?.name || 'Technical Recruiter';
  const myEmail = recruiterUser?.email || 'omkesh@coolsofttech.com';
  const myCompany = recruiterUser?.company || 'SmartHire ATS / COOLSOFT LLC';

  // Resolve job details
  const cleanReqId = String(job?.id || job?.reqId || candidate?.targetReqId || '159116').replace('J-', '').replace('REQ-', '').trim();
  const jobTitle = job?.title || job?.jobTitle || candidate?.matchedJobTitle || candidate?.role || 'Technical Specialist';
  const clientName = job?.client || job?.customer || candidate?.matchedJobClient || 'Direct Enterprise Client';
  const location = job?.location || candidate?.location || 'Remote / US';
  const rate = job?.budget || job?.rate || candidate?.matchedJobRate || candidate?.payRate || '$75/hr';
  const skillsList = Array.isArray(job?.skills) ? job.skills : (job?.skills ? String(job.skills).split(',').map(s => s.trim()) : (candidate?.skills || ['Technical Skills']));
  const skillsStr = skillsList.slice(0, 8).join(', ');

  // Format JD text snippet (clean line breaks)
  let jdSnippet = job?.description || job?.fullDescription || job?.jobDescription || candidate?.notes || '';
  // Clean internal ASCII dividers if present
  jdSnippet = jdSnippet.replace(/={5,}/g, '').replace(/-{5,}/g, '').trim();
  if (jdSnippet.length > 2000) {
    jdSnippet = jdSnippet.slice(0, 1950) + '...\n\n[Full specifications available upon confirmation]';
  }

  const subject = `Opportunity: ${jobTitle} - ${clientName} (Req #${cleanReqId})`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; line-height: 1.6; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
      <p style="font-size: 15px; margin-top: 0; color: #0f172a;">
        Hi <strong>${candName}</strong>,
      </p>
      
      <p style="font-size: 14px; color: #334155; margin-bottom: 18px;">
        ${customNote ? customNote : `I reviewed your profile and verified technical qualifications, and I am excited to reach out regarding a high-priority <strong>${jobTitle}</strong> position with our client <strong>${clientName}</strong>.`}
      </p>

      <!-- Position Specifications Matrix -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px; font-size: 13.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
          Key Position Specifications
        </h3>
        <table style="width: 100%; font-size: 13.5px; border-collapse: collapse;">
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 7px 0; color: #64748b; width: 150px; font-weight: 600;">Requisition ID:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">#${cleanReqId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Position Title:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${jobTitle}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Client:</td>
              <td style="padding: 7px 0; color: #0f172a;">${clientName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Work Location:</td>
              <td style="padding: 7px 0; color: #0f172a;">${location}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Target Rate / Pay:</td>
              <td style="padding: 7px 0; color: #059669; font-weight: 700;">${rate}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Required Skills:</td>
              <td style="padding: 7px 0; color: #0f172a;">${skillsStr}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Job Description Extract -->
      ${jdSnippet ? `
      <div style="margin: 22px 0;">
        <h4 style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #0f172a;">Role Description &amp; Responsibilities:</h4>
        <div style="background: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-line;">
          ${jdSnippet}
        </div>
      </div>
      ` : ''}

      <!-- Next Steps Action Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px 20px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px; font-size: 13.5px; font-weight: 700; color: #0f172a;">
          Next Steps to Proceed with Submission:
        </h4>
        <p style="margin: 0 0 10px; font-size: 13px; color: #334155;">
          If you are interested in moving forward, please <strong>reply directly to this email</strong> with the following details:
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
          <li><strong>Latest Updated Resume</strong> (Word or PDF format)</li>
          <li><strong>Current Work Authorization</strong> (US Citizen / GC / H1B / C2C / W2)</li>
          <li><strong>Current Location</strong> (City, State)</li>
          <li><strong>Target Hourly Rate</strong> ($/hr)</li>
          <li><strong>Earliest Availability to Start</strong> (Immediate / 2 Weeks)</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #334155; margin-bottom: 24px;">
        Thank you, and I look forward to working with you on this opportunity.
      </p>

      <!-- Recruiter Signature -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 13px; color: #64748b;">
        <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${myName}</div>
        <div style="font-size: 12.5px; color: #2563eb; font-weight: 600;">Technical Recruiting Specialist</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${myCompany}</div>
        <div style="font-size: 12px; color: #475569; margin-top: 3px;">
          Email: <a href="mailto:${myEmail}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${myEmail}</a>
        </div>
      </div>
    </div>
  `;

  const plainTextBody = `Hi ${candName},

I reviewed your profile and qualifications, and I am reaching out regarding a high-priority ${jobTitle} position with our client ${clientName} (Req #${cleanReqId}).

KEY SPECIFICATIONS:
- Role: ${jobTitle}
- Client: ${clientName}
- Location: ${location}
- Rate: ${rate}
- Core Skills: ${skillsStr}

${jdSnippet ? `ROLE DESCRIPTION:\n${jdSnippet}\n\n` : ''}
NEXT STEPS TO PROCEED:
If you are interested, please reply directly to this email with:
1. Your latest updated resume (Word/PDF)
2. Your current work authorization status
3. Your current location
4. Your target hourly rate ($/hr)
5. Earliest available start date

Best Regards,
${myName}
Technical Recruiting Specialist | ${myCompany}
Email: ${myEmail}
`;

  try {
    const res = await fetch('/api/recruiter/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recruiterEmail: myEmail,
        to: candEmail,
        subject,
        html: htmlBody,
        body: plainTextBody,
        replyTo: myEmail
      })
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Failed to auto-send JD email:', err);
    return { success: false, message: err.message };
  }
}
