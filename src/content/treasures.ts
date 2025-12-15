export type Treasure = {
  id: string
  name: string
  kind: string
  origin: string
  description: string
  note?: string
}

export const defaultTreasures: Treasure[] = [
  {
    id: 't-chal-1',
    name: '旧茶盏',
    kind: '旧物',
    origin: '青冥山外小市集',
    description:
      '盏口有细裂，常被他随手带着。不是法器，却能让人心里慢下来：喝一口，急气就散半分。',
    note: '他常说：真正的稳，不在器物，在人心。',
  },
  {
    id: 't-lamp-1',
    name: '门外灯芯',
    kind: '旧物',
    origin: '青冥山门旧灯',
    description:
      '霜月那盏旧灯换下来的灯芯，被他收在小木盒里。每次外院新弟子迷路，他就点上，让他们看见路口。',
  },
  {
    id: 't-weight-1',
    name: '经阁镇纸',
    kind: '旧物',
    origin: '青冥内门藏经阁',
    description:
      '一块不起眼的镇纸，边角磨得圆。夏至抄经时，他常压在纸角：不是为了“好看”，只是让风翻不起页，让人心浮不起半分。',
    note: '他说：字要压得住，心才不飘。',
  },
  {
    id: 't-seal-1',
    name: '公议印',
    kind: '器印',
    origin: '诸宗公议所铸',
    description:
      '不是用来压人的印，而是用来压规矩的印。每次落印，都意味着一条边界被写清楚。',
    note: '用印之前，他先问三遍：这条规矩能不能约束强者？',
  },
  {
    id: 't-sword-1',
    name: '点脊剑',
    kind: '佩剑',
    origin: '四海问剑后自磨',
    description:
      '剑锋不求极锐，反而在剑脊上留出“点”的分寸。擂台上常用来偏开对方力道，不必见血。',
  },
  {
    id: 't-scroll-1',
    name: '药单册',
    kind: '札册',
    origin: '北境医馆',
    description:
      '一页页都是病名、脉象、忌口、回访。比丹药更贵的是这份次序。灾后留册，医馆才不至乱。',
  },
  {
    id: 't-follow-1',
    name: '回访表',
    kind: '札册',
    origin: '北境巡访后所留',
    description:
      '一张薄纸，四格：姓名、症候、禁忌、下次复诊日期。写满一张才算一人。它不神奇，却最能防“风头过后就松手”。',
    note: '他留的不是“恩”，是能被重复使用的路。',
  },
  {
    id: 't-stone-1',
    name: '清泉界石',
    kind: '石契',
    origin: '青冥山脚清泉',
    description:
      '几块不起眼的石头，刻着轮次与方向。不是威压谁，而是让争端少一次、误会少一回。',
    note: '界石不吓人，只提醒人：别把“方便”当成“理所当然”。',
  },
  {
    id: 't-rope-1',
    name: '钟楼绳结',
    kind: '旧物',
    origin: '青冥钟楼',
    description:
      '一截旧绳上打着两处止断结。结法极朴素，却让值夜的人敢用力——该响的钟，能响得出来。',
    note: '他不喜欢花架子，只喜欢“能用”的稳。',
  },
]
