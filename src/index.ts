import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import styles from './styles.css';

marked.use(markedKatex({
    throwOnError: false,
    nonStandard: true,
    strict: false,
    trust: true,
    macros: {
        "\\label": "\\href{#1}{}",
        "\\eqref": "\\href{#1}{}",
        "\\require": "\\href{#1}{}",
    }
}));

const renderer = {
  heading(text: string, level: number) {
    const slug = text.toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `<h${level} id="${slug}">${text}</h${level}>`;
  }
};

marked.use({ renderer });

function escapeHtml(value: string) {
    return (value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const GITHUB_OWNER = 'Mahironya';
const GITHUB_REPO = 'misaka23323.com';
const GITHUB_BRANCH = 'main';
const BASE_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/src`;

async function fetchArticlesList() {
    const response = await fetch(`${BASE_URL}/articles.json`);
    if (!response.ok) return [];
    const raw = await response.json() as any[];
    // Normalize file paths in case entries point to unexpected locations
    return raw.map(entry => {
        const e = { ...entry } as any;
        if (e.file && typeof e.file === 'string') {
            let p = e.file.replace(/^\.\//, ''); // remove leading ./
            p = p.replace(/^src\//, ''); // remove leading src/
            p = p.replace(/^\/+/, ''); // remove leading /
            if (!p.startsWith('articles/')) {
                p = `articles/${p}`;
            }
            e.file = p;
        }
        return e;
    });
}

async function fetchArticleContent(filename: string) {
    // Normalize various possible file path forms to point under `src/articles/`
    let cleanPath = filename.replace(/^\.\//, ''); // remove leading ./
    cleanPath = cleanPath.replace(/^src\//, ''); // remove leading src/
    cleanPath = cleanPath.replace(/^\/+/, ''); // remove leading /
    if (!cleanPath.startsWith('articles/')) {
        cleanPath = `articles/${cleanPath}`;
    }
    const response = await fetch(`${BASE_URL}/${cleanPath}`);
    if (!response.ok) return '';
    return await response.text();
}

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
  ASSETS: Fetcher;
    TELEGRAM_CHANNEL?: string;
}

// CSS moved to styles.css

const navBar = `
<div class="progress-container">
    <div class="progress-bar" id="progressBar"></div>
</div>
<div class="overlay"></div>
<nav class="navbar">
    <a href="/" class="logo">Mahiro Oyama</a>
    <div class="menu-toggle">☰</div>
    <ul class="nav-links">
        <li class="nav-item"><a href="/">Home</a></li>
        <li class="nav-item"><a href="/articles">Articles</a></li>
        <li class="nav-item" id="navRefreshItem" style="display:none"><a href="#" id="navRefreshBtn">Refresh Article</a></li>
        <li class="nav-item dropdown">
            <a href="#">Projects ▾</a>
            <ul class="dropdown-menu">
                <li class="dropdown-item"><a href="/2048/">2048 Game</a></li>
            </ul>
        </li>
        <li class="nav-item"><a href="#about">About</a></li>
    </ul>
</nav>
`;

const scripts = `
<script>
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.querySelector('.overlay');
    
    function toggleMenu() {
        navLinks.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    }

    menuToggle.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
             // Don't close menu if clicking a dropdown toggle
             if (link.parentElement.classList.contains('dropdown')) {
                 e.preventDefault();
                 return;
             }
             if (navLinks.classList.contains('active')) toggleMenu();
        });
    });

    // Mobile Dropdown Toggle
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.stopPropagation(); // Prevent bubbling to navLinks click
                dropdown.classList.toggle('active');
            }
        });
    });

    // Progress Bar
    window.onscroll = function() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        const progressBar = document.getElementById("progressBar");
        if (progressBar) {
            progressBar.style.width = scrolled + "%";
        }
    };
</script>
`;

function render(title: string, content: string, metaTags: string = '') {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${metaTags}
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.css" crossorigin="anonymous">
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${navBar}
    <main class="container">
        ${content}
    </main>
    ${scripts}
</body>
</html>
`;
}

