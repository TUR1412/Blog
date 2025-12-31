import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

async function expectNoSeriousA11yViolations(page: Page, context: string) {
  const results = await new AxeBuilder({ page })
    // 颜色对比受主题/显示器/环境影响较大，先聚焦结构性问题（serious/critical）
    .disableRules(['color-contrast'])
    .analyze()

  const violations = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  const summary = violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    help: v.help,
    nodes: v.nodes.slice(0, 8).map((n) => n.target),
  }))

  expect(summary, `A11y(${context}) serious/critical violations`).toEqual([])
}

test('A11y：首页/主导航', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible()
  await expectNoSeriousA11yViolations(page, 'home')
})

test('A11y：灵镜（命令面板）', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '打开灵镜检索' }).click()
  await expect(page.getByRole('dialog', { name: '灵镜检索' })).toBeVisible()
  await expectNoSeriousA11yViolations(page, 'command-palette')
})

test('A11y：札记页 + Confirm', async ({ page }) => {
  await page.goto('/#/notes')
  await expect(page.getByRole('heading', { name: '修行札记' })).toBeVisible()

  const clear = page.getByRole('button', { name: '清空（慎）' })
  await clear.scrollIntoViewIfNeeded()
  await clear.click()
  await expect(page.getByRole('dialog', { name: '清空札记' })).toBeVisible()

  await expectNoSeriousA11yViolations(page, 'notes+confirm')
})
