// scripts/test-login-domains.js
// WHAT: Test login API across different domains to diagnose cookie issues
// WHY: Solve login problems on localhost and messmass.doneisbetter.com

const https = require('https');
const http = require('http');

const credentials = {
  email: 'moldovancsaba@gmail.com',
  password: '0a07432e538de1ece3ad033ca40251a2'
};

const domains = [
  { name: 'localhost', url: 'http://localhost:3000/api/admin/login', protocol: http },
  { name: 'messmass.com', url: 'https://www.messmass.com/api/admin/login', protocol: https },
  { name: 'messmass.doneisbetter.com', url: 'https://messmass.doneisbetter.com/api/admin/login', protocol: https },
  { name: 'messmass.vercel.app', url: 'https://messmass.vercel.app/api/admin/login', protocol: https }
];

async function testLogin(domain) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${domain.name}`);
    console.log(`   URL: ${domain.url}`);
    
    const urlObj = new URL(domain.url);
    const postData = JSON.stringify(credentials);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = domain.protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        
        // Check for Set-Cookie header
        const cookies = res.headers['set-cookie'];
        if (cookies) {
          console.log(`   ✅ Cookies Set:`);
          cookies.forEach(cookie => {
            console.log(`      ${cookie}`);
            
            // Parse cookie attributes
            const parts = cookie.split(';').map(p => p.trim());
            const [nameValue] = parts;
            const attrs = parts.slice(1);
            
            console.log(`      Attributes:`);
            attrs.forEach(attr => {
              console.log(`         - ${attr}`);
            });
          });
        } else {
          console.log(`   ❌ No cookies set`);
        }
        
        try {
          const json = JSON.parse(data);
          console.log(`   Response: ${JSON.stringify(json, null, 2)}`);
        } catch (e) {
          console.log(`   Response: ${data.substring(0, 200)}`);
        }
        
        resolve({ domain: domain.name, success: res.statusCode === 200 && cookies });
      });
    });
    
    req.on('error', (e) => {
      console.log(`   ❌ Error: ${e.message}`);
      resolve({ domain: domain.name, success: false, error: e.message });
    });
    
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🧪 Testing Login Across Domains\n');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const domain of domains) {
    const result = await testLogin(domain);
    results.push(result);
    await new Promise(r => setTimeout(r, 1000)); // Wait 1s between tests
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 Summary:\n');
  
  results.forEach(r => {
    const status = r.success ? '✅ WORKING' : '❌ FAILING';
    console.log(`   ${status} - ${r.domain}`);
    if (r.error) {
      console.log(`      Error: ${r.error}`);
    }
  });
  
  console.log('\n' + '=' .repeat(60));
}

main().catch(console.error);
