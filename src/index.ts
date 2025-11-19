import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import styles from './styles.css';

marked.use(markedKatex({
  throwOnError: false
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

function render(title: string, content: string) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css" integrity="sha384-wcIxkf4k558AjM3Cd3q6S5L036Vyu+86IPDgKS0Wl9UClhYJe19ehkw+53TRagLX" crossorigin="anonymous">
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

async function renderArticlesPage() {
    const articles = await fetchArticlesList();
    // Sort articles by date descending (newest first)
    const sortedArticles = [...articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const articlesHtml = sortedArticles.map(article => `
        <div class="article-item">
            <h2><a href="/articles/${article.slug}">${article.title}</a></h2>
            <p>${article.date}</p>
        </div>
    `).join('');

    const content = `
<div class="article-list">
    <div class="header-actions">
        <h1>Articles</h1>
        <a href="/publish" class="btn-primary">Publish Article</a>
    </div>
    ${articlesHtml}
</div>
`;
    return render("Articles", content);
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
`;
    return render("Publish Article", content);
}

async function handlePublish(request: Request) {
    try {
        const { token, title, slug, content } = await request.json() as any;
        
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
        const newArticle = {
            title,
            slug,
            date,
            file: `./articles/${filename}`
        };
        
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

async function renderArticlePage(slug: string) {
    const articles = await fetchArticlesList();
    const article = articles.find((a: any) => a.slug === slug);
    if (!article) {
        return new Response('Not Found', { status: 404 });
    }

    const markdown = await fetchArticleContent(article.file);
    const htmlContent = marked(markdown);

    const content = `
<div class="article-content">
    <h1>${article.title}</h1>
    <p class="article-meta">${article.date}</p>
    <div class="content">
        ${htmlContent}
    </div>
</div>
`;
    return render(article.title, content);
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
        const html = await renderArticlesPage();
        return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    if (path === '/publish') {
        return new Response(renderPublishPage(), { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
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
