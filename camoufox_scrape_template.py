from camoufox.sync_api import Camoufox


def main():
    with Camoufox(headless=True) as browser:
        page = browser.new_page()

        # 1) Mở trang
        page.goto("https://example.com", wait_until="domcontentloaded")

        # 2) Ví dụ thao tác
        # page.click("text=More information")
        # page.fill("input[name='q']", "camoufox")
        # page.press("input[name='q']", "Enter")

        # 3) Ví dụ lấy dữ liệu
        data = {
            "title": page.title(),
            "url": page.url,
            "h1": page.locator("h1").inner_text(),
            "paragraphs": page.locator("p").all_inner_texts(),
            "links": page.locator("a").evaluate_all(
                "els => els.map(a => ({text: a.innerText, href: a.href}))"
            ),
        }

        print(data)
        page.screenshot(path="camoufox_scrape_template.png", full_page=True)
        print("Saved screenshot: camoufox_scrape_template.png")


if __name__ == "__main__":
    main()
