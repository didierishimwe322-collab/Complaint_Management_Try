#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Repo root: $ROOT"

# Find files that contain 'Notes App' or a <title> with 'Notes' (case-insensitive)
mapfile -t candidates < <(grep -RIl --exclude-dir=node_modules --exclude-dir=.git -e "Notes App" -e "<title>.*Notes" "$ROOT" || true)

# Also include files with 'notes' in filename
mapfile -t name_matches < <(find "$ROOT" -type f -iname "*notes*" -print || true)

# Merge unique
for f in "${name_matches[@]}"; do
  if [[ ! " ${candidates[*]} " =~ " $f " ]]; then
    candidates+=("$f")
  fi
done

if [[ ${#candidates[@]} -eq 0 ]]; then
  echo "No candidate 'Notes' files found by content or filename search."
else
  echo "Found the following candidate files mentioning 'Notes':"
  for f in "${candidates[@]}"; do
    echo " - $f"
  done
fi

# Check public/index.html specifically and replace if it contains Notes
PUBLIC_INDEX="$ROOT/public/index.html"
REPLACED=false
if [[ -f "$PUBLIC_INDEX" ]]; then
  if grep -qi "Notes App" "$PUBLIC_INDEX" || grep -qi "<title>.*Notes" "$PUBLIC_INDEX"; then
    echo "public/index.html contains 'Notes' content. Will replace it with CMSS index (unless --no-replace)."
    if [[ "${NO_REPLACE:-}" != "true" ]]; then
      cat > "$PUBLIC_INDEX" <<'HTML'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Complaint Management System — Complaints & Compliments</title>
  <link rel="stylesheet" href="/app.css" />
</head>
<body>
  <header>
    <h1>Complaint Management System</h1>
    <nav>
      <button id="tab-complaints" class="tab active">Complaints</button>
      <button id="tab-compliments" class="tab">Compliments</button>
    </nav>
  </header>

  <main>
    <section id="complaints-view" class="view">
      <div class="panel">
        <h2>New Complaint</h2>
        <form id="complaint-form">
          <input name="title" placeholder="Title" required />
          <textarea name="description" placeholder="Description" required></textarea>
          <input name="category" placeholder="Category" required />
          <input name="customer_name" placeholder="Customer name" required />
          <input name="customer_email" placeholder="Customer email" />
          <input name="customer_phone" placeholder="Customer phone" />
          <select name="priority">
            <option value="low">low</option>
            <option value="medium" selected>medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
          <button type="submit">Submit Complaint</button>
        </form>
      </div>

      <div class="panel">
        <h2>Complaints</h2>
        <div id="complaints-list">Loading...</div>
      </div>
    </section>

    <section id="compliments-view" class="view hidden">
      <div class="panel">
        <h2>Send Compliment</h2>
        <form id="compliment-form">
          <input name="recipient" placeholder="Recipient" required />
          <input name="sender" placeholder="Sender (optional)" />
          <input name="category" placeholder="Category" />
          <textarea name="message" placeholder="Message" required></textarea>
          <button type="submit">Send Compliment</button>
        </form>
      </div>

      <div class="panel">
        <h2>Compliments</h2>
        <div id="compliments-list">Loading...</div>
      </div>
    </section>
  </main>

  <footer>
    <small>CMSS — lightweight frontend</small>
  </footer>

  <script src="/app.js"></script>
</body>
</html>
HTML
      REPLACED=true
      echo "public/index.html replaced with CMSS frontend."
    fi
  fi
fi

# If user asked to delete candidate files
if [[ "${#candidates[@]}" -gt 0 ]]; then
  if [[ "${FORCE:-}" == "true" ]]; then
    echo "Deleting candidate files (FORCE=true)..."
    for f in "${candidates[@]}"; do
      # never delete the new public/index.html
      if [[ "$f" == "$PUBLIC_INDEX" ]]; then
        echo "Skipping $f (it's public/index.html)"
        continue
      fi
      echo "rm -f \"$f\""
      rm -f "$f"
    done
    echo "Deletion complete."
  else
    echo
    echo "To delete the listed files set FORCE=true and re-run, e.g.:"
    echo "  FORCE=true ./scripts/remove-notes.sh"
  fi
else
  echo "No files to delete."
fi

# Final instructions for user
echo
echo "Next steps:"
echo " - If you run the app in Docker, rebuild and restart the container to pick up the change:"
echo "     docker compose down && docker compose build --no-cache && docker compose up -d"
echo " - If running locally: npm ci && npm start"
echo " - Clear browser cache or open an incognito window to avoid stale pages."
if [[ "$REPLACED" == "true" ]]; then
  echo "public/index.html was updated — refresh your browser after restarting the app."
fi

exit 0
