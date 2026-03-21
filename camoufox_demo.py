from camoufox.sync_api import Camoufox


def main():
    with Camoufox(headless=True) as browser:
        page = browser.new_page()
        page.goto("https://example.com", wait_until="domcontentloaded")
        print("Title:", page.title())
        print("URL:", page.url)
        print("H1:", page.locator("h1").inner_text())
        page.screenshot(path="camoufox_example.png", full_page=True)
        print("Saved screenshot: camoufox_example.png")


if __name__ == "__main__":
    main()
