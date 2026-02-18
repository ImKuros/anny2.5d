// src/security/keyManagement.js
// Gerenciamento de chaves com rotação automática

import crypto from 'crypto';
import CryptoService from './cryptoService.js';

class KeyManagementService {
  constructor() {
    this.keys = new Map();
    this.keyExpiration = 7 * 24 * 60 * 60 * 1000; // 7 dias
    this.rotationInterval = 24 * 60 * 60 * 1000; // 24 horas
    this.currentKeyId = null;
    this.masterKeyEnv = process.env.MASTER_KEY_ENCRYPTION_KEY;
  }

  async initialize() {
    // Gerar primeira chave
    await this.rotateKeys();
    
    // Configurar rotação automática
    setInterval(() => this.rotateKeys(), this.rotationInterval);
    
    console.log('🔑 Key Management Service inicializado');
  }

  async rotateKeys() {
    const keyId = crypto.randomBytes(16).toString('hex');
    const key = await this.generateSecureKey();
    
    // Criptografar a chave com a chave mestra
    const encryptedKey = await CryptoService.encryptData(
      key.toString('hex'),
      Buffer.from(this.masterKeyEnv, 'hex')
    );
    
    this.keys.set(keyId, {
      key,
      encryptedKey,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.keyExpiration
    });
    
    this.currentKeyId = keyId;
    
    // Limpar chaves expiradas
    this.cleanExpiredKeys();
    
    console.log(`🔄 Chaves rotacionadas. Novo KeyID: ${keyId}`);
  }

  async generateSecureKey() {
    // Gerar chave forte para AES-256
    return await crypto.randomBytes(32);
  }

  getCurrentKey() {
    if (!this.currentKeyId) {
      throw new Error('Nenhuma chave disponível');
    }
    
    const keyData = this.keys.get(this.currentKeyId);
    
    // Verificar expiração
    if (keyData.expiresAt < Date.now()) {
      this.rotateKeys();
      return this.getCurrentKey();
    }
    
    return keyData.key;
  }

  getKeyById(keyId) {
    const keyData = this.keys.get(keyId);
    if (!keyData) {
      throw new Error('Chave não encontrada');
    }
    return keyData.key;
  }

  cleanExpiredKeys() {
    for (const [keyId, keyData] of this.keys.entries()) {
      if (keyData.expiresAt < Date.now()) {
        this.keys.delete(keyId);
        console.log(`🗑️ Chave expirada removida: ${keyId}`);
      }
    }
  }

  // Para auditoria - apenas metadados, nunca as chaves
  getKeyMetadata() {
    const metadata = [];
    for (const [keyId, keyData] of this.keys.entries()) {
      metadata.push({
        keyId,
        createdAt: keyData.createdAt,
        expiresAt: keyData.expiresAt,
        isCurrent: keyId === this.currentKeyId
      });
    }
    return metadata;
  }
}

export default new KeyManagementService();