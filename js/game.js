const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 2400;
canvas.height = 1824;

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
        // Adjust camera to center on player
        this.cameraX = this.player.x - canvas.width / 2;
        this.cameraY = this.player.y - canvas.height / 2;
        this.input = {};
        this.map = [];

        window.addEventListener('keydown', (e) => this.input[e.code] = true);
        window.addEventListener('keyup', (e) => this.input[e.code] = false);

        this.loadMap();
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
                    default: tileType = 'grass';
                }
                
                let count = 1;
                if (i + 1 < row.length && !isNaN(parseInt(row[i + 1]))) {
                    count = parseInt(row.slice(i + 1));
                    i = row.length; // Move to end of row
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
        ctx.translate(-this.cameraX, -this.cameraY);
        this.map.forEach(tile => {
            if (tile.x + tile.width > this.cameraX && tile.x < this.cameraX + canvas.width &&
                tile.y + tile.height > this.cameraY && tile.y < this.cameraY + canvas.height) {
                tile.render();
            }
        });
        this.player.render();
        ctx.restore();
    }

    update(deltaTime) {
        this.player.update(deltaTime, this.input, this.map);
        // Update camera position
        this.cameraX = this.player.x - canvas.width / 2;
        this.cameraY = this.player.y - canvas.height / 2;
        // Clamp camera to map bounds
        this.cameraX = Math.max(0, Math.min(this.cameraX, 2400 - canvas.width));
        this.cameraY = Math.max(0, Math.min(this.cameraY, 1824 - canvas.height));
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }
}

const game = new Game();
game.start();
