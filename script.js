// Theme Toggler
class ThemeToggler {
    constructor(toggleBtnId) {
        this.toggleBtn = document.getElementById(toggleBtnId);
        this.body = document.body;
        this.init();
    }
    
    init() {
        const savedTheme = localStorage.getItem('theme') || 'dark-mode';
        this.body.classList.add(savedTheme);
        
        this.toggleBtn.addEventListener('click', () => this.toggleTheme());
    }
    
    toggleTheme() {
        if (this.body.classList.contains('light-mode')) {
            this.body.classList.remove('light-mode');
            this.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark-mode');
        } else {
            this.body.classList.remove('dark-mode');
            this.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light-mode');
        }
    }
}


// Nokia Snake Game - Game Logic
class SnakeGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Game constants
        this.GRID_SIZE = 10; // Size of each grid cell in pixels
        this.GRID_COUNT = this.canvas.width / this.GRID_SIZE;
        this.GAME_SPEED = 100; // Milliseconds between updates
        
        // Game state
        this.snake = [];
        this.food = null;
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.gameRunning = false;
        this.gamePaused = false;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.gameLoopId = null;
        
        // Initialize game
        this.init();
        this.setupEventListeners();
        this.updateDisplay();
    }

    // Helper to get CSS variable
    getColor(variable) {
        return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    }
    
    // Initialize game state
    init() {
        // Start with a 3-segment snake in the middle
        this.snake = [
            { x: Math.floor(this.GRID_COUNT / 2), y: Math.floor(this.GRID_COUNT / 2) },
            { x: Math.floor(this.GRID_COUNT / 2) - 1, y: Math.floor(this.GRID_COUNT / 2) },
            { x: Math.floor(this.GRID_COUNT / 2) - 2, y: Math.floor(this.GRID_COUNT / 2) }
        ];
        
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.score = 0;
        this.gameRunning = false;
        this.spawnFood();
        this.render();
        this.updateDisplay();
    }
    
    // Setup keyboard event listeners
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());

        // Listen for "Enter" key on the game over screen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.getElementById('gameOverModal').classList.contains('show')) {
                this.restart();
            }
        });
    }
    
    // Handle keyboard input
    handleKeyPress(event) {
        const key = event.key.toLowerCase();
        
        // On the first move, prevent the snake from reversing into itself.
        if (!this.gameRunning && (key === 'arrowleft' || key === 'a')) {
            return;
        }
        
        // Start the game on the first valid key press.
        if (!this.gameRunning) {
            if (['arrowup', 'arrowdown', 'arrowright', 'w', 's', 'd'].includes(key)) {
                this.gameRunning = true;
                this.startGameLoop();
            }
        }
        
        // Prevent default browser action for arrow keys.
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            event.preventDefault();
        }
        
        // Update the snake's next direction based on input.
        switch(key) {
            case 'arrowup':
            case 'w':
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -1 };
                }
                break;
            case 'arrowdown':
            case 's':
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: 1 };
                }
                break;
            case 'arrowleft':
            case 'a':
                if (this.direction.x === 0) {
                    this.nextDirection = { x: -1, y: 0 };
                }
                break;
            case 'arrowright':
            case 'd':
                if (this.direction.x === 0) {
                    this.nextDirection = { x: 1, y: 0 };
                }
                break;
        }
    }
    
    // Start the main game loop
    startGameLoop() {
        this.gameLoopId = setInterval(() => this.update(), this.GAME_SPEED);
        document.getElementById('gameStatus').textContent = 'Game Running...';
    }
    
    // Update game state each frame
    update() {
        // Apply next direction
        this.direction = this.nextDirection;
        
        // Calculate new head position
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };
        
        // Check wall collision
        if (this.isWallCollision(newHead)) {
            this.endGame();
            return;
        }
        
        // Check self collision
        if (this.isSelfCollision(newHead)) {
            this.endGame();
            return;
        }
        
        // Add new head
        this.snake.unshift(newHead);
        
        // Check food collision
        if (this.isFoodCollision(newHead)) {
            this.score += 10;
            this.spawnFood();
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
        
        this.render();
        this.updateDisplay();
    }
    
    // Check if head hits a wall
    isWallCollision(head) {
        return head.x < 0 || head.x >= this.GRID_COUNT || 
               head.y < 0 || head.y >= this.GRID_COUNT;
    }
    
    // Check if head hits the snake body
    isSelfCollision(head) {
        return this.snake.some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }
    
    // Check if head eats food
    isFoodCollision(head) {
        return head.x === this.food.x && head.y === this.food.y;
    }
    
    // Spawn food at random location
    spawnFood() {
        let newFood;
        let validPosition = false;
        
        while (!validPosition) {
            newFood = {
                x: Math.floor(Math.random() * this.GRID_COUNT),
                y: Math.floor(Math.random() * this.GRID_COUNT)
            };
            
            // Ensure food doesn't spawn on snake
            validPosition = !this.snake.some(segment => 
                segment.x === newFood.x && segment.y === newFood.y
            );
        }
        
        this.food = newFood;
    }
    
    // Render game to canvas
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.getColor('--canvas-bg');
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = this.getColor('--grid-color');
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.GRID_COUNT; i++) {
            const pos = i * this.GRID_SIZE;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
        
        // Draw food
        this.drawFood();
        
        // Draw snake
        this.drawSnake();
    }
    
    // Draw snake segments
    drawSnake() {
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? this.getColor('--snake-head-color') : this.getColor('--snake-body-color');
            
            this.ctx.fillRect(
                segment.x * this.GRID_SIZE,
                segment.y * this.GRID_SIZE,
                this.GRID_SIZE,
                this.GRID_SIZE
            );
            
            // Add a subtle glow effect in dark mode
            if (!document.body.classList.contains('light-mode')) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = this.getColor('--snake-head-color');
            }
        });
        
        // Reset shadow for other elements
        this.ctx.shadowBlur = 0;
    }
    
    // Draw food
    drawFood() {
        this.ctx.fillStyle = this.getColor('--food-color');
        if (!document.body.classList.contains('light-mode')) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = this.getColor('--food-color');
        }
        
        this.ctx.fillRect(
            this.food.x * this.GRID_SIZE,
            this.food.y * this.GRID_SIZE,
            this.GRID_SIZE,
            this.GRID_SIZE
        );
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    // Update UI displays
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
        this.updateTime();
    }
    
    // Update time display (retro Nokia style)
    updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('time').textContent = `${hours}:${minutes}`;
    }
    
    // End the game
    endGame() {
        this.gameRunning = false;
        clearInterval(this.gameLoopId);
        
        // Update high score if needed
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        // Show game over modal
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverModal').classList.add('show');
        document.getElementById('gameStatus').textContent = 'Game Over! Press button to restart';
    }
    
    // Restart the game
    restart() {
        document.getElementById('gameOverModal').classList.remove('show');
        this.init();
    }
    
    // Load high score from localStorage
    loadHighScore() {
        const saved = localStorage.getItem('snakeHighScore');
        return saved ? parseInt(saved) : 0;
    }
    
    // Save high score to localStorage
    saveHighScore() {
        localStorage.setItem('snakeHighScore', this.highScore);
    }
}

// Initialize game and theme when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ThemeToggler('themeToggle');
    new SnakeGame('gameCanvas');
});
