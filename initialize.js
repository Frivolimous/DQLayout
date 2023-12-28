
//== Main Initialization ==\\
let element = document.getElementById('game-canvas');

let appRect = new PIXI.Rectangle(0, 0, element.offsetWidth, element.offsetHeight);
var app = new PIXI.Application({
  backgroundColor: 0x770000,
  antialias: true,
  resolution: 1,
  width: appRect.width,
  height: appRect.height,
});
element.append(app.view);

//== Initialize Supporting Structures ==\\

app.stage.eventMode = 'passive';

let resizeCallbacks = [];
// let finishResize = debounce(300, () => {
//   app.view.width = appRect.width = element.offsetWidth;
//   app.view.height = appRect.height = element.offsetHeight;

//   console.log("A");

//   resizeCallbacks.forEach(callback => callback());
// });

// finishResize(true);

// window.addEventListener('resize', () => finishResize());

initGame();
