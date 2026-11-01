export const personalities = [
 {playerName:'Oliver',name:'つなぎ屋',description:'連番を最優先。つながらないカードには慎重。',limit:1,reserve:2,bridge:5},
 {playerName:'Emma',name:'貯金家',description:'チップを温存。場のチップが多いカードも好む。',limit:5,reserve:6,potWeight:1.5},
 {playerName:'Noah',name:'慎重派',description:'高い数字を避け、得点の増加を小さく抑える。',limit:0,reserve:2},
 {playerName:'Sophia',name:'大胆派',description:'多少の失点は気にせず、早めにカードを取る。',limit:10,reserve:3},
 {playerName:'Leo',name:'収集家',description:'連番の足がかりを集め、1つ違いの隙間も狙う。',limit:4,reserve:3,bridge:9},
 {playerName:'Ava',name:'戦略家',description:'残りの山札に合わせて、チップの使い方を変える。',limit:2,reserve:4,endgame:true}
];
export function cardScore(cards) {
  const sorted = [...cards].sort((a,b)=>a-b);
  return sorted.reduce((sum,n,i)=>sum + (i && sorted[i-1]===n-1 ? 0 : n),0);
}
export function score(player) { return cardScore(player.cards)-player.chips; }
export function createGame(count, random=Math.random) {
  if (!Number.isInteger(count)||count<3||count>7) throw new Error('人数は3〜7人です');
  const deck=Array.from({length:33},(_,i)=>i+3);
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  const players=Array.from({length:count},(_,i)=>({name:i===0?'あなた':personalities[i-1].playerName,personality:i===0?null:i-1,chips:count<=5?11:count===6?9:7,cards:[]}));
  return {players,deck:deck.slice(0,24),current:Math.floor(random()*count),card:null,pot:0,ended:false,turns:0};
}
export function reveal(game){if(game.card===null&&!game.ended) game.card=game.deck.pop();}
export function act(game,action){
  if(game.ended) return false;
  const p=game.players[game.current];
  if(action==='pass'){
    if(p.chips===0) return false;
    p.chips--;game.pot++;game.current=(game.current+1)%game.players.length;
  }else if(action==='take'){
    p.cards.push(game.card);p.cards.sort((a,b)=>a-b);p.chips+=game.pot;game.pot=0;game.card=null;
    if(game.deck.length===0)game.ended=true;else reveal(game);
  }else return false;
  game.turns++;return true;
}
export function cpuAction(game){
 const p=game.players[game.current];
 const style=personalities[p.personality]||personalities[0];
 const delta=cardScore([...p.cards,game.card])-cardScore(p.cards);
 const bridge=p.cards.some(n=>Math.abs(n-game.card)===2) ? (style.bridge||0) : 0;
 const cost=delta-game.pot*(style.potWeight||1)-bridge;
 const limit=style.limit+(style.endgame ? (game.deck.length<6?5:-1):0);
 const reserve=style.endgame ? Math.ceil(game.deck.length/6):style.reserve;
 return p.chips===0||cost<=limit||p.chips<=reserve&&cost<=limit+7?'take':'pass';
}
