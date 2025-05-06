const http = require('http'),
      url = require('url'),
      fs = require('fs');  

http.createServer((request,response) => {
    let addr = request.url,
        parsedURL = new URL (addr, 'http://localhost:8080'),
        filePath = '';

        fs.appendFile ('log.txt', 'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n', (err) => {
            if (err) {
              console.log(err);
            } else {
              console.log('Added to log.');
            }
          });

    if (parsedURL.pathname.includes('documentation')) {
        filePath = (__dirname + '/documentation.html');
    }
    else {
        filePath = (__dirname + '/index.html');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            throw err;
        }

        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write(data);
        response.end();
    });

 
}).listen(8080);

console.log('server is running on Port 8080.');