function renderHomePage() {
    const content = `
<style>
.hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 4rem;
    min-height: calc(100vh - var(--nav-height) - 8rem);
}

.hero-content {
    flex: 1;
    max-width: 500px;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1.5rem;
    font-weight: 800;
    line-height: 1.2;
}

.hero p {
    font-size: 1.2rem;
    color: var(--secondary-text);
    margin-bottom: 2rem;
}

.hero-links {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 400px;
}

.link-card {
    background: var(--card-bg);
    padding: 1.5rem;
    border-radius: 12px;
    text-decoration: none;
    color: var(--text-color);
    transition: all 0.2s ease;
    border: 1px solid transparent;
}

.link-card:hover {
    background: var(--card-hover);
    transform: translateY(-2px);
    border-color: #eaeaea;
}

.link-card h3 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.link-card p {
    font-size: 0.95rem;
    color: var(--secondary-text);
    margin-bottom: 0;
}

.sub-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
}

.tag {
    background: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    color: var(--secondary-text);
    border: 1px solid #eaeaea;
}

@media (max-width: 768px) {
    .hero {
        flex-direction: column;
        gap: 3rem;
        justify-content: center;
    }

    .hero-content, .hero-links {
        max-width: 100%;
    }
}
</style>
<div class="hero">
    <div class="hero-content">
        <h1>Hello, I'm<br>Mahiro Oyama</h1>
        <p>An undergraduate student from China.</p>
    </div>
    
    <div class="hero-links">
        <a href="/articles" class="link-card">
            <h3>Articles <span>→</span></h3>
            <p>Wrote some interesting stuffs ( ´▽｀)</p>
        </a>
        
        <div class="link-card">
            <h3>Projects</h3>
            <p>Check out what I've been working on.</p>
        </div>
    </div>
</div>
`;
    return render("Mahiro Oyama", content);
}

