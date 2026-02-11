export class SpriteLoader {
    constructor(basePath = 'assets/player/') {
        this.basePath = basePath;
        this.sprites = {
            idle: {},
            walk: {}
        };
        this.loaded = false;
    }

    async load() {
        console.log('🖼️ Carregando sprites 8 direções...');
        
        const directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        
        // Carrega IDLE (8 direções)
        for (const dir of directions) {
            await this.loadSprite('idle', dir);
        }
        
        // Carrega WALK (8 direções)
        for (const dir of directions) {
            await this.loadSprite('walk', dir);
        }
        
        this.loaded = true;
        console.log(`✅ ${Object.keys(this.sprites.idle).length + Object.keys(this.sprites.walk).length} sprites armazenados`);
        console.log('📦 sprites.idle:', Object.keys(this.sprites.idle));
        console.log('📦 sprites.walk:', Object.keys(this.sprites.walk));
    }

    loadSprite(state, direction) {
        return new Promise((resolve) => {
            const filename = `${state}_${direction}.png`;
            const path = this.basePath + filename;
            
            const img = new Image();
            
            img.onload = () => {
                console.log(`✅ ${filename}`);
                
                // 🚨 LINHA CRÍTICA QUE ESTAVA FALTANDO:
                this.sprites[state][direction] = img;
                
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`⚠️ ${filename} não encontrado`);
                const fallback = this.createFallbackSprite(state, direction);
                
                // 🚨 TAMBÉM ARMAZENA O FALLBACK:
                this.sprites[state][direction] = fallback;
                
                resolve(fallback);
            };
            
            img.src = path;
        });
    }

    createFallbackSprite(state, direction) {
        const canvas = document.createElement('canvas');
        canvas.width = 34;
        canvas.height = 54;
        const ctx = canvas.getContext('2d');
        
        const hue = {
            'n': 0, 'ne': 30, 'e': 60, 'se': 120,
            's': 180, 'sw': 210, 'w': 240, 'nw': 300
        }[direction] || 0;
        
        ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
        ctx.fillRect(0, 0, 34, 54);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillText(direction.toUpperCase(), 5, 35);
        
        ctx.fillStyle = 'black';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText(state, 5, 52);
        
        return canvas;
    }

    getSprite(state, direction) {
        // 🚨 VERIFICA SE O SPRITE EXISTE
        const sprite = this.sprites[state]?.[direction];
        
        if (sprite) {
            return sprite;
        }
        
        // Fallback se algo der errado
        console.warn(`⚠️ Sprite ${state}_${direction} não encontrado, gerando fallback`);
        return this.createFallbackSprite(state, direction);
    }
}