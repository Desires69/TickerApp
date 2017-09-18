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

const defaultStartPeriod = 360;
const defaultStart = new Date();
defaultStart.setHours(defaultStart.getHours() - defaultStartPeriod);

let prevDate = defaultStart.toISOString();

var count = 0;
var db = mongoose.connect('mongodb://localhost/tickerAPI', {useMongoClient: true});


var tokenReceived = function (resp) {

  console.log(resp);
  var respObj = JSON.parse(resp);
  var token = respObj.access_token;
  var type = respObj.token_type;
  var curDate = new Date(new Date().setHours(new Date().getHours() - 24)).toISOString();
  //var prev_date = new Date(new Date().setMinutes(new Date().getMinutes()-5)).toISOString();
  var oDataQuery = encodeURI('/utccloud.microsoft.com/activities/signinEvents?api-version=beta&$filter=signinDateTime ge ' + prevDate + ' and signinDateTime le ' + curDate + ' and loginStatus eq "0"');

  var reqOptions = {
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
  serviceRequest(reqOptions);

  function serviceResponseHandler(resp) {
    var response = '';
    resp.on('data', function (chunk) {
      response += chunk;
    });
    resp.on('end', function () {
      serviceResponseReceived(response);
    });
  }
  function serviceResponseReceived(resp) {
    try {
      var serviceRespObj = JSON.parse(resp);
    } catch (e) {
      console.log(e);
    }
    count += serviceRespObj.value.length;
    if (serviceRespObj['@odata.nextLink']) {
      var test = serviceRespObj['@odata.nextLink'];
      reqOptions.path = url.parse(serviceRespObj['@odata.nextLink']).path;
      serviceRequest(reqOptions);
    } else {
      console.log(count);
      var updateQuery = {'updated': curDate, 'count': count};
      var ticker = new Ticker(updateQuery);
      console.log(ticker);
      ticker.save();
    }
  }
  function serviceRequest(options) {
    console.log('requesting', options.path);
    var servReq = https.request(options, serviceResponseHandler);
    servReq.end();
  }

};

var getToken = function () {

  var tokenInput = {
    grant_type: 'client_credentials',
    resource: '',
    client_id: config.client_id,
    client_secret: config.client_secret
  };

  var tokenBody = querystring.stringify(tokenInput);

  var reqOptions = {
    method: 'POST',
    host: config.token_service.host,
    port: '443',
    path: config.token_service.path,
    headers: {
      //'Proxy-Authorization': basicCredentials, 
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(querystring.stringify(tokenInput))
    },
    Accept: '*/*',
    agent: agent
  };

  var tokenBody = querystring.stringify(tokenInput);

  var req = https.request(reqOptions, function (res) {

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

  req.write(tokenBody);

  req.end();

};
var update = function () {
  Ticker.findOne().sort('-updated').exec((err, lastUpdate) => {
    if (err) {
      console.log(err);
    } else {
      //var lastUpdateJson = JSON.parse(lastUpdate);
      if (lastUpdate) {
        count = lastUpdate.count;
        prevDate = lastUpdate.updated;
      }
    }

    getToken();
  });
};
module.exports = update;
//getToken();