async function renderArticlesPage(url?: URL) {
    const articles = await fetchArticlesList();
    const collectionFilter = url?.searchParams.get('collection') || '';
    // Sort articles by date descending (newest first)
    const sortedArticles = [...articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // collect unique collections
    const collections = Array.from(new Set(sortedArticles.map(a => (a as any).collection).filter(Boolean)));

    const filtered = collectionFilter ? sortedArticles.filter(a => (a as any).collection === collectionFilter) : sortedArticles;

    const articlesHtml = filtered.map(article => `
        <div class="article-item">
            <h2>
                <a href="/articles/${article.slug}">${article.title}</a>
                ${(article as any).collection ? ` <span class="article-tag"><a href="/articles?collection=${encodeURIComponent((article as any).collection)}">${(article as any).collection}</a></span>` : ''}
            </h2>
            <p>${article.date}</p>
        </div>
    `).join('');

        // Render a custom dropdown server-side using available collections
        const items = ['All', ...collections];
        const toggleLabel = collectionFilter || 'All';
        const itemsHtml = items.map(it => {
            const value = it === 'All' ? '' : encodeURIComponent(it);
            return `<li class="cd-item"><button type="button" data-value="${value}">${it}</button></li>`;
        }).join('');

        const collectionsHtml = `
            <div class="collections">
                <label><strong>Collections:</strong></label>
                <div class="collection-dropdown" id="collectionDropdown">
                    <button type="button" class="cd-toggle" id="cdToggle">${toggleLabel} <span class="chev">▾</span></button>
                    <ul class="cd-menu" id="cdMenu" aria-hidden="true">
                        ${itemsHtml}
                    </ul>
                </div>
            </div>
            <script>
                (function(){
                    const toggle = document.getElementById('cdToggle');
                    const menu = document.getElementById('cdMenu');
                    if (!toggle || !menu) return;
                    function closeMenu() { menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); toggle.querySelector('.chev').style.transform = ''; }
                    function openMenu() { menu.classList.add('open'); menu.setAttribute('aria-hidden','false'); toggle.querySelector('.chev').style.transform = 'rotate(180deg)'; }
                    toggle.addEventListener('click', function(e){ e.stopPropagation(); if (menu.classList.contains('open')) closeMenu(); else openMenu(); });
                    document.addEventListener('click', function(){ closeMenu(); });
                    menu.addEventListener('click', function(e){ e.stopPropagation(); });
                    // handle clicks on items
                    Array.from(menu.querySelectorAll('button[data-value]')).forEach(btn => {
                        btn.addEventListener('click', function(){
                            const v = this.dataset.value || '';
                            if (!v) location.href = '/articles'; else location.href = '/articles?collection=' + v;
                        });
                    });
                })();
            <\/script>
        `;

    const content = `
<div class="article-list">
    <div class="header-actions">
        <h1>Articles</h1>
        <div class="header-buttons">
            <a href="/publish" class="btn-primary">Publish Article</a>
            <button id="refreshArticles" class="btn-primary">Refresh Articles</button>
        </div>
    </div>
    ${collectionsHtml}
    <div id="articlesContainer">
        ${articlesHtml}
    </div>
</div>
`;
    return render("Articles", content + `
<script>
    (function(){
        const refresh = async function(btn) {
            try {
                btn.classList.add('btn-loading');
                const minDelay = new Promise(resolve => setTimeout(resolve, 500));
                
                const resp = await fetch('${BASE_URL}/articles.json');
                if (!resp.ok) throw new Error('Network response was not ok');
                const list = await resp.json();

                // sort by date desc
                list.sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime());

                const urlParams = new URL(window.location.href).searchParams;
                const collectionFilter = urlParams.get('collection') || '';

                const container = document.getElementById('articlesContainer');
                if (container) {
                    const filtered = collectionFilter ? list.filter(a => a.collection === collectionFilter) : list;
                    // Clear container
                    container.innerHTML = '';
                    filtered.forEach article => {
                        const item = document.createElement('div');
                        item.className = 'article-item';

                        const h2 = document.createElement('h2');
                        const a = document.createElement('a');
                        a.href = '/articles/' + encodeURIComponent(article.slug || '');
                        a.textContent = article.title || '';
                        h2.appendChild(a);

                        if (article.collection) {
                            const span = document.createElement('span');
                            span.className = 'article-tag';
                            const link = document.createElement('a');
                            link.href = '/articles?collection=' + encodeURIComponent(article.collection);
                            link.textContent = article.collection;
                            span.appendChild(link);
                            h2.appendChild(document.createTextNode(' '));
                            h2.appendChild(span);
                        }

                        item.appendChild(h2);
                        const p = document.createElement('p');
                        p.textContent = article.date || '';
                        item.appendChild(p);
                        container.appendChild(item);
                    });
                }

                // rebuild collections dropdown
                const collections = Array.from(new Set(list.map(a => a.collection).filter(Boolean)));
                const items = ['All', ...collections];
                const menu = document.getElementById('cdMenu');
                const toggle = document.getElementById('cdToggle');
                if (menu && toggle) {
                    menu.innerHTML = items.map(it => {
                        const value = it === 'All' ? '' : encodeURIComponent(it);
                        return '<li class="cd-item"><button type="button" data-value="' + value + '">' + it + '</button></li>';
                    }).join('');

                    // reattach handlers
                    Array.from(menu.querySelectorAll('button[data-value]')).forEach(btnEl => {
                        btnEl.addEventListener('click', function(){
                            const v = this.dataset.value || '';
                            if (!v) location.href = '/articles'; else location.href = '/articles?collection=' + v;
                        });
                    });
                }

                await minDelay;

            } catch (err) {
                alert('Refresh failed: ' + (err && err.message ? err.message : err));
            } finally {
                btn.classList.remove('btn-loading');
            }
        };

        const btns = [document.getElementById('refreshArticles')];
        btns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', function(e){
                    e.preventDefault();
                    refresh(this);
                });
            }
        });
    })();
</script>`);
}

function renderPublishPage() {
    const content = `
<div class="publish-form">
    <h1>Publish New Article</h1>
    <form id="publishForm">
        <div class="form-group">
            <label for="token">GitHub Token</label>
            <input type="password" id="token" name="token" required placeholder="ghp_...">
        </div>
        <div class="form-group">
            <label for="title">Title</label>
            <input type="text" id="title" name="title" required placeholder="My New Article">
        </div>
        <div class="form-group">
            <label for="slug">Slug</label>
            <input type="text" id="slug" name="slug" required placeholder="my-new-article">
        </div>
        <div class="form-group">
            <label for="collection">Collection (optional)</label>
            <div class="combobox-wrapper">
                <input type="text" id="collection" name="collection" placeholder="Choose or type to add" autocomplete="off">
                <ul id="collectionMenu" class="combobox-menu"></ul>
            </div>
        </div>
        <div class="form-group">
            <label for="content">Content (Markdown)</label>
            <textarea id="content" name="content" required placeholder="# Hello World\n\nWrite your content here..."></textarea>
        </div>
        <button type="submit" class="btn-submit" id="submitBtn">Publish</button>
    </form>
</div>

<script>
    const form = document.getElementById('publishForm');
    const submitBtn = document.getElementById('submitBtn');
    const titleInput = document.getElementById('title');
    const slugInput = document.getElementById('slug');

    // Auto-generate slug from title
    titleInput.addEventListener('input', (e) => {
        if (!slugInput.value || slugInput.value === slugInput.getAttribute('data-auto')) {
            const slug = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            slugInput.value = slug;
            slugInput.setAttribute('data-auto', slug);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Publishing...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            alert('Article published successfully! It may take a few minutes for the site to update.');
            window.location.href = '/articles';
        } catch (error) {
            alert('Error publishing article: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publish';
        }
    });
</script>
<script>
        // Custom combobox for collection
        (function(){
            const input = document.getElementById('collection');
            const menu = document.getElementById('collectionMenu');
            if (!input || !menu) return;

            let collections = [];

            function renderMenu(filterText = '') {
                menu.innerHTML = '';
                const filtered = collections.filter(c => c.toLowerCase().includes(filterText.toLowerCase()));
                
                if (filtered.length === 0) {
                    menu.style.display = 'none';
                    return;
                }

                filtered.forEach(c => {
                    const li = document.createElement('li');
                    li.textContent = c;
                    li.addEventListener('mousedown', (e) => {
                        e.preventDefault(); // prevent blur
                        input.value = c;
                        menu.style.display = 'none';
                    });
                    menu.appendChild(li);
                });
                menu.style.display = 'block';
            }

            input.addEventListener('focus', () => renderMenu(input.value));
            input.addEventListener('input', () => renderMenu(input.value));
            
            input.addEventListener('blur', () => {
                menu.style.display = 'none';
            });

            fetch('${BASE_URL}/articles.json')
              .then(r => r.json())
              .then(list => {
                collections = Array.from(new Set(list.map(a => a.collection).filter(Boolean)));
              }).catch(() => {/* ignore errors */});
        })();
    </script>
`;
    return render("Publish Article", content);
}

async function handlePublish(request: Request) {
    try {
        const { token, title, slug, content, collection } = await request.json() as any;
        
        if (!token || !title || !slug || !content) {
            return new Response('Missing required fields', { status: 400 });
        }

        const owner = 'Mahironya';
        const repo = 'misaka23323.com';
        const date = new Date().toISOString().split('T')[0];
        
        // Use timestamp (YYYYMMDDHHmmss) in filename to ensure uniqueness
        const now = new Date();
        const timestamp = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');
            
        const filename = `${timestamp}-${slug}.md`;
        const filePath = `src/articles/${filename}`;
        
        // Helper to call GitHub API
        const githubFetch = async (path: string, options: any = {}): Promise<any> => {
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
            const res = await fetch(url, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'Cloudflare-Worker',
                    'Accept': 'application/vnd.github.v3+json',
                    ...options.headers,
                },
            });
            if (!res.ok) {
                throw new Error(`GitHub API Error: ${res.status} ${res.statusText}`);
            }
            return res.json();
        };

        // 1. Create the markdown file
        await githubFetch(filePath, {
            method: 'PUT',
            body: JSON.stringify({
                message: `Add article: ${title}`,
                content: btoa(unescape(encodeURIComponent(content))), // Handle UTF-8
            }),
        });

        // 2. Update articles.json
        // First get current content to get SHA
        const articlesJsonPath = 'src/articles.json';
        const currentFile = await githubFetch(articlesJsonPath);
        const currentContent = JSON.parse(decodeURIComponent(escape(atob(currentFile.content))));
        
        // Add new article
        const newArticle: any = {
            title,
            slug,
            date,
            file: `./articles/${filename}`
        };

        // include collection if provided
        if (collection) {
            newArticle.collection = collection;
        }
        
        const newContent = [...currentContent, newArticle];

        // Update file
        await githubFetch(articlesJsonPath, {
            method: 'PUT',
            body: JSON.stringify({
                message: `Update articles.json for: ${title}`,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(newContent, null, 2)))),
                sha: currentFile.sha,
            }),
        });

        return new Response('Published successfully', { status: 200 });

    } catch (error: any) {
        return new Response(error.message || 'Internal Server Error', { status: 500 });
    }
}

