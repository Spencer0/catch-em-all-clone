// Global constants
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to show 16x16 tiles
const TILE_SIZE = 48;
const VISIBLE_TILES = 16;
canvas.width = TILE_SIZE * VISIBLE_TILES;
canvas.height = TILE_SIZE * VISIBLE_TILES;

// Set the game world size
const WORLD_WIDTH = 32 * TILE_SIZE;
const WORLD_HEIGHT = 32 * TILE_SIZE;

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
        this.allPokemon = [];
        this.playerPokemon = [];
        this.store = null;
        this.isInStore = false;

        window.addEventListener('keydown', (e) => {
            this.input[e.code] = true;
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

        this.setupMainMenu();
        this.loadGame();
    }

    async loadGame() {
        try {
            await Promise.all([
                this.loadMap(),
                this.loadDialogues(),
                this.loadPokemonData(),
                this.loadImages()
            ]);
            this.start();
        } catch (error) {
            console.error('Error loading game:', error);
        }
    }

    loadImages() {
        const images = document.querySelectorAll('img');
        const imagePromises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
        });
        return Promise.all(imagePromises);
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
        return fetch('js/dialogues.json')
            .then(response => response.json())
            .then(data => {
                this.dialogues = data;
                this.dialogueManager = new DialogueManager(this.dialogues, this);
            });
    }

    loadPokemonData() {
        return fetch('js/pokemon_data.json')
            .then(response => response.json())
            .then(data => {
                this.allPokemon = data.pokemon;
                console.log('Pokemon data loaded:', this.allPokemon);
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
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Map data loaded:', data);
                this.createMap(data);
                console.log('Map created');
                this.start(); // Start the game loop after map is loaded
            })
            .catch(error => {
                console.error('Error loading map:', error);
            });
    }

    createMap(mapData) {
        this.map = [];
        if (!mapData || !mapData.tiles || !Array.isArray(mapData.tiles)) {
            console.error('Invalid map data:', mapData);
            return;
        }
        for (let y = 0; y < mapData.height; y++) {
            const row = mapData.tiles[y];
            if (!row || !Array.isArray(row)) {
                console.error(`Invalid row at index ${y}:`, row);
                continue;
            }
            for (let x = 0; x < mapData.width; x++) {
                if (x >= row.length) {
                    console.error(`Row ${y} is shorter than expected width ${mapData.width}`);
                    break;
                }
                let tileType;
                switch (row[x]) {
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
                    case 't':
                        tileType = 'store';
                        // Skip the next 3 tiles to the right and 3 tiles down
                        for (let i = 0; i < 4; i++) {
                            for (let j = 0; j < 4; j++) {
                                if (i === 0 && j === 0) continue; // Skip the current tile
                                if (y + j < mapData.height && x + i < mapData.width) {
                                    mapData.tiles[y + j][x + i] = 'x'; // Mark as occupied
                                }
                            }
                        }
                        break;
                    case 'x':
                        continue; // Skip occupied tiles
                    default: tileType = 'grass';
                }
                let tile = new Tile(x * TILE_SIZE, y * TILE_SIZE, tileType);
                this.map.push(tile);
            }
        }

        console.log(`Map created with ${this.map.length} tiles`);

        // Create the player at the spawn point
        if (this.spawnPoint) {
            this.player = new Player(this.spawnPoint.x, this.spawnPoint.y, CollisionManager);
            console.log('Player created at', this.spawnPoint);
        } else {
            console.error('No spawn point found in the map');
        }
    }

    loop(currentTime) {
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
        if (this.isPokemonMenuOpen) {
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
            this.menuManager.handleInput(this.input);
        } else if (this.dialogueManager.isActive()) {
            this.dialogueManager.update(currentTime);
            if (this.input.Space) {
                this.dialogueManager.progress();
                this.input.Space = false;
            }
            if (this.dialogueManager.isChoosingStarter) {
                if (this.input.Digit1) {
                    this.dialogueManager.chooseStarter(1);
                    this.input.Digit1 = false;
                } else if (this.input.Digit2) {
                    this.dialogueManager.chooseStarter(2);
                    this.input.Digit2 = false;
                } else if (this.input.Digit3) {
                    this.dialogueManager.chooseStarter(3);
                    this.input.Digit3 = false;
                }
            }
        } else {
            this.player.update(deltaTime, this.input, this.isInStore && this.store ? this.store.map : this.map, this.professorOak);
            
            if (!this.isInStore) {
                this.updateCamera();
                this.resetSteppedTiles();

                if (this.input.Space && this.player.checkNearbyNPC(this.professorOak)) {
                    this.dialogueManager.startDialogue('professorOak');
                    this.input.Space = false;
                }

                // Check if player is in the center of the store tile
                const storeTile = this.map.find(tile => tile.type === 'store');
                if (storeTile) {
                    const storeCenterX = storeTile.x + storeTile.width / 2;
                    const storeCenterY = storeTile.y + storeTile.height / 2;
                    if (Math.abs(this.player.x + this.player.width / 2 - storeCenterX) < 5 &&
                        Math.abs(this.player.y + this.player.height / 2 - storeCenterY) < 5) {
                        this.enterStore();
                    }
                }
            } else if (this.store) {
                this.store.update(deltaTime);
                if (this.store.isPlayerAtExit(this.player)) {
                    this.exitStore();
                }
            }
        }
        
        // Reset the Enter key input after processing
        this.input.Enter = false;
    }

    exitStore() {
        this.isInStore = false;
        const storeTile = this.map.find(tile => tile.type === 'store');
        if (storeTile) {
            this.player.x = storeTile.x + storeTile.width / 2 - this.player.width / 2;
            this.player.y = storeTile.y + storeTile.height;
        }
        console.log('Exited store');  // Add this line for debugging
    }

    enterStore() {
        this.isInStore = true;
        if (!this.store) {
            this.store = new Store(this);
        }
        this.player.x = this.store.offsetX + (this.store.width / 2) * TILE_SIZE;
        this.player.y = this.store.offsetY + (this.store.height - 1) * TILE_SIZE;
    }

    exitStore() {
        this.isInStore = false;
        const storeTile = this.map.find(tile => tile.type === 'store');
        if (storeTile) {
            this.player.x = storeTile.x + storeTile.width / 2 - this.player.width / 2;
            this.player.y = storeTile.y + storeTile.height;
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

        if (this.isPokemonMenuOpen) {
            this.pokemonMenu.render(ctx);
        } else if (this.isInStore) {
            this.store.render(ctx);
            this.player.render(0, 0);
        } else {
            let tilesRendered = 0;
            this.map.forEach(tile => {
                if (tile.x + tile.width > this.camera.x && tile.x < this.camera.x + this.camera.width &&
                    tile.y + tile.height > this.camera.y && tile.y < this.camera.y + this.camera.height) {
                    tile.render(this.camera.x, this.camera.y);
                    tilesRendered++;
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
        }

        if (this.dialogueManager && this.dialogueManager.isActive()) {
            this.dialogueManager.render(ctx);
        }

        if (this.menuManager && this.menuManager.isMenuOpen()) {
            this.menuManager.render(ctx);
        }
    }

    start() {
        console.log('Starting game');
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }
}

const game = new Game();
