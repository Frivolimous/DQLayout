let view;
let layout;


function initGame() {
  view = new DQView(appRect.width, appRect.height);
  app.stage.addChild(view);

  layout = new LayoutManager();
  layout.onValueChange.push(view.onLayoutValueChange); 
  layout.onValueChange.push(view.onLayoutValueChange); 

  layout.loadFromLocal();

  resizeCallbacks.push(view.onResize);

  window.addEventListener('keydown', onKeyDown);

  window.setInterval(saveToLocalStorage, 1000 * 60 * 5);
}

function onKeyDown(e) {
  switch(e.key){ 
    case 'ArrowLeft': view.floorButtonDisplay.nextFloor(-1); break;
    case 'ArrowRight': view.floorButtonDisplay.nextFloor(1); break;
    case 'ArrowUp': e.shiftKey ? view.legendDisplay.updateButton(Math.max(view.legendDisplay.currentButton - 1, 0)) : view.legendDisplay.nextPage(-1); break;
    case 'ArrowDown': e.shiftKey ? view.legendDisplay.updateButton(Math.min(view.legendDisplay.currentButton + 1, view.legendDisplay.buttonList.length - 1)) : view.legendDisplay.nextPage(1); break;
    // case 'ArrowDown': e.shiftKey ? view.legendDisplay.updateSelection(Math.min(view.legendDisplay.currentSelection + 1, Object.keys(layout.currentLayout.legend).length - 1)) : view.legendDisplay.nextPage(1); break;
    case 'S': saveToLocalStorage(); break;
    case 'L': view.legendDisplay.legendMode = (view.legendDisplay.legendMode + 1) % 3;
      view.legendDisplay.loadLegend(layout.currentLayout.legend); break;
    case 'B': view.legendDisplay.countMode = (view.legendDisplay.countMode + 1) % 3;
      view.legendDisplay.loadLegend(layout.currentLayout.legend); break;
  }
}

class DQView extends PIXI.Container{
  back = new PIXI.Graphics();
  header = new PIXI.Graphics();
  // footer;
  sidebar = new PIXI.Graphics();
  grid;
  counter;
  autoGraphic;
  legendDisplay;
  floorButtonDisplay;
  helpButton;
  helpPanel;

  constructor(width, height) {
    super();

    // this.back = new PIXI.Graphics();
    this.back.beginFill(CONFIG.backgroundColor).drawRect(0, 0, width, height);
    this.back.eventMode = 'static';
  
    // this.header = new PIXI.Graphics();
    this.header.beginFill(CONFIG.headerColor).lineStyle(1).drawRect(0, 0, width, 100);
  
    // this.footer = new PIXI.Graphics();
    // this.footer.beginFill(CONFIG.headerColor).lineStyle(1).drawRect(0, 0, width, 100);
    // this.footer.y = height - 100;
  
    // this.sidebar = new PIXI.Graphics();
    this.sidebar.beginFill(CONFIG.sideColor).lineStyle(1).drawRect(0, 0, 200, height-100);
    this.sidebar.x = width - 200;
    this.sidebar.y = 100;
  
    this.grid = new DQGrid(9, 9, 50, 50);
    this.grid.position.set((width - 200 - 450) / 2, (height - 450) / 2);
    this.back.addChild(this.grid);
    this.grid.setListeners(this.grid);
  
    this.counter = new DQTextbox('0', 100, 30);
    this.back.addChild(this.counter);
    this.counter.position.set(0, 100);
  
    this.autoGraphic = new DQButton("Saved!", 100, 50, 'center', 0x00ffff);
    this.header.addChild(this.autoGraphic);
    this.autoGraphic.x = width - 102;
    this.autoGraphic.y = 2;
    this.autoGraphic.visible = false;
  
    this.legendDisplay = new DQLegend(200, height - 100);
    this.sidebar.addChild(this.legendDisplay);
  
    this.floorButtonDisplay = new DQFloorButtons();
    this.header.addChild(this.floorButtonDisplay);

    this.helpButton = new DQButton("?", 30, 30, 'center', 0xffcc99);
    this.helpButton.position.set(100, 100);
    this.helpButton.addEventListener('click', () => this.helpPanel.visible = !this.helpPanel.visible);
    this.back.addChild(this.helpButton);

    this.helpPanel = new DQHelpPanel(GameStrings.helpTitle, GameStrings.helpContents);
    this.helpPanel.position.set(this.grid.x - 100, this.grid.y - 100);
    this.back.addChild(this.helpPanel);
    this.helpPanel.visible = false;
  
    this.addChild(this.back, this.header, this.sidebar);
  }

  onLayoutValueChange = (data) => {
    if (data.refresh) {
      this.floorButtonDisplay.update(data.currentLayout.floors.length);
      this.floorButtonDisplay.changeFloor(0);
      this.legendDisplay.loadLegend(data.currentLayout.legend);
    } else {
      this.grid.list[data.x][data.y].updateReward(data.value, data.currentLayout.legend[data.value], !data.isRequired);
      this.legendDisplay.updateCount();
      this.updateCounter();
    }
  }

  updateCounter() {
    this.counter.label.text = layout.getTileCount(this.floorButtonDisplay.currentFloor);
  }

  onResize() {

  }
}

class DQLegend extends PIXI.Container{
  pageSize;
  currentPage = -1;
  numPages;
  _Width;
  _Height;
  currentSelection = 0;
  currentButton = 0;
  buttonList = [];
  countList = [];
  legend = [];
  legendMode = 1; // 0 = ALL, 1 = FLOOR BUDGET, 2 = CURRENT FLOOR
  countMode = 1 // 0 = FLOOR AMOUNT, 1 = SMART BUDGET, 2 = TOTAL

