let textureCache = new class TextureCache {
  // an intermediary to the PIXI.Loader and PIXI.resources.  Preloads and caches resources used in this project.
  // we could also use the native PIXI TextureCache, but this is easier to manipulate especially when
  // related to hotloading
  _cache = {};

  addTextureFromImage = (id, url) => {
    let m = PIXI.Texture.from(url);

    this._cache[id] = m;
    return m;
  }

  addTexturePromise = (id, url, overwrite = false) => {
    return new Promise((resolve) => {
      let loader = new PIXI.Loader;
      
      if (!overwrite && loader.resources[id]) {
        resolve();
      } else {
        loader.add(id, url, {crossOrigin: true});
        loader.load((loader, res) => {
          this._cache[id] = res[id].texture;
          resolve();
        });
      }
    });
  }

  /**
 * @param {[string, string][]} idUrlPairs input pair of strings to create a texture from the second string and store under name of the first
 */
  addTexturesPromise = (idUrlPairs) => {
    return new Promise((resolve) => {
      let loader = new PIXI.Loader;
      idUrlPairs.forEach(([id, url]) => {
        if (!loader.resources[id]) {
          loader.add(id, url, {crossOrigin: true});
        }
      });

      if (loader.length === 0) {
        resolve();
        return;
      }
      loader.load((loader, res) => {
        idUrlPairs.forEach(([id, url]) => {
          this._cache[id] = res[id].texture;
        });
        resolve();
      });
    });
  }

  addTextureFromGraphic = (id, graphic) => {
    let m = APPLICATION.pixiApp.renderer.generateTexture(graphic);
    if (this._cache[id]) {
      console.warn('overwriting texture', id);
    }
    this._cache[id] = m;
    return m;
  }

  getTexture = (id) => {
    return this._cache[id] || PIXI.Texture.WHITE;
  }

  destroy() {
    PIXI.utils.clearTextureCache();
  }
}

class JMTween {
  // My own personal tweening engine, superior to tween.js.  It has a lot of great functions
  // but not really documented so play at your own risk!
  static _running = false;
  static _tweens = [];

  static _add = (tween) => {
    JMTween._tweens.push(tween);
    JMTween._tryRun();
  }

  static _remove = (tween) => {
    let index = JMTween._tweens.indexOf(tween);
    if (index >= 0) {
      JMTween._tweens.splice(index, 1);
    }
  }

  static _tryRun = () => {
    if (!JMTween._running && JMTween._tweens.length > 0) {
      JMTween._running = true;
      requestAnimationFrame(JMTween._onTick);
    }
  }

  static _onTick = (time) => {
    JMTween._running = false;
    JMTween._tweens.forEach(tween => tween.tickThis(time));
    if (!JMTween._running && JMTween._tweens.length > 0) {
      JMTween._running = true;
      requestAnimationFrame(JMTween._onTick);
    }
  }

  running = false;
  tickThis;

  onUpdateCallback;
  onCompleteCallback;
  onWaitCompleteCallback;

  properties = [];
  hasWait;
  _Yoyo;
  _Loop;
  _Repeat = 0;

  nextTween;

  _Easing;

  waitTime;

  startTime;
  endTime;

  object;
  totaltime;

  constructor(object, totalTime = 200) {
    this.object = object;
    this.totalTime = totalTime;
    this.tickThis = this.firstTick;
  }

  onUpdate = (callback) => {
    this.onUpdateCallback = callback;

    return this;
  }

  onComplete = (callback) => {
    this.onCompleteCallback = callback;

    return this;
  }

  onWaitComplete = (callback) => {
    this.onWaitCompleteCallback = callback;

    return this;
  }

  yoyo = (b = true, repeat = 1) => {
    this._Yoyo = b;

    this._Repeat = repeat - 0.5;

    return this;
  }

  loop = (b = true, repeat = 1) => {
    this._Loop = b;
    this._Repeat = repeat;

    return this;
  }

  stop = () => {
    this.running = false;

    JMTween._remove(this);

    return this;
  }

  reset = () => {
    this.tickThis = this.firstTick;
    if (this.waitTime) this.hasWait = true;

    return this;
  }

  wait = (time) => {
    this.waitTime = time;
    this.hasWait = true;

    return this;
  }

  over = (time) => {
    this.totalTime = time;

    return this;
  }

