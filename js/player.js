import { Entity } from './entity.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        
        /* === CONFIGURAÇÕES === */
        this.speed = 50;
        this.input = null;
        this.spriteLoader = null;
        
        /* === IDENTIDADE === */
        this.name = 'MEU PERSONAGEM';
        this.width = 154;
        this.height = 174;
        
        /* === ESTADOS === */
        this.direction = 's';
        this.state = 'idle';
        this.moving = false;
        
        /* === ANIMAÇÃO IDLE — 8 FRAMES === */
        this.idleFrame = 0;
        this.idleTimer = 0;
        this.idleSpeed = 3.0;
        this.maxIdleFrames = 8;
        
        /* === ANIMAÇÃO WALK — 8 FRAMES === */
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.frameSpeed = 1.0;
        this.maxFrames = 8;
        
        /* === EFEITOS VISUAIS === */
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.particles = [];
        
        /* === SOMBRA DINÂMICA === */
        this.shadowScale = 1.0;
        this.lightAngle = 45; // graus, simulando direção da luz
    }
    
    setSpriteLoader(loader) {
        this.spriteLoader = loader;
        console.log('✅ [PLAYER] SpriteLoader conectado');
    }
    
    setInput(input) {
        this.input = input;
    }
    
    update(deltaTime) {
        this.handleMovement();
        this.handleAnimation(deltaTime);
        this.updateVisualEffects(deltaTime);
        super.update(deltaTime);
    }
    
    handleMovement() {
        if (!this.input) return;
        
        let dx = 0, dy = 0;
        if (this.input.keys.has('w')) dy -= 1;
        if (this.input.keys.has('s')) dy += 1;
        if (this.input.keys.has('a')) dx -= 1;
        if (this.input.keys.has('d')) dx += 1;
        
        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx*dx + dy*dy);
            dx /= length;
            dy /= length;
            
            this.velocity.x = dx;
            this.velocity.y = dy;
            this.moving = true;
            this.state = 'walk';
            
            // 4 DIREÇÕES CARDINAIS
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'e' : 'w';
            } else {
                this.direction = dy > 0 ? 's' : 'n';
            }
        } else {
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.moving = false;
            this.state = 'idle';
        }
    }
    
    handleAnimation(deltaTime) {
        if (this.moving && this.state === 'walk') {
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.frameSpeed) {
                this.animationFrame = (this.animationFrame + 1) % this.maxFrames;
                this.animationTimer = 0;
            }
            this.idleFrame = 0;
            this.idleTimer = 0;
        } else {
            this.animationFrame = 0;
            this.idleTimer += deltaTime;
            if (this.idleTimer >= this.idleSpeed) {
                this.idleFrame = (this.idleFrame + 1) % this.maxIdleFrames;
                this.idleTimer = 0;
            }
        }
    }
    
    updateVisualEffects(deltaTime) {
        // Brilho pulsante
        this.glowIntensity += deltaTime * 2 * this.glowDirection;
        if (this.glowIntensity > 1) {
            this.glowIntensity = 1;
            this.glowDirection = -1;
        } else if (this.glowIntensity < 0.3) {
            this.glowIntensity = 0.3;
            this.glowDirection = 1;
        }
        
        // Partículas de poeira mágica ao caminhar
        if (this.moving && Math.random() < 0.4) {
            this.particles.push({
                x: this.x - 12 + Math.random() * 24,
                y: this.y + 15,
                life: 0.8,
                maxLife: 0.8,
                size: 2 + Math.random() * 4,
                speedX: (Math.random() - 0.5) * 40,
                speedY: -30 - Math.random() * 30,
                color: `rgba(200, 160, 220, ${0.5 + Math.random() * 0.3})`
            });
        }
        
        // Atualizar partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime;
            p.x += p.speedX * deltaTime;
            p.y += p.speedY * deltaTime;
            p.size *= 0.98;
            
            if (p.life <= 0 || p.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(ctx, camera) {
        const screenX = this.x - camera.x - this.width / 2;
        const screenY = this.y - camera.y - this.height;
        
        ctx.save();
        
        // Ativar suavização (anti-aliasing) para sprites
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 1. SOMBRA REALISTA COM GRADIENTE
        this.renderAdvancedShadow(ctx, screenX + this.width / 2, screenY + this.height);
        
        // 2. AURA MÍSTICA
        this.renderAura(ctx, screenX + this.width / 2, screenY + this.height / 2);
        
        // 3. SPRITE PRINCIPAL COM CONTORNO SUAVE
        this.renderSprite(ctx, screenX, screenY);
        
        // 4. PARTÍCULAS (desenhadas sobre o personagem)
        this.renderParticles(ctx, camera);
        
        // 5. NOME
        this.renderName(ctx, screenX + this.width / 2, screenY);
        
        ctx.restore();
    }
    
    renderAdvancedShadow(ctx, centerX, groundY) {
        // Sombra com gradiente radial: mais escura no centro, mais clara nas bordas
        const gradient = ctx.createRadialGradient(
            centerX, groundY - 4, 5,
            centerX, groundY - 4, 25
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.ellipse(
            centerX,
            groundY - 6,
            18 * this.shadowScale,
            6 * this.shadowScale,
            0, 0, Math.PI * 2
        );
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    renderAura(ctx, centerX, centerY) {
        const pulse = 0.5 + this.glowIntensity * 0.3;
        
        ctx.shadowColor = '#b07ac0';
        ctx.shadowBlur = 20 * pulse;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY - 10, 20, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 100, 200, ${0.1 * pulse})`;
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
    
    renderSprite(ctx, screenX, screenY) {
        if (!this.spriteLoader) {
            // Fallback extremo com estilo melhorado
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 10;
            ctx.fillRect(screenX, screenY, this.width, this.height);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px monospace';
            ctx.fillText('?', screenX + 10, screenY + 35);
            return;
        }
        
        const frame = this.state === 'idle' ? this.idleFrame : this.animationFrame;
        const sprite = this.spriteLoader.getSprite(this.state, this.direction, frame);
        
        if (!sprite) {
            // Fallback colorido com gradiente
            const gradient = ctx.createLinearGradient(screenX, screenY, screenX + this.width, screenY + this.height);
            gradient.addColorStop(0, '#ff00ff');
            gradient.addColorStop(1, '#aa00aa');
            ctx.fillStyle = gradient;
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 8;
            ctx.fillRect(screenX, screenY, this.width, this.height);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(this.direction, screenX + 5, screenY + 30);
            return;
        }
        
        try {
            // Desenhar sprite com contorno suave (usando sombra)
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.drawImage(
                sprite,
                0, 0,
                sprite.width, sprite.height,
                screenX, screenY,
                this.width, this.height
            );
            
            // Pequeno brilho nos olhos (se o sprite permitir, mas adicionamos um ponto)
            // Isso é apenas um detalhe extra — opcional
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            
            // Se desejar um reflexo nos olhos (independente do sprite), podemos desenhar um pontinho
            // Mas depende da posição. Deixamos comentado para não poluir.
            // if (this.direction === 's') { ... }
            
        } catch (e) {
            console.error('❌ drawImage falhou:', e);
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(screenX, screenY, this.width, this.height);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('ERRO', screenX + 5, screenY + 30);
        }
    }
    
    renderParticles(ctx, camera) {
        for (const p of this.particles) {
            const screenX = p.x - camera.x;
            const screenY = p.y - camera.y;
            
            ctx.globalAlpha = p.life / p.maxLife;
            
            // Partícula com brilho
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
    
    renderName(ctx, centerX, topY) {
        ctx.font = 'bold 14px "Cinzel", "Courier New", monospace';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 6;
        ctx.fillText(this.name, centerX - 35, topY - 10);
        ctx.shadowBlur = 0;
    }
}