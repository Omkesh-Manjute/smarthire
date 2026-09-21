/**
 * SmartHire — Firebase Firestore Candidate Audit & Cleanup Script
 * 
 * Usage:
 *   node firebase-candidate-audit.js          (audit only, no changes)
 *   node firebase-candidate-audit.js --delete  (audit + delete no-attachment candidates)
 */

const https = require('https');

const PROJECT_ID = 'smart-hire-54d38';
const API_KEY = 'AIzaSyA2BwkaHIrKbgNO87CIQc7wSpO_ufdxPXQ';
const COLLECTION = 'atsCandidates';
const DELETE_MODE = process.argv.includes('--delete');

function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function fetchAllCandidates(pageToken = null, allDocs = []) {
  let path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}?pageSize=300&key=${API_KEY}`;
  if (pageToken) path += `&pageToken=${pageToken}`;
  const { status, body } = await httpsRequest({ hostname: 'firestore.googleapis.com', path, method: 'GET' });
  if (status !== 200) {
    console.error('Failed to fetch. Status:', status, JSON.stringify(body).slice(0, 300));
    process.exit(1);
  }
  allDocs.push(...(body.documents || []));
  if (body.nextPageToken) return fetchAllCandidates(body.nextPageToken, allDocs);
  return allDocs;
}

async function deleteDocument(docName) {
  const p = docName.replace(`projects/${PROJECT_ID}/databases/(default)/documents`, '');
  const { status } = await httpsRequest({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents${p}?key=${API_KEY}`,
    method: 'DELETE'
  });
  return status === 200 || status === 204;
}

function getStr(field) { return field ? (field.stringValue || '') : ''; }
function getMap(field) { return field ? (field.mapValue || null) : null; }

async function main() {
  console.log('\n Fetching ALL candidates from Firebase Firestore (atsCandidates)...');
  const docs = await fetchAllCandidates();
  console.log('Total fetched:', docs.length, '\n');

  const withAttachment = [];
  const noAttachment = [];

  for (const doc of docs) {
    const f = doc.fields || {};
    const name = getStr(f.name) || doc.name.split('/').pop();
    const email = getStr(f.email);
    const canId = getStr(f.canId) || getStr(f.id) || doc.name.split('/').pop();

    const resumeText = getStr(f.resumeText);
    const attachmentName = getStr(f.attachmentName);
    const resumeUrl = getStr(f.resumeUrl);
    const fileMap = getMap(f.file);
    const legalDocsMap = getMap(f.legalDocs);

    let legalResumeUrl = '';
    let legalHasFile = false;
    if (legalDocsMap && legalDocsMap.fields && legalDocsMap.fields.resume) {
      const rd = legalDocsMap.fields.resume.mapValue;
      if (rd && rd.fields) {
        legalResumeUrl = getStr(rd.fields.storageUrl);
        legalHasFile = rd.fields.hasFile ? (rd.fields.hasFile.booleanValue === true) : false;
      }
    }

    const hasAttachment = (
      (resumeText && resumeText.length > 100) ||
      (attachmentName && attachmentName.length > 0) ||
      (resumeUrl && resumeUrl.length > 0) ||
      fileMap !== null ||
      (legalResumeUrl && legalResumeUrl.length > 0) ||
      legalHasFile
    );

    const entry = { docName: doc.name, canId, name, email,
      resumeTextLen: resumeText.length, attachmentName, resumeUrl, legalHasFile };

    if (hasAttachment) withAttachment.push(entry);
    else noAttachment.push(entry);
  }

  console.log('='.repeat(60));
  console.log('AUDIT RESULTS');
  console.log('  Total in Firebase Firestore:', docs.length);
  console.log('  Has attachment/resume:       ', withAttachment.length);
  console.log('  NO attachment at all:        ', noAttachment.length);
  console.log('='.repeat(60));

  if (noAttachment.length > 0) {
    console.log('\nCandidates with NO attachment:');
    noAttachment.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.name} | ${c.email} | canId: ${c.canId}`);
    });
  }

  if (DELETE_MODE && noAttachment.length > 0) {
    console.log(`\nDELETE MODE — Removing ${noAttachment.length} no-attachment candidates...`);
    let deleted = 0, failed = 0;
    for (const c of noAttachment) {
      const ok = await deleteDocument(c.docName);
      if (ok) { deleted++; console.log('  DELETED:', c.name, '|', c.email); }
      else { failed++; console.log('  FAILED:', c.name, '|', c.email); }
    }
    console.log('\nDone. Deleted:', deleted, '| Failed:', failed);
  } else if (!DELETE_MODE && noAttachment.length > 0) {
    console.log('\nTo DELETE these candidates, run:');
    console.log('  node firebase-candidate-audit.js --delete\n');
  } else {
    console.log('\nAll candidates have attachments. Nothing to remove!\n');
  }
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
