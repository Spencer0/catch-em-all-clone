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
        if (type === 'store') {
            this.width = TILE_SIZE * 4;
            this.height = TILE_SIZE * 4;
            this.y -= TILE_SIZE * 2; // Move the store up by 2 tiles to align the bottom with the ground
        }
    }

    render(cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const imageToRender = this.isSteppedOn && this.steppedImage ? this.steppedImage : this.image;
        if (imageToRender && imageToRender.complete && imageToRender.naturalHeight !== 0) {
            ctx.drawImage(imageToRender, screenX, screenY, this.width, this.height);
        } else {
            // Fallback rendering if image is not loaded
            ctx.fillStyle = '#FF00FF'; // Magenta color for visibility
            ctx.fillRect(screenX, screenY, this.width, this.height);
        }
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
