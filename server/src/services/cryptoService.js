import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const CTR_IV_SIZE = 16;
const GCM_IV_SIZE = 12;
const GCM_TAG_SIZE = 16;

const MIME = {
  '.mp4':  'video/mp4',
  '.mov':  'video/quicktime',
  '.avi':  'video/x-msvideo',
  '.mkv':  'video/x-matroska',
  '.webm': 'video/webm',
  '.m4v':  'video/mp4',
  '.wmv':  'video/x-ms-wmv',
  '.flv':  'video/x-flv',
  '.ts':   'video/mp2t',
};

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw Object.assign(
      new Error('ENCRYPTION_KEY must be set as 64 hex characters (32 bytes)'),
      { status: 500 }
    );
  }
  return Buffer.from(hex, 'hex');
}

// --- Text encryption (AES-256-GCM, authenticated) ---
// Stored format: base64( iv[12] + authTag[16] + ciphertext )

export function encryptText(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(GCM_IV_SIZE);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptText(ciphertext) {
  const key = getKey();
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, GCM_IV_SIZE);
  const tag = buf.subarray(GCM_IV_SIZE, GCM_IV_SIZE + GCM_TAG_SIZE);
  const encrypted = buf.subarray(GCM_IV_SIZE + GCM_TAG_SIZE);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// --- File encryption (AES-256-CTR, seekable for Range requests) ---
// On-disk format: iv[16] + ciphertext

// Adds blockIndex to a 16-byte IV as a 128-bit big-endian integer (for CTR seeking).
function addToIV(iv, blockIndex) {
  const result = Buffer.from(iv);
  let carry = BigInt(blockIndex);
  for (let i = result.length - 1; i >= 0 && carry > 0n; i--) {
    const sum = BigInt(result[i]) + (carry & 0xffn);
    result[i] = Number(sum & 0xffn);
    carry = (carry >> 8n) + (sum >> 8n);
  }
  return result;
}

export async function encryptFileInPlace(filePath) {
  const key = getKey();
  const iv = crypto.randomBytes(CTR_IV_SIZE);
  const tmpPath = `${filePath}.enc`;

  const input = fs.createReadStream(filePath);
  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
  const output = fs.createWriteStream(tmpPath);

  output.write(iv);
  await pipeline(input, cipher, output);

  fs.unlinkSync(filePath);
  fs.renameSync(tmpPath, filePath);
}

export function streamDecryptedFile(filePath, req, res) {
  const key = getKey();
  const stat = fs.statSync(filePath);
  const plaintextSize = stat.size - CTR_IV_SIZE;

  const fd = fs.openSync(filePath, 'r');
  const iv = Buffer.alloc(CTR_IV_SIZE);
  fs.readSync(fd, iv, 0, CTR_IV_SIZE, 0);
  fs.closeSync(fd);

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'video/octet-stream';
  const rangeHeader = req.headers.range;

  if (rangeHeader) {
    const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? Math.min(parseInt(endStr, 10), plaintextSize - 1) : plaintextSize - 1;
    const chunkSize = end - start + 1;

    // Seek to the correct CTR block: each block is 16 bytes
    const blockIndex = Math.floor(start / 16);
    const byteOffset = start % 16;
    const seekedIV = addToIV(iv, blockIndex);
    const encryptedReadStart = CTR_IV_SIZE + blockIndex * 16;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${plaintextSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });

    const fileStream = fs.createReadStream(filePath, { start: encryptedReadStart });
    const decipher = crypto.createDecipheriv('aes-256-ctr', key, seekedIV);

    let bytesSkipped = 0;
    let bytesSent = 0;

    decipher.on('data', (chunk) => {
      if (bytesSent >= chunkSize) return;
      let data = chunk;

      if (bytesSkipped < byteOffset) {
        const toSkip = Math.min(byteOffset - bytesSkipped, data.length);
        data = data.subarray(toSkip);
        bytesSkipped += toSkip;
      }

      if (data.length > 0) {
        const remaining = chunkSize - bytesSent;
        if (data.length > remaining) data = data.subarray(0, remaining);
        res.write(data);
        bytesSent += data.length;
      }

      if (bytesSent >= chunkSize) {
        fileStream.destroy();
        if (!res.writableEnded) res.end();
      }
    });

    decipher.on('end', () => { if (!res.writableEnded) res.end(); });
    fileStream.on('error', () => { if (!res.writableEnded) res.end(); });
    fileStream.pipe(decipher);
  } else {
    res.writeHead(200, {
      'Content-Length': plaintextSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    });
    const fileStream = fs.createReadStream(filePath, { start: CTR_IV_SIZE });
    const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
    fileStream.on('error', () => { if (!res.writableEnded) res.end(); });
    decipher.on('error', () => { if (!res.writableEnded) res.end(); });
    fileStream.pipe(decipher).pipe(res);
  }
}
