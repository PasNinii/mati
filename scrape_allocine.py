import re, json, html as html_mod, time, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import Request, urlopen
from urllib.error import HTTPError

TOTAL_PAGES = 8471
WORKERS = 5
OUTPUT = "/home/nini/playground/mati/allocine_movies.json"
PROGRESS_FILE = "/home/nini/playground/mati/allocine_progress.json"


def scrape_page(page, retries=4):
    for attempt in range(retries):
        try:
            url = f"https://www.allocine.fr/films/?page={page}"
            req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urlopen(req, timeout=15).read().decode()

            cards = re.split(r'class="card\s+entity-card', resp)[1:]
            movies = []

            for card in cards:
                title_m = re.search(r'class="meta-title-link"[^>]*>([^<]+)<', card)
                if not title_m:
                    continue
                title = html_mod.unescape(title_m.group(1).strip())

                items = re.split(r'<div class="rating-item">', card)
                note_presse = None
                note_spectateurs = None

                for item in items:
                    label_m = re.search(r'rating-title[^>]*>\s*([^<]+?)\s*<', item)
                    if not label_m:
                        continue
                    label = label_m.group(1).strip().lower()
                    note_m = re.search(r'class="stareval-note"(?:\s+[^>]*)?>([^<]+)<', item)
                    if not note_m:
                        continue
                    note = note_m.group(1).strip()
                    if note == '--':
                        note = None
                    if 'presse' in label:
                        note_presse = note
                    elif 'spectateur' in label:
                        note_spectateurs = note

                if note_presse or note_spectateurs:
                    movies.append({
                        "title": title,
                        "note_presse": note_presse,
                        "note_spectateurs": note_spectateurs,
                    })

            return page, movies

        except HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                time.sleep(3 * (attempt + 1))
            else:
                raise
        except Exception:
            if attempt < retries - 1:
                time.sleep(2)
            else:
                raise


# Resume support
done_pages = set()
all_movies = []
try:
    with open(PROGRESS_FILE) as f:
        progress = json.load(f)
        done_pages = set(progress["done_pages"])
        all_movies = progress["movies"]
        print(f"Resuming: {len(done_pages)} pages done, {len(all_movies)} movies so far")
except (FileNotFoundError, json.JSONDecodeError):
    pass

remaining = [p for p in range(1, TOTAL_PAGES + 1) if p not in done_pages]
print(f"Pages remaining: {len(remaining)}")

done_count = 0
errors = 0
t0 = time.time()
total = len(remaining)

BATCH = 500
for batch_start in range(0, total, BATCH):
    batch = remaining[batch_start:batch_start + BATCH]

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(scrape_page, p): p for p in batch}
        for f in as_completed(futures):
            done_count += 1
            page = futures[f]
            try:
                _, movies = f.result()
                all_movies.extend(movies)
                done_pages.add(page)
            except Exception as e:
                errors += 1
                print(f"  FAIL page {page}: {e}", file=sys.stderr)

    elapsed = time.time() - t0
    eta = elapsed / done_count * (total - done_count) if done_count else 0
    print(f"  {done_count}/{total} pages | {len(all_movies)} rated | {errors} err | ETA {eta:.0f}s")

    # Save progress after each batch
    with open(PROGRESS_FILE, "w") as pf:
        json.dump({"done_pages": list(done_pages), "movies": all_movies}, pf)

elapsed = time.time() - t0
print(f"\nDone in {elapsed:.0f}s — {len(all_movies)} rated movies ({errors} errors)")

all_movies.sort(
    key=lambda m: (m["note_spectateurs"] or "0", m["note_presse"] or "0", m["title"]),
    reverse=True,
)

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(all_movies, f, ensure_ascii=False, indent=2)

print(f"Saved to {OUTPUT}")
