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
