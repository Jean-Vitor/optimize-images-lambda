'use strict';

const AWS = require('aws-sdk')
const sharp = require('sharp')
const {basename, extname} = require('path');

const S3 = new AWS.S3();


module.exports.handler = async ({Records: records}, context) => {
  try {
    await Promise.all(records.map(async record => {
      const { key } = record.s3.object;

      const image = await S3.getObject({
        Bucket: process.env.bucket,
        Key: key,
      }).promise();

      const optimizedImage = await sharp(image.Body)
        .resize(1280, 720, {fit: 'inside'})
        .toFormat('jpeg', {progressive: true, quality: 60})
        .toBuffer();

      await S3.putObject({
        Body: optimizedImage,
        Bucket: process.env.bucket,
        ContentType: 'image/jpeg',
        Key: `compressed/${basename(key, extname(key))}.jpg`
      }).promise();
    }))

    return {
      statusCode: 201,
      body: {ok: true}
    }
  } catch (error){
    return error;
  }
};
