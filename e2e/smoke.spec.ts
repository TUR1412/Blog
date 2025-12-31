import { expect, test } from '@playwright/test'

test('导航可用 + 主题切换生效', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible()
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '札记' }).click()
  await expect(page.getByRole('heading', { name: '修行札记' })).toBeVisible()

  await page.getByRole('button', { name: '切换主题' }).click()
  await page.getByRole('menuitemradio', { name: '深色' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  // 主题持久化：刷新后仍保持 data-theme
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.getByRole('button', { name: '切换主题' }).click()
  await page.getByRole('menuitemradio', { name: '跟随系统' }).click()
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /^(dark|light)$/)
})

test('危险操作走 Confirm（可取消）', async ({ page }) => {
  await page.goto('/#/notes')
  await expect(page.getByRole('heading', { name: '修行札记' })).toBeVisible()

  const clear = page.getByRole('button', { name: '清空（慎）' })
  await clear.scrollIntoViewIfNeeded()
  await clear.click()

  const dialog = page.getByRole('dialog', { name: '清空札记' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '取消' }).click()
  await expect(dialog).toBeHidden()

  // 键盘取消：Esc 关闭
  await clear.click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('札记编辑内容可持久化（刷新不丢）', async ({ page }) => {
  await page.goto('/#/notes?view=edit')
  await expect(page.getByRole('heading', { name: '修行札记' })).toBeVisible()

  const editor = page.getByPlaceholder(/写点真话/)
  const stamp = `E2E-${Date.now()}`
  await editor.fill(`这一行来自 e2e：${stamp}`)

  await page.waitForFunction((needle) => {
    const raw = window.localStorage.getItem('xuantian.notes.v1') ?? ''
    return raw.includes(needle)
  }, stamp)

  await page.reload()
  await expect(page.getByPlaceholder(/写点真话/)).toHaveValue(new RegExp(stamp))
})
