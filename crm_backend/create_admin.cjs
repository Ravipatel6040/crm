const http = require('http');

const data = JSON.stringify({
  email: 'admin@gmail.com',
  password: 'admin@123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/admin/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${responseBody}`);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
