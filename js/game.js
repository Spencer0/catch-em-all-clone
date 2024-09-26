const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to 2/3 of the screen size
canvas.width = Math.min(window.innerWidth * 2/3, 800);
canvas.height = Math.min(window.innerHeight * 2/3, 600);

// Set the game world size
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1824;

class Tile {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.type = type;
        this.image = document.getElementById(`${type}Tile`);
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
        const tempPlayer = { x, y, width: this.width, height: this.height };
        return CollisionManager.checkCollision(tempPlayer, map);
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
        this.camera = {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        };
        this.input = {};
        this.map = [];

        window.addEventListener('keydown', (e) => this.input[e.code] = true);
        window.addEventListener('keyup', (e) => this.input[e.code] = false);

        this.loadMap();
    }

    updateCamera() {
        // Center the camera on the player
        this.camera.x = this.player.x - this.camera.width / 2;
        this.camera.y = this.player.y - this.camera.height / 2;

        // Clamp the camera to the map bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, canvas.width - this.camera.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, canvas.height - this.camera.height));
    }

    loadMap() {
        fetch('js/map.json')
            .then(response => response.json())
            .then(data => {
                this.createMap(data);
            });
    }

    createMap(mapData) {
        this.map = [];
        let y = 0;
        for (let row of mapData.tiles) {
            let x = 0;
            let i = 0;
            while (i < row.length) {
                let tileType;
                switch (row[i]) {
                    case 'w': tileType = 'water'; break;
                    case 'b': tileType = 'bridge'; break;
                    case 'g': tileType = 'grass'; break;
                    default: tileType = 'grass';
                }
                
                let count = 1;
                if (i + 1 < row.length && !isNaN(parseInt(row[i + 1]))) {
                    count = parseInt(row.slice(i + 1));
                    i += count.toString().length + 1;
                } else {
                    i++;
                }

                for (let j = 0; j < count; j++) {
                    this.map.push(new Tile(x * 32, y * 32, tileType));
                    x++;
                }
            }
            y++;
        }
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
        ctx.save();
        ctx.scale(canvas.width / WORLD_WIDTH, canvas.height / WORLD_HEIGHT);
        ctx.translate(-this.camera.x, -this.camera.y);
        this.map.forEach(tile => {
            if (tile.x + tile.width > this.camera.x && tile.x < this.camera.x + WORLD_WIDTH &&
                tile.y + tile.height > this.camera.y && tile.y < this.camera.y + WORLD_HEIGHT) {
                tile.render();
            }
        });
        this.player.render();
        ctx.restore();
    }

    update(deltaTime) {
        this.player.update(deltaTime, this.input, this.map);
        this.updateCamera();
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }
}

const game = new Game();
game.start();
