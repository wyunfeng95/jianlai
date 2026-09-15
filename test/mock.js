// 假的 OpenAI 兼容接口：按提示词类型返回对应 JSON
function npc(name, rel, id, w, align, fac){
  return {name,gender:'男',age:40,identity:id,faction:fac||'散人',alignment:align||'中立',personality:['暴躁'],
    appearance:'普通',武功:w,谈吐:50,signature:'霸王拳',relation:rel,好感度:20,爱恋值:null,mood:'平静',alive:true,
    secret:'他有一桩旧案',notes:''};
}
let turnNo=0;
// 真模型每回合措辞都不一样，假接口也别老是一模一样三条——否则引擎的「连挂三回就换掉」会把它们全收走
let aftNo=0;
const AFT=[
  ['照他说的去黑风口走一趟','动身往黑风口探个虚实','黑风口那边，总得亲自去看看'],
  ['把他托付的信送到镖局','先去镖局把那封信交了','绕道镖局，了了这桩托付'],
  ['先回房把伤养好','歇上几日，把身子将养过来','闭门静养，等伤好了再说']
];
function aftVary(i){ return AFT[i][(aftNo+i)%AFT[i].length]; }
function pickBody(prompt){
  if(prompt.includes('请为这个武侠世界铸造当世格局')) return {
    factions:[{name:'华山派',alignment:'正派',power:70,leader:'岳师伯',desc:'关中大派'},
              {name:'黑风寨',alignment:'邪道',power:55,leader:'秃鹰',desc:'劫道为生'}],
    ranking:[{name:'铁掌王',faction:'散人',武功:92,note:'一双铁掌'},
             {name:'冷月姑',faction:'月影宫',武功:80,note:'月影刀'},
             {name:'秃鹰',faction:'黑风寨',武功:66,note:'鹰爪功'}],
    events:['大旱','两派火并']};
  if(prompt.includes('现在请生成一位主角并开局')) return {
    player:{name:'李昭',biaozi:null,gender:'男',age:22,orientation:'异性恋',appearance:'瘦高',personality:['执拗','重义'],
      backgroundType:'习武世家',backstory:'家道中落，父亲死于非命。',
      attributes:{谈吐:42,才学:35,颖悟:60,武功:38},侠名:8,恶名:2,money:120,faction:'华山派',skills:{'记帐':'识文断字（粗浅），能记些账目','烹饪':'做得一手家常便饭（大户人家厨房帮工经验）','暗器':'扔掷石块有准头（虽未及暗器功夫，但手头准）'},
      arts:[{name:'伏虎拳',desc:'刚猛外家拳',style:'刚猛',level:25}],
      items:{武器:[{name:'柳叶刀',desc:'父亲遗物',bonus:5}],秘籍:[{name:'伏虎心法残卷',desc:'字迹斑驳'}],医药:[{name:'金创药'},{name:'金创药'}],毒药:[{name:'蚀骨散'}],杂书:[],其他:[]},
      status:[]},
    npcs:[Object.assign(npc('岳师伯','师父','华山掌门',85,'正派','华山派'),{age:62}),Object.assign(npc('秃鹰','仇人','黑风寨主',66,'邪道','黑风寨'),{age:44}),Object.assign(npc('沈师姐','同门','华山二弟子',55,'正派','华山派'),{gender:'女',age:24})],
    quests:[{title:'查明父亲死因',desc:'父亲死得蹊跷'}],
    opening:'雨下了整宿。李昭把刀往桌上一搁，要了两个馍。\n跑堂的看了看那刀，手一抖。',
    scene:{location:'城门客栈',unresolved:['父亲的死因']},
    rumors:['黑风口不太平'],
    options:[{text:'留在客栈打听消息',hint:'稳妥',type:'normal',months:1,check:null,duel:null,target:null},
             {text:'上山闭关练拳三月',hint:'耗时久',type:'rest',months:3,check:null,duel:null,target:null},
             {text:'去找秃鹰算账',hint:'凶险',type:'duel',months:1,check:null,duel:{opponent:'秃鹰',lethal:false},target:null},
             {text:'找沈师姐深谈',hint:'',type:'talk',months:1,check:null,duel:null,target:'沈师姐'}]};
  if(prompt.includes('请把这场比武写成')) return {
    narrative:'刀光闪过，两人各自退开。\n围观的人都不敢出声。',summary:'与人动手一场',
    scene:{location:'黑风口',unresolved:[]},check:null,
    playerChanges:{attributes:{},fame:{侠名:2,恶名:0},money:0,skills:{},artsAdd:[],artsTrain:[{name:'伏虎拳',level:2}],statusAdd:[],statusRemove:[],itemsAdd:{},itemsRemove:[]},
    npcUpdates:[{name:'秃鹰',好感度:-5}],newNpcs:[],npcEvents:['沈师姐替你说了句话'],rumors:['有人在黑风口动了手'],
    newVendettas:[],questUpdates:[],newQuests:[],rankingUpdates:[],factionUpdates:[],duel:null,
    options:[{text:'就地歇口气',hint:'',type:'rest',months:1},{text:'回华山复命',hint:'',type:'normal',months:2}],
    gameOver:false,ending:null};
  if(prompt.includes('【玩家本回合行动】去黑风口打听消息')) return {
    narrative:'他一脚踏空，坠下崖去。',summary:'主角身死',scene:{location:'崖下',unresolved:[]},check:null,
    playerChanges:{},npcUpdates:[],newNpcs:[],npcEvents:[],rumors:[],newVendettas:[],questUpdates:[],newQuests:[],
    rankingUpdates:[],factionUpdates:[],duel:null,options:[],gameOver:true,ending:'李昭殒命于黑风口'};
  if(/【玩家本回合行动】与.{1,10}谈过之后/.test(prompt)){ aftNo++; return {
    narrative:'话头刚落，院里的风还没停。\n他把那袋银子往你怀里一塞，转身进了屋。',summary:'谈完之后',
    scene:{location:'华山',unresolved:['父亲的死因']},check:null,
    playerChanges:{attributes:{},fame:{侠名:0,恶名:0},money:0,skills:{},artsAdd:[],artsTrain:[],statusAdd:[],statusRemove:[],itemsAdd:{},itemsRemove:[]},
    npcUpdates:[],newNpcs:[],npcEvents:[],rumors:[],newVendettas:[],questUpdates:[],newQuests:[],
    rankingUpdates:[],rankingAdd:[],factionUpdates:[],duel:null,
    options:[{text:aftVary(0),hint:'接着这场话',type:'normal',months:1},
             {text:aftVary(1),hint:'',type:'normal',months:1},
             {text:aftVary(2),hint:'',type:'rest',months:1}],
    gameOver:false,ending:null}; }
  if(prompt.includes('闭关参悟') || prompt.includes('请推演本回合')){
    turnNo++;
    const body={
      narrative:'这一段日子过得飞快。\n李昭把那本残卷翻了又翻。',summary:'第'+turnNo+'回的事',
      scene:{location:'华山',unresolved:['父亲的死因']},check:null,
      playerChanges:{age:null,attributes:{武功:2},hp:-5,fame:{侠名:1,恶名:0},money:40,faction:null,contrib:12,
        skills:{},artsAdd:[],artsTrain:[{name:'伏虎拳',level:3}],personalityAdd:[],statusAdd:[],statusRemove:[],
        itemsAdd:{},itemsRemove:[]},
      npcUpdates:[{name:'沈师姐',好感度:3}],newNpcs:[],
      npcEvents:[{name:'沈师姐',event:'下山办事'},'秃鹰在黑风口摆了一桌'],
      rumors:[{text:'江湖榜要重排了'}],
      newVendettas:turnNo===2?[{name:'秃鹰',reason:'你砸了他的场子',lethal:true}]:[],
      questUpdates:[{title:'查明父亲死因',progress:10,status:'进行中'}],newQuests:[],
      rankingUpdates:[],factionUpdates:[],duel:null,
      options:[{text:'继续练功',hint:'',type:'rest',months:2},
               {text:'下山寻访线索',hint:'',type:'check',months:1,check:{attr:'谈吐',need:55}},
               {text:'找秃鹰了断',hint:'凶险',type:'duel',months:1,duel:{opponent:'秃鹰',lethal:false}}],
      gameOver:false,ending:null};
    return body;
  }
  if(prompt.includes('你现在扮演武侠世界中的人物')) return {
    reply:'（她抬眼看你）「师弟，你脸色不好，这瓶伤药拿去。」',innerThought:'他又在想他爹的事',mood:'关切',favor:4,
    attempt:{type:'求助',attr:'谈吐',need:40,total:60,success:true},revealSecret:false,endTalk:false,
    effects:{money:300,give:[{cat:'医药',name:'白玉续命膏',desc:'师姐私藏的伤药'}],hp:25,
             info:'黑风口近来有埋伏',quest:{title:'替师姐带一封信',desc:'送到山下的镖局'}},
    summary:'与沈师姐说了几句'};
  if(prompt.includes('请把它压成一段')) return {text:'早年在华山学艺，与沈师姐交好，与秃鹰结仇。'};
  if(prompt.includes('墓志铭')) return {biography:'李昭一生……',epitaph:'刀在人在',verdict:'性烈如火'};
  return {narrative:'（未知提示）',summary:'',options:[]};
}
function sse(obj){
  const s=JSON.stringify(obj);
  const chunks=[];
  for(let i=0;i<s.length;i+=400) chunks.push(s.slice(i,i+400));
  return chunks.map(c=>'data: '+JSON.stringify({choices:[{delta:{content:c}}]})+'\n\n').join('')
    +'data: '+JSON.stringify({choices:[{delta:{},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n';
}
module.exports={pickBody,sse};
