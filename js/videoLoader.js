export class VideoLoader {
    constructor(basePath = 'assets/player/') {
        this.basePath = basePath;
        this.videos = {
            idle: { n: null, s: null, e: null, w: null },
            walk: { n: null, s: null, e: null, w: null }
        };
        this.loaded = false;
        this.fallbackCanvas = null;
    }

    async load() {
        console.log('🎬 [VIDEOLOADER] Carregando vídeos...');
        
        const directions = ['n', 's', 'e', 'w'];
        const states = ['idle', 'walk'];
        
        for (const state of states) {
            for (const dir of directions) {
                await this.loadVideo(state, dir);
            }
        }
        
        this.loaded = true;
        console.log('✅ [VIDEOLOADER] Vídeos carregados: 2 estados × 4 direções');
        this.diagnose();
    }

    loadVideo(state, direction) {
        return new Promise((resolve) => {
            const path = `${this.basePath}${state}/${direction}.mp4`;
            const video = document.createElement('video');
            
            video.loop = true;
            video.muted = true;      // necessário para autoplay
            video.playsInline = true;
            video.preload = 'auto';
            video.crossOrigin = 'anonymous'; // evita problemas CORS se necessário
            
            video.oncanplaythrough = () => {
                console.log(`✅ ${state}/${direction}.mp4`);
                this.videos[state][direction] = video;
                resolve(video);
            };
            
            video.onerror = () => {
                console.warn(`⚠️ ${path} não encontrado — usando fallback animado`);
                const fallback = this.createFallbackVideo(state, direction);
                this.videos[state][direction] = fallback;
                resolve(fallback);
            };
            
            video.src = path;
            video.load();
        });
    }

    createFallbackVideo(state, direction) {
        // Cria um canvas animado simples para fallback
        const canvas = document.createElement('canvas');
        canvas.width = 100;   // ajuste conforme necessário
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        
        let frame = 0;
        const interval = setInterval(() => {
            if (!canvas.parentNode) {
                clearInterval(interval);
                return;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Fundo colorido por direção
            const hue = { n: 0, s: 180, e: 60, w: 240 }[direction] || 0;
            ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillText(direction.toUpperCase(), 20, 80);
            
            ctx.font = '18px monospace';
            ctx.fillStyle = '#ff0';
            ctx.fillText(state, 20, 130);
            
            // Pequena animação: círculo pulsante
            ctx.beginPath();
            ctx.arc(50, 150, 10 + Math.sin(frame * 0.3) * 5, 0, 2*Math.PI);
            ctx.fillStyle = '#fff';
            ctx.fill();
            
            frame++;
        }, 100);
        
        return canvas;
    }

    getVideo(state, direction) {
        const video = this.videos[state]?.[direction];
        if (video) return video;
        
        console.warn(`⚠️ [VIDEOLOADER] ${state}/${direction} não disponível, fallback`);
        return this.createFallbackVideo(state, direction);
    }

    playVideo(state, direction) {
        // Pausa todos os vídeos
        for (const s of ['idle', 'walk']) {
            for (const d of ['n','s','e','w']) {
                const v = this.videos[s]?.[d];
                if (v && v instanceof HTMLVideoElement && !v.paused) {
                    v.pause();
                }
            }
        }
        
        // Toca o vídeo desejado
        const video = this.getVideo(state, direction);
        if (video instanceof HTMLVideoElement) {
            video.currentTime = 0;
            video.play().catch(e => console.warn('Autoplay bloqueado:', e));
        }
    }

    diagnose() {
        console.group('🔍 Diagnóstico — VideoLoader');
        console.log('Base path:', this.basePath);
        for (const state of ['idle', 'walk']) {
            for (const dir of ['n','s','e','w']) {
                const v = this.videos[state][dir];
                let status = '❌ ausente';
                if (v) {
                    status = v instanceof HTMLVideoElement ? '✅ vídeo' : '⚠️ fallback';
                }
                console.log(`  ${state}/${dir}: ${status}`);
            }
        }
        console.groupEnd();
    }
}