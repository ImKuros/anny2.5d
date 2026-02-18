// src/api/requestValidator.js
// Validação rigorosa de todas as requisições

import crypto from 'crypto';

class RequestValidator {
  constructor() {
    this.maxPromptLength = 500;
    this.allowedCharacters = /^[a-zA-Z0-9\s.,!?\-_\'"]+$/;
    this.rateLimit = new Map();
  }

  validatePrompt(prompt) {
    const errors = [];

    // Tamanho
    if (!prompt || prompt.length === 0) {
      errors.push('Prompt não pode ser vazio');
    } else if (prompt.length > this.maxPromptLength) {
      errors.push(`Prompt muito longo (máximo ${this.maxPromptLength} caracteres)`);
    }

    // Caracteres permitidos (evitar injection)
    if (prompt && !this.allowedCharacters.test(prompt)) {
      errors.push('Prompt contém caracteres não permitidos');
    }

    // Detectar tentativas de injection
    if (this.detectInjection(prompt)) {
      errors.push('Tentativa de injeção detectada');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: this.sanitizePrompt(prompt)
    };
  }

  detectInjection(prompt) {
    const injectionPatterns = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
      /__proto__/i,
      /constructor/i,
      /\\u00/i, // Unicode injection
      /;.*;/, // Multiple commands
      /--[^-]/, // SQL injection
      /'.*'/, // SQL injection
      /".*"/, // SQL injection
    ];

    return injectionPatterns.some(pattern => pattern.test(prompt));
  }

  sanitizePrompt(prompt) {
    return prompt
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  validateHeaders(headers) {
    const requiredHeaders = ['x-request-id', 'x-client-version', 'x-platform'];
    const missing = requiredHeaders.filter(h => !headers[h]);
    
    return {
      isValid: missing.length === 0,
      missing
    };
  }

  checkRateLimit(userId, endpoint, limit = 60, window = 60000) {
    const key = `${userId}:${endpoint}`;
    const now = Date.now();
    
    if (!this.rateLimit.has(key)) {
      this.rateLimit.set(key, []);
    }
    
    const timestamps = this.rateLimit.get(key);
    
    // Limpar timestamps antigos
    const validTimestamps = timestamps.filter(t => now - t < window);
    this.rateLimit.set(key, validTimestamps);
    
    if (validTimestamps.length >= limit) {
      return {
        allowed: false,
        retryAfter: window - (now - validTimestamps[0])
      };
    }
    
    validTimestamps.push(now);
    return { allowed: true };
  }

  generateRequestId() {
    return 'req_' + crypto.randomBytes(16).toString('hex');
  }
}

export default new RequestValidator();