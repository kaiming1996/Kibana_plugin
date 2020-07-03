const AWS = require('aws-sdk');

//Test data 
var index = 'node-test';
var type = '_doc';
var id = '1';
var json1 = {
    "title": "Moneyball",
    "director": "Bennett Miller",
    "year": "2011"
  }


/**
 * Sends a request to Elasticsearch
 *
 * @param {string} httpMethod - The HTTP method, e.g. 'GET', 'PUT', 'DELETE', etc
 * @param {string} requestPath - The HTTP path (relative to the Elasticsearch domain), e.g. '.kibana'
 * @param {Object} [payload] - An optional JavaScript object that will be serialized to the HTTP request body
 * @returns {Promise} Promise - object with the result of the HTTP response
 */

function sendGetRequest({ httpMethod, requestPath, payload }) {
    var httpClient = new AWS.HttpClient();
    var AWS_REGION = 'us-west-2';
    //(node:1885) UnhandledPromiseRejectionWarning: Error [ERR_TLS_CERT_ALTNAME_INVALID]: Hostname/IP does not match certificate's altnames: Host: https. is not in the cert's altnames: DNS:*.us-west-2.es.amazonaws.com
    //solution  : don't include https:// 
    var domain = 'search-test-kaiminc-gnajvxs3uu6jgs4pya6dkecsl4.us-west-2.es.amazonaws.com';
    var credentials = new AWS.Credentials();
    credentials.accessKeyId = 'xxx';
    credentials.secretAccessKey = 'yyy';
    var endpoint = new AWS.Endpoint(domain);
    var request = new AWS.HttpRequest(endpoint, AWS_REGION);

    request.method = httpMethod;
    request.headers['Content-Type'] = 'application/json';
    request.headers['Host'] = domain;
    request.headers['Content-Length'] = Buffer.byteLength(request.body);

    const signer = new AWS.Signers.V4(request, 'es');
    signer.addAuthorization(credentials, new Date());

    return new Promise((resolve, reject) => {
        httpClient.handleRequest(request, null,
            response => {
                const { statusCode, statusMessage, headers } = response;
                let body = '';
                response.on('data', chunk => {
                    body += chunk;
                });
                response.on('end', () => {
                    const data = {
                        statusCode,
                        statusMessage,
                        headers
                    };
                    if (body) {
                        data.body = JSON.parse(body);
                    }
                    resolve(data);
                });
            },
            err => {
                reject(err);
            });
    });
  }


  const params = {
      httpMethod: 'GET',
      //
      requestPath: '',
      payload: {}
  };
  const params1 = {
    httpMethod: 'POST',
    //
    requestPath: '_index/1',
    payload: json1
  };


export default function (server) {

  server.route([{
    path: '/app/test_kaiming/example',
    method: 'GET',
    handler:(request,response) => {
      try{
        (sendGetRequest(params)
        .then(response => {
            return response;
        }));
      } catch(error) {
        if (error.isBoom) {
            return error;
        }
        throw error;
    }
    }
  }]);

}
