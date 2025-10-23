/**
 * Snake Game with Simple but Effective AI
 * Background implementation for portfolio website
 */

class SnakeGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 15;
        this.tileCount = Math.floor(canvas.width / this.gridSize);
        this.tileCountY = Math.floor(canvas.height / this.gridSize);
        
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
        
        // Game loop
        this.gameLoop();
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
            
            // Score based on distance to food
            const newDistance = Math.abs(nextX - food.x) + Math.abs(nextY - food.y);
            const currentDistance = Math.abs(head.x - food.x) + Math.abs(head.y - food.y);
            
            if (newDistance < currentDistance) {
                score += 100; // Moving towards food
            } else if (newDistance > currentDistance) {
                score -= 50; // Moving away from food
            }
            
            // Bonus for moving towards food direction
            if ((action === 0 && dy < 0) || (action === 1 && dx > 0) || 
                (action === 2 && dy > 0) || (action === 3 && dx < 0)) {
                score += 50;
            }
            
            // Avoid repetitive actions
            if (action === this.lastAction) {
                score -= 20;
            }
            
            // Bonus for actions that keep snake in center area
            const centerX = this.tileCount / 2;
            const centerY = this.tileCountY / 2;
            const distanceFromCenter = Math.abs(nextX - centerX) + Math.abs(nextY - centerY);
            score += (20 - distanceFromCenter);
            
            if (score > bestScore) {
                bestScore = score;
                bestAction = action;
            }
        }
        
        // Prevent getting stuck in loops
        if (this.lastAction === bestAction) {
            this.consecutiveActions++;
            if (this.consecutiveActions > 5) {
                // Force a different action
                const alternatives = safeActions.filter(a => a !== bestAction);
                if (alternatives.length > 0) {
                    bestAction = alternatives[Math.floor(Math.random() * alternatives.length)];
                    this.consecutiveActions = 0;
                }
            }
        } else {
            this.consecutiveActions = 0;
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
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }
    }
    
    // Game over
    gameOver() {
        this.gameRunning = false;
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
    }
    
    // Enhanced rendering with better visual effects
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw snake with gradient effect
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Head - brighter green with glow effect
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
            } else {
                // Body - darker green with slight transparency
                const alpha = Math.max(0.4, 1 - (index * 0.08));
                this.ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
                this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
            }
        });
        
        // Draw food with pulsing effect
        const pulse = Math.sin(Date.now() * 0.015) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
        this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
        
        // Draw score and game info
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 8, 16);
        this.ctx.fillText(`Games: ${this.gameCount}`, 8, 32);
    }
    
    // Faster game loop with adaptive speed
    gameLoop() {
        this.update();
        this.render();
        
        if (this.gameRunning) {
            // Much faster gameplay with adaptive speed
            const baseSpeed = 50; // Base speed in ms
            const speedReduction = Math.min(this.score * 2, 30); // Speed up with score
            const finalSpeed = Math.max(baseSpeed - speedReduction, 20); // Minimum 20ms
            setTimeout(() => this.gameLoop(), finalSpeed);
        } else {
            setTimeout(() => this.gameLoop(), 50); // Very fast restart
        }
    }
}

// Initialize the snake game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'snake-game-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        snakeGame.tileCount = Math.floor(canvas.width / snakeGame.gridSize);
        snakeGame.tileCountY = Math.floor(canvas.height / snakeGame.gridSize);
    });
});