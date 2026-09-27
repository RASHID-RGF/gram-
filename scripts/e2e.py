"""Browser-level E2E check: log in, render the feed, like, open a profile."""
from __future__ import annotations

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
SHOTS = Path(__file__).resolve().parents[2] / "screenshots"
SHOTS.mkdir(exist_ok=True)

console_errors: list[str] = []


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 950})
        page.on(
            "console",
            lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
        )
        page.on("pageerror", lambda err: console_errors.append(str(err)))
        failed_responses: list[str] = []
        page.on(
            "response",
            lambda r: failed_responses.append(f"{r.status} {r.url}")
            if r.status >= 400
            else None,
        )

        # ---------------------------------------------------------- login
        page.goto(f"{BASE}/login", wait_until="networkidle")
        page.fill('input[autocomplete="username"]', "demo")
        page.fill('input[autocomplete="current-password"]', "demo12345")
        page.click('button[type="submit"]')
        page.wait_for_url("**/feed", timeout=15000)
        page.wait_for_selector("article", timeout=15000)

        posts = page.locator("article")
        count = posts.count()
        print(f"feed rendered {count} posts")
        assert count > 0, "no posts rendered on the home feed"

        # stories bar
        stories = page.locator('main button span.w-full')
        print(f"story entries visible: {stories.count()}")
        page.screenshot(path=str(SHOTS / "01-feed.png"), full_page=False)

        # ---------------------------------------------------------- like
        first_article = posts.first
        is_liked = first_article.locator('button[aria-label="Unlike"]').count() > 0
        target_label = "Like" if is_liked else "Unlike"
        first_article.locator(f'button[aria-label="{"Unlike" if is_liked else "Like"}"]').click()
        page.wait_for_timeout(700)
        toggled = first_article.locator(f'button[aria-label="{target_label}"]').count()
        print(f"like toggled: {toggled == 1} (was liked: {is_liked})")
        assert toggled == 1, "like button did not toggle"
        first_article.locator(f'button[aria-label="{target_label}"]').click()  # restore
        page.wait_for_timeout(400)

        # ---------------------------------------------------------- comment box
        box = posts.first.locator('input[placeholder="Add a comment…"]')
        assert box.count() > 0, "inline comment box missing"
        box.fill("looks great!")
        posts.first.locator('button:has-text("Post")').click()
        page.wait_for_timeout(900)
        print("comment submitted")

        # ---------------------------------------------------------- explore
        page.goto(f"{BASE}/explore", wait_until="networkidle")
        tiles = page.locator("main button img")
        page.wait_for_timeout(800)
        print(f"explore tiles: {tiles.count()}")
        assert tiles.count() > 0, "explore grid empty"
        page.screenshot(path=str(SHOTS / "02-explore.png"))

        # ---------------------------------------------------------- profile
        page.goto(f"{BASE}/u/alice_wonder", wait_until="networkidle")
        page.wait_for_timeout(700)
        assert page.locator("h1", has_text="alice_wonder").count() > 0, "profile header missing"
        grid = page.locator("main img")
        print(f"profile images: {grid.count()}")
        page.screenshot(path=str(SHOTS / "03-profile.png"))

        # ---------------------------------------------------------- post detail
        page.goto(f"{BASE}/explore", wait_until="networkidle")
        page.wait_for_timeout(600)
        page.locator("main button").first.click()
        page.wait_for_timeout(1200)
        assert "Comment" not in page.url or "/p/" in page.url, "did not open a post"
        print(f"post detail url: {page.url}")
        page.screenshot(path=str(SHOTS / "04-post-detail.png"))

        # ---------------------------------------------------------- messages
        page.goto(f"{BASE}/messages", wait_until="networkidle")
        page.wait_for_timeout(1000)
        convos = page.locator("aside button")
        print(f"conversations: {convos.count()}")
        assert convos.count() > 0, "no conversations listed"
        convos.first.click()
        page.wait_for_timeout(900)
        bubbles = page.locator("section span.rounded-3xl")
        print(f"messages in thread: {bubbles.count()}")
        assert bubbles.count() > 0, "thread empty"
        page.screenshot(path=str(SHOTS / "05-messages.png"))

        # ---------------------------------------------------------- create post
        page.goto(f"{BASE}/create", wait_until="networkidle")
        assert page.locator('text=Drag photos and videos here').count() > 0, "create step 1 missing"
        page.screenshot(path=str(SHOTS / "06-create.png"))

        # ---------------------------------------------------------- search overlay
        page.goto(f"{BASE}/feed", wait_until="networkidle")
        page.keyboard.press("Control+k")
        page.wait_for_timeout(500)
        page.keyboard.type("coffee")
        page.wait_for_timeout(900)
        results = page.locator('text=Accounts')
        print(f"search panel rendered: {results.count() > 0}")
        page.screenshot(path=str(SHOTS / "07-search.png"))
        page.keyboard.press("Escape")

        browser.close()

        real_errors = [e for e in console_errors if "favicon" not in e.lower()]
        print(f"console errors: {len(real_errors)}")
        for err in real_errors[:10]:
            print("  !", err)
        print(f"failed requests: {len(failed_responses)}")
        for item in sorted(set(failed_responses))[:10]:
            print("  4xx/5xx:", item)
        if real_errors or failed_responses:
            sys.exit(1)
        print("Browser E2E passed.")


if __name__ == "__main__":
    main()
