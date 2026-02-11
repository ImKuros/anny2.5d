export class Input {
    constructor() {
        this.keys = new Set();
        this.lastDirection = 's';
        
        window.addEventListener('keydown', (e) => {
            if (['w','a','s','d'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                this.keys.add(e.key.toLowerCase());
                this.updateLastDirection(e.key.toLowerCase());
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (['w','a','s','d'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                this.keys.delete(e.key.toLowerCase());
            }
        });
    }
    
    updateLastDirection(key) {
        this.lastDirection = key;
    }
    
    getMovementVector() {
        let x = 0, y = 0;
        
        if (this.keys.has('w')) y -= 1;
        if (this.keys.has('s')) y += 1;
        if (this.keys.has('a')) x -= 1;
        if (this.keys.has('d')) x += 1;
        
        const length = Math.sqrt(x*x + y*y);
        if (length > 0) {
            x /= length;
            y /= length;
        }
        
        return { x, y };
    }
    
    isMoving() {
        return this.keys.size > 0;
    }
}