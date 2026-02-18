export class SpriteLoader {
    constructor(basePath = 'assets/player/') {
        this.basePath = basePath;
        this.sprites = {
            idle: { n: [], s: [], e: [], w: [] },
            walk: { n: [], s: [], e: [], w: [] }
        };
        this.loaded = false;
    }

    async load() {
        console.log('🖼️ [SPRITELOADER] Carregando PNGs...');
        
        const directions = ['n', 's', 'e', 'w'];
        const idleFrames = 8;  // número de frames idle (ajuste se necessário)
        const walkFrames = 8;   // número de frames walk (ajuste se necessário)
        
        // Carrega idle
        for (const dir of directions) {
            this.sprites.idle[dir] = [];
            for (let frame = 1; frame <= idleFrames; frame++) {
                await this.loadFrame('idle', dir, frame);
            }
        }
        
        // Carrega walk
        for (const dir of directions) {
            this.sprites.walk[dir] = [];
            for (let frame = 1; frame <= walkFrames; frame++) {
                await this.loadFrame('walk', dir, frame);
            }
        }
        
        this.loaded = true;
        console.log('✅ [SPRITELOADER] PNGs carregados: 2 estados × 4 direções');
        this.diagnose();
    }

    loadFrame(state, direction, frame) {
        return new Promise((resolve) => {
            const path = `${this.basePath}${state}/${direction}/${frame}.png`;
            const img = new Image();
            
            img.onload = () => {
                if (img.width === 0 || img.height === 0) {
                    console.warn(`⚠️ ${path} (0x0) — fallback`);
                    this.sprites[state][direction][frame - 1] = this.createFallback(state, direction, frame);
                } else {
                    console.log(`✅ ${state}/${direction}/${frame}.png`);
                    this.sprites[state][direction][frame - 1] = img;
                }
                resolve();
            };
            
            img.onerror = () => {
                console.warn(`⚠️ ${path} não encontrado — fallback`);
                this.sprites[state][direction][frame - 1] = this.createFallback(state, direction, frame);
                resolve();
            };
            
            img.src = path;
        });
    }

    createFallback(state, direction, frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 34;
        canvas.height = 54;
        const ctx = canvas.getContext('2d');
        
        const hue = { n: 0, s: 180, e: 60, w: 240 }[direction] || 0;
        
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fillRect(0, 0, 34, 54);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 32, 52);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillText(direction.toUpperCase(), 5, 30);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#ff0';
        ctx.fillText(`${state} ${frame}`, 5, 50);
        
        return canvas;
    }

    getSprite(state, direction, frame = 0) {
        const frames = this.sprites[state]?.[direction];
        if (frames && frames.length > 0) {
            return frames[frame] || frames[0] || this.createFallback(state, direction, frame + 1);
        }
        return this.createFallback(state, direction, frame + 1);
    }

    diagnose() {
        console.group('🔍 Diagnóstico — SpriteLoader');
        console.log('Base path:', this.basePath);
        for (const state of ['idle', 'walk']) {
            for (const dir of ['n', 's', 'e', 'w']) {
                const frames = this.sprites[state][dir];
                const loaded = frames ? frames.filter(f => f instanceof HTMLImageElement).length : 0;
                const total = frames ? frames.length : 0;
                console.log(`  ${state}/${dir}: ${loaded}/${total} frames`);
            }
        }
        console.groupEnd();
    }
}