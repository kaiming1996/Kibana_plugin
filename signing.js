//Signing Module

const Hapi = require('@hapi/hapi');
const Wreck = require('wreck');
let crypto = require('crypto-js');
let https = require('https');


let server = Hapi.server({
    port: 3000,
    host: 'localhost'
});
 

function assignAuthHeader(request){
  request.headers = main()
}


// split the code into a main function
function main() {
  // our letiables
  let access_key = 'xxx';
  let secret_key = 'yyy';
  let region = 'us-west-2';
  let url = 'search-test-kaiminc-gnajvxs3uu6jgs4pya6dkecsl4.us-west-2.es.amazonaws.com';
  let myService = 'es';
  let myMethod = 'GET';
  let myPath = '/';
 
  // get the letious date formats needed to form our request
  let amzDate = getAmzDate(new Date().toISOString());
  let authDate = amzDate.split("T")[0];
 
  // we have an empty payload here because it is a GET request
  let payload = '';
  // get the SHA256 hash value for our payload
  let hashedPayload = crypto.SHA256(payload).toString();
 
  // create our canonical request
  let canonicalReq =  myMethod + '\n' +
                      myPath + '\n' +
                      '\n' +
                      'host:' + url + '\n' +
                      'x-amz-content-sha256:' + hashedPayload + '\n' +
                      'x-amz-date:' + amzDate + '\n' +
                      '\n' +
                      'host;x-amz-content-sha256;x-amz-date' + '\n' +
                      hashedPayload;
 
  // hash the canonical request
  let canonicalReqHash = crypto.SHA256(canonicalReq).toString();
 
  // form our String-to-Sign
  let stringToSign =  'AWS4-HMAC-SHA256\n' +
                      amzDate + '\n' +
                      authDate+'/'+region+'/'+myService+'/aws4_request\n'+
                      canonicalReqHash;
 
  // get our Signing Key
  let signingKey = getSignatureKey(crypto, secret_key, authDate, region, myService);
 
  // Sign our String-to-Sign with our Signing Key
  let authKey = crypto.HmacSHA256(stringToSign, signingKey);
 
  // Form our authorization header
  let authString  = 'AWS4-HMAC-SHA256 ' +
                    'Credential='+
                    access_key+'/'+
                    authDate+'/'+
                    region+'/'+
                    myService+'/aws4_request,'+
                    'SignedHeaders=host;x-amz-content-sha256;x-amz-date,'+
                    'Signature='+authKey;
 
  // throw our headers together
  headers = {
    'Authorization' : authString,
    'Host' : url,
    'x-amz-date' : amzDate,
    'x-amz-content-sha256' : hashedPayload
  };

  performRequest(url, headers, payload, function(response){
    console.log('=== \n');
  });
}

// this function gets the Signature Key, see AWS documentation for more details, this was taken from the AWS samples site
function getSignatureKey(Crypto, key, dateStamp, regionName, serviceName) {
    let kDate = Crypto.HmacSHA256(dateStamp, "AWS4" + key);
    let kRegion = Crypto.HmacSHA256(regionName, kDate);
    let kService = Crypto.HmacSHA256(serviceName, kRegion);
    let kSigning = Crypto.HmacSHA256("aws4_request", kService);
    return kSigning;
}
 
// this function converts the generic JS ISO8601 date format to the specific format the AWS API wants
function getAmzDate(dateStr) {
  let chars = [":","-"];
  for (let i=0;i<chars.length;i++) {
    while (dateStr.indexOf(chars[i]) != -1) {
      dateStr = dateStr.replace(chars[i],"");
    }
  }
  dateStr = dateStr.split(".")[0] + "Z";
  return dateStr;
}

// the REST API call using the Node.js 'https' module
function performRequest(endpoint, headers, data, success) {
 
  let dataString = data;
 
  let options = {
    host: endpoint,
    port: 443,
    path: '/',
    method: 'GET',
    headers: headers
  };
 
  const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`)
  res.on('data', (d) => {
    process.stdout.write(d)
  })
})
 
  req.write(dataString);
  req.end();
}
