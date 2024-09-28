class DialogueManager {
    constructor(dialogues, game) {
        this.dialogues = dialogues;
        this.game = game;
        this.currentDialogue = null;
        this.currentIndex = 0;
        this.text = '';
        this.displayedText = '';
        this.isTyping = false;
        this.typingSpeed = 50; // milliseconds per character
        this.lastTypingTime = 0;
        this.isFirstInteraction = true;
        this.isChoosingStarter = false;
        this.starterOptions = [];
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
        if (this.currentDialogue && this.currentDialogue[this.currentIndex]) {
            ctx.fillText(this.currentDialogue[this.currentIndex].speaker + ':', 70, canvas.height - 120);
            this.wrapText(ctx, this.displayedText, 70, canvas.height - 90, canvas.width - 140, 25);
        } else {
            ctx.fillText('No active dialogue', 70, canvas.height - 120);
        }

        // Render starter selection UI if choosing
        if (this.isChoosingStarter) {
            this.renderStarterSelection(ctx);
        }
    }

    renderStarterSelection(ctx) {
        const boxWidth = 300;
        const boxHeight = 100;
        const boxX = (canvas.width - boxWidth) / 2;
        const boxY = canvas.height - 250;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        this.starterOptions.forEach((pokemon, index) => {
            ctx.fillText(`${index + 1}. ${pokemon.name}`, boxX + 20, boxY + 30 + index * 30);
        });
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
        } else if (this.isChoosingStarter) {
            // Do nothing, wait for player to choose
            return;
        } else {
            // Move to next dialogue
            this.currentIndex++;
            if (this.currentIndex < this.currentDialogue.length) {
                this.setText(this.currentDialogue[this.currentIndex].text);
                if (this.text === "What starter would you like?") {
                    this.prepareStarterSelection();
                }
            } else {
                if (this.isFirstInteraction && this.game.playerPokemon.length === 0) {
                    this.prepareStarterSelection();
                } else {
                    this.currentDialogue = null;
                    this.isFirstInteraction = false;
                }
            }
        }
    }

    prepareStarterSelection() {
        this.isChoosingStarter = true;
        this.starterOptions = this.game.allPokemon.slice(0, 3);
        this.setText("What starter would you like?\n1. Bulbasaur\n2. Charmander\n3. Squirtle");
        this.currentDialogue = [{ speaker: "Professor Oak", text: this.text }];
        this.currentIndex = 0;
    }

    chooseStarter(choice) {
        if (choice >= 1 && choice <= 3) {
            const chosenPokemon = this.starterOptions[choice - 1];
            this.game.playerPokemon.push(chosenPokemon);
            this.setText(`Congratulations! You received ${chosenPokemon.name} as your first Pokémon!`);
            this.isChoosingStarter = false;
            this.currentDialogue = [{ speaker: "Professor Oak", text: this.text }];
            this.currentIndex = 0;
            this.isFirstInteraction = false;
        }
    }

    isActive() {
        return (this.currentDialogue !== null && this.currentIndex < this.currentDialogue.length) || this.isChoosingStarter;
    }
}
