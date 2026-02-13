import { Entity } from './entity.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        
        /* === CONFIGURAÇÕES === */
        this.speed = 200;
        this.input = null;
        this.videoLoader = null;
        
        /* === IDENTIDADE === */
        this.name = 'MEU PERSONAGEM';
        // Ajuste as dimensões conforme o tamanho do vídeo (ex: 100x180)
        this.width = 100;
        this.height = 180;
        
        /* === ESTADOS === */
        this.direction = 's';
        this.state = 'idle';
        this.moving = false;
        
        /* === CONTROLE DE TRANSIÇÃO DE VÍDEO === */
        this.lastState = '';
        this.lastDir = '';
        
        /* === EFEITOS VISUAIS === */
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.particles = [];
        this.shadowScale = 1.0;
    }
    
    setVideoLoader(loader) {
        this.videoLoader = loader;
        console.log('✅ [PLAYER] VideoLoader conectado');
    }
    
    setInput(input) {
        this.input = input;
    }
    
    update(deltaTime) {
        this.handleMovement();
        this.handleVideoTransition();
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
    
    handleVideoTransition() {
        if (this.lastState !== this.state || this.lastDir !== this.direction) {
            this.lastState = this.state;
            this.lastDir = this.direction;
            
            if (this.videoLoader) {
                this.videoLoader.playVideo(this.state, this.direction);
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
        if (this.moving && Math.random() < 0.4) {
            this.particles.push({
                x: this.x - 15 + Math.random() * 30,
                y: this.y + 20,
                life: 0.8,
                maxLife: 0.8,
                size: 2 + Math.random() * 6,
                speedX: (Math.random() - 0.5) * 40,
                speedY: -40 - Math.random() * 40,
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
        const screenX = this.x - camera.x - this.width/2;
        const screenY = this.y - camera.y - this.height;
        
        ctx.save();
        
        // Suavização para vídeos
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Sombra realista
        this.renderShadow(ctx, screenX + this.width/2, screenY + this.height);
        
        // Aura mística
        this.renderAura(ctx, screenX + this.width/2, screenY + this.height/2);
        
        // Vídeo principal
        this.renderVideo(ctx, screenX, screenY);
        
        // Partículas (sobre o personagem)
        this.renderParticles(ctx, camera);
        
        // Nome
        this.renderName(ctx, screenX + this.width/2, screenY);
        
        ctx.restore();
    }
    
    renderVideo(ctx, screenX, screenY) {
        if (!this.videoLoader) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(screenX, screenY, this.width, this.height);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px monospace';
            ctx.fillText('?', screenX + 40, screenY + 90);
            return;
        }
        
        const video = this.videoLoader.getVideo(this.state, this.direction);
        
        if (video instanceof HTMLVideoElement) {
            try {
                ctx.drawImage(
                    video,
                    0, 0,
                    video.videoWidth, video.videoHeight,
                    screenX, screenY,
                    this.width, this.height
                );
            } catch (e) {
                console.error('❌ Erro ao desenhar vídeo:', e);
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(screenX, screenY, this.width, this.height);
            }
        } else if (video instanceof HTMLCanvasElement) {
            ctx.drawImage(video, screenX, screenY, this.width, this.height);
        } else {
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(screenX, screenY, this.width, this.height);
        }
    }
    
    renderShadow(ctx, centerX, groundY) {
        const gradient = ctx.createRadialGradient(
            centerX, groundY - 10, 5,
            centerX, groundY - 10, 35
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.ellipse(
            centerX,
            groundY - 10,
            25 * this.shadowScale,
            8 * this.shadowScale,
            0, 0, Math.PI * 2
        );
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    renderAura(ctx, centerX, centerY) {
        const pulse = 0.5 + this.glowIntensity * 0.3;
        ctx.shadowColor = '#b07ac0';
        ctx.shadowBlur = 30 * pulse;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY - 20, 30, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 100, 200, ${0.1 * pulse})`;
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
    
    renderParticles(ctx, camera) {
        for (const p of this.particles) {
            const screenX = p.x - camera.x;
            const screenY = p.y - camera.y;
            
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
    
    renderName(ctx, centerX, topY) {
        ctx.font = 'bold 16px "Cinzel", "Courier New", monospace';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 8;
        ctx.fillText(this.name, centerX - 45, topY - 15);
        ctx.shadowBlur = 0;
    }
}