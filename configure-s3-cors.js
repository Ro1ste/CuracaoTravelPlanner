#!/usr/bin/env node

import 'dotenv/config';
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.S3_BUCKET_NAME || 'curacao-travel-planner';

async function configureS3Cors() {
  try {
    // Read CORS configuration
    const corsConfigPath = path.join(process.cwd(), 's3-cors-config.json');
    const corsConfig = JSON.parse(fs.readFileSync(corsConfigPath, 'utf8'));

    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: corsConfig,
      },
    });

    await s3Client.send(command);
    console.log(`✅ CORS configuration applied to S3 bucket: ${bucketName}`);
  } catch (error) {
    console.error('❌ Failed to configure S3 CORS:', error);
    process.exit(1);
  }
}

configureS3Cors();
