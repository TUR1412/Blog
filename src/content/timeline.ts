export type TimelineLayer = 1 | 2 | 3 | 4

export const TIMELINE_LAYER_META: Record<TimelineLayer, { label: string; hint: string }> = {
  1: { label: '立身', hint: '先把脚下站稳：规矩、耐心、手上要干净。' },
  2: { label: '立名', hint: '名声不是用来换便宜，是用来被检验。' },
  3: { label: '立规', hint: '把争端写成章法：让后来人照着做。' },
  4: { label: '立秤', hint: '端秤不压人：秤压的是规矩，不是人。' },
}

export function timelineLayerLabel(layer: TimelineLayer) {
  return TIMELINE_LAYER_META[layer]?.label ?? '未定'
}

export type TimelineEvent = {
  id: string
  when: string
  title: string
  detail: string
  long?: string
  chronicleSlug?: string
  tone?: 'calm' | 'bright' | 'warn'
  layer: TimelineLayer
}

export const timeline: TimelineEvent[] = [
  {
    id: 't-174-1',
    when: '玄历一七四年 · 霜月',
    title: '入青冥山门',
    detail: '外院挑水三日，不抢前路，先学规矩。',
    long: '他初入山门时没有“惊天异象”。最先学的是把桶挑稳、把话说清：不抢别人一步，也不让自己的诺言松半分。',
    chronicleSlug: 'frost-moon-lantern',
    tone: 'calm',
    layer: 1,
  },
  {
    id: 't-176-1',
    when: '玄历一七六年 · 夏至',
    title: '内门初入',
    detail: '开始抄经与守夜，常把“稳”挂在嘴边。',
    long: '内门规矩更细：火候、心气、值夜的时辰都要对得上。他不爱讲大道理，只把“该做的事”做得干净；抄经抄到手酸，也不抄捷径。',
    chronicleSlug: 'summer-solstice-sutra-copying',
    tone: 'calm',
    layer: 1,
  },
  {
    id: 't-178-1',
    when: '玄历一七八年 · 春分',
    title: '四海问剑',
    detail: '擂台上留一线，胜负分明，人心不碎。',
    long: '他赢得不靠狠话，靠分寸：该止就止，该收就收。对手输得明白，也留得住脸面。',
    chronicleSlug: 'four-seas-sword-asking',
    tone: 'bright',
    layer: 2,
  },
  {
    id: 't-180-1',
    when: '玄历一八〇年 · 雨水',
    title: '断桥旧约',
    detail: '守一诺，不借名头讨便宜；小事里炼心。',
    long: '他说“欠的是汤钱，不是名头”。于是还账、请医、修木板，一件件做完，像把一段人情摆回正路。',
    chronicleSlug: 'broken-bridge-old-promise',
    tone: 'calm',
    layer: 2,
  },
  {
    id: 't-182-1',
    when: '玄历一八二年 · 小满',
    title: '清泉立界',
    detail: '把争端写成规矩，立石为证，省去来年吵闹。',
    long: '清泉不大，却牵动三村与药圃。轩少不以名头压人，只把时辰、桶数、轮次写清，再立几块界石，让人“记得住、照着做”。',
    chronicleSlug: 'clear-spring-boundary-stones',
    tone: 'warn',
    layer: 3,
  },
  {
    id: 't-183-1',
    when: '玄历一八三年 · 大暑',
    title: '北境救荒',
    detail: '以丹救人，不以丹换名；把次序留在医馆。',
    long: '他留的是药单与回访的次序：谁先稳气血、谁忌什么、何时再诊。人救回来之后，医馆也能照着办下去。',
    chronicleSlug: 'northern-famine-dan-rescue',
    tone: 'bright',
    layer: 3,
  },
  {
    id: 't-184-1',
    when: '玄历一八四年 · 寒露',
    title: '钟楼守夜',
    detail: '修旧绳、改轮值；夜里若真有事，先让人活着醒来。',
    long: '他把守夜写成册：先敲小钟，再派两人去看；不许一个人逞强。少了“英雄”，多了平安。',
    chronicleSlug: 'bell-tower-night-watch',
    tone: 'calm',
    layer: 3,
  },
  {
    id: 't-185-1',
    when: '玄历一八五年 · 谷雨',
    title: '巡访回访',
    detail: '救荒之后回去补空：账目公示，回访照走，不让次序断在半路。',
    long: '他没带旗号，只带一本薄册：去医馆看药单是否还在用，去问账目是否还能给人看，去补那些“最容易被忽略的空”。他常说：救人不是一阵风，风过了，路要还在。',
    chronicleSlug: 'followup-ledger-walk',
    tone: 'warn',
    layer: 4,
  },
  {
    id: 't-186-1',
    when: '玄历一八六年 · 白露',
    title: '诸宗公议',
    detail: '提出可执行细则，先立边界，再谈威望。',
    long: '他把誓词翻出来逐条对照，逼众人面对自己的承诺。规矩之所以能立住，是因为它也能约束“强者”。那夜他在灯下写了两页细则，第二天就拿去公议台上逐条过。',
    chronicleSlug: 'white-dew-oath-ledger',
    tone: 'warn',
    layer: 4,
  },
  {
    id: 't-186-2',
    when: '玄历一八六年 · 霜降',
    title: '细则落地',
    detail: '抄三份、贴三处、问三遍：把誓纸上的字变成能照着做的路。',
    long: '公议之后最怕“字好听、人走散”。轩少做得很少：抄三份，贴三处，问三遍——让细则可见、可用、可对照。规矩不是用来显威望，是用来防走偏。',
    chronicleSlug: 'oath-clauses-made-usable',
    tone: 'warn',
    layer: 4,
  },
  {
    id: 't-187-1',
    when: '玄历一八七年 · 立冬',
    title: '众望而后立',
    detail: '“轩天帝”写进盟约；私下仍称“轩少”。',
    long: '“轩天帝”多用于公文抬头；私下仍叫“轩少”。他更愿意被记作一个端秤的人，而不是被吹成天上来的神话。',
    chronicleSlug: 'after-ascension-not-boast',
    tone: 'bright',
    layer: 4,
  },
]
