// src/security/auditLogger.js
// Logging seguro sem expor dados sensíveis

import crypto from 'crypto';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';

class AuditLogger {
  constructor() {
    this.logPath = process.env.AUDIT_LOG_PATH || './logs/audit/';
    this.encryptionKey = null;
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath, { recursive: true, mode: 0o700 });
    }
  }

  async log(eventType, metadata, userId = null) {
    const logEntry = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: new Date().toISOString(),
      eventType,
      userId: userId ? this.hashIdentifier(userId) : null,
      metadata: this.sanitizeMetadata(metadata),
      source: this.getSourceInfo(),
      sessionId: this.getSessionId()
    };

    // Adicionar hash de integridade
    logEntry.hash = this.calculateHash(logEntry);

    // Armazenar
    await this.writeLog(logEntry);

    // Se evento crítico, enviar alerta
    if (this.isCriticalEvent(eventType)) {
      await this.sendAlert(logEntry);
    }

    return logEntry.id;
  }

  hashIdentifier(identifier) {
    return crypto
      .createHash('sha256')
      .update(identifier + process.env.AUDIT_SALT)
      .digest('hex')
      .substring(0, 16);
  }

  sanitizeMetadata(metadata) {
    // Remove qualquer dado potencialmente sensível
    const sensitiveKeys = ['password', 'token', 'credit_card', 'cpf', 'email'];
    const sanitized = { ...metadata };
    
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  calculateHash(entry) {
    return crypto
      .createHmac('sha512', process.env.AUDIT_SECRET)
      .update(JSON.stringify(entry))
      .digest('hex');
  }

  async writeLog(entry) {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${this.logPath}audit-${dateStr}.log`;
    
    // Rotacionar se necessário
    if (fs.existsSync(filename) && fs.statSync(filename).size > 100 * 1024 * 1024) {
      await this.rotateLog(filename);
    }
    
    // Escrever log
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(filename, logLine, { mode: 0o600 });
    
    // Se log estiver muito grande, comprimir
    if (fs.existsSync(filename) && fs.statSync(filename).size > 500 * 1024 * 1024) {
      await this.compressLog(filename);
    }
  }

  async rotateLog(filename) {
    const timestamp = Date.now();
    const rotatedFile = `${filename}.${timestamp}`;
    fs.renameSync(filename, rotatedFile);
    await this.compressLog(rotatedFile);
  }

  async compressLog(filename) {
    const gzip = createGzip();
    const source = fs.createReadStream(filename);
    const destination = fs.createWriteStream(`${filename}.gz`);
    
    await pipeline(source, gzip, destination);
    fs.unlinkSync(filename); // Remove original após compressão
  }

  getSourceInfo() {
    return {
      hostname: process.env.HOSTNAME || 'unknown',
      pid: process.pid,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  getSessionId() {
    // Em produção, pegar do contexto da requisição
    return global.requestContext?.sessionId || 'system';
  }

  isCriticalEvent(eventType) {
    const criticalEvents = [
      'API_KEY_ROTATION',
      'SECURITY_ALERT',
      'UNAUTHORIZED_ACCESS',
      'DATA_BREACH_ATTEMPT',
      'ADMIN_ACTION'
    ];
    return criticalEvents.includes(eventType);
  }

  async sendAlert(entry) {
    // Implementar alerta via email/Slack/SMS
    console.error('🚨 ALERTA CRÍTICO:', entry);
    // await this.notificationService.send(entry);
  }

  async verifyLogIntegrity(filename) {
    const logs = fs.readFileSync(filename, 'utf8').split('\n').filter(l => l);
    
    for (let i = 0; i < logs.length; i++) {
      const entry = JSON.parse(logs[i]);
      const storedHash = entry.hash;
      delete entry.hash;
      
      const calculatedHash = this.calculateHash(entry);
      
      if (storedHash !== calculatedHash) {
        throw new Error(`Log tampering detected at entry ${i}`);
      }
    }
    
    return true;
  }
}

export default new AuditLogger();