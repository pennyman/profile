'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

// const BUCKET = process.env.BUCKET;
const URL = process.env.URL;
const ALLOWED_RESOLUTIONS = process.env.ALLOWED_RESOLUTIONS ? new Set(process.env.ALLOWED_RESOLUTIONS.split(/\s*,\s*/)) : new Set([]);

var utils = {
  decodeKey: function(key) {
    return decodeURIComponent(key).replace(/\+/g, ' ');
  }
};

exports.handler = function(event, context, callback) {
  const BUCKET = event.Records[0].s3.bucket.name;
  // const key = event.queryStringParameters.key;
  // const match = key.match(/((\d+)x(\d+))\/(.*)/);

  //Check if requested resolution is allowed
  // if(0 != ALLOWED_RESOLUTIONS.size && !ALLOWED_RESOLUTIONS.has(match[1]) ) {
  //   callback(null, {
  //     statusCode: '403',
  //     headers: {},
  //     body: '',
  //   });
  //   return;
  // }

  const width = 500;
  const height = 500;
  const originalKey = utils.decodeKey(event.Records[0].s3.object.key);
  const dstKey = originalKey.replace(/\.\w+$/, ".jpg").replace(/big/gi, "small");

// .resize(width, height)
  S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
    .then(data => Sharp(data.Body)
    .resize(width, height,
      { fit: 'cover',
        position: 'entropy',
        quality: 100,
        normalize: true,
        embed: true,
        trellisQuantisation: true,
        overshootDeringing: true,
        optimiseScans: true,
        quantisationTable: 8,
        quantizationTable: 8,
        kernel: 'cubic'})
      .toFormat('jpeg')
      .toBuffer()
    )
    .then(buffer => S3.putObject({
        Body: buffer,
        Bucket: 'xxxx',
        ContentType: 'image/jpeg',
        Key: dstKey,
      }).promise()
    )
    .then(() => callback(null, {
        statusCode: '301',
        headers: {'location': `${URL}/${dstKey}`},
        body: '',
      })
    )
    .catch(err => callback(err))
}
