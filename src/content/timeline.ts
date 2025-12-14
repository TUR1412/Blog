export type TimelineEvent = {
  id: string
  when: string
  title: string
  detail: string
  long?: string
  chronicleSlug?: string
  tone?: 'calm' | 'bright' | 'warn'
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
  },
  {
    id: 't-176-1',
    when: '玄历一七六年 · 夏至',
    title: '内门初入',
    detail: '开始抄经与守夜，常把“稳”挂在嘴边。',
    long: '内门规矩更细：火候、心气、值夜的时辰都要对得上。他不爱讲大道理，只把“该做的事”做得干净。',
    tone: 'calm',
  },
  {
    id: 't-178-1',
    when: '玄历一七八年 · 春分',
    title: '四海问剑',
    detail: '擂台上留一线，胜负分明，人心不碎。',
    long: '他赢得不靠狠话，靠分寸：该止就止，该收就收。对手输得明白，也留得住脸面。',
    chronicleSlug: 'four-seas-sword-asking',
    tone: 'bright',
  },
  {
    id: 't-180-1',
    when: '玄历一八〇年 · 雨水',
    title: '断桥旧约',
    detail: '守一诺，不借名头讨便宜；小事里炼心。',
    long: '他说“欠的是汤钱，不是名头”。于是还账、请医、修木板，一件件做完，像把一段人情摆回正路。',
    chronicleSlug: 'broken-bridge-old-promise',
    tone: 'calm',
  },
  {
    id: 't-182-1',
    when: '玄历一八二年 · 小满',
    title: '清泉立界',
    detail: '把争端写成规矩，立石为证，省去来年吵闹。',
    long: '清泉不大，却牵动三村与药圃。轩少不以名头压人，只把时辰、桶数、轮次写清，再立几块界石，让人“记得住、照着做”。',
    chronicleSlug: 'clear-spring-boundary-stones',
    tone: 'warn',
  },
  {
    id: 't-183-1',
    when: '玄历一八三年 · 大暑',
    title: '北境救荒',
    detail: '以丹救人，不以丹换名；把次序留在医馆。',
    long: '他留的是药单与回访的次序：谁先稳气血、谁忌什么、何时再诊。人救回来之后，医馆也能照着办下去。',
    chronicleSlug: 'northern-famine-dan-rescue',
    tone: 'bright',
  },
  {
    id: 't-184-1',
    when: '玄历一八四年 · 寒露',
    title: '钟楼守夜',
    detail: '修旧绳、改轮值；夜里若真有事，先让人活着醒来。',
    long: '他把守夜写成册：先敲小钟，再派两人去看；不许一个人逞强。少了“英雄”，多了平安。',
    chronicleSlug: 'bell-tower-night-watch',
    tone: 'calm',
  },
  {
    id: 't-186-1',
    when: '玄历一八六年 · 白露',
    title: '诸宗公议',
    detail: '提出可执行细则，先立边界，再谈威望。',
    long: '他把誓词翻出来逐条对照，逼众人面对自己的承诺。规矩之所以能立住，是因为它也能约束“强者”。',
    tone: 'warn',
  },
  {
    id: 't-187-1',
    when: '玄历一八七年 · 立冬',
    title: '众望而后立',
    detail: '“轩天帝”写进盟约；私下仍称“轩少”。',
    long: '“轩天帝”多用于公文抬头；私下仍叫“轩少”。他更愿意被记作一个端秤的人，而不是被吹成天上来的神话。',
    chronicleSlug: 'after-ascension-not-boast',
    tone: 'bright',
  },
]
