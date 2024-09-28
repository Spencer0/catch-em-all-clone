class Player {
    constructor(x, y, CollisionManager) {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.speed = 300;
        this.sprites = {
            down: document.getElementById('playerDown'),
            up: document.getElementById('playerUp'),
            right: document.getElementById('playerRight')
        };
        this.currentSprite = this.sprites.down;
        this.direction = 'down';
        this.interactionDistance = TILE_SIZE * 2.5;
    }

    checkNearbyNPC(professorOak) {
        const distance = Math.sqrt(
            Math.pow(this.x - professorOak.x, 2) + 
            Math.pow(this.y - professorOak.y, 2)
        );
        return distance <= this.interactionDistance;
    }

    update(deltaTime, input, map, professorOak) {
        let newX = this.x;
        let newY = this.y;

        if (input.ArrowLeft) {
            newX -= this.speed * deltaTime;
            this.direction = 'left';
            this.currentSprite = this.sprites.right;
        }
        if (input.ArrowRight) {
            newX += this.speed * deltaTime;
            this.direction = 'right';
            this.currentSprite = this.sprites.right;
        }
        if (input.ArrowUp) {
            newY -= this.speed * deltaTime;
            this.direction = 'up';
            this.currentSprite = this.sprites.up;
        }
        if (input.ArrowDown) {
            newY += this.speed * deltaTime;
            this.direction = 'down';
            this.currentSprite = this.sprites.down;
        }

        if (!this.checkCollision(newX, newY, map) && 
            !this.isCollidingWithBush(newX, newY, map) &&
            !this.isCollidingWithProfessorOak(newX, newY, professorOak)) {
            this.x = newX;
            this.y = newY;
            this.stepOnTile(map);
        }

        // Keep player within world bounds
        this.x = Math.max(0, Math.min(WORLD_WIDTH - this.width, this.x));
        this.y = Math.max(0, Math.min(WORLD_HEIGHT - this.height, this.y));
    }

    stepOnTile(map) {
        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;
        map.forEach(tile => {
            if (tile.type === 'longGrass' &&
                playerCenterX >= tile.x && playerCenterX < tile.x + tile.width &&
                playerCenterY >= tile.y && playerCenterY < tile.y + tile.height) {
                tile.step();
            }
        });
    }

    checkCollision(x, y, map) {
        const tempPlayer = { x, y, width: this.width, height: this.height };
        return CollisionManager.checkCollision(tempPlayer, map);
    }

    isCollidingWithBush(x, y, map) {
        const tempPlayer = { x, y, width: this.width, height: this.height };
        return map.some(tile => 
            tile.type === 'bush' &&
            x < tile.x + tile.width &&
            x + this.width > tile.x &&
            y < tile.y + tile.height &&
            y + this.height > tile.y
        );
    }

    isCollidingWithProfessorOak(x, y, professorOak) {
        const collisionMargin = 10; // Pixels of overlap allowed
        return professorOak &&
            x < professorOak.x + professorOak.width - collisionMargin &&
            x + this.width > professorOak.x + collisionMargin &&
            y < professorOak.y + professorOak.height - collisionMargin &&
            y + this.height > professorOak.y + collisionMargin;
    }

    render(cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        ctx.save();
        if (this.direction === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(this.currentSprite, -screenX - this.width, screenY, this.width, this.height);
        } else {
            ctx.drawImage(this.currentSprite, screenX, screenY, this.width, this.height);
        }
        ctx.restore();
    }
}

// Player class is now globally available
