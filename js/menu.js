class MenuItem {
    constructor(label, action) {
        this.label = label;
        this.action = action;
    }
}

class Menu {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.selectedIndex = 0;
    }

    addItem(label, action) {
        this.items.push(new MenuItem(label, action));
    }

    up() {
        this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    }

    down() {
        this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    }

    select() {
        if (this.items[this.selectedIndex]) {
            this.items[this.selectedIndex].action();
        }
    }

    render(ctx) {
        const menuWidth = 200;
        const menuHeight = this.items.length * 40 + 20;
        const menuX = (ctx.canvas.width - menuWidth) / 2;
        const menuY = (ctx.canvas.height - menuHeight) / 2;

        // Draw menu background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Draw menu items
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        this.items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                ctx.fillStyle = '#ffff00';
            } else {
                ctx.fillStyle = '#ffffff';
            }
            ctx.fillText(item.label, menuX + 20, menuY + 30 + index * 40);
        });
    }
}

class MenuManager {
    constructor(game) {
        this.game = game;
        this.currentMenu = null;
    }

    openMenu(menu) {
        this.currentMenu = menu;
    }

    closeMenu() {
        this.currentMenu = null;
    }

    handleInput(input) {
        if (this.currentMenu) {
            if (input.ArrowUp) {
                this.currentMenu.up();
            } else if (input.ArrowDown) {
                this.currentMenu.down();
            }
            // Remove the Enter key handling from here
        }
    }

    selectCurrentItem() {
        if (this.currentMenu) {
            this.currentMenu.select();
        }
    }

    update() {
        // Add any menu-specific update logic here
    }

    render(ctx) {
        if (this.currentMenu) {
            this.currentMenu.render(ctx);
        }
    }

    isMenuOpen() {
        return this.currentMenu !== null;
    }
}