  start = () => {
    this.running = true;

    this.properties.forEach(property => {
      if (property.to || property.to === 0) {
        // @ts-ignore
        property.start = this.object[property.key] || 0;
        property.end = property.to;
      } else if (property.from || property.from === 0) {
        property.start = property.from;
        // @ts-ignore
        property.end = this.object[property.key] || 0;
      }

      if (property.isColor) {
        property.incR = Math.floor(property.end / 0x010000) - Math.floor(property.start / 0x010000);
        property.incG = Math.floor((property.end % 0x010000) / 0x000100) - Math.floor((property.start % 0x010000) / 0x000100);
        property.incB = Math.floor(property.end % 0x000100) - Math.floor(property.start % 0x000100);
      } else {
        property.inc = property.end - property.start;
      }

      // @ts-ignore
      this.object[property.key] = property.start;
    });

    JMTween._add(this);

    return this;
  }

  to = (props, eased = true) => {
    for (let key of Object.keys(props)) {
      // @ts-ignore
      this.properties.push({ key, eased, to: props[key] });
    }

    return this;
  }

  from = (props, eased = true) => {
    for (let key of Object.keys(props)) {
      // @ts-ignore
      this.properties.push({ key, eased, from: props[key] });
    }

    return this;
  }

  colorTo = (props, eased = true) => {
    for (let key of Object.keys(props)) {
      // @ts-ignore
      this.properties.push({ key, eased, to: props[key], isColor: true });
    }

    return this;
  }

  colorFrom = (props, eased = true) => {
    for (let key of Object.keys(props)) {
      // @ts-ignore
      this.properties.push({ key, eased, from: props[key], isColor: true });
    }

    return this;
  }

  easing = (func) => {
    this._Easing = func;

    return this;
  }

  /**
   * @returns {JMTween}
   */
  chain(nextObj, totalTime) {
    this.nextTween = new JMTween(nextObj, totalTime);

    return this.nextTween;
  }

  /**
   * @returns {JMTween}
   */
  chainTween(tween) {
    this.nextTween = tween;

    return tween;
  }

  complete = (time) => {
    this.properties.forEach(property => {
      // @ts-ignore
      this.object[property.key] = property.end;
    });

    if (this._Loop && this._Repeat > 0) {
      this._Repeat--;
      this.reset();
      this.startTime = time;
      this.endTime = this.startTime + (this.totalTime || 0);
    } else if (this._Yoyo && this._Repeat > 0) {
      this._Repeat -= 0.5;
      this.reverseProps();
      this.startTime = time;
      this.endTime = this.startTime + (this.totalTime || 0);
    } else {
      this.running = false;

      JMTween._remove(this);
      this.tickThis = () => { };
      if (this.onCompleteCallback) this.onCompleteCallback(this.object);

      if (this.nextTween) {
        this.nextTween.reset();
        this.nextTween.start();
        this.nextTween.tickThis(time);
      }
    }
    return this;
  }

  firstTick = (time) => {
    if (this.hasWait) {
      this.startTime = time + this.waitTime;
    } else {
      this.startTime = time;
    }
    this.endTime = this.startTime + (this.totalTime || 0);
    this.tickThis = this.tailTick;
  }

  tailTick = (time) => {
    if (this.hasWait && time > this.startTime) {
      this.hasWait = false;
      if (this.onWaitCompleteCallback) this.onWaitCompleteCallback(this.object);
    }

    if (time > this.endTime) {
      this.complete(time);
    } else if (time > this.startTime) {
      let raw = (time - this.startTime) / this.totalTime;
      let eased = this._Easing ? this._Easing(raw) : raw;

      this.properties.forEach(property => {
        let percent = property.eased ? eased : raw;

        if (property.isColor) {
          // @ts-ignore
          (this.object[property.key]) = Math.round(property.start +
            Math.floor(property.incR * percent) * 0x010000 +
            Math.floor(property.incG * percent) * 0x000100 +
            Math.floor(property.incB * percent));
        } else {
          // @ts-ignore
          (this.object[property.key]) = property.start + property.inc * percent;
        }
      });

      if (this.onUpdateCallback) this.onUpdateCallback(this.object);
    }
  }

