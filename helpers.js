const colorRewardStrings = [
    ["None", 0, 0x444444],
    ["Empty", 0xffffff, 0],
    ["HolidayCurrency", 0xdddddd, 0],
    ["Start", 0x667700, 0xffff00],
    ["LadderUp", 0x667700, 0xffff00],
    ["Ladder.Datetime", 0x337733, 0x00ff00],
    ["Ladder", 0x337733, 0x00ff00],
    ["Door.Common", 0x996633, 0xffcc00],
    ["Door.Datetime", 0x775533, 0xffcc00],
    ["Door.Secret", 0x553322, 0xffcc00],
    ["Door.Silver", 0x333399, 0x00ffff],
    ["Door.Gold", 0x553388, 0xff00ff],
    ["Door.Special", 0x772277, 0xff00ff],
    ["Key.Silver", 0x9999ff, 0x00ffff],
    ["Key.Gold", 0xbb99ff, 0xff00ff],
    ["Key.Special", 0xaa99ff, 0xff00ff],

    ["Equipment:Common", 0xffdddd, 0],
    ["Equipment:Rare", 0xffdddd, 0],
    ["Perk", 0xffdddd, 0],
    ["SkillResetToken", 0xffdddd, 0],

    ["RaidCardCurrency", 0xee99ee, 0],
    ["RaidWildcard", 0xee99ee, 0],
    ["Pet", 0xdddd88, 0],
    ["Diamonds", 0x99eeee, 0],
    ["EquipmentShards", 0xdddd88, 0],
    ["Avatar", 0x44ff44, 0],
    ["Frame", 0x44ff44, 0],
    ["Equipment:Legendary", 0xffff44, 0],
    ["Equipment", 0x44ff44, 0],
    ["SkillPoint", 0xffff44, 0],
    ["Fortune", 0xffff44, 0],
];

const CONFIG = {
    backgroundColor: 0x002266,
    headerColor: 0x008800,
    sideColor: 0x662200,
}

function getColorForReward(reward) {
    for(el of colorRewardStrings) {
        if (reward.includes(el[0])) {
            return el;
        }
    }

    return colorRewardStrings[0];
}

function saveToLocalStorage() {
    layout.saveToLocal();
    view.autoGraphic.visible = true;
    new JMTween(view.autoGraphic, 2000).to({alpha: 0}).start().onComplete(() => {view.autoGraphic.visible = false, view.autoGraphic.alpha = 1});
}

const GameStrings = {
    helpTitle: 'Editor Commands',
    helpContents: `Click / Drag - Draw with current selection
    SHIFT + Click - Select Tile for drawing
    ALT + Click (Option + Click) - Toggle "Required"
    
    < / > - Next / Prev Floor
    ^ / v - Next / Prev Legend Page
    SHIFT + ^ / v - Next / Prev Legend Item
    SHIFT + S - save to local storage (otherwise autosaves every 5 minutes)
    SHIFT + L - change legend mode (view all items / view current floor budget / view current floor contents)
    SHIFT + B - change legend count mode (current floor amount / cumulative budget remaining / cumulative total amount)
    
    CONSOLE:
    layout.loadLayout(json) - loads a JSON layout exported from here or from the admin panel
    layout.TSVToBudget(tsv) - loads a budget for the entire layout from a TSV generated through Google Sheets
    
    layout.export() - exports a JSON for use in the admin panel or for sharing
    layout.exportLegendTSV - exports the current legend`,
}