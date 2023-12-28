
// let path = new AStarPath();

export class AStarPath{
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

// const astarGridHermeneutic=(node,end)=>{
//   return Math.abs(node.x-end.x)+Math.abs(node.y-end.y);
// }
