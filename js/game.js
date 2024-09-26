const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

class Tile {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.type = type;
        this.image = new Image();
        this.image.src = `assets/${type}.svg`;
    }

    render() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.speed = 200;
    }

    update(deltaTime, input, map) {
        let newX = this.x;
        let newY = this.y;

        if (input.ArrowLeft) newX -= this.speed * deltaTime;
        if (input.ArrowRight) newX += this.speed * deltaTime;
        if (input.ArrowUp) newY -= this.speed * deltaTime;
        if (input.ArrowDown) newY += this.speed * deltaTime;

        if (!this.checkCollision(newX, newY, map)) {
            this.x = newX;
            this.y = newY;
        }

        // Keep player within canvas bounds
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
    }

    checkCollision(x, y, map) {
        for (let tile of map) {
            if (tile.type === 'water' &&
                x < tile.x + tile.width &&
                x + this.width > tile.x &&
                y < tile.y + tile.height &&
                y + this.height > tile.y) {
                return true;
            }
        }
        return false;
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
        this.map = this.createMap();

        window.addEventListener('keydown', (e) => this.input[e.code] = true);
        window.addEventListener('keyup', (e) => this.input[e.code] = false);
    }

    createMap() {
        const map = [];
        const mapWidth = canvas.width / 32;
        const mapHeight = canvas.height / 32;

        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const type = Math.random() < 0.8 ? 'grass' : 'water';
                map.push(new Tile(x * 32, y * 32, type));
            }
        }

        return map;
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
        this.player.update(deltaTime, this.input, this.map);
    }

    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.map.forEach(tile => tile.render());
        this.player.render();
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }
}

const game = new Game();
game.start();
