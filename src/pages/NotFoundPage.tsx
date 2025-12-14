import { ArrowLeft } from 'lucide-react'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-[820px]">
      <Card className="p-8">
        <SectionHeading title="此处无卷" subtitle="路走偏了，也不必慌。回到明处再走。" />
        <div className="text-sm leading-7 text-muted/85">
          你要找的页面不存在，可能是旧地址，也可能是你走得太快。这里不放生硬的报错字句，只留一条回路。
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <ButtonLink to="/" variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            回洞天
          </ButtonLink>
          <ButtonLink to="/chronicles">去看纪事</ButtonLink>
        </div>
      </Card>
    </div>
  )
}
