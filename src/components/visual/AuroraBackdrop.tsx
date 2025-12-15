import { ASSET_VERSION } from '../../lib/constants'

export function AuroraBackdrop() {
  const noiseUrl = `${import.meta.env.BASE_URL}noise.svg?v=${ASSET_VERSION}`
  return (
    <div className="aurora-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-bg" />

      <div className="aurora-backdrop__glows absolute inset-0">
        <div className="aurora-glow absolute -left-24 -top-24 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.55),transparent_62%)] blur-3xl" />
        <div className="aurora-glow absolute -right-32 top-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.50),transparent_62%)] blur-3xl" />
        <div className="aurora-glow aurora-glow--center absolute left-1/2 top-[42vh] h-[720px] w-[980px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,.10),transparent_66%)] blur-3xl" />
      </div>

      <div
        className="aurora-noise absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage: `url(${noiseUrl})`,
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="aurora-vignette absolute inset-0 bg-gradient-to-b from-transparent via-bg/10 to-bg" />
    </div>
  )
}
