const https = require('https')

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvbaszjtjhzgrarkbhvt.supabase.co') + '/rest/v1/store_settings?select=*'
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

const req = https.request(url, {
  method: 'GET',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
}, (res) => {
  let body = ''
  res.on('data', chunk => body += chunk)
  res.on('end', () => {
    console.log('Status code:', res.statusCode)
    try {
      const data = JSON.parse(body)
      console.log('Store settings data:')
      console.log(JSON.stringify(data, null, 2))
    } catch (e) {
      console.log('Raw body:', body)
    }
  })
})

req.on('error', (e) => {
  console.error('Request error:', e)
})

req.end()
