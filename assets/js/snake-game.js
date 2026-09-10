/**
 * Snake Game with Simple but Effective AI
 * Background implementation for portfolio website
 */

class SnakeGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 18;
        this.resize();
        
        // Game state
        this.snake = [{x: Math.floor(this.tileCount/2), y: Math.floor(this.tileCountY/2)}];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.gameRunning = true;
        this.score = 0;
        this.steps = 0;
        this.maxSteps = 300;
        
        // Simple AI state
        this.lastAction = -1;
        this.consecutiveActions = 0;
        this.gameCount = 0;
        
        // Animation state: motion is interpolated between logic steps
        this.prevSnake = this.snake.map(s => ({x: s.x, y: s.y}));
        this.stepStart = performance.now();
        this.stepDuration = 70;
        this.deathAt = 0;
        this.ripples = [];
        
        // Loops: logic on a timer, painting on animation frames
        this.tick();
        this.renderLoop();
    }
    
    // Size the backing store to the device pixel ratio so cells stay crisp
    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = Math.round(this.width * dpr);
        this.canvas.height = Math.round(this.height * dpr);
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.tileCount = Math.floor(this.width / this.gridSize);
        this.tileCountY = Math.floor(this.height / this.gridSize);
    }
    
    // Generate food at random position
    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCountY)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        return food;
    }
    
    // Simple but effective AI decision making
    chooseAction() {
        const head = this.snake[0];
        const food = this.food;
        
        // Calculate direction to food
        const dx = food.x - head.x;
        const dy = food.y - head.y;
        
        // Get safe actions (not leading to immediate death)
        const safeActions = this.getSafeActions();
        
        if (safeActions.length === 0) {
            // No safe actions, choose randomly (game over anyway)
            return Math.floor(Math.random() * 4);
        }
        
        // If only one safe action, take it
        if (safeActions.length === 1) {
            return safeActions[0];
        }
        
        // Calculate best direction to food
        let bestAction = -1;
        let bestScore = -Infinity;
        
        for (const action of safeActions) {
            let score = 0;
            
            // Calculate next position
            let nextX = head.x;
            let nextY = head.y;
            
            switch(action) {
                case 0: nextY--; break; // up
                case 1: nextX++; break; // right
                case 2: nextY++; break; // down
                case 3: nextX--; break; // left
            }
            
            // Score based on distance to food (Manhattan distance)
            const newDistance = Math.abs(nextX - food.x) + Math.abs(nextY - food.y);
            const currentDistance = Math.abs(head.x - food.x) + Math.abs(head.y - food.y);
            
            if (newDistance < currentDistance) {
                score += 200; // Strong bonus for moving towards food
            } else if (newDistance > currentDistance) {
                score -= 100; // Penalty for moving away from food
            }
            
            // Strong bonus for moving in the primary direction towards food
            const primaryDirectionX = dx !== 0 ? (dx > 0 ? 1 : 3) : -1; // right or left
            const primaryDirectionY = dy !== 0 ? (dy > 0 ? 2 : 0) : -1; // down or up
            
            // Prioritize the direction that reduces the larger distance component
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal distance is larger, prioritize horizontal movement
                if (action === primaryDirectionX) {
                    score += 150; // Strong bonus for primary horizontal direction
                }
            } else if (Math.abs(dy) > Math.abs(dx)) {
                // Vertical distance is larger, prioritize vertical movement
                if (action === primaryDirectionY) {
                    score += 150; // Strong bonus for primary vertical direction
                }
            } else {
                // Equal distances, prefer the direction that's more aligned
                if (action === primaryDirectionX || action === primaryDirectionY) {
                    score += 100; // Bonus for either primary direction
                }
            }
            
            // Small bonus for continuing in the same direction (reduces zigzagging)
            if (action === this.lastAction) {
                score += 30;
            }
            
            // Only prevent loops if we're truly stuck (much higher threshold)
            if (this.lastAction === bestAction) {
                this.consecutiveActions++;
                if (this.consecutiveActions > 15) { // Increased from 5 to 15
                    // Only force change if we have alternatives that are still good
                    const alternatives = safeActions.filter(a => a !== bestAction);
                    if (alternatives.length > 0) {
                        // Check if any alternative is also moving towards food
                        const goodAlternatives = alternatives.filter(alt => {
                            let altX = head.x, altY = head.y;
                            switch(alt) {
                                case 0: altY--; break;
                                case 1: altX++; break;
                                case 2: altY++; break;
                                case 3: altX--; break;
                            }
                            const altDistance = Math.abs(altX - food.x) + Math.abs(altY - food.y);
                            return altDistance <= currentDistance;
                        });
                        
                        if (goodAlternatives.length > 0) {
                            bestAction = goodAlternatives[Math.floor(Math.random() * goodAlternatives.length)];
                            this.consecutiveActions = 0;
                        }
                    }
                }
            } else {
                this.consecutiveActions = 0;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestAction = action;
            }
        }
        
        this.lastAction = bestAction;
        return bestAction;
    }
    
    // Get safe actions (actions that don't lead to immediate death)
    getSafeActions() {
        const head = this.snake[0];
        const safeActions = [];
        
        const directions = [
            {dx: 0, dy: -1}, // 0: north
            {dx: 1, dy: 0},  // 1: east
            {dx: 0, dy: 1},  // 2: south
            {dx: -1, dy: 0}   // 3: west
        ];
        
        for (let i = 0; i < 4; i++) {
            const nextX = head.x + directions[i].dx;
            const nextY = head.y + directions[i].dy;
            
            // Check bounds
            if (nextX < 0 || nextX >= this.tileCount || nextY < 0 || nextY >= this.tileCountY) {
                continue;
            }
            
            // Check self collision
            if (this.snake.some(segment => segment.x === nextX && segment.y === nextY)) {
                continue;
            }
            
            safeActions.push(i);
        }
        
        return safeActions;
    }
    
    // Execute action
    executeAction(action) {
        // 0=up, 1=right, 2=down, 3=left
        switch(action) {
            case 0: this.dx = 0; this.dy = -1; break;
            case 1: this.dx = 1; this.dy = 0; break;
            case 2: this.dx = 0; this.dy = 1; break;
            case 3: this.dx = -1; this.dy = 0; break;
        }
    }
    
    // Simple game update
    update() {
        if (!this.gameRunning) return;
        
        this.steps++;
        this.prevSnake = this.snake.map(s => ({x: s.x, y: s.y}));
        this.stepStart = performance.now();
        this.stepDuration = Math.max(70 - Math.min(this.score * 3, 40), 30);
        
        // Choose and execute action
        const action = this.chooseAction();
        this.executeAction(action);
        
        // Move snake
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCountY) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        // Check if too many steps without progress
        if (this.steps > this.maxSteps) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.steps = 0; // Reset step counter
            this.ripples.push({x: this.food.x, y: this.food.y, t: performance.now()});
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }
    }
    
    // Game over
    gameOver() {
        this.gameRunning = false;
        this.deathAt = performance.now();
        this.gameCount++;
        // Restart game after a short delay
        setTimeout(() => {
            this.reset();
        }, 500);
    }
    
    // Reset game
    reset() {
        this.snake = [{x: Math.floor(this.tileCount/2), y: Math.floor(this.tileCountY/2)}];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.gameRunning = true;
        this.score = 0;
        this.steps = 0;
        this.lastAction = -1;
        this.consecutiveActions = 0;
        this.prevSnake = this.snake.map(s => ({x: s.x, y: s.y}));
        this.ripples = [];
    }
    
    // Rounded cell, falling back to a square where roundRect is unavailable
    cellPath(x, y, size, radius) {
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
            this.ctx.roundRect(x, y, size, size, radius);
        } else {
            this.ctx.rect(x, y, size, size);
        }
        this.ctx.fill();
    }
    
    // Two dots on the head, facing the direction of travel
    drawEyes(cx, cy, cell) {
        const ctx = this.ctx;
        const off = cell * 0.2;
        const along = cell * 0.16;
        const ax = this.dx * along;
        const ay = this.dy * along;
        const px = -this.dy * off;
        const py = this.dx * off;
        ctx.fillStyle = 'rgba(4, 20, 12, 0.85)';
        for (const sign of [1, -1]) {
            ctx.beginPath();
            ctx.arc(cx + ax + px * sign, cy + ay + py * sign, cell * 0.11, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    render() {
        const ctx = this.ctx;
        const g = this.gridSize;
        const cell = g - 3;
        const pad = 1.5;
        const radius = 5;
        const now = performance.now();
        
        // Clear canvas — transparent, so the page's ambient background shows through
        ctx.clearRect(0, 0, this.width, this.height);
        
        // Fraction of the way through the current logic step, for smooth gliding
        const t = Math.min(1, (now - this.stepStart) / this.stepDuration);
        // Dim briefly on death, then the reset snaps back to full brightness
        const fade = this.gameRunning ? 1 : Math.max(0.2, 1 - (now - this.deathAt) / 500);
        
        // Expanding rings where food was eaten
        this.ripples = this.ripples.filter(r => now - r.t < 900);
        ctx.lineWidth = 1.5;
        for (const r of this.ripples) {
            const p = (now - r.t) / 900;
            ctx.strokeStyle = `rgba(35, 196, 224, ${0.55 * (1 - p)})`;
            ctx.beginPath();
            ctx.arc(r.x * g + g / 2, r.y * g + g / 2, 5 + p * 55, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Snake — accent green at the head easing into cyan down the tail
        const len = this.snake.length;
        for (let i = len - 1; i >= 0; i--) {
            const seg = this.snake[i];
            const prev = this.prevSnake[Math.min(i, this.prevSnake.length - 1)] || seg;
            const x = (prev.x + (seg.x - prev.x) * t) * g + pad;
            const y = (prev.y + (seg.y - prev.y) * t) * g + pad;
            const k = Math.min(i / 18, 1);
            const r = Math.round(53 + (35 - 53) * k);
            const gr = Math.round(224 + (196 - 224) * k);
            const b = Math.round(138 + (224 - 138) * k);
            
            if (i === 0) {
                ctx.shadowColor = 'rgba(53, 224, 138, 0.95)';
                ctx.shadowBlur = 22;
                ctx.fillStyle = `rgba(120, 255, 190, ${fade})`;
                this.cellPath(x, y, cell, radius);
                ctx.shadowBlur = 0;
                this.drawEyes(x + cell / 2, y + cell / 2, cell);
            } else {
                ctx.fillStyle = `rgba(${r}, ${gr}, ${b}, ${fade * (0.92 - k * 0.42)})`;
                this.cellPath(x, y, cell, radius);
            }
        }
        
        // Food — a pulsing core inside a soft halo
        const pulse = Math.sin(now * 0.005) * 0.5 + 0.5;
        const fx = this.food.x * g + g / 2;
        const fy = this.food.y * g + g / 2;
        const halo = ctx.createRadialGradient(fx, fy, 0, fx, fy, g * (1.6 + pulse * 0.5));
        halo.addColorStop(0, `rgba(35, 196, 224, ${0.35 + pulse * 0.2})`);
        halo.addColorStop(1, 'rgba(35, 196, 224, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(fx, fy, g * (1.6 + pulse * 0.5), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowColor = 'rgba(35, 196, 224, 0.95)';
        ctx.shadowBlur = 18;
        ctx.fillStyle = `rgba(160, 240, 255, ${0.75 + pulse * 0.25})`;
        ctx.beginPath();
        ctx.arc(fx, fy, cell * (0.3 + pulse * 0.1), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw score and game info, tucked into the bottom-left away from the nav
        ctx.fillStyle = 'rgba(151, 163, 178, 0.7)';
        ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(`score ${this.score}`, 16, this.height - 34);
        ctx.fillText(`games ${this.gameCount}`, 16, this.height - 18);
    }
    
    // Logic step: speed climbs with the score
    tick() {
        this.update();
        setTimeout(() => this.tick(), this.gameRunning ? this.stepDuration : 60);
    }
    
    // Paint every frame so glows and motion stay smooth between steps
    renderLoop() {
        this.render();
        requestAnimationFrame(() => this.renderLoop());
    }
}

// Initialize the snake game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'snake-game-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    
    // Add canvas to body
    document.body.appendChild(canvas);
    
    // Initialize snake game
    const snakeGame = new SnakeGame(canvas);
    
    // Handle window resize
    window.addEventListener('resize', function() {
        snakeGame.resize();
    });
});