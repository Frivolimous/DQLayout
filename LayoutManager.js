class LayoutManager {
  currentLayout;
  currentBudget;
  onValueChange = [];

  loadLayout(json) {
    this.clear();
  
    this.currentLayout = this.uncompressDungeon(JSON.parse(json));
    // this.currentLayout = JSON.parse(json);
    console.log(this.currentLayout);
  
    this.onValueChange.forEach(callback => callback({refresh: true, currentLayout: this.currentLayout }));
  }

  loadBudget(tsv) {
    this.currentBudget = this.TSVToBudget(tsv);
  }
  
  clear() {
    this.currentLayout = null;
  }
  
  export(compress = true) {
    if (compress) {
      console.log(JSON.stringify(this.compressDungeon(this.currentLayout)));
    } else {
      console.log(JSON.stringify(this.currentLayout));
    }
  }

  compressDungeon(dungeon) {
    dungeon.floors.forEach((floor, i) => {
        let layout = floor.layout;
        let required = dungeon.required_for_completion[i];

        while(layout[layout.length - 1].every(tile => tile === 0)) {
            layout.pop();
            required.pop();
        }
        while(layout[0].every(tile => tile === 0)) {
            layout.shift();
            required.shift();
            floor.padding_top++;
        }
        while(layout.every(row => row[0] === 0)) {
            layout.forEach(row => row.shift());
            required.forEach(row => row.shift());
            floor.padding_left++;
        }
        while(layout.every(row => row[row.length - 1] === 0)) {
            layout.forEach(row => row.pop());
            required.forEach(row => row.pop());
        }
    });

    return dungeon;
}

  uncompressDungeon(dungeon) {
    dungeon.floors.forEach((floor, i) => {
        let layout = floor.layout;
        let required = dungeon.required_for_completion[i];

        while (floor.padding_left > 0) {
            floor.padding_left--;
            layout.forEach(row => row.unshift(0));
            required.forEach(row => row.unshift(false));
        }
        while (layout[0].length < 9) {
            layout.forEach(row => row.push(0));
            required.forEach(row => row.push(false));
        }
        while (floor.padding_top > 0) {
            floor.padding_top--;
            layout.unshift([0,0,0,0,0,0,0,0,0]);
            required.unshift([false,false,false,false,false,false,false,false,false]);
        }

        while (layout.length < 9) {
            layout.push([0,0,0,0,0,0,0,0,0]);
            required.push([false,false,false,false,false,false,false,false,false]);
        }
    });

    return dungeon;
}

  exportLegendTSV() {
    let m = ``;
    let keys = Object.keys(this.currentLayout.legend);
    keys.forEach(el => m+= this.currentLayout.legend[el] + "	");

    console.log(m);
  }

  TSVToBudget(tsv) {
    let budget;
    let rows = tsv.split('\n');
    rows = rows.map(row => row.split('\t'));
    let values = rows.shift();
    budget = rows.map(row => {
      let m = {};
      row.forEach((el, i) => {
        m[values[i]] = Number(el);
      });

      return m;
    });

    console.log(budget);
    return budget;
  }

  lockBudget() {
    let floors = this.currentLayout.floors;
    let budget = [];
    for (let i = 0; i < floors.length; i++) {
      budget.push(this.floorToBudget(i));
    }

    this.currentBudget = budget;
  }

  floorToBudget(floor) {
    let resources = {};
    let legend = this.currentLayout.legend;
    for (let key in Object.keys(legend)) {
      resources[legend[key]] = 0;
    }
    this.currentLayout.floors[floor].layout.forEach(row => {
      row.forEach(tile => {
        resources[legend[tile]]++;
      })
    });

    return resources;
  }
  
  emptyFloors() {
    this.currentLayout.floors.forEach(floor => floor.layout.forEach(row => row.forEach((tile, i) => row[i] = 0)));
    this.currentLayout.required_for_completion.forEach(floor => floor.forEach(row => row.forEach((tile, i) => row[i] = false)));
    // loadFloor(0);
    // this.onValueChange.forEach(callback => callback({refresh: true}))
  }

  getTileCount(floorIndex) {
    let floor = this.currentLayout.floors[floorIndex];
    let count = 0;
    floor.layout.forEach(row => row.forEach(tile => count += tile === 0 ? 0 : 1));

    return count;
  }

  getTileValue(floor, x, y) {
    return this.currentLayout.floors[floor].layout[y][x];
  }

  setTileValue(value, floor, x, y) {
    let isRequired = this.isIndexRequired(value);
    this.currentLayout.floors[floor].layout[y][x] = value;
    this.currentLayout.required_for_completion[floor][y][x] = isRequired;
    console.log("IS REQ", isRequired);
    this.onValueChange.forEach(callback => callback({value, floor, x, y, isRequired, currentLayout: this.currentLayout}));
  }

  setRequiredValue(isRequired, floor, x, y) {
    this.currentLayout.required_for_completion[floor][y][x] = isRequired;
    this.onValueChange.forEach(callback => callback({value, floor, x, y, isRequired, currentLayout: this.currentLayout}));
  }

  isIndexRequired(index) {
    return (index !== 0 && index !== Number(this.flipLegend()['Door.Secret']));
  }

  toggleRequiredValue(floor, x, y) {
    let isRequired = !this.currentLayout.required_for_completion[floor][y][x];
    this.currentLayout.required_for_completion[floor][y][x] = isRequired;
    this.onValueChange.forEach(callback => callback({floor, x, y, isRequired, currentLayout: this.currentLayout}));
  }

  saveToLocal() {
    localStorage.setItem('DQ-Layout',JSON.stringify(this.currentLayout));
    localStorage.setItem('DQ-Budget', JSON.stringify(this.currentBudget));
  }

  loadFromLocal() {
    this.currentBudget = localStorage.getItem('DQ-Budget') ? JSON.parse(localStorage.getItem('DQ-Budget')) : this.TSVToBudget(DEFAULT_BUDGET);
    this.loadLayout(localStorage.getItem('DQ-Layout') || DEFAULT_LAYOUT);
  }

  getFloorResources(floorIndex) {
    let floor = this.currentLayout.floors[floorIndex].layout;
    let flatMap = {};
    floor.flat().forEach(el => flatMap[el] = (flatMap[el] || 0) + 1);

    return flatMap;
  }

  getFloorBudgetLegend(floorIndex) {
    let budget = this.currentBudget[floorIndex];
    let flatMap = this.getFloorResources(floorIndex);

    let always = {
        'Door.Common': 1,
    }

    let m = {};

    for (let key in this.currentLayout.legend) {
      let resource = this.currentLayout.legend[key];
      if (budget[resource] != 0 || flatMap[key] > 0 || always[resource] > 0) {
        m[key] = resource;
      }
    }

    return m;
  }

  getFloorCurrentLegend(floorIndex) {
    let flatMap = this.getFloorResources(floorIndex);

    let m = {};
    for (let key in this.currentLayout.legend) {
      let resource = this.currentLayout.legend[key];
      if (flatMap[key] > 0) {
        m[key] = resource;
      }
    }

    return m;
  }

  getTotalResources(minFloorIndex, maxFloorIndex) {
    let totalResources = {};
    for (let i = minFloorIndex; i <= maxFloorIndex; i++) {
      let flatMap = this.getFloorResources(i);
      for (let key in flatMap) {
        let resource = this.currentLayout.legend[key];
        totalResources[resource] = (totalResources[resource] || 0) + flatMap[key];
      }
    }

    return totalResources;
  }
  
  getResourceArray() {
    let resources = [];
    for (let i = 0; i < this.currentLayout.floors.length; i++) {
      let flatMap = this.getFloorResources(i);
      let res = {};
      for (let key in flatMap) {
        let resource = this.currentLayout.legend[key];
        res[resource] = flatMap[key];
      }
      resources.push(res);
    }

    return resources;
  }

  getCumBudget(minFloorIndex, maxFloorIndex) {
    let totalBudget = {};
    let totalResources = {};

    for (let i = minFloorIndex; i <= maxFloorIndex; i++) {
      let budget = this.currentBudget[i];
      let flatMap = this.getFloorResources(i);

      // for (let key in this.currentLayout.legend) {
      //   let resource = this.currentLayout.legend[key];
      //   totalBudget[resource] = (totalBudget[resource] || 0) + (budget[resource] || 0);
      //   totalResources[key] = (totalResources[key] || 0) + (flatMap[key] || 0);
      // }

      for (let key in budget) {
        totalBudget[key] = (totalBudget[key] || 0) + budget[key];
      }

      for (let key in flatMap) {
        totalResources[key] = (totalResources[key] || 0) + flatMap[key];
      }
    }
    // console.log(totalBudget, totalResources);

    let m = {};

    for (let key in this.currentLayout.legend) {
      let resource = this.currentLayout.legend[key];
      let amt = (totalBudget[resource] || 0) - (totalResources[key] || 0);
      if(amt !== 0) {
        m[resource] = amt;
      }
    }

    return m;
  }

  addBudget(floor, resourceIndex, amount) {
    let floorBudget = this.currentBudget[floor];
    console.log(floorBudget);
    if (floorBudget[resourceIndex] || floorBudget[resourceIndex] === 0) {
      floorBudget[resourceIndex] += amount;
    } else {
    }
  }

  flipLegend() {
    let m = {};
    let legend = this.currentLayout.legend;
    for (let i in Object.keys(legend)) {
      m[legend[i]] = i;
    }

    return m;
  }

  exportFloorVisualization() {
    let floors = this.currentLayout.floors;
    let legend = this.currentLayout.legend;

    let floorMap = floors.map(floor => {
      let flatFloor = floor.layout.flat().map(el => el = legend[el]);
      return {
        doorTimed: flatFloor.reduce((total, el) => el.includes('Door.Datetime') ? total + 1 : total, 0),
        ladder1: flatFloor.includes('Ladder:1'),
        ladder2: flatFloor.includes('Ladder:2'),
        ladder3: flatFloor.includes('Ladder:3'),
        ladderTimed: flatFloor.some(el => el.includes('Ladder.Datetime')),
      }
    });

    let visualization = '';

    floorMap.forEach((floor, i) => {
      visualization += (i < 10 ? '0'+i : i) + ': ';
      visualization += floor.ladder2 ? '// ' : '   ';
      visualization += floor.ladder1 ? ' || ' : floor.ladderTimed ? ' TT ' : '    ';
      visualization += floor.ladder3 ? ' \\ ' : '    ';
      visualization += floor.doorTimed ? ' T'+floor.doorTimed : '   ';
      visualization +=`
      `;

    });

    return visualization;
  }

  // pathToNext() {
  //   let astarMap = this.currentLayout.floors.map(floor => {
  //     let down = floor.layout.length;
  //     let across = floor.layout[0].length;
  //     let flatMap = floor.layout.flat();
  //     let tiles = [];
  //     flatMap.forEach((el, i) => {
  //       let tile = {value: el, connections: []};
        
  //       if (i > across) {
  //         let other = tiles[i - across];
  //         other.connections.push(tile);
  //         tile.connections.push(other);
  //       }
  //       if (i % across > 0) {
  //         let other = tiles[i - 1];
  //         other.connections.push(tile);
  //         tile.connections.push(other);
  //       }

  //       tiles.push(tile);
  //     })
  //   });

  //   let getValue = (node => (node.value === 0 ? 0 : 1));

  //   let start = tiles.find(el => el.value === );
  // }
}