import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import styles from './styles.css';

marked.use(markedKatex({
    throwOnError: false,
    nonStandard: true
}));

const GITHUB_OWNER = 'Mahironya';
const GITHUB_REPO = 'misaka23323.com';
const GITHUB_BRANCH = 'main';
const BASE_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/src`;

async function fetchArticlesList() {
    const response = await fetch(`${BASE_URL}/articles.json`);
    if (!response.ok) return [];
    return await response.json() as any[];
}

async function fetchArticleContent(filename: string) {
    // Remove ./ from the beginning if present
    const cleanPath = filename.replace(/^\.\//, '');
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
}

// CSS moved to styles.css

function renderNavBar(isArticle = false, slug = '') {
    const editLi = isArticle ? `<li class="nav-item nav-edit"><a href="/publish?edit=${encodeURIComponent(slug)}">Edit Article</a></li>` : '';
    return `
<div class="progress-container">
    <div class="progress-bar" id="progressBar"></div>
</div>
<div class="overlay"></div>
<nav class="navbar">
    <a href="/" class="logo">Mahiro Oyama</a>
    <div class="menu-toggle">☰</div>
    <ul class="nav-links">
        ${editLi}
        <li class="nav-item"><a href="/">Home</a></li>
        <li class="nav-item"><a href="/articles">Articles</a></li>
        <li class="nav-item dropdown">
            <a href="#">Projects ▾</a>
            <ul class="dropdown-menu">
                <li class="dropdown-item"><a href="#web-dev">Web Dev</a></li>
                <li class="dropdown-item"><a href="#mobile-apps">Mobile Apps</a></li>
                <li class="dropdown-item"><a href="#open-source">Open Source</a></li>
            </ul>
        </li>
        <li class="nav-item"><a href="#about">About</a></li>
    </ul>
</nav>
`;
}

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

function render(title: string, content: string, navHtml?: string) {
    const nav = navHtml || renderNavBar();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.css" crossorigin="anonymous">
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    ${nav}
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
    }

    .hero-content, .hero-links {
        max-width: 100%;
    }
}
</style>
<div class="hero">
    <div class="hero-content">
        <h1>Hello, I'm<br>Mahiro Oyama</h1>
        <p>A passionate developer building things for the web. I specialize in TypeScript, React, and Cloudflare Workers.</p>
    </div>
    
    <div class="hero-links">
        <a href="/articles" class="link-card">
            <h3>Articles <span>→</span></h3>
            <p>Read my latest thoughts on technology and development.</p>
        </a>
        
        <div class="link-card">
            <h3>Projects</h3>
            <p>Check out what I've been working on.</p>
            <div class="sub-links">
                <span class="tag">Web Dev</span>
                <span class="tag">Mobile Apps</span>
                <span class="tag">Open Source</span>
            </div>
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
        }).join('\n');

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
        <a href="/publish" class="btn-primary">Publish Article</a>
    </div>
    ${collectionsHtml}
    ${articlesHtml}
</div>
`;
    return render("Articles", content);
}

