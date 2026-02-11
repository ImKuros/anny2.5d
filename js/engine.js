import { World } from './world.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { Camera } from './camera.js';
import { Renderer } from './renderer.js';
import { SpriteLoader } from './spriteLoader.js';

export class Engine {
    constructor(ctx) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Inicializa componentes básicos
        this.world = new World(30, 30);
        this.input = new Input();
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.renderer = new Renderer(this.ctx, this.camera);
        this.spriteLoader = new SpriteLoader();
        
        // 🚨 FIX: Player criado DEPOIS que tudo existe
        this.player = null;
        
        this.initialized = false;
    }
    
    async start() {
        try {
            console.log('⚙️ Inicializando Shadow Core...');
            
            // 1. Carrega sprites (fallback)
            await this.spriteLoader.load();
            
            // 2. 🚨 CRIA PLAYER SOMENTE AGORA
            this.player = new Player(400, 300);
            
            // 3. Configura dependências do player
            this.player.setSpriteLoader(this.spriteLoader);
            this.player.setInput(this.input);
            
            // 4. Adiciona ao mundo
            this.world.addEntity(this.player);
            
            // 5. Pronto
            this.initialized = true;
            console.log('✅ Engine pronta. Player criado:', this.player);
            
            // Inicia o loop
            requestAnimationFrame(this.gameLoop.bind(this));
            
        } catch (error) {
            console.error('❌ Erro ao iniciar engine:', error);
            
            // 🚨 FIX: Fallback extremo - cria player mesmo com erro
            this.player = new Player(400, 300);
            this.world.addEntity(this.player);
            this.initialized = true;
            
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    gameLoop(currentTime) {
        if (!this.initialized || !this.player) {
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        
        // Delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        if (this.deltaTime > 0.1) this.deltaTime = 0.016;
        this.lastTime = currentTime;
        
        // Update
        this.update(this.deltaTime);
        
        // Render
        this.render();
        
        // Próximo frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    update(deltaTime) {
        this.world.update(deltaTime);
        this.camera.follow(this.player, deltaTime);
    }
    
    render() {
        // Limpa tela com fundo escuro
        this.ctx.fillStyle = '#0a0a14';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderiza mundo
        if (this.renderer && this.world) {
            this.renderer.renderWorld(this.world);
        }
    }
}