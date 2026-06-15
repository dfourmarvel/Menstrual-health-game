import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        msgs = []
        page.on('console', lambda msg: msgs.append(msg.text))
        await page.goto('http://localhost:8000/index.html')
        await page.wait_for_timeout(2000)
        print('Console:', msgs)
        await browser.close()

asyncio.run(run())