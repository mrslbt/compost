# Compost — Bookmarks with an expiration date

Save links. Use them or let them go. Links fade over 30 days and disappear — like compost returning to the earth.

[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/compost/TODO)

## What is Compost?

Compost is a Chrome extension for saving links that automatically expire. Every link you save visually decays over 30 days — fading in opacity until it disappears completely. Click a link to open it and it's removed instantly. The idea is simple: if you didn't use it in 30 days, you didn't need it.

## Why?

Bookmarks pile up. You save something "for later," and later never comes. Compost flips the default — instead of links living forever, they decompose. The ones you actually use get opened and cleared. The ones you don't fade away on their own. No guilt, no cleanup, no bookmark graveyard.

## How It Works

1. Click the Compost icon in your browser toolbar
2. Paste a link (or it auto-fills from your clipboard)
3. Hit Enter or click "+"
4. The link is saved with today's date
5. Over 30 days, it gradually fades in opacity
6. Click it to open and remove it, or let it decompose naturally

## Features

- **Visual decay** — links fade from full opacity to near-invisible over 30 days
- **Auto-paste** — opens with your clipboard URL ready to save
- **Click to use** — opening a link automatically removes it from the list
- **Title fetching** — pulls page titles via noembed for YouTube, Twitter, Vimeo, SoundCloud, and more
- **URL fallback titles** — extracts readable titles from the URL path when no metadata is available
- **Duplicate detection** — won't save the same link twice
- **Manual delete** — hover to reveal the delete button if you want to remove a link early
- **Local storage only** — all data stays in your browser via Chrome's storage API
- **No tracking, no accounts** — see [Privacy Policy](PRIVACY.md)

## Tech

Zero dependencies. Pure vanilla HTML, CSS, and JavaScript — no build step, no framework.

- Chrome Manifest V3
- `chrome.storage.local` for persistence
- `navigator.clipboard` for auto-paste
- noembed.com API for title resolution

## Install

From the [Chrome Web Store](https://chromewebstore.google.com/detail/compost/TODO) or load unpacked:

```bash
git clone https://github.com/mrslbt/compost.git
```

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `compost/compost` directory

## Built by

Made in Fukuoka.
