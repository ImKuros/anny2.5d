import { World } from './world.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { Camera } from './camera.js';
import { Renderer } from './renderer.js';
import { VideoLoader } from './videoLoader.js';  // ← ALTERADO

export class Engine {
    constructor(ctx) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.world = new World(30, 30);
        this.input = new Input();
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.renderer = new Renderer(this.ctx, this.camera);
        this.videoLoader = new VideoLoader('assets/player/');  // ← NOVO
        
        this.player = null;
        this.initialized = false;
    }
    
    async start() {
        console.log('⚙️ [ENGINE] Inicializando...');
        
        try {
            await this.videoLoader.load();          // ← CARREGA VÍDEOS
            this.videoLoader.diagnose();
            
            this.player = new Player(400, 300);
            this.player.setVideoLoader(this.videoLoader);  // ← CONECTA
            this.player.setInput(this.input);
            
            this.world.addEntity(this.player);
            
            this.initialized = true;
            console.log('✅ [ENGINE] Pronta.');
            
            requestAnimationFrame(this.gameLoop.bind(this));
        } catch (error) {
            console.error('❌ [ENGINE] Erro fatal:', error);
        }
    }
    
    gameLoop(currentTime) {
        if (!this.initialized || !this.player) {
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        if (this.deltaTime > 0.1) this.deltaTime = 0.016;
        this.lastTime = currentTime;
        
        this.update(this.deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    update(deltaTime) {
        this.world.update(deltaTime);
        this.camera.follow(this.player, deltaTime);
    }
    
    render() {
        this.ctx.fillStyle = '#1a1e2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderer.renderWorld(this.world);
    }
}