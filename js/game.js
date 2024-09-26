const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.speed = 200;
    }

    update(deltaTime, input) {
        if (input.ArrowLeft) this.x -= this.speed * deltaTime;
        if (input.ArrowRight) this.x += this.speed * deltaTime;
        if (input.ArrowUp) this.y -= this.speed * deltaTime;
        if (input.ArrowDown) this.y += this.speed * deltaTime;

        // Keep player within canvas bounds
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
    }

    render() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Game {
    constructor() {
        this.lastTime = 0;
        this.accumulator = 0;
        this.step = 1 / 60;
        this.player = new Player(canvas.width / 2, canvas.height / 2);
        this.input = {};

        window.addEventListener('keydown', (e) => this.input[e.code] = true);
        window.addEventListener('keyup', (e) => this.input[e.code] = false);
    }

    loop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.accumulator += deltaTime;

        while (this.accumulator >= this.step) {
            this.update(this.step);
            this.accumulator -= this.step;
        }

        this.render();
        requestAnimationFrame(this.loop.bind(this));
    }

    update(deltaTime) {
        this.player.update(deltaTime, this.input);
    }

    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.player.render();
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }
}

const game = new Game();
game.start();
