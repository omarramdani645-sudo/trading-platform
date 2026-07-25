const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  // توجيه الزائر لصفحة login.html عند فتح الرابط الرئيسي
  let filePath = path.join(__dirname, req.url === '/' ? 'login.html' : req.url);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      fs.readFile(path.join(__dirname, 'login.html'), (error, defaultContent) => {
        if (error) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('الصفحة غير موجودة');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(defaultContent, 'utf-8');
        }
      });
    } else {
      res.writeHead(200);
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
