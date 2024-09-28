class Tile {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.type = type;
        this.image = document.getElementById(`${type}Tile`);
        this.steppedImage = type === 'longGrass' ? document.getElementById('longGrassSteppedTile') : null;
        this.isSteppedOn = false;
    }

    render(cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const imageToRender = this.isSteppedOn && this.steppedImage ? this.steppedImage : this.image;
        ctx.drawImage(imageToRender, screenX, screenY, this.width, this.height);
    }

    step() {
        if (this.type === 'longGrass') {
            this.isSteppedOn = true;
        }
    }

    reset() {
        this.isSteppedOn = false;
    }
}

// Tile class is now globally available
