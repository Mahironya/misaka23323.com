import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { articles, articleContents } from './generated-articles';
import styles from './styles.css';

marked.use(markedKatex({
  throwOnError: false
}));

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
    
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Mobile Dropdown Toggle
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
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

function renderArticlesPage() {
    const articlesHtml = articles.map(article => `
        <div class="article-item">
            <h2><a href="/articles/${article.slug}">${article.title}</a></h2>
            <p>${article.date}</p>
        </div>
    `).join('');

    const content = `
<div class="article-list">
    <h1>Articles</h1>
    ${articlesHtml}
</div>
`;
    return render("Articles", content);
}

function renderArticlePage(slug: string) {
    const article = articles.find(a => a.slug === slug);
    if (!article) {
        return new Response('Not Found', { status: 404 });
    }

    const markdown = articleContents[article.file as keyof typeof articleContents];
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
        return new Response(renderArticlesPage(), { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    const articleMatch = path.match(/^\/articles\/(.+)/);
    if (articleMatch) {
        const slug = articleMatch[1];
        const response = renderArticlePage(slug);
        if (response instanceof Response) {
            return response;
        }
        return new Response(response, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    return new Response('Not Found', { status: 404 });
  },
};
