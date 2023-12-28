class DQGrid extends PIXI.Container {
    list = [];
    _Width;
    _Height;
    getValueFunction = (floor, x, y) => 0;
    setValueFunction = value => null;
    isDown = false;

    constructor(across, down, width, height) {
        super();
        this._Width = width;
        this._Height = height;
        this.eventMode = 'static';
        this.cursor = 'pointer';

        for (let x = 0; x < across; x++) {
            let row = [];
            this.list.push(row);
            for (let y = 0; y < down; y++) {
                let tile = new DQTile(width, height);
                tile.position.set(x * width, y * height);

                this.addChild(tile);
                row.push(tile);
            }
        }
    }

    setListeners() {
        this.addEventListener('pointerdown', this.onDown);
        this.addEventListener('pointerup', this.onUp);
        this.addEventListener('pointerupoutside', this.onUp);
        this.addEventListener('pointermove', this.onMove);
    }

    onDown = e => {
        if (e.shiftKey) {
            let position = e.data.getLocalPosition(this);
            let tilePosition = this.globalToLocal(position);
            let value = layout.getTileValue(view.floorButtonDisplay.currentFloor, tilePosition.x, tilePosition.y);
            view.legendDisplay.updateSelection(value);
        }else if (e.altKey) {
            let position = e.data.getLocalPosition(this);
            let tilePosition = this.globalToLocal(position);
            layout.toggleRequiredValue(view.floorButtonDisplay.currentFloor, tilePosition.x, tilePosition.y);
        } else {
            this.isDown = true;
            this.onMove(e);
        }
    }

    onUp = e => {
        this.isDown = false;
    }

    onMove = e => {
        if (this.isDown) {
            if (view.legendDisplay.currentSelection || view.legendDisplay.currentSelection === 0) {
                let position = e.data.getLocalPosition(this);
                let tilePosition = this.globalToLocal(position);
                layout.setTileValue(view.legendDisplay.currentSelection, view.floorButtonDisplay.currentFloor, tilePosition.x, tilePosition.y);
            }
        }
    }

    globalToLocal(position) {
        let x = Math.floor(position.x / this._Width);
        let y = Math.floor(position.y / this._Height);
        return {x, y};
    }

    loadFloor(layoutFloor, legend, required_for_completion) {
        let across = 9;
        let down = 9;
        for (let x = 0; x < across; x++) {
            for (let y = 0; y < down; y++) {
                if (x < 0 || y < 0 || x >= across || y >= down) {
                    this.list[x][y].updateReward(0, legend[0], !required_for_completion[y][x]);
                } else {
                    let rewardIndex = layoutFloor.layout[y][x];
                    this.list[x][y].updateReward(rewardIndex, legend[rewardIndex], !required_for_completion[y][x]);
                }
            }
        }
    }
}

class DQTile extends PIXI.Graphics{
    border = new PIXI.Graphics();
    label;
    isTile = true;
    over;

    constructor(width, height) {
        super();
        this.label = new PIXI.Text("0", {fontSize: width / 3, fill: 0xffffff});

        this.label.anchor.set(0.5);
        this.label.position.set(width / 2, height / 2);

        this.eventMode = 'auto';
        this.beginFill(0xffffff);
        this.drawRect(0, 0, width, height);

        this.border.lineStyle(1,0xffffff,1,0);
        this.border.drawRect(0, 0, width, height);

        this.over = new DQTileOver(width, height);
        this.over.tint = 0xff0000;
        this.over.visible = false;

        this.addChild(this.over, this.label, this.border);
    }

    updateReward(index, rewardString, showOverlay) {
        if (index !== undefined) {
            this.label.text = String(index);
            let colors = getColorForReward(rewardString);
            this.tint = colors[1];
            this.border.tint = colors[2]
            if (getLuminance(colors[1]) > 40) {
                this.label.tint = 0;
            } else {
                this.label.tint = 0xffffff;
            }

            if (rewardString === "Door.Secret") {
                this.over.tint = 0xff0000;
            } else {
                this.over.tint = 0x990000;
            }
        }

        this.over.visible = showOverlay;
    }

    showOver(b = true) {
        this.over.visible = b;
    }
}

class DQTileOver extends PIXI.Graphics{
    constructor(width, height) {
        super();
        this.lineStyle(2, 0xffffff);
        this.moveTo(0, 0).lineTo(width, height).moveTo(width, 0).lineTo(0, height);
    }
}

class DQButton extends PIXI.Graphics{
    border = new PIXI.Graphics();
    label;

    constructor(text, width, height, align = 'center', tint = 0xcccccc) {
        super();
        let fontFill = getLuminance(tint) > 40 ? 0x000000 : 0xffffff;

        this.label = new PIXI.Text(text, {fontSize: height * 3 / 4, fill: fontFill});

        this.label.anchor.set(align === 'center' ? 0.5 : align === 'left' ? 0 : 1, 0.5);
        if (this.label.width > width - 10) {
            this.label.width = width - 10;
            this.label.scale.y = this.label.scale.x;
        }
        this.label.position.set(align === 'center' ? width / 2 : align === 'left' ? 5 : width, height / 2);
        // label.

        this.beginFill(0xffffff);
        this.lineStyle(2);
        this.drawRoundedRect(0, 0, width, height, height / 8);
        this.tint = tint;

        this.border.lineStyle(4, 0xffff00);
        this.border.drawRoundedRect(0, 0, width, height, height / 8);
        this.border.visible = false;

        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.addChild(this.label, this.border);
    }

    selectMe(b) {
        this.border.visible = b;
        if (b) {
            // this.tint = 0xffff00;
            this.eventMode = 'none';
        } else {
            // this.tint = tint;
            this.eventMode = 'static';
        }
    }
}

class DQTextbox extends PIXI.Graphics{
    label;
    constructor(text, width, height, align = 'center') {
        super();

        this.label = new PIXI.Text(text, {fontSize: height * 3 / 4});

        this.label.anchor.set(align === 'center' ? 0.5 : align === 'left' ? 0 : 1, 0.5);
        if (this.label.width > width - 10) {
            this.label.width = width - 10;
            this.label.scale.y = this.label.scale.x;
        }
        this.label.position.set(align === 'center' ? width / 2 : align === 'left' ? 5 : width, height / 2);
    
        this.lineStyle(2);
        this.beginFill(0xffffff);
        this.drawRoundedRect(0, 0, width, height, height / 8);
    
        this.addChild(this.label);
    }
}


class DQHelpPanel extends PIXI.Graphics{
    constructor(helpTitle, helpContents) {
        super();
        this.beginFill(0xdddddd);
        this.lineStyle(1);
        this.drawRoundedRect(0, 0, 650, 650, 10);

        let closeButton = new DQButton('X', 50, 50, 'center', 0x990000);
        closeButton.position.set(650 - 40, -10);
        closeButton.addEventListener('click', () => this.visible = false);

        let title = new PIXI.Text(helpTitle, {fontSize: 30, fontWeight: 'bold'});
        let content = new PIXI.Text(helpContents, {fontSize: 20, wordWrap: true, wordWrapWidth: 620});
        title.resolution = 2;        
        content.resolution = 2;
        title.position.set((650 - title.width) / 2, 10);
        content.position.set(10, title.position.y + title.height + 5);

        this.addChild(title, content, closeButton);
    }
}
