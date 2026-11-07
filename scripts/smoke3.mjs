import puppeteer from 'puppeteer-core'
const base = 'http://localhost:4173'
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })

await page.goto(base + '/#/demo', { waitUntil: 'networkidle0' })
const clicks = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Войти' && b.closest('article')?.innerText.includes('Специалист деканата'))
  if (btn) { btn.click(); return true }
  return false
})
await new Promise((r) => setTimeout(r, 900))
console.log('staff-clicked:', clicks, '| url:', page.url())
const body = await page.evaluate(() => document.body.innerText)
console.log('staff-dashboard:', body.includes('Заявки студентов'))
console.log('shows-student-names:', body.includes('Соколова') && body.includes('Ветров'))

// смена статуса
const act = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Взять в работу'))
  if (b) { b.click(); return true }
  return false
})
await new Promise((r) => setTimeout(r, 600))
console.log('status-action:', act)

// изоляция: сотрудник видит чужую заявку
await page.goto(base + '/#/requests/req_1001', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 500))
const detail = await page.evaluate(() => document.body.innerText)
console.log('staff-sees-detail:', detail.includes('Справка об обучении'), '| forbidden:', detail.includes('Нет доступа'))

// десктоп: сайдбар
await page.setViewport({ width: 1280, height: 900 })
await page.goto(base + '/#/staff', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 500))
const sidebar = await page.evaluate(() => {
  const nav = [...document.querySelectorAll('nav a')].map((a) => a.textContent.trim())
  return { nav, sidebarVisible: !!document.querySelector('aside')?.getBoundingClientRect().width }
})
console.log('desktop-nav:', JSON.stringify(sidebar))

console.log('ERRORS:', errors.length ? errors : 'none')
await browser.close()
