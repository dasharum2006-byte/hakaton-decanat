import puppeteer from 'puppeteer-core'

const base = 'http://localhost:4173'
const errors = []

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const page = await browser.newPage()
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('CONSOLE: ' + m.text())
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await page.goto(base + '/', { waitUntil: 'networkidle0' })
await page.screenshot({ path: '/tmp/shots/01-landing-mobile.png', fullPage: true })

// Демо-аккаунты
await page.goto(base + '/#/demo', { waitUntil: 'networkidle0' })
await page.screenshot({ path: '/tmp/shots/02-demo.png', fullPage: true })

// Вход как Анна: первая кнопка "Войти как"
const buttons = await page.$$('button')
for (const b of buttons) {
  const t = await page.evaluate((el) => el.textContent, b)
  if (t && t.includes('Войти как Анна')) { await b.click(); break }
}
await new Promise((r) => setTimeout(r, 1200))
await page.screenshot({ path: '/tmp/shots/03-dashboard-mobile.png', fullPage: true })

for (const [path, name] of [
  ['#/schedule', '04-schedule'],
  ['#/grades', '05-grades'],
  ['#/requests', '06-requests'],
  ['#/requests/new', '07-request-new'],
  ['#/assistant', '08-assistant'],
  ['#/notifications', '09-notifications'],
  ['#/profile', '10-profile'],
]) {
  await page.goto(base + '/' + path, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 400))
  await page.screenshot({ path: `/tmp/shots/${name}.png`, fullPage: true })
}

// проверка изоляции: чужая заявка
await page.goto(base + '/#/requests/req_2001', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 400))
const forbidden = await page.evaluate(() => document.body.innerText.includes('Нет доступа'))
await page.screenshot({ path: '/tmp/shots/11-forbidden.png', fullPage: true })

// чат-помощник: открыть, отправить вопрос
await page.goto(base + '/#/home', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 500))
const chatBtn = await page.$('button[aria-label="Открыть помощника деканата"]')
if (chatBtn) {
  await chatBtn.click()
  await new Promise((r) => setTimeout(r, 500))
  const input = await page.$('input[aria-label="Сообщение помощнику"]')
  await input.type('Когда окна?')
  await page.keyboard.press('Enter')
  await new Promise((r) => setTimeout(r, 1200))
  await page.screenshot({ path: '/tmp/shots/12-chat.png', fullPage: true })
}

// десктоп
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 })
await page.goto(base + '/#/home', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 600))
await page.screenshot({ path: '/tmp/shots/13-dashboard-desktop.png', fullPage: true })
await page.goto(base + '/#/schedule', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 400))
await page.screenshot({ path: '/tmp/shots/14-schedule-desktop.png', fullPage: true })

console.log('FORBIDDEN_OK:', forbidden)
console.log('ERRORS:', errors.length ? errors : 'none')
await browser.close()
