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

// PokemonMenu class has been moved to pokemon_menu.js

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
        this.pokemonMenu = new PokemonMenu(this);
        this.isPokemonMenuOpen = false;

        window.addEventListener('keydown', (e) => {
            this.input[e.code] = true;
            console.log('KeyDown:', e.code);
            if (e.code === 'Enter') {
                e.preventDefault(); // Prevent default action for Enter key
            }
        });
        window.addEventListener('keyup', (e) => {
            this.input[e.code] = false;
            if (e.code === 'Enter') {
                this.handleEnterKeyUp();
            }
        });

        this.loadMap();
        this.loadDialogues();
        this.setupMainMenu();
    }

    handleEnterKeyUp() {
        if (this.isPokemonMenuOpen) {
            this.pokemonMenu.select();
        } else if (this.menuManager.isMenuOpen()) {
            this.menuManager.selectCurrentItem();
        } else {
            this.toggleMenu();
        }
    }

    setupMainMenu() {
        const mainMenu = new Menu(this);
        mainMenu.addItem("Pokemon", () => {
            console.log("Pokemon menu option selected");
            this.openPokemonMenu();
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

    openPokemonMenu() {
        this.isPokemonMenuOpen = true;
        this.menuManager.closeMenu();
    }

    closePokemonMenu() {
        this.isPokemonMenuOpen = false;
        this.menuManager.openMenu(this.mainMenu);
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
        console.log('Loading map');
        fetch('js/map.json')
            .then(response => response.json())
            .then(data => {
                console.log('Map data loaded');
                this.createMap(data);
                console.log('Map created');
                this.start(); // Start the game loop after map is loaded
            })
            .catch(error => {
                console.error('Error loading map:', error);
            });
    }

    createMap(mapData) {
        console.log('Creating map');
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

        console.log(`Map created with ${this.map.length} tiles`);

        // Create the player at the spawn point
        this.player = new Player(this.spawnPoint.x, this.spawnPoint.y);
        console.log('Player created at', this.spawnPoint);
    }

    loop(currentTime) {
        console.log('Game loop started');
        if (!this.player || !this.dialogueManager) {
            console.log('Player or DialogueManager not initialized, skipping loop');
            return;
        }

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
        console.log('Updating game state');
        if (this.isPokemonMenuOpen) {
            console.log('Pokemon menu is open');
            if (this.input.ArrowUp) {
                this.pokemonMenu.up();
                this.input.ArrowUp = false;
            } else if (this.input.ArrowDown) {
                this.pokemonMenu.down();
                this.input.ArrowDown = false;
            } else if (this.input.ArrowLeft) {
                this.pokemonMenu.left();
                this.input.ArrowLeft = false;
            } else if (this.input.ArrowRight) {
                this.pokemonMenu.right();
                this.input.ArrowRight = false;
            }
        } else if (this.menuManager.isMenuOpen()) {
            console.log('Menu is open');
            this.menuManager.handleInput(this.input);
        } else if (this.dialogueManager.isActive()) {
            console.log('Dialogue is active');
            this.dialogueManager.update(currentTime);
            if (this.input.Space) {
                this.dialogueManager.progress();
                this.input.Space = false;
            }
        } else {
            console.log('Updating player');
            this.player.update(deltaTime, this.input, this.map, this.professorOak);
            this.updateCamera();
            this.resetSteppedTiles();

            if (this.input.Space && this.player.checkNearbyNPC(this.professorOak)) {
                console.log('Starting dialogue with Professor Oak');
                this.dialogueManager.startDialogue('professorOak');
                this.input.Space = false;
            }
        }
        
        // Reset the Enter key input after processing
        this.input.Enter = false;
    }

    resetSteppedTiles() {
        console.log('Resetting stepped tiles');
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
        console.log('Rendering game');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.isPokemonMenuOpen) {
            console.log('Rendering Pokemon menu');
            this.pokemonMenu.render(ctx);
        } else {
            let tilesRendered = 0;
            this.map.forEach(tile => {
                if (tile.x + tile.width > this.camera.x && tile.x < this.camera.x + this.camera.width &&
                    tile.y + tile.height > this.camera.y && tile.y < this.camera.y + this.camera.height) {
                    tile.render(this.camera.x, this.camera.y);
                    tilesRendered++;
                }
            });
            console.log(`Rendered ${tilesRendered} tiles`);

            if (this.professorOak) {
                console.log('Rendering Professor Oak');
                const screenX = this.professorOak.x - this.camera.x;
                const screenY = this.professorOak.y - this.camera.y;
                if (screenX + this.professorOak.width > 0 && screenX < canvas.width &&
                    screenY + this.professorOak.height > 0 && screenY < canvas.height) {
                    ctx.drawImage(this.professorOak.image, screenX, screenY, this.professorOak.width, this.professorOak.height);
                }
            }

            console.log('Rendering player');
            this.player.render(this.camera.x, this.camera.y);

            if (this.dialogueManager && this.dialogueManager.isActive()) {
                console.log('Rendering dialogue');
                this.dialogueManager.render(ctx);
            }

            if (this.menuManager && this.menuManager.isMenuOpen()) {
                console.log('Rendering menu');
                this.menuManager.render(ctx);
            }
        }
    }

    start() {
        console.log('Starting game');
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }
}

const game = new Game();
console.log('Game instance created');
// game.start() is now called after the map is loaded
// DialogueManager class has been moved to dialogue_manager.js
