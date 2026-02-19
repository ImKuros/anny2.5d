export class SpriteLoader {
    constructor(basePath = 'assets/player/', chromaOptions = {}) {
        this.basePath = basePath;
        // Opções de chroma key com a cor fornecida (#34d917 = RGB 52,217,23)
        this.chroma = {
            color: chromaOptions.color || { r: 52, g: 217, b: 23 }, // #34d917
            tolerance: chromaOptions.tolerance || 30, // tolerância um pouco maior devido à variação
            debug: chromaOptions.debug || false
        };
        this.sprites = {
            idle: { n: [], s: [], e: [], w: [] },
            walk: { n: [], s: [], e: [], w: [] }
        };
        this.loaded = false;
    }

    // Remove fundo verde baseado na cor configurada
    #removeGreenBackground(image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Debug: mostra a cor do primeiro pixel (canto superior esquerdo)
        if (this.chroma.debug && data.length >= 4) {
            console.log(`🔍 Primeiro pixel: r=${data[0]}, g=${data[1]}, b=${data[2]}`);
        }

        const { r: cr, g: cg, b: cb } = this.chroma.color;
        const tolerance = this.chroma.tolerance;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Verifica se o pixel está próximo da cor chroma (dentro da tolerância)
            if (Math.abs(r - cr) <= tolerance &&
                Math.abs(g - cg) <= tolerance &&
                Math.abs(b - cb) <= tolerance) {
                data[i + 3] = 0; // alpha = 0 (transparente)
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    async load() {
        console.log('🖼️ [SPRITELOADER] Carregando PNGs com remoção de fundo verde...');
        
        const directions = ['n', 's', 'e', 'w'];
        const idleFrames = 30;  // Altere para o número real de frames idle
        const walkFrames = 30;   // Altere para o número real de frames walk
        
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
        console.log('✅ [SPRITELOADER] PNGs carregados e processados');
        this.diagnose();
    }

    loadFrame(state, direction, frame) {
        return new Promise((resolve) => {
            // Nome do arquivo no formato: "estado (número).png"
            const fileName = `${state} (${frame}).png`;
            const path = `${this.basePath}${state}/${direction}/${fileName}`;
            
            const img = new Image();
            
            img.onload = () => {
                if (img.width === 0 || img.height === 0) {
                    console.warn(`⚠️ ${path} (0x0) — usando fallback`);
                    this.sprites[state][direction][frame - 1] = this.createFallback(state, direction, frame);
                } else {
                    console.log(`✅ ${path} carregado, processando...`);
                    // Processa a imagem removendo o fundo verde
                    const processed = this.#removeGreenBackground(img);
                    this.sprites[state][direction][frame - 1] = processed;
                }
                resolve();
            };
            
            img.onerror = () => {
                console.warn(`⚠️ ${path} não encontrado — usando fallback`);
                this.sprites[state][direction][frame - 1] = this.createFallback(state, direction, frame);
                resolve();
            };
            
            img.src = path;
        });
    }

    createFallback(state, direction, frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 124;
        canvas.height = 194;
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
        console.log('Chroma color:', this.chroma.color);
        console.log('Chroma tolerance:', this.chroma.tolerance);
        for (const state of ['idle', 'walk']) {
            for (const dir of ['n', 's', 'e', 'w']) {
                const frames = this.sprites[state][dir];
                const loaded = frames ? frames.filter(f => f instanceof HTMLCanvasElement || f instanceof HTMLImageElement).length : 0;
                const total = frames ? frames.length : 0;
                console.log(`  ${state}/${dir}: ${loaded}/${total} frames`);
            }
        }
        console.groupEnd();
    }
}