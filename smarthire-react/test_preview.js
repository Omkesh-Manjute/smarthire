async function test() {
  const listRes = await fetch('http://127.0.0.1:8787/api/jobs');
  const list = await listRes.json();
  const job = list.jobs[0];
  console.log('Testing job:', job.id);
  const res = await fetch(`http://127.0.0.1:8787/api/jobs/${job.id}/linkedin-preview`);
  const data = await res.json();
  console.log(data);
}
test();
