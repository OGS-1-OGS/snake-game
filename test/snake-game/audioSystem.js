// 音效系统
class AudioSystem {
    constructor() {
        // 创建音频上下文
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isBackgroundPlaying = false;
        this.backgroundLoop = null;
    }

    // 生成吃食物的音效
    playEatSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // 设置音调和音量
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        // 播放音效
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    // 生成特殊食物音效
    playSpecialSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // 设置音调和音量
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, this.audioContext.currentTime + 0.15); // C6

        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        // 播放音效
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    // 生成游戏结束音效
    playGameOverSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // 设置音调和音量
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        // 播放音效
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    // 播放背景音乐
    playBackgroundMusic() {
        if (this.isBackgroundPlaying) return;

        const playNote = (frequency, startTime, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, startTime);

            gainNode.gain.setValueAtTime(0.1, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        const playMelody = () => {
            const currentTime = this.audioContext.currentTime;
            const notes = [262, 330, 392, 330]; // C4, E4, G4, E4
            const noteDuration = 0.2;
            const totalDuration = notes.length * noteDuration;

            notes.forEach((freq, index) => {
                playNote(freq, currentTime + index * noteDuration, noteDuration);
            });

            // 循环播放
            this.backgroundLoop = setTimeout(playMelody, totalDuration * 1000);
        };

        this.isBackgroundPlaying = true;
        playMelody();
    }

    // 停止背景音乐
    stopBackgroundMusic() {
        if (this.backgroundLoop) {
            clearTimeout(this.backgroundLoop);
            this.backgroundLoop = null;
        }
        this.isBackgroundPlaying = false;
    }

    // 恢复音频上下文（用于处理浏览器的自动播放策略）
    resume() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// 导出音频系统
window.AudioSystem = AudioSystem;