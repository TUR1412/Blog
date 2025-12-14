export type TimelineEvent = {
  id: string
  when: string
  title: string
  detail: string
  tone?: 'calm' | 'bright' | 'warn'
}

export const timeline: TimelineEvent[] = [
  {
    id: 't-174-1',
    when: '玄历一七四年 · 霜月',
    title: '入青冥山门',
    detail: '外院挑水三日，不抢前路，先学规矩。',
    tone: 'calm',
  },
  {
    id: 't-176-1',
    when: '玄历一七六年 · 夏至',
    title: '内门初入',
    detail: '开始抄经与守夜，常把“稳”挂在嘴边。',
    tone: 'calm',
  },
  {
    id: 't-178-1',
    when: '玄历一七八年 · 春分',
    title: '四海问剑',
    detail: '擂台上留一线，胜负分明，人心不碎。',
    tone: 'bright',
  },
  {
    id: 't-180-1',
    when: '玄历一八〇年 · 雨水',
    title: '断桥旧约',
    detail: '守一诺，不借名头讨便宜；小事里炼心。',
    tone: 'calm',
  },
  {
    id: 't-183-1',
    when: '玄历一八三年 · 大暑',
    title: '北境救荒',
    detail: '以丹救人，不以丹换名；把次序留在医馆。',
    tone: 'bright',
  },
  {
    id: 't-186-1',
    when: '玄历一八六年 · 白露',
    title: '诸宗公议',
    detail: '提出可执行细则，先立边界，再谈威望。',
    tone: 'warn',
  },
  {
    id: 't-187-1',
    when: '玄历一八七年 · 立冬',
    title: '众望而后立',
    detail: '“轩天帝”写进盟约；私下仍称“轩少”。',
    tone: 'bright',
  },
]

