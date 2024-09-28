class PokemonMenu {
    constructor(game) {
        this.game = game;
        this.selectedIndex = 0;
        this.exitButtonIndex = 6; // Index for the exit button
    }

    getPlayerPokemon() {
        return this.game.playerPokemon;
    }

    up() {
        this.selectedIndex = (this.selectedIndex - 3 + 7) % 7;
    }

    down() {
        this.selectedIndex = (this.selectedIndex + 3) % 7;
    }

    left() {
        if (this.selectedIndex % 3 > 0) {
            this.selectedIndex--;
        }
    }

    right() {
        if (this.selectedIndex % 3 < 2 && this.selectedIndex < 6) {
            this.selectedIndex++;
        }
    }

    select() {
        if (this.selectedIndex === this.exitButtonIndex) {
            this.game.closePokemonMenu();
        } else {
            console.log(`Selected Pokemon in slot ${this.selectedIndex + 1}`);
            // Add Pokemon selection logic here
        }
    }

    render(ctx) {
        // Draw background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const playerPokemon = this.getPlayerPokemon();

        // Draw Pokemon boxes
        for (let i = 0; i < 6; i++) {
            const x = 50 + (i % 3) * 220;
            const y = 50 + Math.floor(i / 3) * 220;
            ctx.fillStyle = this.selectedIndex === i ? '#ffff00' : '#ffffff';
            ctx.fillRect(x, y, 200, 200);
            ctx.strokeRect(x, y, 200, 200);
            
            if (i < playerPokemon.length) {
                const pokemon = playerPokemon[i];
                ctx.fillStyle = '#000000';
                ctx.font = '20px Arial';
                ctx.fillText(pokemon.name, x + 50, y + 50);
                ctx.fillText(`Type: ${pokemon.type}`, x + 50, y + 80);
                
                // Load and draw Pokemon sprite
                const sprite = new Image();
                sprite.src = pokemon.sprite;
                sprite.onload = () => {
                    ctx.drawImage(sprite, x + 50, y + 100, 100, 100);
                };
            } else {
                ctx.fillStyle = '#000000';
                ctx.font = '20px Arial';
                ctx.fillText('Empty', x + 75, y + 100);
            }
        }

        // Draw exit button
        const exitX = canvas.width / 2 - 100;
        const exitY = canvas.height - 80;
        ctx.fillStyle = this.selectedIndex === this.exitButtonIndex ? '#ffff00' : '#ffffff';
        ctx.fillRect(exitX, exitY, 200, 60);
        ctx.strokeRect(exitX, exitY, 200, 60);
        ctx.fillStyle = '#000000';
        ctx.font = '24px Arial';
        ctx.fillText('Exit', exitX + 80, exitY + 38);
    }
}
