#!/usr/bin/env node

import 'dotenv/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.S3_BUCKET_NAME || 'curacao-sports-week';

async function testSignedUrl() {
  console.log('🔧 Testing S3 Signed URL Generation...');
  
  const objectId = randomUUID();
  const objectKey = `uploads/${objectId}`;
  
  console.log(`Object Key: ${objectKey}`);
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: 'application/octet-stream',
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    console.log('✅ Signed URL generated successfully');
    console.log(`URL: ${signedUrl.substring(0, 100)}...`);
    
    // Test the signed URL with a simple PUT request
    console.log('🧪 Testing signed URL with fetch...');
    const response = await fetch(signedUrl, {
      method: 'PUT',
      body: 'Test content',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
    
    if (response.ok) {
      console.log('✅ Signed URL upload test: SUCCESS');
    } else {
      console.log('❌ Signed URL upload test: FAILED');
      console.log(`Status: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log('❌ Signed URL generation failed');
    console.log(`Error: ${error.message}`);
  }
}

testSignedUrl().catch(console.error);
