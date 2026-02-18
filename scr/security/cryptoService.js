// src/security/cryptoService.js
// Serviço de criptografia avançada para dados sensíveis

import crypto from 'crypto';
import { promisify } from 'util';

const randomBytesAsync = promisify(crypto.randomBytes);

class CryptoService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyDerivation = 'pbkdf2-sha512';
    this.iterations = 100000;
    this.keyLength = 32;
  }

  /**
   * Deriva uma chave a partir de uma senha
   */
  async deriveKey(password, salt = null) {
    salt = salt || await randomBytesAsync(32);
    const key = await promisify(crypto.pbkdf2)(
      password,
      salt,
      this.iterations,
      this.keyLength,
      'sha512'
    );
    return { key, salt };
  }

  /**
   * Criptografa dados com envelope de chave
   */
  async encryptData(data, key) {
    const iv = await randomBytesAsync(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted;
    if (typeof data === 'string') {
      encrypted = Buffer.concat([
        cipher.update(data, 'utf8'),
        cipher.final()
      ]);
    } else {
      encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final()
      ]);
    }
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted.toString('hex'),
      algorithm: this.algorithm
    };
  }

  /**
   * Descriptografa dados com envelope de chave
   */
  decryptData(encryptedPackage, key) {
    const iv = Buffer.from(encryptedPackage.iv, 'hex');
    const authTag = Buffer.from(encryptedPackage.authTag, 'hex');
    const encryptedData = Buffer.from(encryptedPackage.data, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Criptografa com envelope de chave mestra (usando senha)
   */
  async encryptWithMasterPassword(data, masterPassword) {
    const { key, salt } = await this.deriveKey(masterPassword);
    const encrypted = await this.encryptData(data, key);
    
    return {
      ...encrypted,
      salt: salt.toString('hex'),
      version: 1
    };
  }

  /**
   * Descriptografa com envelope de chave mestra
   */
  async decryptWithMasterPassword(encryptedPackage, masterPassword) {
    const salt = Buffer.from(encryptedPackage.salt, 'hex');
    const { key } = await this.deriveKey(masterPassword, salt);
    return this.decryptData(encryptedPackage, key);
  }

  /**
   * Gera hash seguro de dados (para auditoria sem expor dados)
   */
  hashForAudit(data, salt = null) {
    salt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .createHash('sha256')
      .update(data + salt)
      .digest('hex');
    
    return { hash, salt };
  }

  /**
   * Cria assinatura HMAC para verificação de integridade
   */
  createHMAC(data, key) {
    const hmac = crypto.createHmac('sha512', key);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Gera par de chaves para API (rotação)
   */
  async generateKeyPair() {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
          cipher: 'aes-256-cbc',
          passphrase: '' // Será preenchido depois
        }
      }, (err, publicKey, privateKey) => {
        if (err) reject(err);
        else resolve({ publicKey, privateKey });
      });
    });
  }
}

export default new CryptoService();