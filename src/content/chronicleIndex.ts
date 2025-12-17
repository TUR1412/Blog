export type ChronicleMeta = {
  slug: string
  title: string
  dateText: string
  tags: string[]
  excerpt: string
}

export const chronicleIndex: ChronicleMeta[] = [
  {
    slug: 'frost-moon-lantern',
    title: '霜月入山：青冥门外的一盏灯',
    dateText: '玄历一七四年 · 霜月',
    tags: ['入门', '宗门', '行止'],
    excerpt:
      '轩少第一次踏进青冥山时，并无惊天异象。只有门外一盏旧灯，照见他衣袖里的尘与手背的冻裂。',
  },
  {
    slug: 'summer-solstice-sutra-copying',
    title: '夏至抄经：火候未到，先把字写正',
    dateText: '玄历一七六年 · 夏至',
    tags: ['内门', '抄经', '稳'],
    excerpt:
      '内门里最先磨人的，不是斗法，是纸墨与时辰。夏至那段日子，轩少抄经抄到手酸，却不肯抄捷径：他说先把字写正，心才不会歪。',
  },
  {
    slug: 'four-seas-sword-asking',
    title: '四海问剑：不争之胜',
    dateText: '玄历一七八年 · 春分',
    tags: ['问剑', '名声', '分寸'],
    excerpt:
      '四海问剑的擂台上，轩少赢得不多话。每一场都像在讲一个道理：胜负要分清，但人心不必踩碎。',
  },
  {
    slug: 'broken-bridge-old-promise',
    title: '断桥旧约：守一诺，拒蝇营',
    dateText: '玄历一八〇年 · 雨水',
    tags: ['守诺', '断桥', '人情'],
    excerpt:
      '断桥边的热汤摊，欠账不大，却最容易让人走偏。轩少说欠的是汤钱，不是名头：该还的还，该修的修，别让“便宜”从人情里钻出来。',
  },
  {
    slug: 'clear-spring-boundary-stones',
    title: '清泉立界：把争端写成规矩',
    dateText: '玄历一八二年 · 小满',
    tags: ['立界', '规矩', '争端'],
    excerpt:
      '清泉不大，却牵动三村与药圃。轩少不以名头压人，只把时辰、桶数、轮次写清，再立界石为证，让来年也能照着做。',
  },
  {
    slug: 'northern-famine-dan-rescue',
    title: '北境救荒：以丹救人，不以丹换名',
    dateText: '玄历一八三年 · 大暑',
    tags: ['救荒', '医馆', '次序'],
    excerpt:
      '救荒最怕“热闹过后无章法”。轩少留下的不是旗号，是药单与回访的次序：谁先稳气血、谁忌什么、何时再诊，都写得清清楚楚。',
  },
  {
    slug: 'bell-tower-night-watch',
    title: '钟楼守夜：把“英雄”换成流程',
    dateText: '玄历一八四年 · 寒露',
    tags: ['守夜', '流程', '稳'],
    excerpt:
      '守夜不是逞强，是避免补漏。轩少修旧绳、改轮值，夜里真有事，先让人活着醒来：少一点英雄，多一点平安。',
  },
  {
    slug: 'followup-ledger-walk',
    title: '巡访回访：风过之后，路要还在',
    dateText: '玄历一八五年 · 谷雨',
    tags: ['回访', '对账', '补空'],
    excerpt:
      '救人不是一阵风。风过了，账目、公示、药单与次序要还在。轩少带着薄册巡访：看流程是否还在用，看空处是否被补上。',
  },
  {
    slug: 'white-dew-oath-ledger',
    title: '白露誓账：把誓词翻出来逐条对照',
    dateText: '玄历一八六年 · 白露',
    tags: ['公议', '誓词', '对照'],
    excerpt:
      '他不让人靠嗓门赢，只让人靠对照负责。誓词能约束强者，才算规矩；只束弱者，不过是纸。',
  },
  {
    slug: 'oath-clauses-made-usable',
    title: '霜降细则：抄三份，贴三处，问三遍',
    dateText: '玄历一八六年 · 霜降',
    tags: ['细则', '落地', '公示'],
    excerpt:
      '公议之后最怕“字好听、人走散”。轩少做得很少：抄三份、贴三处、问三遍——让细则可见、可用、可对照。',
  },
  {
    slug: 'after-ascension-not-boast',
    title: '立冬盟约：名号写进纸，做人留在地',
    dateText: '玄历一八七年 · 立冬',
    tags: ['盟约', '名号', '分寸'],
    excerpt:
      '“轩天帝”四字写进盟约，多用于公文抬头；私下仍有人叫他“轩少”。他更愿意被记作端秤的人，而不是被吹成神话。',
  },
  {
    slug: 'winter-solstice-archiving',
    title: '冬至封卷：把账写给后来人',
    dateText: '玄历一八八年 · 冬至',
    tags: ['归档', '立规', '分寸'],
    excerpt:
      '冬至雪夜，公议台上灯火未熄。轩少把旧案与公费摊开，不许“口头算了”：他说把账写清，才配谈威望。',
  },
  {
    slug: 'new-year-balance-scale',
    title: '正月端秤：把“差不多”压回刻度里',
    dateText: '玄历一八九年 · 正月',
    tags: ['端秤', '对账', '立规'],
    excerpt:
      '冬至封卷之后，最容易松的一口气，往往会变成“差不多”。正月里，轩少借来一杆旧秤，先校量、再落笔：刻度不吓人，却能让争端少一半。',
  },
  {
    slug: 'spring-flood-ferry-ledger',
    title: '清明渡口：把“先后”写成一张名单',
    dateText: '玄历一九〇年 · 清明',
    tags: ['渡口', '次序', '立规'],
    excerpt:
      '春汛水涨，渡口人多。有人想靠嗓门抢位，有人想靠名头插队。轩少没争高低，只把“先后”写成一张名单：写得清，队伍就不乱。',
  },
]

export function getChronicleMetaBySlug(slug: string) {
  return chronicleIndex.find((c) => c.slug === slug) ?? null
}

export function getAllTags() {
  const set = new Set<string>()
  for (const c of chronicleIndex) for (const t of c.tags) set.add(t)
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
}

