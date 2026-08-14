export default function handler(_req, res) {
  res.status(200).json({
    ok: true,
    service: 'verifyhire-api-vercel',
    runtime: 'nodejs',
    now: new Date().toISOString(),
  })
}