async function renderArticlePage(slug: string, url: string, telegramChannel?: string) {
    const articles = await fetchArticlesList();
    const article = articles.find((a: any) => a.slug === slug);
    if (!article) {
        return new Response('Not Found', { status: 404 });
    }

    const markdown = await fetchArticleContent(article.file);
    const htmlContent = await marked(markdown);

    // Generate description for meta tags
    const plainText = htmlContent.replace(/<[^>]+>/g, '');
    const trimmedText = plainText.replace(/\s+/g, ' ').trim();
    const summary = trimmedText.length > 200 ? `${trimmedText.substring(0, 200).trim()}...` : trimmedText;
    const escapedDescription = escapeHtml(summary || 'Mahiro Oyama Article');
    const escapedTitle = escapeHtml(article.title);
    const canonicalUrl = url.split('#')[0];
    const publishedDate = new Date(`${article.date}T00:00:00Z`);
    const isoPublished = Number.isNaN(publishedDate.getTime()) ? article.date : publishedDate.toISOString();
    const isoModified = isoPublished;
    const section = (article as any).collection ? String((article as any).collection) : '';
    const escapedSection = section ? escapeHtml(section) : '';
    const telegramHandle = telegramChannel ? telegramChannel.trim() : '';

    const jsonLd: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        datePublished: isoPublished,
        dateModified: isoModified,
        author: {
            '@type': 'Person',
            name: 'Mahiro Oyama',
        },
        mainEntityOfPage: canonicalUrl,
        description: summary || 'Mahiro Oyama Article',
        url: canonicalUrl,
    };

    if (section) {
        jsonLd.articleSection = section;
    }

    const jsonLdString = JSON.stringify(jsonLd, null, 2).replace(/</g, '\\u003C');

    const metaParts = [
        `<link rel="canonical" href="${canonicalUrl}">`,
        `<meta property="og:title" content="${escapedTitle}">`,
        `<meta property="og:description" content="${escapedDescription}">`,
        `<meta property="og:type" content="article">`,
        `<meta property="og:url" content="${canonicalUrl}">`,
        `<meta property="og:site_name" content="Mahiro Oyama">`,
        `<meta property="article:published_time" content="${isoPublished}">`,
        `<meta property="article:modified_time" content="${isoModified}">`,
        `<meta property="article:author" content="Mahiro Oyama">`,
        section ? `<meta property="article:section" content="${escapedSection}">` : '',
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${escapedTitle}">`,
        `<meta name="twitter:description" content="${escapedDescription}">`,
        `<meta name="twitter:url" content="${canonicalUrl}">`,
        telegramHandle ? `<meta property="telegram:channel" content="${telegramHandle.startsWith('@') ? telegramHandle : '@' + telegramHandle}">` : '',
        `<script type="application/ld+json">${jsonLdString}</script>`
    ].filter(Boolean);

    const metaTags = metaParts.join('\n    ');

    const collectionHtml = section ? ` <span class="article-tag" itemprop="articleSection"><a href="/articles?collection=${encodeURIComponent(section)}">${section}</a></span>` : '';

    const content = `
<article class="article-content" itemscope itemtype="https://schema.org/Article" data-iv-entry="article">
    <meta itemprop="mainEntityOfPage" content="${canonicalUrl}">
    <meta itemprop="url" content="${canonicalUrl}">
    <header class="article-header">
        <h1 itemprop="headline">${article.title}${collectionHtml}</h1>
        <div class="article-meta">
            <time datetime="${isoPublished}" itemprop="datePublished">${article.date}</time>
            <meta itemprop="dateModified" content="${isoModified}">
            <span class="article-author" itemprop="author" itemscope itemtype="https://schema.org/Person">
                <meta itemprop="name" content="Mahiro Oyama">
                Mahiro Oyama
            </span>
        </div>
    </header>
    <div class="content" itemprop="articleBody">
        ${htmlContent}
    </div>
</article>
<script>
    (function() {
        const navItem = document.getElementById('navRefreshItem');
        const navBtn = document.getElementById('navRefreshBtn');
        if (navItem && navBtn) {
            navItem.style.display = 'flex';
            
            navBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                navBtn.classList.add('btn-loading');
                const minDelay = new Promise(resolve => setTimeout(resolve, 500));
                
                try {
                    const response = await fetch(window.location.href);
                    if (!response.ok) throw new Error('Network error');
                    const html = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newContent = doc.querySelector('.article-content');
                    const currentContent = document.querySelector('.article-content');
                    if (newContent && currentContent) {
                        currentContent.innerHTML = newContent.innerHTML;
                    }
                    await minDelay;
                } catch (err) {
                    alert('Failed to refresh: ' + (err.message || err));
                } finally {
                    navBtn.classList.remove('btn-loading');
                }
            });
        }
    })();
</script>
`;
    return render(article.title, content, metaTags);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/styles.css') {
      return new Response(styles, {
        headers: { 'Content-Type': 'text/css' },
      });
    }

    if (path === '/') {
        return new Response(renderHomePage(), { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    if (path === '/articles') {
        const html = await renderArticlesPage(url);
        return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    if (path === '/publish') {
        return new Response(renderPublishPage(), { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    if (path === '/api/publish' && request.method === 'POST') {
        return handlePublish(request);
    }

    if (path.startsWith('/2048')) {
        // Handle 2048 game assets
        let response = await env.ASSETS.fetch(request);
        
        if (response.status === 404) {
            // If accessing /2048 without slash, redirect to /2048/
            if (path === '/2048') {
                return Response.redirect(url.origin + '/2048/', 301);
            }
            // If accessing a directory (ending in /), try index.html
            if (path.endsWith('/')) {
                const newUrl = new URL(url);
                newUrl.pathname += 'index.html';
                response = await env.ASSETS.fetch(new Request(newUrl, request));
            }
        }
        return response;
    }

    const articleMatch = path.match(/^\/articles\/(.+)/);
    if (articleMatch) {
        const slug = articleMatch[1];
        const response = await renderArticlePage(slug, request.url, env.TELEGRAM_CHANNEL);
        if (response instanceof Response) {
            return response;
        }
        return new Response(response, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    return new Response('Not Found', { status: 404 });
  },
};
