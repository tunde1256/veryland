const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const secretKey = process.env.SECRET_KEY;

// Helper function to encrypt a document using AES-256
const encryptDocument = (filePath, secretKey) => {
  return new Promise((resolve, reject) => {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16); // 16-byte initialization vector
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'utf-8'), iv);

    const inputFile = fs.createReadStream(filePath);
    const encryptedFilePath = `${filePath}.enc`; // Encrypted file path
    const outputFile = fs.createWriteStream(encryptedFilePath);

    inputFile.pipe(cipher).pipe(outputFile);

    outputFile.on('finish', () => resolve({ encryptedFilePath, iv: iv.toString('hex') })); // Return encrypted file path and IV
    outputFile.on('error', reject);
  });
};

// Helper function to decrypt a document using AES-256
const decryptDocument = (encryptedFilePath, secretKey, ivHex) => {
  return new Promise((resolve, reject) => {
    const algorithm = 'aes-256-cbc';
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'utf-8'), iv);

    const inputFile = fs.createReadStream(encryptedFilePath);
    const decryptedFilePath = `${encryptedFilePath}.dec`; // Decrypted file path
    const outputFile = fs.createWriteStream(decryptedFilePath);

    inputFile.pipe(decipher).pipe(outputFile);

    outputFile.on('finish', () => resolve(decryptedFilePath)); 
    outputFile.on('error', reject);
  });
};

module.exports = { encryptDocument, decryptDocument };
