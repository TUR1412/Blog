import type { TimelineEvent, TimelineLayer } from './timeline'

export type RelationKind = '人物' | '宗门' | '地点' | '誓词' | '旧物' | '关口'

export type RelationTone = NonNullable<TimelineEvent['tone']> | 'calm'

export type RelationNode = {
  id: string
  title: string
  kind: RelationKind
  summary: string
  detail: string
  tone?: RelationTone
  layer?: TimelineLayer
  chronicleSlug?: string
  timelineId?: string
  keywords?: string[]
  pos: { x: number; y: number }
}

export type RelationEdge = {
  id: string
  from: string
  to: string
  label: string
}

export const RELATION_KINDS: RelationKind[] = ['人物', '宗门', '地点', '誓词', '旧物', '关口']

export const relationNodes: RelationNode[] = [
  {
    id: 'xuan',
    title: '轩少（轩天帝）',
    kind: '人物',
    summary: '端秤的人。秤压规矩，不压人。',
    detail:
      '他不靠“更响的口号”取信人心，靠的是可被重复验证的做法：守诺、立界、写细则、做回访。名号在公文里叫“天帝”，私下仍有人叫他“轩少”。',
    tone: 'calm',
    pos: { x: 50, y: 50 },
    keywords: ['轩天帝', '轩少', '分寸', '规矩', '端秤', '行止'],
  },
  {
    id: 'qingming',
    title: '青冥山',
    kind: '宗门',
    summary: '规矩细，门槛冷，最先磨人心气。',
    detail:
      '青冥的门不金碧，却重“把话说清、把事做完”。在这里，最先学的往往不是术法，而是时辰、轮值与一笔一画的端正。',
    tone: 'calm',
    pos: { x: 22, y: 22 },
    keywords: ['宗门', '门规', '外院', '内门', '钟楼', '藏经阁'],
  },
  {
    id: 'oath-ledger',
    title: '誓词对照',
    kind: '誓词',
    summary: '不是拿来抬高谁，是拿来压住“强者”。',
    detail:
      '他常把“当年写过的字”摆到桌上：不让人靠嗓门赢，而让人靠对照负责。誓词能约束强者，才算规矩；只束弱者，不过是纸。',
    tone: 'warn',
    pos: { x: 80, y: 24 },
    keywords: ['誓词', '对照', '公议', '追责', '强者', '细则'],
  },
  {
    id: 'oath-relief',
    title: '救灾公费与医馆次序',
    kind: '誓词',
    summary: '救急要快，但次序要留给后来人。',
    detail:
      '他不爱“当场立功”。更在意的是：公费怎么拨、药怎么开、谁该回访、账目如何公示。把这些写清，才算真正把人救稳。',
    tone: 'bright',
    pos: { x: 80, y: 78 },
    keywords: ['救荒', '公费', '医馆', '药单', '回访', '公示'],
  },
  {
    id: 'seal',
    title: '公议印',
    kind: '旧物',
    summary: '不是压人的印，是压规矩的印。',
    detail:
      '每次落印，意味着一条边界被写清楚。用印之前，他总会先问：这条规矩能不能约束强者？若不能，就不该落下去。',
    tone: 'warn',
    pos: { x: 66, y: 36 },
    keywords: ['印', '公议', '边界', '细则'],
  },
  {
    id: 'balance-scale',
    title: '端秤（旧秤杆）',
    kind: '旧物',
    summary: '刻度不吓人，能让争端少一半。',
    detail:
      '它不是用来“压人”的器物，而是用来把“差不多”拆掉的刻度：校量、范围、复核、落款。秤压的是规矩，不是人。',
    tone: 'warn',
    pos: { x: 44, y: 58 },
    keywords: ['端秤', '旧秤', '刻度', '校量', '差不多', '复核', '对账', '分粮'],
  },
  {
    id: 'medicine-ledger',
    title: '药单册',
    kind: '旧物',
    summary: '比丹更贵的是“次序”。',
    detail:
      '一页页都是病名、脉象、忌口、回访。灾后留册，医馆才不至乱。你能从这些细字里看见：他不靠“神迹”，靠的是耐心与可复用的章法。',
    tone: 'bright',
    pos: { x: 66, y: 64 },
    keywords: ['药单', '回访', '医馆', '救荒', '次序'],
  },
  {
    id: 'notice-board',
    title: '公示榜',
    kind: '旧物',
    summary: '字贴在墙上，才算给人看。',
    detail:
      '公费、轮次、期限、去向——凡是容易“含糊过去”的东西，他都更愿意写在人人看得见的地方。字不必漂亮，必须清楚；不许用含混词，不许留暗门。',
    tone: 'warn',
    pos: { x: 58, y: 72 },
    keywords: ['公示', '张榜', '清楚', '可对照'],
  },
  {
    id: 'duanqiao',
    title: '断桥',
    kind: '地点',
    summary: '小事最磨心：不借名头讨便宜。',
    detail:
      '桥年年断又年年修，热汤摊年年在。这里没有“惊天大事”，只有欠账、还账、修木板、请医——却最容易让人走偏。',
    tone: 'calm',
    pos: { x: 20, y: 76 },
    keywords: ['断桥', '旧约', '热汤', '守诺'],
  },
  {
    id: 'north-infirmary',
    title: '北境医馆',
    kind: '地点',
    summary: '灯不熄，纸不乱：救人靠流程。',
    detail:
      '城门口排队的是饥民，屋里堆的是药材与病历。有人来施丹要旗号，他来借一间空屋，把药单写清，把回访排好。',
    tone: 'bright',
    pos: { x: 86, y: 56 },
    keywords: ['北境', '医馆', '救荒', '夜诊', '回访'],
  },
  {
    id: 'clear-spring',
    title: '清泉',
    kind: '地点',
    summary: '泉眼不大，争端不小：写清轮次。',
    detail:
      '三村与药圃为水起争。有人想用名头压住场面，他却把时辰、桶数、轮次写成字，再立界石，让“来年也能照着做”。',
    tone: 'warn',
    pos: { x: 36, y: 66 },
    keywords: ['清泉', '立界', '轮次', '界石', '争端'],
  },
  {
    id: 't-174-1',
    title: '入青冥山门',
    kind: '关口',
    summary: '不抢前路，先学规矩。',
    detail:
      '没有惊天异象，只有旧灯与冻裂的手背。真正的起步，是把桶挑稳、把话说清。',
    tone: 'calm',
    layer: 1,
    timelineId: 't-174-1',
    chronicleSlug: 'frost-moon-lantern',
    pos: { x: 34, y: 18 },
    keywords: ['霜月', '旧灯', '入门', '挑水'],
  },
  {
    id: 't-176-1',
    title: '夏至抄经',
    kind: '关口',
    summary: '火候未到，先把字写正。',
    detail:
      '抄经抄到手酸，也不抄捷径。字端正，心就不敢太歪；时辰写得清楚，轮值才不会乱。',
    tone: 'calm',
    layer: 1,
    timelineId: 't-176-1',
    chronicleSlug: 'summer-solstice-sutra-copying',
    pos: { x: 46, y: 26 },
    keywords: ['夏至', '抄经', '藏经阁', '镇纸'],
  },
  {
    id: 't-178-1',
    title: '四海问剑',
    kind: '关口',
    summary: '胜负分明，人心不碎。',
    detail:
      '擂台只分胜负，不分生死。留一线，是给对手，也是给未来的自己。',
    tone: 'bright',
    layer: 2,
    timelineId: 't-178-1',
    chronicleSlug: 'four-seas-sword-asking',
    pos: { x: 60, y: 18 },
    keywords: ['问剑', '擂台', '留一线', '名声'],
  },
  {
    id: 't-180-1',
    title: '断桥旧约',
    kind: '关口',
    summary: '守一诺，拒蝇营。',
    detail:
      '欠的是汤钱，不是名头。还账、请医、修桥板，一件件做完，把人情摆回正路。',
    tone: 'calm',
    layer: 2,
    timelineId: 't-180-1',
    chronicleSlug: 'broken-bridge-old-promise',
    pos: { x: 34, y: 84 },
    keywords: ['断桥', '旧约', '守诺', '不借名头'],
  },
  {
    id: 't-182-1',
    title: '清泉立界',
    kind: '关口',
    summary: '把争端写成规矩。',
    detail:
      '名头能压住一时，压不住来年。写清轮次与细则，才算把争端收住。',
    tone: 'warn',
    layer: 3,
    timelineId: 't-182-1',
    chronicleSlug: 'clear-spring-boundary-stones',
    pos: { x: 46, y: 70 },
    keywords: ['清泉', '立界', '界石', '细则'],
  },
  {
    id: 't-183-1',
    title: '北境救荒',
    kind: '关口',
    summary: '以丹救人，不以丹换名。',
    detail:
      '他留的是药单与回访次序：谁先稳气血、谁忌什么、何时再诊。救急之后，医馆还能照着办下去。',
    tone: 'bright',
    layer: 3,
    timelineId: 't-183-1',
    chronicleSlug: 'northern-famine-dan-rescue',
    pos: { x: 74, y: 64 },
    keywords: ['北境', '救荒', '药单', '回访', '夜诊'],
  },
  {
    id: 't-184-1',
    title: '钟楼守夜',
    kind: '关口',
    summary: '少英雄，多平安。',
    detail:
      '先敲小钟，再派两人去看；不许一个人逞强。把轮值写成册，让人能在慌乱里照着做。',
    tone: 'calm',
    layer: 3,
    timelineId: 't-184-1',
    chronicleSlug: 'bell-tower-night-watch',
    pos: { x: 24, y: 46 },
    keywords: ['钟楼', '守夜', '轮值', '小钟'],
  },
  {
    id: 't-185-1',
    title: '巡访回访',
    kind: '关口',
    summary: '风过了，路要还在。',
    detail:
      '救荒之后回去补空：看药单是否还在用，看账目是否还能给人看，看回访是否还照着走。最难的不是当场救急，是事后不松手。',
    tone: 'warn',
    layer: 4,
    timelineId: 't-185-1',
    chronicleSlug: 'followup-ledger-walk',
    pos: { x: 74, y: 82 },
    keywords: ['巡访', '回访', '谷雨', '账目', '公示', '补空'],
  },
  {
    id: 't-186-1',
    title: '诸宗公议',
    kind: '关口',
    summary: '先立边界，再谈威望。',
    detail:
      '他把旧誓翻出来逐条对照，又把细则写到可用：期限、拨付、公开、追责。不是为了“压住场”，是为了让未来不再乱。',
    tone: 'warn',
    layer: 4,
    timelineId: 't-186-1',
    chronicleSlug: 'white-dew-oath-ledger',
    pos: { x: 70, y: 34 },
    keywords: ['白露', '公议', '誓词', '细则'],
  },
  {
    id: 't-186-2',
    title: '细则落地',
    kind: '关口',
    summary: '把誓纸上的字变成能照着做的路。',
    detail:
      '公议之后最怕“字好听、人走散”。他抄三份，贴三处，问三遍：让细则可见、可用、可对照。规矩不是用来显威望，是用来防走偏。',
    tone: 'warn',
    layer: 4,
    timelineId: 't-186-2',
    chronicleSlug: 'oath-clauses-made-usable',
    pos: { x: 78, y: 46 },
    keywords: ['霜降', '细则', '落地', '公示', '对照'],
  },
  {
    id: 't-187-1',
    title: '众望而后立',
    kind: '关口',
    summary: '名号写进盟约，手里仍是旧茶盏。',
    detail:
      '“天帝”多用于公文抬头；私下仍叫“轩少”。他更愿意被记作端秤的人，而不是被吹成天上来的神话。',
    tone: 'bright',
    layer: 4,
    timelineId: 't-187-1',
    chronicleSlug: 'after-ascension-not-boast',
    pos: { x: 86, y: 38 },
    keywords: ['立冬', '盟约', '天帝', '端秤'],
  },
  {
    id: 't-188-1',
    title: '冬至封卷',
    kind: '关口',
    summary: '把账写给后来人。',
    detail:
      '雪夜对账归档，不许“口头算了”。他要的不是场面好看，而是可对照：日期、缘由、数目、经手、落印与去向。写得清，才能少争端；留得住，才能让后来人有处可查。',
    tone: 'warn',
    layer: 4,
    timelineId: 't-188-1',
    chronicleSlug: 'winter-solstice-archiving',
    pos: { x: 90, y: 52 },
    keywords: ['冬至', '封卷', '对账', '归档', '公示', '可查', '落印'],
  },
  {
    id: 't-189-1',
    title: '正月端秤',
    kind: '关口',
    summary: '把“差不多”压回刻度里。',
    detail:
      '冬至封卷之后最怕松手：他借来一杆旧秤，先校量、再分粮；称量与登记分开，范围与复核写明。刻度不响，却最管用。',
    tone: 'warn',
    layer: 4,
    timelineId: 't-189-1',
    chronicleSlug: 'new-year-balance-scale',
    pos: { x: 56, y: 58 },
    keywords: ['正月', '端秤', '刻度', '校量', '分粮', '对账', '复核', '贴榜'],
  },
]

