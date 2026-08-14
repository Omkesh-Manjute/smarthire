const fs = require('fs');

async function test() {
  const tokenData = JSON.parse(fs.readFileSync('server/linkedin_token.json', 'utf8'));
  const commentary = "🌟 Hiring: Test Post\n\n🚀 Hiring: Test Post (Java, AWS)\n\nWe are testing if text gets truncated after newlines.\n\n✅ Responsibility 1\n\n📍 Remote";
  
  const postBody = {
    author: tokenData.member_id,
    commentary: commentary,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: []
    },
    lifecycleState: 'PUBLISHED'
  };

  const response = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'LinkedIn-Version': '202605',
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postBody)
  });

  console.log(response.status);
  console.log(response.headers.get('x-restli-id'));
}

test().catch(console.error);
