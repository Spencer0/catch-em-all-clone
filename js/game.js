const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to show 16x16 tiles
const TILE_SIZE = 48;
const VISIBLE_TILES = 16;
canvas.width = TILE_SIZE * VISIBLE_TILES;
canvas.height = TILE_SIZE * VISIBLE_TILES;

// Set the game world size
const WORLD_WIDTH = 10800;
const WORLD_HEIGHT = 5472;

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

class Player {
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
        this.interactionDistance = TILE_SIZE * 2.5; // Increased from 1.5 to 2.5
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

class Game {
    constructor() {
        this.lastTime = 0;
        this.accumulator = 0;
        this.step = 1 / 60;
        this.player = null;
        this.camera = {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        };
        this.input = {};
        this.map = [];
        this.spawnPoint = { x: 0, y: 0 };
        this.professorOak = null;
        this.dialogueManager = null;
        this.dialogues = {};
        this.menuManager = new MenuManager(this);

        window.addEventListener('keydown', (e) => {
            this.input[e.code] = true;
            if (e.code === 'Enter') {
                this.toggleMenu();
            }
        });
        window.addEventListener('keyup', (e) => this.input[e.code] = false);

        this.loadMap();
        this.loadDialogues();
        this.setupMainMenu();
    }

    setupMainMenu() {
        const mainMenu = new Menu(this);
        mainMenu.addItem("Pokemon", () => {
            console.log("Pokemon menu option selected");
            // Add Pokemon-related functionality here in the future
        });
        mainMenu.addItem("Exit Menu", () => {
            this.menuManager.closeMenu();
        });
        this.mainMenu = mainMenu;
    }

    toggleMenu() {
        if (this.menuManager.isMenuOpen()) {
            this.menuManager.closeMenu();
        } else {
            this.menuManager.openMenu(this.mainMenu);
        }
    }

    loadDialogues() {
        fetch('js/dialogues.json')
            .then(response => response.json())
            .then(data => {
                this.dialogues = data;
                this.dialogueManager = new DialogueManager(this.dialogues);
            });
    }

    updateCamera() {
        // Center the camera on the player
        this.camera.x = this.player.x - this.camera.width / 2;
        this.camera.y = this.player.y - this.camera.height / 2;

        // Clamp the camera to the world bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, WORLD_WIDTH - this.camera.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, WORLD_HEIGHT - this.camera.height));
    }

    loadMap() {
        fetch('js/map.json')
            .then(response => response.json())
            .then(data => {
                this.createMap(data);
                this.start(); // Start the game loop after map is loaded
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
                    case 'u': tileType = 'bush'; break;
                    case 'l': tileType = 'longGrass'; break;
                    case 's': 
                        tileType = 'grass';
                        this.spawnPoint = { x: x * TILE_SIZE, y: y * TILE_SIZE };
                        break;
                    case 'o':
                        tileType = 'grass';
                        this.professorOak = {
                            x: x * TILE_SIZE,
                            y: y * TILE_SIZE,
                            width: TILE_SIZE,
                            height: TILE_SIZE,
                            image: document.getElementById('professorOak')
                        };
                        break;
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
                    let tile = new Tile(x * TILE_SIZE, y * TILE_SIZE, tileType);
                    this.map.push(tile);
                    x++;
                }
            }
            y++;
        }

        // Create the player at the spawn point
        this.player = new Player(this.spawnPoint.x, this.spawnPoint.y);
    }

    loop(currentTime) {
        if (!this.player || !this.dialogueManager) return; // Don't run the loop if player or dialogueManager is not created yet

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.accumulator += deltaTime;

        while (this.accumulator >= this.step) {
            this.update(this.step, currentTime);
            this.accumulator -= this.step;
        }

        this.render();
        requestAnimationFrame(this.loop.bind(this));
    }

    update(deltaTime, currentTime) {
        if (this.dialogueManager.isActive()) {
            this.dialogueManager.update(currentTime);
            if (this.input.Space) {
                this.dialogueManager.progress();
                this.input.Space = false; // Reset space key to prevent multiple triggers
            }
        } else {
            this.player.update(deltaTime, this.input, this.map, this.professorOak);
            this.updateCamera();
            this.resetSteppedTiles();

            if (this.input.Space && this.player.checkNearbyNPC(this.professorOak)) {
                this.dialogueManager.startDialogue('professorOak');
                this.input.Space = false; // Reset space key to prevent multiple triggers
            }
        }
    }

    resetSteppedTiles() {
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        this.map.forEach(tile => {
            if (tile.type === 'longGrass' && tile.isSteppedOn) {
                if (playerCenterX < tile.x || playerCenterX >= tile.x + tile.width ||
                    playerCenterY < tile.y || playerCenterY >= tile.y + tile.height) {
                    tile.reset();
                }
            }
        });
    }

    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.map.forEach(tile => {
            if (tile.x + tile.width > this.camera.x && tile.x < this.camera.x + this.camera.width &&
                tile.y + tile.height > this.camera.y && tile.y < this.camera.y + this.camera.height) {
                tile.render(this.camera.x, this.camera.y);
            }
        });
        if (this.professorOak) {
            const screenX = this.professorOak.x - this.camera.x;
            const screenY = this.professorOak.y - this.camera.y;
            if (screenX + this.professorOak.width > 0 && screenX < canvas.width &&
                screenY + this.professorOak.height > 0 && screenY < canvas.height) {
                ctx.drawImage(this.professorOak.image, screenX, screenY, this.professorOak.width, this.professorOak.height);
            }
        }
        this.player.render(this.camera.x, this.camera.y);

        if (this.dialogueManager && this.dialogueManager.isActive()) {
            this.dialogueManager.render(ctx);
        }
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }
}

const game = new Game();
// game.start() is now called after the map is loaded
class DialogueManager {
    constructor(dialogues) {
        this.dialogues = dialogues;
        this.currentDialogue = null;
        this.currentIndex = 0;
        this.text = '';
        this.displayedText = '';
        this.isTyping = false;
        this.typingSpeed = 50; // milliseconds per character
        this.lastTypingTime = 0;
    }

    startDialogue(npcKey) {
        this.currentDialogue = this.dialogues[npcKey];
        this.currentIndex = 0;
        this.setText(this.currentDialogue[this.currentIndex].text);
    }

    setText(text) {
        this.text = text;
        this.displayedText = '';
        this.isTyping = true;
        this.lastTypingTime = performance.now();
    }

    update(currentTime) {
        if (this.isTyping) {
            if (currentTime - this.lastTypingTime > this.typingSpeed) {
                this.displayedText += this.text[this.displayedText.length];
                this.lastTypingTime = currentTime;
                if (this.displayedText.length === this.text.length) {
                    this.isTyping = false;
                }
            }
        }
    }

    render(ctx) {
        // Render dialogue box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(50, canvas.height - 150, canvas.width - 100, 100);
        
        // Render text
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(this.currentDialogue[this.currentIndex].speaker + ':', 70, canvas.height - 120);
        this.wrapText(ctx, this.displayedText, 70, canvas.height - 90, canvas.width - 140, 25);
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    progress() {
        if (this.isTyping) {
            // Fast forward text
            this.displayedText = this.text;
            this.isTyping = false;
        } else {
            // Move to next dialogue
            this.currentIndex++;
            if (this.currentIndex < this.currentDialogue.length) {
                this.setText(this.currentDialogue[this.currentIndex].text);
            } else {
                this.currentDialogue = null;
            }
        }
    }

    isActive() {
        return this.currentDialogue !== null;
    }
}
