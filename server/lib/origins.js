// CLIENT_ORIGIN may contain a comma-separated list, e.g.
//   http://localhost:5173,http://127.0.0.1:5173,https://urban-outline.vercel.app
// localhost and 127.0.0.1 are different origins to a browser, and the deployed
// store and the local dev server are different origins too.

function allowedOrigins() {
  return (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

// Links inside emails (verify / reset) must use one real origin, not the list.
function primaryOrigin() {
  return allowedOrigins()[0]
}

function isAllowedOrigin(req) {
  const origin = req.get('Origin')
  return !origin || allowedOrigins().includes(origin)
}

module.exports = { allowedOrigins, primaryOrigin, isAllowedOrigin }
