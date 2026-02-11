import { Entity } from './entity.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        
        /* === CONFIGURAÇÕES BASE === */
        this.speed = 200;
        this.input = null;
        this.spriteLoader = null;
        
        /* === IDENTIDADE === */
        this.name = 'MEU PERSONAGEM'; // ← ALTERE AQUI
        this.title = 'O Aventureiro';  // ← ALTERE AQUI
        
        /* === DIMENSÕES DO SPRITE === */
        this.width = 34;
        this.height = 54;
        this.spriteWidth = 34;
        this.spriteHeight = 54;
        
        /* === ESTADOS === */
        this.direction = 's';      // começa olhando sul
        this.state = 'idle';       // começa parado
        this.moving = false;
        
        /* === ANIMAÇÃO (reservado para futuro) === */
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.frameSpeed = 0.15;
        
        /* === STATUS BÁSICO === */
        this.stats = {
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50
        };
    }
    
    /* === CONEXÃO COM SPRITELOADER === */
    setSpriteLoader(loader) {
        this.spriteLoader = loader;
        console.log('✅ SpriteLoader conectado ao player');
    }
    
    /* === CONEXÃO COM INPUT === */
    setInput(input) {
        this.input = input;
    }
    
    /* === UPDATE = MOVIMENTO + 8 DIREÇÕES === */
    update(deltaTime) {
        this.handleMovement();
        super.update(deltaTime);
    }
    
    /* === SISTEMA DE 8 DIREÇÕES PERFEITO === */
    handleMovement() {
        if (!this.input) return;
        
        let dx = 0, dy = 0;
        
        if (this.input.keys.has('w')) dy -= 1;
        if (this.input.keys.has('s')) dy += 1;
        if (this.input.keys.has('a')) dx -= 1;
        if (this.input.keys.has('d')) dx += 1;
        
        // Se está se movendo
        if (dx !== 0 || dy !== 0) {
            // Normaliza vetor (diagonal não fica mais rápida)
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
            
            this.velocity.x = dx;
            this.velocity.y = dy;
            this.moving = true;
            this.state = 'walk';
            
            // === DEFINE 8 DIREÇÕES ===
            if (dx === 0 && dy < 0) this.direction = 'n';
            else if (dx > 0 && dy < 0) this.direction = 'ne';
            else if (dx > 0 && dy === 0) this.direction = 'e';
            else if (dx > 0 && dy > 0) this.direction = 'se';
            else if (dx === 0 && dy > 0) this.direction = 's';
            else if (dx < 0 && dy > 0) this.direction = 'sw';
            else if (dx < 0 && dy === 0) this.direction = 'w';
            else if (dx < 0 && dy < 0) this.direction = 'nw';
            
        } else {
            // Parado
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.moving = false;
            this.state = 'idle';
        }
    }
    
    /* === RENDERIZAÇÃO PRINCIPAL === */
    render(ctx, camera) {
        const screenX = this.x - camera.x - this.width / 2;
        const screenY = this.y - camera.y - this.height;
        
        ctx.save();
        
        // 1. SOMBRA 2.5D
        this.renderShadow(ctx, screenX + this.width / 2, screenY + this.height);
        
        // 2. SPRITE DO PERSONAGEM
        this.renderSprite(ctx, screenX, screenY);
        
        // 3. NOME E STATUS
        this.renderNameplate(ctx, screenX + this.width / 2, screenY);
        this.renderHealthBar(ctx, screenX + this.width / 2, screenY + this.height + 8);
        
        ctx.restore();
    }
    
    /* === RENDERIZAÇÃO DO SPRITE (PNG OU FALLBACK) === */
    renderSprite(ctx, screenX, screenY) {
        // Se não tem spriteLoader, fallback vermelho
        if (!this.spriteLoader) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(screenX, screenY, this.width, this.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('?', screenX + 12, screenY + 35);
            return;
        }
        
        // Pega o sprite correto: idle_n.png, walk_se.png, etc
        const sprite = this.spriteLoader.getSprite(this.state, this.direction);
        
        if (sprite) {
            // Desenha o PNG carregado
            ctx.drawImage(
                sprite,
                0, 0,
                this.spriteWidth, this.spriteHeight,
                screenX, screenY,
                this.width, this.height
            );
            
            // DEBUG OPCIONAL: mostra direção na tela
            if (false) { // Mude para true se quiser ver as direções
                ctx.font = 'bold 14px monospace';
                ctx.fillStyle = 'yellow';
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 4;
                ctx.fillText(`${this.state}_${this.direction}`, screenX, screenY - 20);
                ctx.shadowBlur = 0;
            }
            
        } else {
            // Fallback extremo (nunca deve acontecer)
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(screenX, screenY, this.width, this.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px monospace';
            ctx.fillText(this.direction.toUpperCase(), screenX + 5, screenY + 35);
        }
    }
    
    /* === SOMBRA 2.5D === */
    renderShadow(ctx, centerX, groundY) {
        ctx.beginPath();
        ctx.ellipse(
            centerX,
            groundY - 5,
            this.width * 0.45,
            this.height * 0.1,
            0, 0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fill();
    }
    
    /* === NOME DO PERSONAGEM === */
    renderNameplate(ctx, centerX, topY) {
        ctx.font = 'bold 14px "Cinzel", "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(this.name, centerX - 35, topY - 12);
        ctx.shadowBlur = 0;
    }
    
    /* === BARRA DE VIDA SIMPLES === */
    renderHealthBar(ctx, centerX, bottomY) {
        const hpPercent = this.stats.hp / this.stats.maxHp;
        const barWidth = 50;
        const barHeight = 6;
        
        // Fundo
        ctx.fillStyle = '#331122';
        ctx.fillRect(centerX - barWidth/2, bottomY, barWidth, barHeight);
        
        // Vida atual
        ctx.fillStyle = '#b05a7a';
        ctx.fillRect(centerX - barWidth/2, bottomY, barWidth * hpPercent, barHeight);
        
        // Borda
        ctx.strokeStyle = '#aa88aa';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(centerX - barWidth/2, bottomY, barWidth, barHeight);
    }
}