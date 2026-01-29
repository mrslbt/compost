const DECAY_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// DOM Elements
const linkInput = document.getElementById('link-input');
const saveBtn = document.getElementById('save-btn');
const linksList = document.getElementById('links-list');
const emptyState = document.getElementById('empty-state');
const linkCount = document.getElementById('link-count');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await cleanupExpiredLinks();
  await renderLinks();
  await tryAutoPaste();
});

// Event Listeners
saveBtn.addEventListener('click', saveLink);
linkInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') saveLink();
});

// Try to auto-paste from clipboard
async function tryAutoPaste() {
  try {
    const text = await navigator.clipboard.readText();
    if (isValidUrl(text) && linkInput.value === '') {
      linkInput.value = text;
      linkInput.select();
    }
  } catch (err) {
    // Clipboard access denied - that's fine
  }
}

// Validate URL
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Save a new link
async function saveLink() {
  const url = linkInput.value.trim();

  if (!url) return;

  if (!isValidUrl(url)) {
    linkInput.classList.add('error');
    setTimeout(() => linkInput.classList.remove('error'), 500);
    return;
  }

  const links = await getLinks();

  // Check for duplicates
  if (links.some(link => link.url === url)) {
    linkInput.value = '';
    linkInput.placeholder = 'Already saved!';
    setTimeout(() => {
      linkInput.placeholder = 'Paste a link to save...';
    }, 1500);
    return;
  }

  const newLink = {
    id: Date.now().toString(),
    url: url,
    title: null, // Will be fetched
    savedAt: Date.now()
  };

  links.unshift(newLink);
  await saveLinks(links);

  linkInput.value = '';
  await renderLinks();

  // Fetch title in background
  fetchTitle(newLink.id, url);
}

// Fetch page title using noembed (CORS-friendly for media sites)
async function fetchTitle(id, url) {
  let title = null;

  // Try noembed.com (works for YouTube, Twitter, Vimeo, SoundCloud, etc.)
  try {
    const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const response = await fetch(noembedUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.title) {
        title = data.title;
      }
    }
  } catch {
    // noembed failed, fall back to URL parsing
  }

  // Fall back to URL-based title
  if (!title) {
    title = extractTitleFromUrl(url);
  }

  await updateLinkTitle(id, title);
}

// Extract readable title from URL
function extractTitleFromUrl(url) {
  try {
    const urlObj = new URL(url);
    // Get pathname and clean it up
    let path = urlObj.pathname;

    // Remove trailing slash and file extensions
    path = path.replace(/\/$/, '').replace(/\.[^/.]+$/, '');

    // Get last segment
    const segments = path.split('/').filter(Boolean);
    let title = segments[segments.length - 1] || urlObj.hostname;

    // Clean up the title
    title = title
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase();

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // If title is too short, use hostname
    if (title.length < 3) {
      title = urlObj.hostname.replace('www.', '');
    }

    return title;
  } catch {
    return url;
  }
}

// Update link title in storage
async function updateLinkTitle(id, title) {
  const links = await getLinks();
  const link = links.find(l => l.id === id);
  if (link) {
    link.title = title;
    await saveLinks(links);
    await renderLinks();
  }
}

// Calculate decay (0 = fresh, 1 = fully decayed)
function calculateDecay(savedAt) {
  const age = Date.now() - savedAt;
  const ageDays = age / MS_PER_DAY;
  return Math.min(ageDays / DECAY_DAYS, 1);
}

// Get human-readable age
function getAge(savedAt) {
  const age = Date.now() - savedAt;
  const days = Math.floor(age / MS_PER_DAY);

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// Remove expired links
async function cleanupExpiredLinks() {
  const links = await getLinks();
  const validLinks = links.filter(link => {
    const decay = calculateDecay(link.savedAt);
    return decay < 1;
  });

  if (validLinks.length !== links.length) {
    await saveLinks(validLinks);
  }
}

// Render all links
async function renderLinks() {
  const links = await getLinks();

  if (links.length === 0) {
    linksList.innerHTML = '';
    emptyState.style.display = 'block';
    linkCount.textContent = '0 links';
    return;
  }

  emptyState.style.display = 'none';
  linkCount.textContent = `${links.length} link${links.length === 1 ? '' : 's'}`;

  linksList.innerHTML = links.map(link => {
    const decay = calculateDecay(link.savedAt);
    const opacity = 1 - (decay * 0.8); // Never go below 0.2 opacity
    const age = getAge(link.savedAt);
    const displayTitle = link.title || extractTitleFromUrl(link.url);
    const domain = new URL(link.url).hostname.replace('www.', '');

    return `
      <div class="link-item" style="opacity: ${opacity}" data-id="${link.id}">
        <a href="${link.url}" target="_blank" class="link-content">
          <span class="link-title">${escapeHtml(displayTitle)}</span>
          <span class="link-meta">
            <span class="link-domain">${escapeHtml(domain)}</span>
            <span class="link-age">${age}</span>
          </span>
        </a>
        <button class="delete-btn" data-id="${link.id}" title="Remove">×</button>
      </div>
    `;
  }).join('');

  // Add delete handlers
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await deleteLink(btn.dataset.id);
    });
  });

  // Add click handler to remove on visit
  document.querySelectorAll('.link-content').forEach(link => {
    link.addEventListener('click', async () => {
      const id = link.parentElement.dataset.id;
      // Small delay so the link opens first
      setTimeout(() => deleteLink(id), 100);
    });
  });
}

// Delete a link
async function deleteLink(id) {
  const links = await getLinks();
  const filtered = links.filter(l => l.id !== id);
  await saveLinks(filtered);
  await renderLinks();
}

// Storage helpers
async function getLinks() {
  return new Promise(resolve => {
    chrome.storage.local.get(['compostLinks'], (result) => {
      resolve(result.compostLinks || []);
    });
  });
}

async function saveLinks(links) {
  return new Promise(resolve => {
    chrome.storage.local.set({ compostLinks: links }, resolve);
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
