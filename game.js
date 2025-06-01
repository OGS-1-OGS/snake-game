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
        this.maxFoods = 5; // 修改默认最大食物数量为5个
        this.bonusFoodTimer = null;
        this.isInvincible = false;
        this.invincibleTimer = null;
        this.invincibleEndTime = 0;
        this.rainbowEffect = false;

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
        // 清除之前的计时器
        if (this.bonusFoodTimer) {
            clearTimeout(this.bonusFoodTimer);
            this.bonusFoodTimer = null;
        }
        if (this.invincibleTimer) {
            clearTimeout(this.invincibleTimer);
            this.invincibleTimer = null;
        }

        // 初始化蛇的位置
        this.snake = [
            { x: 6, y: 10 },
            { x: 5, y: 10 },
            { x: 4, y: 10 }
        ];

        // 清空食物数组
        this.foods = [];
        // 生成初始食物
        for (let i = 0; i < 5; i++) { // 生成5个初始食物
            this.generateFood();
        }

        // 重置分数
        this.score = 0;
        this.updateScore();

        // 重置游戏状态
        this.isGameOver = false;
        this.isPaused = false;
        this.isInvincible = false;
        this.invincibleEndTime = 0;
        this.rainbowEffect = false;

        // 更新界面
        this.draw();
    }

    setupEventListeners() {
        // 键盘控制
        document.addEventListener("keydown", (e) => {
            this.handleKeyPress(e);
        });

        // 触摸和点击控制
        this.canvas.addEventListener("click", (e) => {
            this.handleTouchOrClick(e);
        });
        this.canvas.addEventListener("touchstart", (e) => {
            e.preventDefault(); // 防止触摸事件导致页面滚动
            this.handleTouchOrClick(e.touches[0]);
        });

        // 虚拟方向键控制
        document.querySelectorAll('.control-btn').forEach(button => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault(); // 防止触摸事件导致页面滚动
                const direction = button.dataset.direction;
                this.handleVirtualControl(direction);
            });

            // 添加鼠标点击支持（用于在桌面端测试）
            button.addEventListener('click', (e) => {
                const direction = button.dataset.direction;
                this.handleVirtualControl(direction);
            });
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

        // 游戏说明按钮
        document.getElementById("instructionsBtn").addEventListener("click", () => {
            document.getElementById("instructionsModal").style.display = "block";
        });

        // 关闭游戏说明模态框
        document.getElementById("closeInstructionsModal").addEventListener("click", () => {
            document.getElementById("instructionsModal").style.display = "none";
        });

        // 点击模态框外部关闭
        window.addEventListener("click", (e) => {
            const instructionsModal = document.getElementById("instructionsModal");
            if (e.target === instructionsModal) {
                instructionsModal.style.display = "none";
            }
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

    handleTouchOrClick(event) {
        if (this.isGameOver || this.isPaused) return;

        // 获取点击/触摸位置相对于画布的坐标
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 获取蛇头位置（转换为像素坐标）
        const headX = this.snake[0].x * this.gridSize;
        const headY = this.snake[0].y * this.gridSize;

        // 计算点击位置相对于蛇头的方向
        const dx = x - headX;
        const dy = y - headY;

        // 根据点击位置确定新方向
        let newDirection;
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平移动
            newDirection = dx > 0 ? "right" : "left";
        } else {
            // 垂直移动
            newDirection = dy > 0 ? "down" : "up";
        }

        // 防止反向移动
        const opposites = {
            "up": "down",
            "down": "up",
            "left": "right",
            "right": "left"
        };

        if (this.direction !== opposites[newDirection]) {
            this.nextDirection = newDirection;
        }
    }

    handleVirtualControl(direction) {
        if (this.isGameOver || this.isPaused) return;

        const opposites = {
            "up": "down",
            "down": "up",
            "left": "right",
            "right": "left"
        };

        // 防止反向移动
        if (this.direction !== opposites[direction]) {
            this.nextDirection = direction;
        }
    }

    generateFood() {
        if (this.foods.length >= this.maxFoods) return;

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

        // 无敌状态下可以穿过墙壁
        if (!this.isInvincible) {
            if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
                head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
                this.gameOver();
                return;
            }

            if (this.isCollision(head)) {
                this.gameOver();
                return;
            }
        } else {
            // 无敌状态下穿墙
            if (head.x < 0) head.x = this.canvas.width / this.gridSize - 1;
            if (head.x >= this.canvas.width / this.gridSize) head.x = 0;
            if (head.y < 0) head.y = this.canvas.height / this.gridSize - 1;
            if (head.y >= this.canvas.height / this.gridSize) head.y = 0;
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
                this.temporaryFoodBoost();
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
        // 清除之前的计时器
        if (this.invincibleTimer) {
            clearTimeout(this.invincibleTimer);
            this.invincibleTimer = null;
        }

        // 激活无敌状态
        this.isInvincible = true;
        this.rainbowEffect = true;
        this.invincibleEndTime = Date.now() + 10000; // 设置结束时间（当前时间 + 10秒）

        // 保存原始的绘制方法
        const originalDraw = this.draw.bind(this);

        // 创建新的绘制方法
        this.draw = () => {
            // 先清除画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

            // 绘制蛇
            if (this.rainbowEffect) {
                // 绘制彩虹蛇身
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

                // 添加无敌状态提示
                const remainingTime = Math.ceil((this.invincibleEndTime - Date.now()) / 1000);
                if (remainingTime > 0) {
                    // 绘制半透明背景
                    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
                    this.ctx.fillRect(0, 0, this.canvas.width, 40);

                    // 绘制无敌状态和倒计时
                    this.ctx.fillStyle = "white";
                    this.ctx.font = "20px Poppins";
                    this.ctx.textAlign = "center";
                    this.ctx.fillText(`无敌状态 ${remainingTime}秒`, this.canvas.width / 2, 30);
                }
            } else {
                // 正常状态下的蛇身颜色
                this.snake.forEach((segment, index) => {
                    this.ctx.fillStyle = index === 0 ? "#4CAF50" : "#81C784";
                    this.ctx.fillRect(
                        segment.x * this.gridSize,
                        segment.y * this.gridSize,
                        this.gridSize - 1,
                        this.gridSize - 1
                    );
                });
            }

            // 如果游戏暂停，绘制暂停提示
            if (this.isPaused) {
                this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = "white";
                this.ctx.font = "30px Poppins";
                this.ctx.textAlign = "center";
                this.ctx.fillText("暂停", this.canvas.width / 2, this.canvas.height / 2);
            }
        };

        // 10秒后恢复原始状态
        this.invincibleTimer = setTimeout(() => {
            // 重置所有状态
            this.isInvincible = false;
            this.rainbowEffect = false;
            this.invincibleEndTime = 0;

            // 立即重绘一次，确保颜色恢复正常
            this.draw();

            // 恢复原始绘制方法
            this.draw = originalDraw;

            // 清除计时器
            clearTimeout(this.invincibleTimer);
            this.invincibleTimer = null;

            // 再次重绘，确保使用原始绘制方法
            this.draw();
        }, 10000);
    }

    temporaryFoodBoost() {
        // 清除之前的计时器
        if (this.bonusFoodTimer) {
            clearTimeout(this.bonusFoodTimer);
        }

        // 增加最大食物数量
        const originalMaxFoods = this.maxFoods;
        this.maxFoods = 10; // 临时增加到10个食物

        // 立即生成额外的食物
        while (this.foods.length < this.maxFoods) {
            this.generateFood();
        }

        // 5秒后恢复原来的食物数量
        this.bonusFoodTimer = setTimeout(() => {
            this.maxFoods = originalMaxFoods;
            // 如果当前食物数量超过最大值，移除多余的食物
            while (this.foods.length > this.maxFoods) {
                this.foods.pop();
            }
            this.bonusFoodTimer = null;
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

// 原生JS摇杆实现
function createNativeJoystick(options) {
    const zone = options.zone;
    const size = options.size || 100;
    // 创建摇杆底座
    const base = document.createElement('div');
    base.style.position = 'relative';
    base.style.width = size + 'px';
    base.style.height = size + 'px';
    base.style.background = 'rgba(33,150,243,0.15)';
    base.style.borderRadius = '50%';
    base.style.boxShadow = '0 2px 8px rgba(33,150,243,0.2)';
    base.style.margin = '0 auto';
    base.style.touchAction = 'none';
    // 创建摇杆手柄
    const stick = document.createElement('div');
    const stickSize = size * 0.45;
    stick.style.position = 'absolute';
    stick.style.left = (size - stickSize) / 2 + 'px';
    stick.style.top = (size - stickSize) / 2 + 'px';
    stick.style.width = stickSize + 'px';
    stick.style.height = stickSize + 'px';
    stick.style.background = 'linear-gradient(145deg, #2196f3 60%, #90caf9 100%)';
    stick.style.borderRadius = '50%';
    stick.style.boxShadow = '0 4px 12px rgba(33,150,243,0.25)';
    stick.style.transition = 'left 0.1s, top 0.1s';
    base.appendChild(stick);
    zone.innerHTML = '';
    zone.appendChild(base);

    let dragging = false;
    let startX, startY;
    let lastDirection = null;

    function getDirection(dx, dy) {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        if (Math.abs(dx) < size * 0.15 && Math.abs(dy) < size * 0.15) return null;
        if (angle >= -45 && angle < 45) return 'right';
        if (angle >= 45 && angle < 135) return 'down';
        if (angle >= 135 || angle < -135) return 'left';
        if (angle >= -135 && angle < -45) return 'up';
        return null;
    }

    function handleMove(clientX, clientY) {
        const rect = base.getBoundingClientRect();
        const dx = clientX - (rect.left + size / 2);
        const dy = clientY - (rect.top + size / 2);
        const dist = Math.min(Math.sqrt(dx * dx + dy * dy), size / 2 - stickSize / 2);
        const angle = Math.atan2(dy, dx);
        const stickX = Math.cos(angle) * dist + size / 2 - stickSize / 2;
        const stickY = Math.sin(angle) * dist + size / 2 - stickSize / 2;
        stick.style.left = stickX + 'px';
        stick.style.top = stickY + 'px';
        // 方向判断
        const direction = getDirection(dx, dy);
        if (direction && direction !== lastDirection) {
            let key;
            switch (direction) {
                case 'up': key = 'ArrowUp'; break;
                case 'down': key = 'ArrowDown'; break;
                case 'left': key = 'ArrowLeft'; break;
                case 'right': key = 'ArrowRight'; break;
            }
            if (window.game && typeof window.game.handleKeyPress === 'function') {
                window.game.handleKeyPress({ key, preventDefault: () => { } });
            }
            lastDirection = direction;
        }
        if (!direction) lastDirection = null;
    }

    function resetStick() {
        stick.style.left = (size - stickSize) / 2 + 'px';
        stick.style.top = (size - stickSize) / 2 + 'px';
        lastDirection = null;
    }

    // 触摸事件
    base.addEventListener('touchstart', function (e) {
        dragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        handleMove(touch.clientX, touch.clientY);
    });
    base.addEventListener('touchmove', function (e) {
        if (!dragging) return;
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
    });
    base.addEventListener('touchend', function () {
        dragging = false;
        resetStick();
    });
    // 鼠标事件
    base.addEventListener('mousedown', function (e) {
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', function () {
        if (dragging) {
            dragging = false;
            resetStick();
        }
    });
}

// 页面加载后初始化原生摇杆
window.addEventListener('DOMContentLoaded', function () {
    window.game = new Game();
    createNativeJoystick({
        zone: document.getElementById('joystick-zone'),
        size: 100
    });
});