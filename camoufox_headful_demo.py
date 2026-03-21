from camoufox.sync_api import Camoufox


def main():
    with Camoufox(headless=False) as browser:
        page = browser.new_page()
        page.goto("https://example.com", wait_until="domcontentloaded")
        print("Title:", page.title())
        print("URL:", page.url)
        print("H1:", page.locator("h1").inner_text())
        page.screenshot(path="camoufox_headful_example.png", full_page=True)
        print("Saved screenshot: camoufox_headful_example.png")
        page.wait_for_timeout(5000)


if __name__ == "__main__":
    main()
