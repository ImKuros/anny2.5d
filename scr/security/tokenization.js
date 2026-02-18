// src/security/tokenization.js
// Substitui dados sensíveis por tokens seguros

import crypto from 'crypto';
import KeyManagementService from './keyManagement.js';

class TokenizationService {
  constructor() {
    this.tokenVault = new Map(); // Em produção, use Redis/banco criptografado
    this.reverseIndex = new Map();
  }

  /**
   * Tokeniza um dado sensível
   */
  tokenize(data, ttl = 30 * 24 * 60 * 60 * 1000) { // 30 dias padrão
    // Gerar token aleatório
    const token = this.generateToken();
    
    // Criptografar o dado original
    const key = KeyManagementService.getCurrentKey();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, crypto.randomBytes(12));
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Armazenar no vault
    this.tokenVault.set(token, {
      data: encrypted,
      authTag,
      iv: cipher.getIV(),
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl
    });
    
    // Índice reverso (para auditoria)
    const hash = this.hashForIndex(data);
    if (!this.reverseIndex.has(hash)) {
      this.reverseIndex.set(hash, []);
    }
    this.reverseIndex.get(hash).push(token);
    
    return token;
  }

  /**
   * Detokeniza (recupera dado original)
   */
  detokenize(token) {
    const vaultEntry = this.tokenVault.get(token);
    if (!vaultEntry) {
      throw new Error('Token inválido ou expirado');
    }
    
    if (vaultEntry.expiresAt < Date.now()) {
      this.tokenVault.delete(token);
      throw new Error('Token expirado');
    }
    
    const key = KeyManagementService.getCurrentKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, vaultEntry.iv);
    decipher.setAuthTag(vaultEntry.authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(vaultEntry.data),
      decipher.final()
    ]);
    
    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Gera token seguro
   */
  generateToken() {
    return 'tok_' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash para índice reverso (não reversível)
   */
  hashForIndex(data) {
    return crypto
      .createHash('sha384')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Limpa tokens expirados
   */
  cleanExpiredTokens() {
    for (const [token, data] of this.tokenVault.entries()) {
      if (data.expiresAt < Date.now()) {
        this.tokenVault.delete(token);
      }
    }
  }
}

export default new TokenizationService();