class Store {
    constructor(game) {
        this.game = game;
        this.width = 5;
        this.height = 5;
        this.tileSize = TILE_SIZE;
        this.map = this.createStoreMap();
        this.exitTile = { x: 2, y: 2 }; // Center tile as exit
    }

    createStoreMap() {
        let map = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (x === this.exitTile.x && y === this.exitTile.y) {
                    map.push(new Tile(x * this.tileSize, y * this.tileSize, 'storeExit'));
                } else {
                    map.push(new Tile(x * this.tileSize, y * this.tileSize, 'storeFloor'));
                }
            }
        }
        return map;
    }

    render(ctx) {
        this.map.forEach(tile => {
            if (tile.type === 'storeExit') {
                ctx.fillStyle = 'red'; // Make exit tile red
                ctx.fillRect(tile.x, tile.y, this.tileSize, this.tileSize);
            } else {
                tile.render(0, 0);
            }
        });
    }

    isPlayerAtExit(player) {
        const exitX = this.exitTile.x * this.tileSize;
        const exitY = this.exitTile.y * this.tileSize;
        return player.x === exitX && player.y === exitY;
    }
}
