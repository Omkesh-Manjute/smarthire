import { scrapeJobsInHand } from './jobs-ingestion/jobsinhand-scraper.js';

console.log('🚀 [Test] Starting JobsInHand scraper verification...');
console.log(`📅 [Test] Current date: ${new Date().toISOString().slice(0, 10)}`);

async function runTest() {
  try {
    const result = await scrapeJobsInHand((msg) => console.log(msg));
    console.log('\n📊 [Test Result Summary]:');
    console.log(`- Mode Used: ${result.mode}`);
    console.log(`- Total Found: ${result.totalFound}`);
    console.log(`- Today Jobs Found: ${result.jobs.length}`);
    console.log(`- Rebid Filtered: ${result.rebidFiltered}`);
    console.log(`- Non-Today Filtered: ${result.notTodayFiltered}`);
    
    if (result.jobs.length > 0) {
      console.log('\n✅ [Scraped Today Jobs]:');
      result.jobs.forEach((j, i) => {
        console.log(`\n--- Job #${i + 1} ---`);
        console.log(`Title: ${j.title}`);
        console.log(`Date: ${j.postDate}`);
        console.log(`Location: ${j.location}`);
        console.log(`Experience: ${j.experience}`);
        console.log(`Skills: ${j.skills ? j.skills.join(', ') : 'None'}`);
      });
    } else {
      console.log('\nℹ️ No jobs created today found on JobsInHand.com (or all filtered).');
    }
  } catch (err) {
    console.error('❌ [Test Error]:', err);
  }
}

runTest();
