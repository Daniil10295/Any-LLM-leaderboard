import type { IconType } from 'react-icons'
import {
  SiAlibabacloud,
  SiAnthropic,
  SiDeepseek,
  SiGoogle,
  SiMeta,
  SiMinimax,
  SiMistralai,
  SiX,
  SiXiaomi,
} from 'react-icons/si'
import { BsOpenai } from 'react-icons/bs'
import { MoonStar } from 'lucide-react'
import type { Provider } from '../types'

const icons: Record<string, IconType> = {
  openai: BsOpenai,
  anthropic: SiAnthropic,
  google: SiGoogle,
  meta: SiMeta,
  mistralai: SiMistralai,
  x: SiX,
  deepseek: SiDeepseek,
  alibabacloud: SiAlibabacloud,
  xiaomi: SiXiaomi,
  minimax: SiMinimax,
}

type ProviderLogoProps = {
  provider: Provider
  size?: 'sm' | 'md' | 'lg' | 'xl'
  inverse?: boolean
}

export function ProviderLogo({ provider, size = 'md', inverse = false }: ProviderLogoProps) {
  const Logo = provider.logoKey ? icons[provider.logoKey] : undefined
  const isMoonshot = provider.id === 'moonshot'
  const color = inverse ? '#ffffff' : provider.accent

  return (
    <span
      className={`provider-logo provider-logo--${size}${inverse ? ' provider-logo--inverse' : ''}`}
      style={{ color, borderColor: inverse ? 'rgba(255,255,255,.17)' : `${provider.accent}35` }}
      title={provider.name}
      aria-label={`${provider.name} logo`}
    >
      {Logo ? <Logo aria-hidden="true" /> : isMoonshot ? <MoonStar aria-hidden="true" /> : <b aria-hidden="true">{provider.name.slice(0, 1)}</b>}
    </span>
  )
}
