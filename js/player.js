import { Entity } from './entity.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        
        /* === CONFIGURAÇÕES === */
        this.speed = 100;
        this.input = null;
        this.spriteLoader = null;
        
        /* === IDENTIDADE === */
        this.name = 'MEU PERSONAGEM';
        this.width = 174;
        this.height = 194;
        
        /* === ESTADOS === */
        this.direction = 's';
        this.state = 'idle';
        this.moving = false;
        
        /* === ANIMAÇÃO IDLE — 8 FRAMES === */
        this.idleFrame = 0;
        this.idleTimer = 0;
        this.idleSpeed = 3.0;      // 200ms — respiração calma
        this.maxIdleFrames = 8;     // 8 frames de respiração
        
        /* === ANIMAÇÃO WALK — 8 FRAMES (4 DIREÇÕES) === */
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.frameSpeed = 1.10;     // 180ms — suave para 8 frames
        this.maxFrames = 8;         // ← AGORA 8 FRAMES PARA CAMINHADA
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
            // Animação de caminhada — 8 frames
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.frameSpeed) {
                this.animationFrame = (this.animationFrame + 1) % this.maxFrames;
                this.animationTimer = 0;
            }
            // Reseta idle ao andar
            this.idleFrame = 0;
            this.idleTimer = 0;
        } else {
            // IDLE — respiração em 8 frames
            this.animationFrame = 0;
            this.idleTimer += deltaTime;
            if (this.idleTimer >= this.idleSpeed) {
                this.idleFrame = (this.idleFrame + 1) % this.maxIdleFrames;
                this.idleTimer = 0;
            }
        }
    }
    
    render(ctx, camera) {
        const screenX = this.x - camera.x - this.width/2;
        const screenY = this.y - camera.y - this.height;
        
        ctx.save();
        
        // SOMBRA
        this.renderShadow(ctx, screenX + this.width/2, screenY + this.height);
        
        // SPRITE
        this.renderSprite(ctx, screenX, screenY);
        
        // NOME
        this.renderName(ctx, screenX + this.width/2, screenY);
        
        ctx.restore();
    }
    
    renderSprite(ctx, screenX, screenY) {
        if (!this.spriteLoader) {
            // Fallback extremo
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(screenX, screenY, this.width, this.height);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px monospace';
            ctx.fillText('?', screenX + 10, screenY + 35);
            return;
        }
        
        // DEFINE O FRAME CORRETO
        let frame = 0;
        if (this.state === 'idle') {
            frame = this.idleFrame;        // 0..7
        } else {
            frame = this.animationFrame;   // 0..7 (walk)
        }
        
        const sprite = this.spriteLoader.getSprite(this.state, this.direction, frame);
        
        if (!sprite) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(screenX, screenY, this.width, this.height);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`${this.direction}`, screenX + 10, screenY + 30);
            return;
        }
        
        try {
            ctx.drawImage(
                sprite,
                0, 0,
                sprite.width, sprite.height,
                screenX, screenY,
                this.width, this.height
            );
        } catch (e) {
            console.error('❌ drawImage falhou:', e);
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(screenX, screenY, this.width, this.height);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('ERRO', screenX + 5, screenY + 30);
        }
    }
    
    renderShadow(ctx, centerX, groundY) {
        ctx.beginPath();
        ctx.ellipse(centerX, groundY - 6, 16, 5, 0, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fill();
    }
    
    renderName(ctx, centerX, topY) {
        ctx.font = 'bold 14px "Cinzel", "Courier New", monospace';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(this.name, centerX - 35, topY - 10);
        ctx.shadowBlur = 0;
    }
}