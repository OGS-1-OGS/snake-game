class Snake {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 10;
        this.y = 10;
        this.dx = 1;
        this.dy = 0;
        this.cells = [{ x: this.x, y: this.y }];
        this.maxCells = 4;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        // 穿墙
        if (this.x >= 20) this.x = 0;
        if (this.x < 0) this.x = 19;
        if (this.y >= 20) this.y = 0;
        if (this.y < 0) this.y = 19;

        this.cells.unshift({ x: this.x, y: this.y });
        if (this.cells.length > this.maxCells) {
            this.cells.pop();
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileSize = this.canvas.width / this.gridSize;

        this.snake = new Snake();
        this.foods = [];
        this.score = 0;
        this.gameLoop = null;
        this.isGameRunning = false;

        // 初始化多个食物
        this.generateFoods(3);

        this.bindControls();
        this.setupButtons();
        this.loadRecords();

        this.overlay = document.getElementById('gameOverlay');
        this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
        document.getElementById('highScoreText').textContent = this.highScore;
    }

    setupButtons() {
        document.getElementById('startBtn').addEventListener('click', () => {
            if (this.isGameRunning) {
                this.stopGame();
            }
            this.startGame();
        });

        document.getElementById('recordsBtn').addEventListener('click', () => {
            this.showRecords();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('recordsModal').style.display = 'none';
        });
    }

    generateFoods(count) {
        this.foods = [];
        for (let i = 0; i < count; i++) {
            this.foods.push(this.getRandomFood());
        }
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.isGameRunning) return;

            switch (e.key) {
                case 'ArrowLeft':
                    if (this.snake.dx === 0) {
                        this.snake.dx = -1;
                        this.snake.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                    if (this.snake.dx === 0) {
                        this.snake.dx = 1;
                        this.snake.dy = 0;
                    }
                    break;
                case 'ArrowUp':
                    if (this.snake.dy === 0) {
                        this.snake.dx = 0;
                        this.snake.dy = -1;
                    }
                    break;
                case 'ArrowDown':
                    if (this.snake.dy === 0) {
                        this.snake.dx = 0;
                        this.snake.dy = 1;
                    }
                    break;
            }
        });
    }

    getRandomFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (this.isFoodOnSnake(newFood));
        return newFood;
    }

    isFoodOnSnake(food) {
        return this.snake.cells.some(cell => cell.x === food.x && cell.y === food.y);
    }

    checkCollision() {
        const head = this.snake.cells[0];

        // 检查是否吃到食物
        this.foods = this.foods.filter(food => {
            if (head.x === food.x && head.y === food.y) {
                this.score += 10;
                document.getElementById('scoreText').textContent = this.score;
                this.snake.maxCells++;
                return false;
            }
            return true;
        });

        // 补充新的食物
        while (this.foods.length < 3) {
            this.foods.push(this.getRandomFood());
        }

        // 检查是否撞到自己
        for (let i = 1; i < this.snake.cells.length; i++) {
            if (head.x === this.snake.cells[i].x && head.y === this.snake.cells[i].y) {
                this.gameOver();
                return;
            }
        }
    }

    gameOver() {
        this.isGameRunning = false;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            document.getElementById('highScoreText').textContent = this.highScore;
        }
        this.saveRecord();
        this.overlay.style.display = 'flex';
        const overlayContent = this.overlay.querySelector('.overlay-content');
        overlayContent.innerHTML = `
            <h2>游戏结束</h2>
            <p>得分：${this.score}</p>
            <p>点击"开始游戏"重新开始</p>
        `;
        this.stopGame();
    }

    saveRecord() {
        const records = JSON.parse(localStorage.getItem('snakeRecords') || '[]');
        records.push({
            score: this.score,
            date: new Date().toLocaleString()
        });
        records.sort((a, b) => b.score - a.score);
        localStorage.setItem('snakeRecords', JSON.stringify(records.slice(0, 10)));
    }

    loadRecords() {
        return JSON.parse(localStorage.getItem('snakeRecords') || '[]');
    }

    showRecords() {
        const records = this.loadRecords();
        const recordsList = document.getElementById('recordsList');
        recordsList.innerHTML = '';

        if (records.length === 0) {
            recordsList.innerHTML = '<div class="record-item">暂无游戏记录</div>';
            return;
        }

        records.forEach((record, index) => {
            const recordItem = document.createElement('div');
            recordItem.className = 'record-item';
            recordItem.innerHTML = `
                <span>第${index + 1}名</span>
                <span>${record.score}分</span>
                <span>${record.date}</span>
            `;
            recordsList.appendChild(recordItem);
        });

        document.getElementById('recordsModal').style.display = 'block';
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 画蛇
        this.ctx.fillStyle = '#4CAF50';
        this.snake.cells.forEach(cell => {
            this.ctx.fillRect(
                cell.x * this.tileSize,
                cell.y * this.tileSize,
                this.tileSize - 1,
                this.tileSize - 1
            );
        });

        // 画食物
        this.ctx.fillStyle = '#FF5722';
        this.foods.forEach(food => {
            this.ctx.fillRect(
                food.x * this.tileSize,
                food.y * this.tileSize,
                this.tileSize - 1,
                this.tileSize - 1
            );
        });
    }

    update() {
        if (!this.isGameRunning) return;
        this.snake.update();
        this.checkCollision();
        this.draw();
    }

    startGame() {
        this.snake.reset();
        this.score = 0;
        document.getElementById('scoreText').textContent = this.score;
        this.generateFoods(3);
        this.isGameRunning = true;
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), 150);
        this.overlay.style.display = 'none';
    }

    stopGame() {
        this.isGameRunning = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }
}

// 启动游戏
window.onload = () => new Game(); 