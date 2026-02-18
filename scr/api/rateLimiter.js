// src/api/rateLimiter.js
// Rate limiting avançado com Redis (fallback para memória)

import crypto from 'crypto';

class RateLimiter {
  constructor() {
    this.storage = new Map(); // Fallback para memória
    this.usagePatterns = new Map();
  }

  async checkLimit(userId, endpoint, options = {}) {
    const {
      limit = 60,
      window = 60000,
      burstLimit = 100,
      burstWindow = 10000
    } = options;

    const key = this.generateKey(userId, endpoint);
    const now = Date.now();

    // Obter ou criar contador
    if (!this.storage.has(key)) {
      this.storage.set(key, {
        requests: [],
        burst: [],
        blocked: false,
        blockedUntil: 0
      });
    }

    const record = this.storage.get(key);

    // Verificar se está bloqueado
    if (record.blocked && record.blockedUntil > now) {
      return {
        allowed: false,
        reason: 'blocked',
        retryAfter: record.blockedUntil - now,
        blockExpiry: record.blockedUntil
      };
    } else if (record.blocked && record.blockedUntil <= now) {
      record.blocked = false;
    }

    // Limpar registros antigos
    record.requests = record.requests.filter(t => now - t < window);
    record.burst = record.burst.filter(t => now - t < burstWindow);

    // Verificar limite normal
    if (record.requests.length >= limit) {
      return {
        allowed: false,
        reason: 'rate_limit',
        retryAfter: window - (now - record.requests[0]),
        currentCount: record.requests.length,
        limit
      };
    }

    // Verificar burst limit
    if (record.burst.length >= burstLimit) {
      // Bloquear por 5 minutos se exceder burst
      record.blocked = true;
      record.blockedUntil = now + 5 * 60 * 1000;
      
      // Log de segurança
      console.error(`🚨 BURST LIMIT EXCEEDED: ${key}`);
      
      return {
        allowed: false,
        reason: 'burst_limit_exceeded',
        blocked: true,
        blockedUntil: record.blockedUntil
      };
    }

    // Registrar requisição
    record.requests.push(now);
    record.burst.push(now);

    // Detectar padrões suspeitos
    await this.detectSuspiciousPatterns(userId, endpoint, record);

    return {
      allowed: true,
      currentCount: record.requests.length,
      remaining: limit - record.requests.length,
      resetIn: record.requests.length > 0 ? window - (now - record.requests[0]) : 0
    };
  }

  generateKey(userId, endpoint) {
    return crypto
      .createHash('sha256')
      .update(`${userId}:${endpoint}:${process.env.RATE_LIMIT_SALT}`)
      .digest('hex');
  }

  async detectSuspiciousPatterns(userId, endpoint, record) {
    const key = `${userId}:patterns`;
    
    if (!this.usagePatterns.has(key)) {
      this.usagePatterns.set(key, {
        timestamps: [],
        endpoints: new Set()
      });
    }
    
    const pattern = this.usagePatterns.get(key);
    pattern.timestamps.push(Date.now());
    pattern.endpoints.add(endpoint);
    
    // Manter apenas últimos 5 minutos
    pattern.timestamps = pattern.timestamps.filter(t => Date.now() - t < 300000);
    
    // Detectar acesso a muitos endpoints em pouco tempo
    if (pattern.endpoints.size > 10 && pattern.timestamps.length > 50) {
      console.warn(`⚠️ Possível varredura detectada: ${userId}`);
      
      // Bloquear temporariamente
      const blockKey = this.generateKey(userId, 'global');
      if (this.storage.has(blockKey)) {
        this.storage.get(blockKey).blocked = true;
        this.storage.get(blockKey).blockedUntil = Date.now() + 3600000; // 1 hora
      }
    }
    
    // Resetar endpoints a cada 5 minutos
    setTimeout(() => {
      if (this.usagePatterns.has(key)) {
        this.usagePatterns.get(key).endpoints.clear();
      }
    }, 300000).unref();
  }
}

export default new RateLimiter();