export const relationEdges: RelationEdge[] = [
  edge('xuan', 'qingming', '所系'),
  edge('xuan', 't-174-1', '起于'),
  edge('xuan', 't-176-1', '磨于'),
  edge('xuan', 't-178-1', '立名于'),
  edge('xuan', 't-180-1', '守诺于'),
  edge('xuan', 't-182-1', '立界于'),
  edge('xuan', 't-183-1', '救荒于'),
  edge('xuan', 't-184-1', '守夜于'),
  edge('xuan', 't-185-1', '回访于'),
  edge('xuan', 't-186-1', '对照于'),
  edge('xuan', 't-186-2', '落地于'),
  edge('xuan', 't-187-1', '受职于'),
  edge('xuan', 't-188-1', '封卷于'),
  edge('xuan', 't-189-1', '校秤于'),

  edge('t-180-1', 'duanqiao', '发生于'),
  edge('t-182-1', 'clear-spring', '发生于'),
  edge('t-183-1', 'north-infirmary', '发生于'),
  edge('t-185-1', 'north-infirmary', '回到'),

  edge('t-186-1', 'oath-ledger', '以此为秤'),
  edge('t-186-2', 'oath-ledger', '照此执行'),
  edge('t-187-1', 'oath-ledger', '托此立约'),
  edge('t-186-1', 'seal', '落印'),
  edge('t-186-2', 'notice-board', '贴榜'),

  edge('t-183-1', 'medicine-ledger', '留册'),
  edge('t-183-1', 'oath-relief', '留次序'),
  edge('t-185-1', 'medicine-ledger', '补空'),
  edge('t-185-1', 'oath-relief', '公示'),
  edge('t-185-1', 'oath-ledger', '端秤'),
  edge('t-185-1', 'notice-board', '张榜'),
  edge('oath-relief', 'notice-board', '需公示'),
  edge('t-182-1', 'oath-ledger', '写成字'),

  edge('t-188-1', 'oath-ledger', '照秤'),
  edge('t-188-1', 'oath-relief', '对账'),
  edge('t-188-1', 'notice-board', '公示'),
  edge('t-188-1', 'medicine-ledger', '归档'),
  edge('t-188-1', 'seal', '落印'),

  edge('t-189-1', 'balance-scale', '端秤'),
  edge('t-189-1', 'notice-board', '贴榜'),
  edge('t-189-1', 'oath-ledger', '照秤'),
  edge('t-189-1', 'oath-relief', '依次'),
]

export function getRelationNode(id: string) {
  return relationNodes.find((n) => n.id === id) ?? null
}

export function getRelationEdgesFor(id: string) {
  return relationEdges.filter((e) => e.from === id || e.to === id)
}

export function getRelatedNodeIds(id: string) {
  const ids = new Set<string>()
  for (const e of getRelationEdgesFor(id)) ids.add(e.from === id ? e.to : e.from)
  return Array.from(ids)
}

function edge(from: string, to: string, label: string): RelationEdge {
  return { id: `${from}__${to}`, from, to, label }
}