  reverseProps = () => {
    this.properties.forEach(property => {
      let start = property.start;
      property.start = property.end;
      property.end = start;

      if (property.isColor) {
        property.incR = Math.floor(property.end / 0x010000) - Math.floor(property.start / 0x010000);
        property.incG = Math.floor((property.end % 0x010000) / 0x000100) - Math.floor((property.start % 0x010000) / 0x000100);
        property.incB = Math.floor(property.end % 0x000100) - Math.floor(property.start % 0x000100);
      } else {
        property.inc = property.end - property.start;
      }
    });
  }
}

const Easing = {
  // Easing functions for use in conjunction with JMTween.
  // Simplified to accept a PERCENT (0 - 1) and return the equivalent 'eased' percent.
  Linear: {
    None: (k) => {
      return k;
    },
  },

  Quadratic: {
    In: (k) => {
      return k * k;
    },
    Out: (k) => {
      return k * (2 - k);
    },
    InOut: (k) => {
      k *= 2;
      if (k < 1) {
        return 0.5 * k * k;
      }
      return - 0.5 * (--k * (k - 2) - 1);
    },
  },

  Cubic: {
    In: (k) => {
      return k * k * k;
    },
    Out: (k) => {
      return --k * k * k + 1;
    },
    InOut: (k) => {
      k *= 2;
      if (k < 1) {
        return 0.5 * k * k * k;
      }
      return 0.5 * ((k -= 2) * k * k + 2);
    },
  },

  Quartic: {
    In: (k) => {
      return k * k * k * k;
    },
    Out: (k) => {
      return 1 - (--k * k * k * k);
    },
    InOut: (k) => {
      k *= 2;
      if (k < 1) {
        return 0.5 * k * k * k * k;
      }
      return - 0.5 * ((k -= 2) * k * k * k - 2);
    },
  },

  Quintic: {
    In: (k) => {
      return k * k * k * k * k;
    },
    Out: (k) => {
      return --k * k * k * k * k + 1;
    },
    InOut: (k) => {
      k *= 2;
      if (k < 1) {
        return 0.5 * k * k * k * k * k;
      }
      return 0.5 * ((k -= 2) * k * k * k * k + 2);
    },
  },

  Sinusoidal: {
    In: (k) => {
      return 1 - Math.cos(k * Math.PI / 2);
    },
    Out: (k) => {
      return Math.sin(k * Math.PI / 2);
    },
    InOut: (k) => {
      return 0.5 * (1 - Math.cos(Math.PI * k));
    },
  },

  Exponential: {
    In: (k) => {
      return k === 0 ? 0 : Math.pow(1024, k - 1);
    },
    Out: (k) => {
      return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);
    },
    InOut: (k) => {
      if (k === 0) {
        return 0;
      }
      if (k === 1) {
        return 1;
      }
      k *= 2;
      if (k < 1) {
        return 0.5 * Math.pow(1024, k - 1);
      }
      return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);
    },
  },

  Circular: {
    In: (k) => {
      return 1 - Math.sqrt(1 - k * k);
    },
    Out: (k) => {
      return Math.sqrt(1 - (--k * k));
    },
    InOut: (k) => {
      k *= 2;
      if (k < 1) {
        return - 0.5 * (Math.sqrt(1 - k * k) - 1);
      }
      return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
    },
  },

  Elastic: {
    In: (k) => {
      if (k === 0) {
        return 0;
      }
      if (k === 1) {
        return 1;
      }
      return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
    },
    Out: (k) => {
      if (k === 0) {
        return 0;
      }
      if (k === 1) {
        return 1;
      }
      return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;
    },
    InOut: (k) => {
      if (k === 0) {
        return 0;
      }
      if (k === 1) {
        return 1;
      }
      k *= 2;
      if (k < 1) {
        return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
      }
      return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;
    },
  },

  Back: {
    In: (k) => {
      let s = 1.70158;
      return k * k * ((s + 1) * k - s);
    },
    Out: (k) => {
      let s = 1.70158;
      return --k * k * ((s + 1) * k + s) + 1;
    },
    InOut: (k) => {
      let s = 1.70158 * 1.525;
      k *= 2;
      if (k < 1) {
        return 0.5 * (k * k * ((s + 1) * k - s));
      }
      return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
    },
  },

  Bounce: {
    In: (k) => {
      return 1 - JMEasing.Bounce.Out(1 - k);
    },
    Out: (k) => {
      if (k < (1 / 2.75)) {
        return 7.5625 * k * k;
      } else if (k < (2 / 2.75)) {
        return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
      } else if (k < (2.5 / 2.75)) {
        return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
      } else {
        return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
      }
    },
    InOut: (k) => {
      if (k < 0.5) {
        return JMEasing.Bounce.In(k * 2) * 0.5;
      }
      return JMEasing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
    },
  },
};

