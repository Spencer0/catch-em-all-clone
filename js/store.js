class Store {
    constructor(game) {
        this.game = game;
        this.width = 5;
        this.height = 5;
        this.tileSize = TILE_SIZE;
        this.map = this.createStoreMap();
    }

    createStoreMap() {
        let map = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                map.push(new Tile(x * this.tileSize, y * this.tileSize, 'storeFloor'));
            }
        }
        return map;
    }

    render(ctx) {
        this.map.forEach(tile => {
            tile.render(0, 0);
        });
    }

    isPlayerAtExit(player) {
        const exitX = 2 * this.tileSize;
        const exitY = 4 * this.tileSize;
        return player.x === exitX && player.y === exitY;
    }
}
