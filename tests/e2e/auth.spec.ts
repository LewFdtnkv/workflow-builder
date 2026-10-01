import { expect, test } from '@playwright/test'

test('shows authentication form and allows switching to registration', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Flowcraft' })).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Пароль')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible()

  await page.getByRole('button', { name: 'Нет аккаунта? Регистрация' }).click()
  await expect(page.getByRole('button', { name: 'Создать аккаунт' })).toBeVisible()
})
