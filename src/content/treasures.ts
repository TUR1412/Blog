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
]

