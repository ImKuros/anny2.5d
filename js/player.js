import { Entity } from './entity.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        
        /* === CONFIGURAÇÕES === */
        this.speed = 200;
        this.input = null;
        this.spriteLoader = null;
        
        /* === IDENTIDADE === */
        this.name = 'MEU PERSONAGEM';
        this.width = 94;
        this.height = 124;
        
        /* === ESTADOS === */
        this.direction = 's';
        this.state = 'idle';
        this.moving = false;
        
        /* === ANIMAÇÃO IDLE === */
        this.idleFrame = 0;
        this.idleTimer = 0;
        this.idleSpeed = 0.30;      // 200ms
        this.maxIdleFrames = 30;      // ← ajuste conforme seus PNGs
        
        /* === ANIMAÇÃO WALK === */
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.frameSpeed = 1.0;      // 180ms
        this.maxFrames = 30;           // ← ajuste conforme seus PNGs
        
        /* === EFEITOS VISUAIS === */
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.particles = [];
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
            
            // 4 direções cardinais
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
        
        // Partículas ao caminhar
        if (this.moving && Math.random() < 0.3) {
            this.particles.push({
                x: this.x - 12 + Math.random() * 24,
                y: this.y + 20,
                life: 0.8,
                maxLife: 0.8,
                size: 2 + Math.random() * 4,
                speedX: (Math.random() - 0.5) * 30,
                speedY: -20 - Math.random() * 30,
                color: `rgba(200, 160, 220, ${0.6})`
            });
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime;
            p.x += p.speedX * deltaTime;
            p.y += p.speedY * deltaTime;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }
    
    render(ctx, camera) {
        const screenX = this.x - camera.x - this.width/2;
        const screenY = this.y - camera.y - this.height;
        
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        this.renderShadow(ctx, screenX + this.width/2, screenY + this.height);
        this.renderAura(ctx, screenX + this.width/2, screenY + this.height/2);
        this.renderSprite(ctx, screenX, screenY);
        this.renderParticles(ctx, camera);
        this.renderName(ctx, screenX + this.width/2, screenY);
        
        ctx.restore();
    }
    
    renderSprite(ctx, screenX, screenY) {
        if (!this.spriteLoader) {
            ctx.fillStyle = '#f0f';
            ctx.fillRect(screenX, screenY, this.width, this.height);
            return;
        }
        
        const frame = this.state === 'idle' ? this.idleFrame : this.animationFrame;
        const sprite = this.spriteLoader.getSprite(this.state, this.direction, frame);
        
        if (sprite) {
            ctx.drawImage(
                sprite,
                0, 0,
                sprite.width, sprite.height,
                screenX, screenY,
                this.width, this.height
            );
        } else {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(screenX, screenY, this.width, this.height);
        }
    }
    
    renderShadow(ctx, centerX, groundY) {
        const gradient = ctx.createRadialGradient(centerX, groundY-6, 5, centerX, groundY-6, 25);
        gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.beginPath();
        ctx.ellipse(centerX, groundY-6, 20, 6, 0, 0, Math.PI*2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    renderAura(ctx, centerX, centerY) {
        const pulse = 0.5 + this.glowIntensity * 0.3;
        ctx.shadowColor = '#b07ac0';
        ctx.shadowBlur = 20 * pulse;
        ctx.beginPath();
        ctx.arc(centerX, centerY-10, 25, 0, Math.PI*2);
        ctx.fillStyle = `rgba(150,100,200,${0.1*pulse})`;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    renderParticles(ctx, camera) {
        for (const p of this.particles) {
            const x = p.x - camera.x;
            const y = p.y - camera.y;
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    renderName(ctx, centerX, topY) {
        ctx.font = 'bold 14px "Cinzel", monospace';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(this.name, centerX - 35, topY - 10);
        ctx.shadowBlur = 0;
    }
}