async function renderPublishPage(url?: URL) {
    // If edit query param is present, prefill form with existing article
    const editSlug = url?.searchParams.get('edit') || '';
    let titleVal = '';
    let slugVal = '';
    let collectionVal = '';
    let contentVal = '';
    let originalFileVal = '';
    let isEdit = false;

    if (editSlug) {
        const articles = await fetchArticlesList();
        const article = articles.find((a: any) => a.slug === editSlug);
        if (article) {
            isEdit = true;
            titleVal = article.title || '';
            slugVal = article.slug || '';
            collectionVal = (article as any).collection || '';
            originalFileVal = article.file || '';
            // fetch markdown content
            try {
                contentVal = await fetchArticleContent(article.file || '');
            } catch (e) {
                const owner = 'Mahironya';
                const repo = 'misaka23323.com';
        }
                let filePath = '';
                let currentFileSha: string | undefined = undefined;

                // Helper to call GitHub API and surface error body
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
                        let errBody = '';
                        try {
                            const j = await res.json();
                            errBody = j && (j.message || JSON.stringify(j));
                        } catch (e) {
                            try { errBody = await res.text(); } catch (_) { errBody = ''; }
                        }
                        throw new Error(`GitHub API Error: ${res.status} ${res.statusText}${errBody ? ' - ' + errBody : ''}`);
                    }
                    return res.json();
                };

                // If originalFile provided, use it (edit mode). Otherwise create a new file with timestamp.
                const providedOriginalFile = (bodyJson && bodyJson.originalFile) || '';
                if (providedOriginalFile) {
                    // articles.json stores paths like "./articles/xxxx.md" — GitHub API needs the repo path, which is under "src/..."
                    filePath = `src/${providedOriginalFile.replace(/^\.\//, '')}`;
                    // preserve the original file ref to write into articles.json later
                    var fileRef = providedOriginalFile;
                    // fetch file metadata to get sha for update
                    try {
                        const metaUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
                        const metaRes = await fetch(metaUrl, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'User-Agent': 'Cloudflare-Worker',
                                'Accept': 'application/vnd.github.v3+json',
                            }
                        });
                        if (metaRes.ok) {
                            const meta = await metaRes.json();
                            currentFileSha = meta.sha;
                        } else if (metaRes.status === 404) {
                            // file not found: it will be created as new
                            currentFileSha = undefined;
                        } else {
                            let errBody = '';
                            try { const j = await metaRes.json(); errBody = j && (j.message || JSON.stringify(j)); } catch { try { errBody = await metaRes.text(); } catch (_) { errBody = ''; } }
                            throw new Error(`GitHub API Error: ${metaRes.status} ${metaRes.statusText}${errBody ? ' - ' + errBody : ''}`);
                        }
                    } catch (e) {
                        // propagate error to caller
                        throw e;
                    }
                } else {
                    // Use timestamp (YYYYMMDDHHmmss) in filename to ensure uniqueness
                    const now = new Date();
                    const timestamp = now.getFullYear() +
                        String(now.getMonth() + 1).padStart(2, '0') +
                        String(now.getDate()).padStart(2, '0') +
                        String(now.getHours()).padStart(2, '0') +
                        String(now.getMinutes()).padStart(2, '0') +
                        String(now.getSeconds()).padStart(2, '0');
                    const filename = `${timestamp}-${slug}.md`;
                    filePath = `src/articles/${filename}`;
                    var fileRef = `./articles/${filename}`;
                }
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
        submitBtn.textContent = '${isEdit ? 'Updating...' : 'Publishing...'}';

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
            submitBtn.textContent = '${isEdit ? 'Update Article' : 'Publish'}';
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
        // Read request body ONCE — reading multiple times causes "Body has already been used"
        const bodyJson = await request.json() as any;
        const { token, title, slug, content, collection } = bodyJson;
        const providedOriginalFile = bodyJson.originalFile || '';
        const providedOriginalSlug = bodyJson.originalSlug || '';

        if (!token || !title || !slug || !content) {
            return new Response('Missing required fields', { status: 400 });
        }

        const owner = 'Mahironya';
        const repo = 'misaka23323.com';
        const date = new Date().toISOString().split('T')[0];
        
        let filePath = '';
        let currentFileSha: string | undefined = undefined;

        // If originalFile provided, use it (edit mode). Otherwise create a new file with timestamp.
        if (providedOriginalFile) {
            filePath = providedOriginalFile.replace(/^\.\//, '');
            // fetch file metadata to get sha for update
            try {
                const meta = await githubFetch(filePath, { method: 'GET' });
                currentFileSha = meta.sha;
            } catch (e) {
                // ignore, will attempt update without sha and let GitHub error if necessary
            }
        } else {
            // Use timestamp (YYYYMMDDHHmmss) in filename to ensure uniqueness
            const now = new Date();
            const timestamp = now.getFullYear() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0') +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0') +
                String(now.getSeconds()).padStart(2, '0');
            const filename = `${timestamp}-${slug}.md`;
            filePath = `src/articles/${filename}`;
        }
        
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

        // 1. Create or update the markdown file
        const putBody: any = {
            message: providedOriginalFile ? `Update article: ${title}` : `Add article: ${title}`,
            content: btoa(unescape(encodeURIComponent(content))), // Handle UTF-8
        };
        if (currentFileSha) putBody.sha = currentFileSha;

        await githubFetch(filePath, {
            method: 'PUT',
            body: JSON.stringify(putBody),
        });

        // 2. Update articles.json
        // First get current content to get SHA
        const articlesJsonPath = 'src/articles.json';
        const currentFile = await githubFetch(articlesJsonPath);
        const currentContent = JSON.parse(decodeURIComponent(escape(atob(currentFile.content))));
        
        // Add or update article entry in articles.json
        // fileRef variable was set above: for edits keep original './articles/..', for new files the generated './articles/...'

        const newArticle: any = {
            title,
            slug,
            date,
            file: fileRef
        };
        if (collection) newArticle.collection = collection;

        // replace existing if editing
        let updated = false;
        const newContent = currentContent.map((entry: any) => {
            if (entry.file === providedOriginalFile || entry.slug === bodyJson.originalSlug) {
                updated = true;
                return newArticle;
            }
            return entry;
        });
        if (!updated) newContent.push(newArticle);

        // Update articles.json
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

async function renderArticlePage(slug: string) {
    const articles = await fetchArticlesList();
    const article = articles.find((a: any) => a.slug === slug);
    if (!article) {
        return new Response('Not Found', { status: 404 });
    }

    const markdown = await fetchArticleContent(article.file);
    const htmlContent = marked(markdown);

    const collectionHtml = (article as any).collection ? ` <span class="article-tag"><a href="/articles?collection=${encodeURIComponent((article as any).collection)}">${(article as any).collection}</a></span>` : '';

    const content = `
<div class="article-content">
    <h1>${article.title}${collectionHtml}</h1>
    <p class="article-meta">${article.date}</p>
    <div class="content">
        ${htmlContent}
    </div>
</div>
`;
    const navHtml = renderNavBar(true, slug);
    return render(article.title, content, navHtml);
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
        const html = await renderPublishPage(url);
        return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    if (path === '/api/publish' && request.method === 'POST') {
        return handlePublish(request);
    }

    const articleMatch = path.match(/^\/articles\/(.+)/);
    if (articleMatch) {
        const slug = articleMatch[1];
        const response = await renderArticlePage(slug);
        if (response instanceof Response) {
            return response;
        }
        return new Response(response, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    return new Response('Not Found', { status: 404 });
  },
};
