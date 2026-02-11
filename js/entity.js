export class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        this.velocity = { x: 0, y: 0 };
        this.speed = 160;
        this.moving = false;
        this.direction = 's';
        this.state = 'idle';
        this.states = ['idle', 'walk', 'attack', 'hit', 'cast'];
        
        this.sprite = null;
        this.spriteLoader = null;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.frameSpeed = 0.15;
    }

    setSpriteLoader(loader) {
        this.spriteLoader = loader;
    }

    update(deltaTime) {
        this.x += this.velocity.x * this.speed * deltaTime;
        this.y += this.velocity.y * this.speed * deltaTime;
        
        if (this.moving) {
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.frameSpeed) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.animationTimer = 0;
            }
        } else {
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
    }

    getCurrentSprite() {
        if (!this.spriteLoader) return null;
        
        let spriteDir = this.direction;
        if (this.state === 'attack') spriteDir += '_attack';
        
        return this.spriteLoader.getSprite(spriteDir);
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x - this.width/2;
        const screenY = this.y - camera.y - this.height;
        
        const sprite = this.getCurrentSprite();
        
        if (sprite) {
            ctx.drawImage(
                sprite,
                0, this.animationFrame * this.height,
                this.width, this.height,
                screenX, screenY,
                this.width, this.height
            );
        } else {
            ctx.fillStyle = '#8a5a3a';
            ctx.fillRect(screenX, screenY, this.width, this.height);
        }
        
        if (this.state !== 'idle') {
            ctx.fillStyle = '#ffffaa';
            ctx.font = '10px "Courier New", monospace';
            ctx.fillText(this.state, screenX, screenY - 10);
        }
    }

    getRenderOrder() {
        return this.y + this.height;
    }
}