"""Camoufox starter template.

Cách dùng:
    python camoufox_starter.py

Đổi URL, selector và logic trong hàm run() theo nhu cầu.
"""

from camoufox.sync_api import Camoufox


DEFAULT_URL = "https://example.com"
HEADLESS = True
SCREENSHOT_PATH = "camoufox_starter.png"


def run(url: str = DEFAULT_URL, headless: bool = HEADLESS):
    with Camoufox(headless=headless) as browser:
        page = browser.new_page()
        page.goto(url, wait_until="domcontentloaded")

        result = {
            "title": page.title(),
            "url": page.url,
        }

        if page.locator("h1").count() > 0:
            result["h1"] = page.locator("h1").first.inner_text()

        page.screenshot(path=SCREENSHOT_PATH, full_page=True)
        result["screenshot"] = SCREENSHOT_PATH
        return result


if __name__ == "__main__":
    output = run()
    print(output)
