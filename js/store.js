class Store {
    constructor(game) {
        this.game = game;
        this.width = 12;
        this.height = 12;
        this.tileSize = TILE_SIZE;
        this.exitTile = { x: 5, y: 0 }; // Top center tile as exit
        this.map = this.createStoreMap();
        this.offsetX = (canvas.width - this.width * this.tileSize) / 2;
        this.offsetY = (canvas.height - this.height * this.tileSize) / 2;
    }

    createStoreMap() {
        let map = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (x === this.exitTile.x && y === this.exitTile.y) {
                    map.push(new Tile(x * this.tileSize, y * this.tileSize, 'storeExit'));
                } else if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    map.push(new Tile(x * this.tileSize, y * this.tileSize, 'storeWall'));
                } else {
                    map.push(new Tile(x * this.tileSize, y * this.tileSize, 'storeFloor'));
                }
            }
        }
        return map;
    }

    render(ctx) {
        // Fill the entire canvas with black
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render the store
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);

        this.map.forEach(tile => {
            if (tile.type === 'storeExit') {
                const exitImage = document.getElementById('storeExitTile');
                ctx.drawImage(exitImage, tile.x, tile.y, this.tileSize, this.tileSize);
            } else {
                tile.render(0, 0);
            }
        });

        ctx.restore();
    }

    isPlayerAtExit(player) {
        const exitX = this.exitTile.x * this.tileSize + this.offsetX;
        const exitY = this.exitTile.y * this.tileSize + this.offsetY;
        return Math.abs(player.x - exitX) < this.tileSize / 2 &&
               Math.abs(player.y - exitY) < this.tileSize / 2;
    }

    update(deltaTime) {
        // Add any store-specific update logic here if needed
    }

    checkCollision(x, y, width, height) {
        for (const tile of this.map) {
            if (tile.type === 'storeWall' &&
                x < tile.x + this.tileSize &&
                x + width > tile.x &&
                y < tile.y + this.tileSize &&
                y + height > tile.y) {
                return true;
            }
        }
        return false;
    }
}
