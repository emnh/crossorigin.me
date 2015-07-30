#!/usr/bin/env node
var http = require('http');
var request = require('request');
var fs = require('fs');
var domain = require('domain');
var index = fs.readFileSync('index.html');
var favicon = fs.readFileSync('favicon.ico');

var port = process.env.PORT || 8080;

var copyHeaders = ['Date', 'Last-Modified', 'Expires', 'Cache-Control', 'Pragma', 'Content-Length', 'Content-Type'];
var copyClientHeaders = ['If-Modified-Since'];

var server = http.createServer(function (req, res) {
	var d = domain.create();
	d.on('error', function (e){
		console.log('ERROR', e.stack);

		res.statusCode = 500;
		res.end('Error: ' + ((e instanceof TypeError) ? "make sure your URL is correct" : String(e)));
	});

	d.add(req);
	d.add(res);

	d.run(function() {
		handler(req, res);
	});

}).listen(port);


function handler(req, res) {
	console.log(req.url);
	switch (req.url) {
		case "/":
			res.writeHead(200);
			res.write(index);
			res.end();
			break;
		case "/index.html":
			res.writeHead(200);
			res.write(index);
			res.end();
			break;
		case "/favicon.ico":
			res.writeHead(200);
			res.write(favicon);
			res.end();
      break;
		default:
			if (req.url.indexOf('vivastreet') > -1){
				res.end('tempbanned');
			} else {
			try {
				res.setTimeout(25000);
				res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString()); // one day in the future
        if (req.headers['If-Modified-Since'.toLowerCase()]) {
          console.log("If-Modified-Since", req.headers['if-modified-since']);
          res.writeHead(304);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Credentials', false);
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,If-None-Match,If-Modified-Since,' + copyHeaders.join());
          res.setHeader('Last-Modified', req.headers['if-modified-since']);
          res.end();
          break;
        }
        var headers = {
          encoding: null
        };
        for (var i=0; i < copyClientHeaders.length; i++) {
          var clientHeader = req.headers[copyClientHeaders[i].toLowerCase()];
          if (clientHeader) {
            headers[copyHeaders[i]] = clientHeader;
          }
        }
        var options = {
          url: req.url.slice(1),
          headers: headers
        };
				var r = request(options);
				r.pipefilter = function(response, dest) {
					for (var header in response.headers) {
						dest.removeHeader(header);
					}
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Credentials', false);
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,If-None-Match,If-Modified-Since,' + copyHeaders.join());
          var lastModified = response.headers['date'];
          if (lastModified) {
            res.setHeader('Last-Modified', lastModified);
          }
					for (var i=0; i<copyHeaders.length; i++) {
						var responseHeader = response.headers[copyHeaders[i].toLowerCase()];
						if (responseHeader) {
							res.setHeader(copyHeaders[i], responseHeader);
						}
					}
				};
				r.pipe(res);
			} catch (e) {
				res.end('Error: ' +  ((e instanceof TypeError) ? "make sure your URL is correct" : String(e)));
			}
		}
	}
}