  constructor(width, height){
    super();

    this._Width = width;
    this._Height = height;
    this.pageSize = Math.floor((this._Height -10 - 50) / (20 + 4));
  }

  loadLegend(legend) {
    if (this.legendMode === 1) {
      this.legend = layout.getFloorBudgetLegend(view.floorButtonDisplay.currentFloor);
    } else if (this.legendMode === 2) {
      this.legend = layout.getFloorCurrentLegend(view.floorButtonDisplay.currentFloor);
    } else if (this.legendMode === 0) {
      this.legend = legend;
    }

    this.updateLegend(0);
    this.updateSelection(this.currentSelection);
  }

  updateLegend(page){
    this.clearLegend();

    let keys = Object.keys(this.legend);
    this.currentPage = page;

    let buttonWidth = 160;

    for (let i = page * this.pageSize; (i < Math.min(keys.length, (page + 1) * this.pageSize)); i++) {
      if (i > (page + 1) * this.pageSize) {
        
        return;
      }
      let rewardColor = getColorForReward(this.legend[keys[i]])[1];
      let rewardText = this.legend[keys[i]];
      
      rewardText = rewardText.replace('Reward:','');
      rewardText = rewardText.replace('Datetime:','');
      rewardText = rewardText.replace('T00:00Z','');
      
      let maxChars = 25;
      if (rewardText.length > maxChars) {
        rewardText = "|"+rewardText.substring(rewardText.length - maxChars, rewardText.length);
      }

      let count = new DQTextbox('0', 25, 20);
      this.countList.push(count);
      count.position.set(10 + buttonWidth, 10 + (i - page * this.pageSize) * (20 + 4));
      this.addChild(count);
      
      let button = new DQButton(`${keys[i]} - ${rewardText}`,buttonWidth, 20, 'left', rewardColor);
      this.buttonList.push(button);
      button.legendIndex = Number(keys[i]);
      button.position.set(10, 10 + (i - page * this.pageSize) * (20 + 4));
      this.addChild(button);
  
      button.addEventListener('click', () => {
        this.updateSelection(button.legendIndex);
      });
    }
  
    this.updateSelection(this.currentSelection);
    this.updateCount();
  }

  nextPage(delta = 1) {
    this.buttonList.forEach(el => el.destroy());
    this.buttonList = [];
  
    let length = Object.keys(this.legend).length;
    let numPages = Math.ceil(length / this.pageSize) - 1;
  
    this.updateLegend(Math.min(Math.max(this.currentPage + delta, 0), numPages));
  }

  updateSelection(i) {
    this.currentSelection = i;
    this.currentButton = this.buttonList.findIndex(el => el.legendIndex === i);
    this.buttonList.forEach((button) => button.selectMe(button.legendIndex === i));
  }

  updateButton(i) {
    this.currentButton = i;
    this.currentSelection = this.buttonList[i].legendIndex;
    this.buttonList.forEach((button, j) => button.selectMe(j === i));
  }

  updateCount() {
    let flatMap = layout.getFloorResources(view.floorButtonDisplay.currentFloor);

    if (this.countMode === 1) {
      let cumBudget = layout.getCumBudget(0, view.floorButtonDisplay.currentFloor);

      this.buttonList.forEach((b, i) => {
        this.countList[i].label.text = (cumBudget[this.legend[b.legendIndex]] || 0);
      });
    } else if (this.countMode === 0) {
      this.buttonList.forEach((b, i) => {
        this.countList[i].label.text = flatMap[b.legendIndex] || 0;
      });
    } else if (this.countMode === 2) {
      let resources = layout.getTotalResources(0, view.floorButtonDisplay.currentFloor);
      this.buttonList.forEach((b, i) => {
        this.countList[i].label.text = (resources[this.legend[b.legendIndex]] || 0);
      });
    }
  }

  clearLegend() {
    this.buttonList.forEach(el => el.destroy());
    this.buttonList = [];
    this.countList.forEach(el => el.destroy());
    this.countList = [];
    this.currentPage = -1;
  }
}

class DQFloorButtons extends PIXI.Container{
  _Width;
  _Height;
  buttons = [];
  currentFloor = -1;

  constructor(width, height){
    super();
    this._Width = width;
    this._Height = height;
  }

  update(numFloors) {
    this.clear();
    for (let i = 0; i < numFloors; i++) {
      let button = new DQButton(i, 30, 30);
      this.buttons.push(button);
      button.floorIndex = i;
  
      let across = Math.ceil(numFloors / 2);
  
      button.position.set(20 + (i % across) * (30 + 4), 20 + Math.floor(i / across) * (30 + 4));
      this.addChild(button);
  
      button.addEventListener('click', () => {
        this.changeFloor(button.floorIndex);
      });
    }
  }

  clear() { 
    this.buttons.forEach(el => el.destroy());
    this.buttons = [];
  }

  changeFloor(i) {
    this.currentFloor = i;
    this.buttons.forEach((button, index) => button.selectMe(index === i));

    view.grid.loadFloor(layout.currentLayout.floors[i], layout.currentLayout.legend, layout.currentLayout.required_for_completion[i]);
    view.legendDisplay.loadLegend(layout.currentLayout.legend);
    view.updateCounter();
  }

  nextFloor(delta = 1) {
    this.changeFloor(Math.min(Math.max(this.currentFloor + delta, 0), this.buttons.length - 1));
  }
}
