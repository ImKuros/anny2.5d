import { Engine } from './engine.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const engine = new Engine(ctx);
    engine.start();
});