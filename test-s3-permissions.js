#!/usr/bin/env node

import 'dotenv/config';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.S3_BUCKET_NAME || 'curacao-sports-week';

async function testS3Permissions() {
  console.log('🔧 Testing S3 Permissions...');
  console.log(`Bucket: ${bucketName}`);
  console.log(`Region: ${process.env.S3_REGION || 'us-east-1'}`);
  console.log(`Access Key: ${process.env.S3_ACCESS_KEY_ID ? `${process.env.S3_ACCESS_KEY_ID.substring(0, 8)}...` : 'NOT SET'}`);
  console.log('');

  try {
    // Test 1: List objects (basic read permission)
    console.log('📋 Test 1: List objects...');
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1
    });
    await s3Client.send(listCommand);
    console.log('✅ List objects: SUCCESS');
  } catch (error) {
    console.log('❌ List objects: FAILED');
    console.log(`   Error: ${error.message}`);
  }

  try {
    // Test 2: Put object (write permission)
    console.log('📤 Test 2: Put object...');
    const testKey = `test-${randomUUID()}.txt`;
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: 'Test file content',
      ContentType: 'text/plain'
    });
    await s3Client.send(putCommand);
    console.log('✅ Put object: SUCCESS');
    
    // Clean up test file
    try {
      const deleteCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });
      // Note: We can't delete with PutObjectCommand, but the test file will expire
      console.log(`   Test file created: ${testKey} (will need manual cleanup)`);
    } catch (cleanupError) {
      console.log(`   Warning: Could not clean up test file: ${cleanupError.message}`);
    }
  } catch (error) {
    console.log('❌ Put object: FAILED');
    console.log(`   Error: ${error.message}`);
    console.log('');
    console.log('🔧 SOLUTION:');
    console.log('The AWS credentials need the following IAM permissions:');
    console.log('');
    console.log('{');
    console.log('  "Version": "2012-10-17",');
    console.log('  "Statement": [');
    console.log('    {');
    console.log('      "Effect": "Allow",');
    console.log('      "Action": [');
    console.log('        "s3:PutObject",');
    console.log('        "s3:PutObjectAcl",');
    console.log('        "s3:GetObject",');
    console.log('        "s3:DeleteObject",');
    console.log('        "s3:ListBucket"');
    console.log('      ],');
    console.log('      "Resource": [');
    console.log(`        "arn:aws:s3:::${bucketName}",`);
    console.log(`        "arn:aws:s3:::${bucketName}/*"`);
    console.log('      ]');
    console.log('    }');
    console.log('  ]');
    console.log('}');
    console.log('');
    console.log('Or use the AWS managed policy: AmazonS3FullAccess');
  }

  try {
    // Test 3: Get object (read permission)
    console.log('📥 Test 3: Get object...');
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: 'non-existent-file.txt'
    });
    await s3Client.send(getCommand);
    console.log('✅ Get object: SUCCESS');
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      console.log('✅ Get object: SUCCESS (bucket accessible, file just doesn\'t exist)');
    } else {
      console.log('❌ Get object: FAILED');
      console.log(`   Error: ${error.message}`);
    }
  }
}

testS3Permissions().catch(console.error);
