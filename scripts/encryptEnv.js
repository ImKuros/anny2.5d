#!/usr/bin/env node
// scripts/encryptEnv.js
// Script para criptografar o arquivo .env com senha mestra

import crypto from 'crypto';
import fs from 'fs';
import readline from 'readline';
import { promisify } from 'util';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = promisify(rl.question).bind(rl);

async function encryptEnv() {
  console.log('🔐 CRIPTOGRAFAR ARQUIVO .ENV');
  console.log('----------------------------');
  
  try {
    // Ler arquivo .env
    if (!fs.existsSync('.env')) {
      console.error('❌ Arquivo .env não encontrado!');
      process.exit(1);
    }

    const envContent = fs.readFileSync('.env', 'utf8');
    
    // Solicitar senha mestra
    const password = await question('Digite a senha mestra (mínimo 12 caracteres): ');
    if (password.length < 12) {
      console.error('❌ Senha muito curta! Mínimo 12 caracteres.');
      process.exit(1);
    }

    // Gerar salt e derivar chave
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
    
    // Gerar IV
    const iv = crypto.randomBytes(16);
    
    // Criptografar
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(envContent, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Estrutura do arquivo criptografado
    const encryptedPackage = {
      version: 1,
      algorithm: 'aes-256-gcm',
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted.toString('hex'),
      timestamp: new Date().toISOString()
    };
    
    // Salvar arquivo criptografado
    fs.writeFileSync('.env.encrypted', JSON.stringify(encryptedPackage, null, 2));
    
    // Backup seguro
    fs.writeFileSync(`.env.backup.${Date.now()}.enc`, JSON.stringify(encryptedPackage));
    
    console.log('✅ Arquivo .env criptografado com sucesso!');
    console.log('📁 Arquivos gerados:');
    console.log('   - .env.encrypted (principal)');
    console.log('   - .env.backup.*.enc (backup)');
    console.log('\n⚠️  GUARDE A SENHA MESTRA EM UM LOCAL SEGURO!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    rl.close();
  }
}

encryptEnv();