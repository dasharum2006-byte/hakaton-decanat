import puppeteer from 'puppeteer-core'
const base = 'http://localhost:4173'
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true })

const overflow = async (label) => {
  const res = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
    body: document.body.innerText.slice(0, 120).replace(/\n/g, ' | '),
  }))
  console.log(label, res.sw > res.cw + 1 ? `OVERFLOW ${res.sw}>${res.cw}` : 'ok', '|', res.body)
}

// 1. Логин: неверный пароль
await page.goto(base + '/#/login', { waitUntil: 'networkidle0' })
await page.type('#login', 'anna')
await page.type('#password', 'wrong')
await page.click('button[type=submit]')
await new Promise((r) => setTimeout(r, 600))
const err = await page.evaluate(() => document.body.innerText.includes('Неверный пароль'))
console.log('wrong-password-error:', err)

// 2. Логин верный (перезагрузка, чтобы сбросить состояние формы)
await page.reload({ waitUntil: 'networkidle0' })
await page.type('#login', 'anna')
await page.type('#password', 'demo1234')
await page.click('button[type=submit]')
await new Promise((r) => setTimeout(r, 900))
console.log('logged-in:', page.url().includes('/home'))
await overflow('home@360')

// 3. Создание заявки
await page.goto(base + '/#/requests/new?type=r_edu', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 300))
await overflow('request-new@360')
// выбрать обязательные опции в каждом вопросе
const clickText = async (selector, text) => {
  const h = await page.evaluateHandle((sel, t) => [...document.querySelectorAll(sel)].find((b) => b.textContent.trim() === t), selector, text)
  if (h.asElement()) await h.asElement().click()
}
await clickText('[role=radio]', 'Военкомат')
await clickText('[role=radio]', 'Стандартная')
const nextBtn = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Далее'))
if (nextBtn) await nextBtn.asElement().click()
await new Promise((r) => setTimeout(r, 500))
const onReview = await page.evaluate(() => document.body.innerText.includes('Проверьте данные'))
console.log('step-3:', onReview)
const sendBtn = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Отправить')))
if (sendBtn) await sendBtn.asElement().click()
await new Promise((r) => setTimeout(r, 800))
const created = await page.evaluate(() => document.body.innerText)
console.log('created-number:', (created.match(/Д-2026-\d+/) || [])[0], '| new-status:', created.includes('Создана'))
await overflow('request-detail@360')

// 4. авто-статус через 22 секунды
await new Promise((r) => setTimeout(r, 22000))
const after = await page.evaluate(() => document.body.innerText)
console.log('auto-advanced:', /В работе|Подписана|Готова/.test(after))

// 5. уведомления, профиль, тема
await page.goto(base + '/#/notifications', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 300))
await overflow('notifications@360')
await page.goto(base + '/#/profile', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 300))
await overflow('profile@360')
const darkBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'))
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Тёмная тема') || b.textContent.includes('Светлая тема'))?.click())
await new Promise((r) => setTimeout(r, 300))
const darkAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'))
console.log('theme-toggle:', darkBefore, '->', darkAfter)

// 6. чат: проверить ответ про окна
await page.goto(base + '/#/assistant', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 300))
await page.type('input[aria-label="Сообщение помощнику"]', 'Когда окна?')
await page.keyboard.press('Enter')
await new Promise((r) => setTimeout(r, 1200))
const chat = await page.evaluate(() => document.body.innerText)
console.log('chat-answer-windows:', chat.includes('свободные окна'))
console.log('chat-no-raw-error:', !chat.includes('не понял вопрос'))
await overflow('assistant@360')

// 7. выход и вход сотрудником
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Выйти'))?.click())
await new Promise((r) => setTimeout(r, 500))
await page.goto(base + '/#/demo', { waitUntil: 'networkidle0' })
const staffBtn = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Войти' && b.closest('article')?.innerText.toLowerCase().includes('деканат')))
if (staffBtn.asElement()) await staffBtn.asElement().click()
await new Promise((r) => setTimeout(r, 800))
console.log('staff-page:', await page.evaluate(() => document.body.innerText.includes('Заявки студентов')))
await overflow('staff@360')

// 8. студент не может открыть staff
await page.goto(base + '/#/demo', { waitUntil: 'networkidle0' })
const annaBtn = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Войти как Анна')))
if (annaBtn.asElement()) await annaBtn.asElement().click()
await new Promise((r) => setTimeout(r, 700))
await page.goto(base + '/#/staff', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 700))
console.log('student-blocked-from-staff:', page.url().includes('/home') || await page.evaluate(() => document.body.innerText.includes('Привет')))

console.log('ERRORS:', errors.length ? errors : 'none')
await browser.close()
