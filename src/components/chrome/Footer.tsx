import { APP_VERSION } from '../../lib/constants'

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-6 lg:px-10">
      <div className="glass flex flex-col gap-3 rounded-xl2 px-5 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-fg">修仙纪事 · 轩天帝（轩少）</div>
          <div className="text-xs text-muted/80">少夸饰，多落地。句句为人话。</div>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs text-muted/70 md:justify-end">
          <span>版本 {APP_VERSION}</span>
          <span className="hidden md:inline">·</span>
          <span>按 Ctrl/⌘ + K 唤起灵镜</span>
        </div>
      </div>
    </footer>
  )
}

