export class Renderer {
    constructor(ctx, camera) {
        this.ctx = ctx;
        this.camera = camera;
        this.backgroundColor = '#1a1e22';
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    
    renderWorld(world) {
        this.renderGrid(world);
        
        const sortedEntities = world.getEntitiesSortedByDepth();
        
        for (const entity of sortedEntities) {
            entity.render(this.ctx, this.camera);
        }
    }
    
    renderGrid(world) {
        const startX = Math.floor(this.camera.x / world.tileSize) - 2;
        const startY = Math.floor(this.camera.y / world.tileSize) - 2;
        const endX = startX + Math.ceil(this.ctx.canvas.width / world.tileSize) + 4;
        const endY = startY + Math.ceil(this.ctx.canvas.height / world.tileSize) + 4;
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (x >= 0 && x < world.width && y >= 0 && y < world.height) {
                    const screenX = x * world.tileSize - this.camera.x;
                    const screenY = y * world.tileSize - this.camera.y;
                    
                    this.ctx.fillStyle = world.grid[y][x].type === 'wall' ? '#3a4a5a' : '#2a3a3a';
                    this.ctx.fillRect(screenX, screenY, world.tileSize - 1, world.tileSize - 1);
                    
                    this.ctx.strokeStyle = '#4a5a6a';
                    this.ctx.strokeRect(screenX, screenY, world.tileSize - 1, world.tileSize - 1);
                }
            }
        }
    }
}