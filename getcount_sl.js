'use strict';

const config = require('./config');
const assert = require('assert');

var HttpsProxyAgent = require('https-proxy-agent'),
  url = require('url'),
  querystring = require('querystring'),
  mongoose = require('mongoose'),
  https = require('https'),
  Ticker = require('./models/tickerModel');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

//https.globalAgent.options.secureProtocol = 'SSLv3_method';

let proxyAgent;

if (config.proxy) {
  assert(config.proxy.url);
  proxyAgent = new HttpsProxyAgent(config.proxy.url);
}

const agent = proxyAgent ? proxyAgent : undefined;
//var proxyAgent = new HttpsProxyAgent('http://ai203025:8888');

//var basicCredentials = 'Basic ';

const default_start_period = 360;
const default_start = new Date();
default_start.setHours(default_start.getHours() - default_start_period);

let prev_date = default_start.toISOString();

var count = 0;
var db = mongoose.connect('mongodb://localhost/tickerAPI', {useMongoClient: true});
var update = function () {
  Ticker.findOne().sort('-updated').exec((err, lastUpdate) => {
    if (err) {
      console.log(err);
    } else {
      //var lastUpdateJson = JSON.parse(lastUpdate);
      if (lastUpdate) {
        count = lastUpdate.count;
        prev_date = lastUpdate.updated;
      }
    }

    getToken();
  });
}

var tokenReceived = function (resp) {

  console.log(resp);
  var resp_obj = JSON.parse(resp);
  var token = resp_obj.access_token;
  var type = resp_obj.token_type;
  var cur_date = new Date(new Date().setHours(new Date().getHours() - 24)).toISOString();
  //var prev_date = new Date(new Date().setMinutes(new Date().getMinutes()-5)).toISOString();
  var oDataQuery = encodeURI("/utccloud.microsoft.com/activities/signinEvents?api-version=beta&$filter=signinDateTime ge " + prev_date + " and signinDateTime le " + cur_date + " and loginStatus eq '0'");

  var req_options = {
    method: 'GET',
    host: 'graph.windows.net',
    port: '443',
    path: oDataQuery,
    headers: {
      'Authorization': type + ' ' + token,
      //'Proxy-Authorization': basicCredentials, 
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
    },
    Accept: '*/*',
    agent: agent
  };
  service_request(req_options);

  function service_response_handler(resp) {
    var response = '';
    resp.on('data', function (chunk) {
      response += chunk;
    });
    resp.on('end', function () {
      service_response_received(response);
    });
  }
  function service_response_received(resp) {
    try {
      var service_resp_obj = JSON.parse(resp);
    } catch (e) {
      console.log(e);
    }
    count += service_resp_obj.value.length;
    if (service_resp_obj['@odata.nextLink']) {
      var test = service_resp_obj['@odata.nextLink'];
      req_options.path = url.parse(service_resp_obj['@odata.nextLink']).path;
      service_request(req_options);
    } else {
      console.log(count);
      var updateQuery = {'updated': cur_date, 'count': count}
      var ticker = new Ticker(updateQuery);
      console.log(ticker);
      ticker.save();
    }
  }
  function service_request(options) {
    console.log('requesting', options.path);
    var serv_req = https.request(options, service_response_handler);
    serv_req.end();
  }

};

var getToken = function () {

  var token_input = {
    grant_type: 'client_credentials',
    resource: '',
    client_id: config.client_id,
    client_secret: config.client_secret
  };

  var token_body = querystring.stringify(token_input);

  var req_options = {
    method: 'POST',
    host: config.token_service.host,
    port: '443',
    path: config.token_service.path,
    headers: {
      //'Proxy-Authorization': basicCredentials, 
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(querystring.stringify(token_input))
    },
    Accept: '*/*',
    agent: agent
  };

  var token_body = querystring.stringify(token_input);

  var req = https.request(req_options, function (res) {

    var response = '';

    res.on('data', function (chunk) {
      response += chunk;
    });

    res.on('end', function () {
      tokenReceived(response);
    });

  });

  req.on('error', function (e) {
    console.error(e);
  });

  req.write(token_body);

  req.end();

}

module.exports = update;
//getToken();
