class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.gridSize = 20;
        this.snake = [];
        this.direction = "right";
        this.nextDirection = "right";
        this.foods = [];
        this.specialFood = null;
        this.score = 0;
        this.highScore = localStorage.getItem("highScore") || 0;
        this.gameLoop = null;
        this.isGameOver = false;
        this.isPaused = false;
        this.audioSystem = new AudioSystem();
        this.records = JSON.parse(localStorage.getItem("gameRecords") || "[]");

        // 难度设置
        this.difficulties = {
            easy: { speed: 200, specialFoodChance: 0.15 },
            normal: { speed: 150, specialFoodChance: 0.2 },
            hard: { speed: 100, specialFoodChance: 0.25 }
        };

        // 特殊食物类型
        this.foodTypes = {
            normal: { color: "#FF4081", points: 1 },
            speed: { color: "#FFD700", points: 3 }, // 加速食物
            bonus: { color: "#4CAF50", points: 5 }, // 奖励分数
            rainbow: { color: "#9C27B0", points: 8 } // 彩虹食物
        };

        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        // 初始化蛇的位置
        this.snake = [
            { x: 6, y: 10 },
            { x: 5, y: 10 },
            { x: 4, y: 10 }
        ];

        // 清空食物数组
        this.foods = [];
        // 生成初始食物
        this.generateFood();
        this.generateFood();

        // 重置分数
        this.score = 0;
        this.updateScore();

        // 重置游戏状态
        this.isGameOver = false;
        this.isPaused = false;

        // 更新界面
        this.draw();
    }

    setupEventListeners() {
        // 键盘控制
        document.addEventListener("keydown", (e) => {
            this.handleKeyPress(e);
        });

        // 开始按钮
        document.getElementById("startBtn").addEventListener("click", () => {
            if (this.isGameOver || !this.gameLoop) {
                this.startGame();
            } else {
                this.togglePause();
            }
        });

        // 记录按钮
        document.getElementById("recordsBtn").addEventListener("click", () => {
            this.showRecords();
        });

        // 关闭记录模态框
        document.getElementById("closeModal").addEventListener("click", () => {
            document.getElementById("recordsModal").style.display = "none";
        });
    }

    handleKeyPress(e) {
        const key = e.key;
        const directions = {
            "ArrowUp": "up",
            "ArrowDown": "down",
            "ArrowLeft": "left",
            "ArrowRight": "right"
        };

        if (directions[key]) {
            // 阻止方向键的默认滚动行为
            e.preventDefault();

            const newDirection = directions[key];
            const opposites = {
                "up": "down",
                "down": "up",
                "left": "right",
                "right": "left"
            };

            // 防止反向移动
            if (this.direction !== opposites[newDirection]) {
                this.nextDirection = newDirection;
            }
        }
    }

    generateFood() {
        if (this.foods.length >= 3) return;

        let newFood;
        const difficulty = document.getElementById("difficulty").value;
        const specialFoodChance = this.difficulties[difficulty].specialFoodChance;

        do {
            const foodType = this.getRandomFoodType(specialFoodChance);
            newFood = {
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize)),
                type: foodType
            };
        } while (this.isCollision(newFood) || this.foods.some(food =>
            food.x === newFood.x && food.y === newFood.y));

        this.foods.push(newFood);
    }

    getRandomFoodType(specialChance) {
        if (Math.random() >= specialChance) {
            return "normal";
        }

        // 随机选择特殊食物类型
        const specialTypes = ["speed", "bonus", "rainbow"];
        return specialTypes[Math.floor(Math.random() * specialTypes.length)];
    }

    isCollision(position) {
        // 检查是否与蛇身碰撞
        return this.snake.some(segment =>
            segment.x === position.x && segment.y === position.y);
    }

    move() {
        this.direction = this.nextDirection;
        const head = { ...this.snake[0] };

        switch (this.direction) {
            case "up": head.y--; break;
            case "down": head.y++; break;
            case "left": head.x--; break;
            case "right": head.x++; break;
        }

        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            this.gameOver();
            return;
        }

        if (this.isCollision(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        const foodIndex = this.foods.findIndex(food =>
            food.x === head.x && food.y === head.y);

        if (foodIndex !== -1) {
            const food = this.foods[foodIndex];
            this.foods.splice(foodIndex, 1);

            // 根据食物类型处理效果
            this.handleFoodEffect(food);

            this.generateFood();
        } else {
            this.snake.pop();
        }
    }

    handleFoodEffect(food) {
        const foodInfo = this.foodTypes[food.type];
        this.score += foodInfo.points;

        switch (food.type) {
            case "speed":
                this.audioSystem.playSpecialSound();
                this.temporarySpeedBoost();
                break;
            case "bonus":
                this.audioSystem.playSpecialSound();
                break;
            case "rainbow":
                this.audioSystem.playSpecialSound();
                this.activateRainbowEffect();
                break;
            default:
                this.audioSystem.playEatSound();
        }

        this.updateScore();
    }

    temporarySpeedBoost() {
        const difficulty = document.getElementById("difficulty").value;
        const normalSpeed = this.difficulties[difficulty].speed;
        const boostSpeed = normalSpeed * 0.7;

        clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => {
            if (!this.isPaused) {
                this.move();
                this.draw();
            }
        }, boostSpeed);

        setTimeout(() => {
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => {
                    if (!this.isPaused) {
                        this.move();
                        this.draw();
                    }
                }, normalSpeed);
            }
        }, 3000);
    }

    activateRainbowEffect() {
        let rainbow = true;
        let rainbowTimeout = setTimeout(() => {
            rainbow = false;
        }, 5000);

        // 保存原始的绘制方法
        const originalDraw = this.draw.bind(this);

        // 创建新的绘制方法
        this.draw = () => {
            originalDraw();
            if (rainbow) {
                this.snake.forEach((segment, index) => {
                    const hue = (index * 25 + Date.now() / 50) % 360;
                    this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                    this.ctx.fillRect(
                        segment.x * this.gridSize,
                        segment.y * this.gridSize,
                        this.gridSize - 1,
                        this.gridSize - 1
                    );
                });
            }
        };

        // 5秒后恢复原始绘制方法
        setTimeout(() => {
            this.draw = originalDraw;
            clearTimeout(rainbowTimeout);
        }, 5000);
    }

    updateScore() {
        document.getElementById("scoreText").textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem("highScore", this.highScore);
            document.getElementById("highScoreText").textContent = this.highScore;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制蛇
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? "#4CAF50" : "#81C784";
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });

        // 绘制食物
        this.foods.forEach(food => {
            this.ctx.fillStyle = this.foodTypes[food.type].color;
            this.ctx.fillRect(
                food.x * this.gridSize,
                food.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });

        if (this.isPaused) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = "white";
            this.ctx.font = "30px Poppins";
            this.ctx.textAlign = "center";
            this.ctx.fillText("暂停", this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.audioSystem.playGameOverSound();
        this.audioSystem.stopBackgroundMusic();
        clearInterval(this.gameLoop);
        this.gameLoop = null;

        // 保存记录
        const newRecord = {
            score: this.score,
            date: new Date().toLocaleString()
        };
        this.records.push(newRecord);
        this.records.sort((a, b) => b.score - a.score);
        this.records = this.records.slice(0, 10); // 只保留前10名
        localStorage.setItem("gameRecords", JSON.stringify(this.records));

        // 显示游戏结束界面
        const overlay = document.getElementById("gameOverlay");
        overlay.style.display = "flex";
        overlay.querySelector(".overlay-content").innerHTML = `
            <h2>游戏结束</h2>
            <p>最终得分: ${this.score}</p>
            <p>点击"开始游戏"重新开始</p>
        `;

        // 更新开始按钮文本
        document.getElementById("startBtn").innerHTML = '<span class="btn-icon">▶</span>重新开始';
    }

    startGame() {
        // 重置游戏状态
        this.isGameOver = false;
        this.isPaused = false;
        this.direction = "right";
        this.nextDirection = "right";

        // 停止当前游戏循环
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }

        // 初始化游戏
        this.audioSystem.resume();
        this.audioSystem.playBackgroundMusic();
        this.initializeGame();

        // 更新界面
        document.getElementById("gameOverlay").style.display = "none";
        document.getElementById("startBtn").innerHTML = '<span class="btn-icon">⏸</span>暂停游戏';

        // 设置新的游戏循环
        const difficulty = document.getElementById("difficulty").value;
        const speed = this.difficulties[difficulty].speed;

        this.gameLoop = setInterval(() => {
            if (!this.isPaused) {
                this.move();
                this.draw();
            }
        }, speed);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.audioSystem.stopBackgroundMusic();
            document.getElementById("startBtn").innerHTML = '<span class="btn-icon">▶</span>继续游戏';
        } else {
            this.audioSystem.playBackgroundMusic();
            document.getElementById("startBtn").innerHTML = '<span class="btn-icon">⏸</span>暂停游戏';
        }
        this.draw();
    }

    showRecords() {
        const recordsList = document.getElementById("recordsList");
        recordsList.innerHTML = this.records.map((record, index) => `
            <div class="record-item">
                <span class="rank">#${index + 1}</span>
                <span class="score">${record.score}分</span>
                <span class="date">${record.date}</span>
            </div>
        `).join("");

        document.getElementById("recordsModal").style.display = "block";
    }
}

// 当页面加载完成时初始化游戏
document.addEventListener("DOMContentLoaded", () => {
    window.game = new Game();
});