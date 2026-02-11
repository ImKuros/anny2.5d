export class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tileSize = 40;
        this.entities = [];
        this.grid = this.generateGrid();
    }
    
    generateGrid() {
        const grid = [];
        for (let y = 0; y < this.height; y++) {
            grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                grid[y][x] = {
                    type: Math.random() > 0.8 ? 'wall' : 'floor',
                    walkable: true
                };
            }
        }
        return grid;
    }
    
    addEntity(entity) {
        this.entities.push(entity);
    }
    
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) this.entities.splice(index, 1);
    }
    
    update(deltaTime) {
        for (const entity of this.entities) {
            entity.update(deltaTime);
        }
    }
    
    getEntitiesSortedByDepth() {
        return [...this.entities].sort((a, b) => a.getRenderOrder() - b.getRenderOrder());
    }
}