function debounce(ms, callback) {
  let timeout;
  let later = () => {
    timeout = null;
    callback();
  }

  return (now = false) => {
    clearTimeout(timeout);

    if (now) {
      later();
    } else {
      timeout = setTimeout(later, ms);
    }
  }
}

function throttle(ms, callback) {
  let timeout;
  let resetTimeout = () => {
    timeout = null;
  }

  return (...args) => {
    if (!timeout) {
      callback(...args);
      timeout = setTimeout(resetTimeout, ms);
    }
  }
}

let throttleTest = throttle(300, (x, y) => {
  console.log('x', x);
  console.log('y', y);
});

function getLuminance(color) {
  let r = Math.floor(color / 0x010000);
  let g = Math.floor((color % 0x010000) / 0x000100);
  let b = Math.floor(color % 0x000100);

  let maxC = Math.max(r, g, b);
  let minC = Math.min(r, g, b);

  return (maxC + minC) * 100 / 255 / 2;
}

function arrayToTSV(json) {
  let headers = [];
  let rows = [];

  for(let prop of json) {
      let row = [];
      let keys = Object.keys(prop);
      for (let key of keys) {
      let index = headers.indexOf(key);
      if (index === -1) {
          index = headers.length;
          headers.push(key);
      }
      row[index] = prop[key].toString();
      }

      rows.push(row);
  }

  let output = headers.join('	');
  rows.forEach(row => {
      output += `
      `;
      output += row.join('	');
  });

  return output;
}

class AStarPath{
  path;
  closed;
  tileValue;
  hermeneutic;

  constructor(start,end,tileValue,hermeneutic){
    this.hermeneutic = hermeneutic || ((node,end)=> 0);
    this.tileValue = tileValue = tileValue || (() => 1);
    this.makePath(start, end);
  }
  /**
   * @function call this to generate a new path.
   */
  makePath=(start,end)=>{
    let open=[];
    this.closed=[];
    open.push({current: start,previous: null, pValue:0,hValue:this.hermeneutic(start,end)});

    while (open.length){
      let node=open.shift();
      let current=node.current;
      let cValue = this.tileValue(current);

      if (current === end){
        this.path=[node.current];
        while (node.previous){
          node=node.previous;
          this.path.unshift(node.current);
        }

        return this.path;
      }else{
        main:for (let i=0;i<current.connections.length;i++){
          for (let j=0;j<open.length;j++){
            if (current.connections[i]===open[j].current){
              if (node.pValue+cValue<open[j].pValue){
                open[j].pValue=node.pValue+cValue;
                open[j].previous=node;
              }
              continue main;
            }
          }
          for (let j=0;j<this.closed.length;j++){
            if (current.connections[i]===this.closed[j].current){
              if (node.pValue+cValue<this.closed[j].pValue){
                
                this.closed[j].pValue=node.pValue+cValue;
                this.closed[j].previous=node;
              }
              continue main;
            }
          }
          let node2={current:current.connections[i],previous:node,pValue:node.pValue+this.tileValue(current.connections[i]),hValue:this.hermeneutic(current.connections[i],end)};
          // for (let j=0;j<open.length;j++){
          //   if (node2.hValue+node2.pValue < open[j].hValue+open[j].pValue){
          //     open.splice(j,0,node2);
          //     continue main;
          //   }
          // }
          open.push(node2);
        }
        open.sort((a,b)=>{
          if (a.pValue+a.hValue < b.pValue+b.hValue){
            return -1;
          }else if (a.pValue+a.hValue > b.pValue+b.hValue){
            return 1;
          }else{
            return 0;
          }
        });
        this.closed.push(node);
      }
    }
    this.path=null;
    return null;
  }
}


const astarSpacialHermeneutic=(node,end)=>{
  return Math.sqrt((node.x-end.x)*(node.x-end.x)+(node.y-end.y)*(node.y-end.y));
}