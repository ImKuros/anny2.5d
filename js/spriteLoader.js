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
        console.log('🖼️ Carregando sprites...');
        
        const directions = ['n', 's', 'e', 'w'];
        const idleFrames = [1, 2, 3, 4, 5, 6, 7, 8];
        const walkFrames = [1, 2, 3, 4, 5, 6, 7, 8]; // 8 FRAMES PARA WALK
        
        // IDLE — 8 frames, 4 direções
        for (const dir of directions) {
            for (const frame of idleFrames) {
                await this.loadIdleFrame(dir, frame);
            }
        }
        
        // WALK — 8 frames, 4 direções
        console.log('🚶 Carregando walk (4 direções × 8 frames)...');
        for (const dir of directions) {
            this.sprites.walk[dir] = [];
            for (const frame of walkFrames) {
                await this.loadWalkFrame(dir, frame);
            }
        }
        
        this.loaded = true;
        this.diagnose();
    }

    loadIdleFrame(direction, frame) {
        return new Promise((resolve) => {
            const path = `${this.basePath}idle/${direction}/${frame}.png`;
            const img = new Image();
            
            img.onload = () => {
                if (img.width === 0 || img.height === 0) {
                    console.warn(`⚠️ ${path} (0x0) — fallback`);
                    this.sprites.idle[direction][frame - 1] = this.createIdleFallback(direction, frame);
                } else {
                    console.log(`✅ idle/${direction}/${frame}.png`);
                    this.sprites.idle[direction][frame - 1] = img;
                }
                resolve();
            };
            
            img.onerror = () => {
                console.warn(`⚠️ ${path} não encontrado — fallback`);
                this.sprites.idle[direction][frame - 1] = this.createIdleFallback(direction, frame);
                resolve();
            };
            
            img.src = path;
        });
    }

    loadWalkFrame(direction, frame) {
        return new Promise((resolve) => {
            const path = `${this.basePath}walk/${direction}/${frame}.png`;
            const img = new Image();
            
            img.onload = () => {
                if (img.width === 0 || img.height === 0) {
                    console.warn(`⚠️ ${path} (0x0) — fallback`);
                    this.sprites.walk[direction][frame - 1] = this.createWalkFallback(direction, frame);
                } else {
                    console.log(`✅ walk/${direction}/${frame}.png`);
                    this.sprites.walk[direction][frame - 1] = img;
                }
                resolve();
            };
            
            img.onerror = () => {
                console.warn(`⚠️ ${path} não encontrado — fallback`);
                this.sprites.walk[direction][frame - 1] = this.createWalkFallback(direction, frame);
                resolve();
            };
            
            img.src = path;
        });
    }

    createIdleFallback(direction, frame) {
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
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillText(direction.toUpperCase(), 5, 30);
        
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = '#ff0';
        ctx.shadowBlur = 2;
        ctx.fillText(`idle ${frame}`, 5, 50);
        
        ctx.shadowBlur = 0;
        return canvas;
    }

    createWalkFallback(direction, frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 34;
        canvas.height = 54;
        const ctx = canvas.getContext('2d');
        
        const hue = { n: 0, s: 180, e: 60, w: 240 }[direction] || 0;
        
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fillRect(0, 0, 34, 54);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 32, 52);
        
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillText(direction.toUpperCase(), 5, 30);
        
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = '#aaf';
        ctx.shadowBlur = 2;
        ctx.fillText(`walk ${frame}`, 5, 50);
        
        ctx.shadowBlur = 0;
        return canvas;
    }

    getSprite(state, direction, frame = 0) {
        if (state === 'idle') {
            const frames = this.sprites.idle[direction];
            if (frames && frames.length > 0) {
                return frames[frame] || frames[0] || this.createIdleFallback(direction, 1);
            }
        } else if (state === 'walk') {
            const frames = this.sprites.walk[direction];
            if (frames && frames.length > 0) {
                return frames[frame] || frames[0] || this.createWalkFallback(direction, frame + 1);
            }
        }
        return this.createIdleFallback(direction, 1);
    }

    diagnose() {
        console.group('🔍 Diagnóstico — SpriteLoader');
        console.log('Base path:', this.basePath);
        console.log('Loaded:', this.loaded);
        
        for (const dir of ['n', 's', 'e', 'w']) {
            const idleFrames = this.sprites.idle[dir];
            const idleCount = idleFrames ? idleFrames.filter(f => f instanceof HTMLImageElement).length : 0;
            console.log(`  idle/${dir}: ${idleCount}/8 frames carregados`);
        }
        
        for (const dir of ['n', 's', 'e', 'w']) {
            const walkFrames = this.sprites.walk[dir];
            const walkCount = walkFrames ? walkFrames.filter(f => f instanceof HTMLImageElement).length : 0;
            console.log(`  walk/${dir}: ${walkCount}/8 frames carregados`);
        }
        
        console.groupEnd();
    }
}