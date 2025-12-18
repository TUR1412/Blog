import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, useReducedMotion } from 'framer-motion'
import { GripVertical, RotateCcw } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'
import { defaultTreasures, type Treasure } from '../content/treasures'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { cn } from '../lib/cn'
import { STORAGE_KEYS } from '../lib/constants'

function buildDefaultOrder() {
  return defaultTreasures.map((t) => t.id)
}

export function TreasuryPage() {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const [order, setOrder] = useLocalStorageState<string[]>(STORAGE_KEYS.treasureOrder, buildDefaultOrder())
  const [openId, setOpenId] = useState<string | null>(null)
  const reduceMotion = useReducedMotion() ?? false

  const list = useMemo(() => {
    const map = new Map(defaultTreasures.map((t) => [t.id, t] as const))
    const ordered = order.map((id) => map.get(id)).filter(Boolean) as Treasure[]
    const missing = defaultTreasures.filter((t) => !order.includes(t.id))
    return [...ordered, ...missing]
  }, [order])

  const ids = useMemo(() => list.map((t) => t.id), [list])

  return (
    <div className="space-y-6">
      <Card className="p-7 md:p-10">
        <Badge className="mb-4">藏品</Badge>
        <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">法宝与旧物</h2>
        <p className="mt-3 max-w-[82ch] text-sm leading-7 text-muted/85">
          这里不摆“惊天神器”，只放与轩少行止相合的物件：旧茶盏、灯芯、药单册、公议印……可拖拽排序，
          像把旧物摆回心里合适的位置。
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <SectionHeading title="说明" subtitle="排序会记住，刷新不丢。" />
          <div className="rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-sm leading-7 text-muted/85">
            <div className="font-semibold text-fg">拖拽手感</div>
            <div className="mt-2 text-sm text-muted/85">
              轻拖即可换位。这里的“Q 弹”不是噱头，而是让手指知道：它真的动了。
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOrder(buildDefaultOrder())
                setOpenId(null)
              }}
              className="w-full justify-start"
            >
              <RotateCcw className="h-4 w-4" />
              重置排序
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-xs leading-6 text-muted/80">
            小提示：点开卡片可展开细节；展开状态不会影响排序。
          </div>
        </Card>

        <Card className="lg:col-span-8">
          <SectionHeading title="藏品列表" subtitle="拖拽卡片左侧把手即可换位。" />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event
              if (!over) return
              if (active.id === over.id) return
              const oldIndex = ids.indexOf(String(active.id))
              const newIndex = ids.indexOf(String(over.id))
              if (oldIndex < 0 || newIndex < 0) return
              setOrder(arrayMove(ids, oldIndex, newIndex))
            }}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="grid gap-2">
                {list.map((t) => (
                  <SortableTreasureCard
                    key={t.id}
                    treasure={t}
                    open={openId === t.id}
                    onToggle={() => setOpenId((cur) => (cur === t.id ? null : t.id))}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </Card>
      </div>
    </div>
  )
}

function SortableTreasureCard({
  treasure,
  open,
  onToggle,
  reduceMotion,
}: {
  treasure: Treasure
  open: boolean
  onToggle: () => void
  reduceMotion: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: treasure.id,
  })

  const hasDndTransform = Boolean(transform)
  const allowLayout = !reduceMotion && !isDragging && !hasDndTransform

  const style: CSSProperties | undefined = hasDndTransform
    ? { transform: CSS.Transform.toString(transform), transition }
    : allowLayout
      ? { willChange: 'transform' }
      : undefined

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-70')}
      layout={allowLayout ? 'position' : undefined}
      transition={allowLayout ? { duration: 0.22, ease: [0.22, 1, 0.36, 1] } : undefined}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'focus-ring tap w-full rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-left',
          'hover:bg-white/7',
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'mt-0.5 grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-white/5 text-muted/80',
              isDragging && 'bg-white/10 text-fg/90',
            )}
            aria-label="拖拽把手"
            {...attributes}
            {...listeners}
            onClick={(e) => e.preventDefault()}
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-fg">{treasure.name}</div>
                <div className="mt-1 text-xs text-muted/70">
                  {treasure.kind} · {treasure.origin}
                </div>
              </div>
              <div className="text-xs text-muted/70">{open ? '收起' : '展开'}</div>
            </div>

            <div className="mt-2 text-sm leading-7 text-muted/85">{treasure.description}</div>

            <motion.div
              initial={false}
              animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className="overflow-hidden"
            >
              {treasure.note ? (
                <div className="mt-3 rounded-xl border border-border/60 bg-white/4 px-4 py-3 text-sm leading-7 text-muted/85">
                  {treasure.note}
                </div>
              ) : null}
            </motion.div>
          </div>
        </div>
      </button>
    </motion.div>
  )
}
