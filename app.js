// ============================================
// CONFIGURAÇÃO
// ============================================
const CONFIG = {
    GITHUB_USERNAME: 'Shelby3344',
    
    // URL da Edge Function que faz proxy pro GitHub (token seguro no servidor)
    GITHUB_PROXY_URL: 'https://faazmzqbsnppmbymqtco.supabase.co/functions/v1/github-proxy',
    
    // Configuração dos projetos em destaque
    FEATURED_PROJECTS: {
        revalidaflow: {
            name: 'RevalidaFlow',
            description: 'Plataforma de estudos para Revalida',
            siteUrl: 'https://www.revalidaflow.com/',
            githubRepo: 'Shelby3344/RevalidaFlow-2.0',
            supabaseStatsUrl: 'https://faazmzqbsnppmbymqtco.supabase.co/functions/v1/get-stats',
            gradient: 'linear-gradient(135deg, #667eea, #764ba2)'
        },
        cardflowbr: {
            name: 'CardFlowBR',
            description: 'Sistema de flashcards inteligente',
            siteUrl: 'https://www.cardflowbr.com/',
            githubRepo: 'Shelby3344/CardFlow-Shelby',
            supabaseStatsUrl: 'https://zxvxsaosoaulreztafvg.supabase.co/functions/v1/get-stats',
            gradient: 'linear-gradient(135deg, #f093fb, #f5576c)'
        },
        deepeyes: {
            name: 'DeepEyes',
            description: 'Visão computacional avançada',
            siteUrl: 'https://deepeyes.online/',
            githubRepo: 'Shelby3344/deepeyers',
            supabaseStatsUrl: 'https://ovqbegdxdcdpjdqiqebp.supabase.co/functions/v1/get-stats',
            gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)'
        }
    }
};
// ============================================

const langColors = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
    Ruby: '#701516', Go: '#00ADD8', Rust: '#dea584', PHP: '#4F5D95',
    Swift: '#ffac45', Kotlin: '#A97BFF', HTML: '#e34c26', CSS: '#563d7c',
    Vue: '#41b883', Shell: '#89e051', Dart: '#00B4AB', SCSS: '#c6538c',
};

let allRepos = [];
let currentRepo = null;

// Fetch via proxy seguro (token no servidor)
async function fetchGH(endpoint) {
    try {
        const res = await fetch(`${CONFIG.GITHUB_PROXY_URL}?endpoint=${encodeURIComponent(endpoint)}`);
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
}

async function fetchSupabaseStats(url) {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
}

// Initialize
async function init() {
    await loadProfile();
    await loadRepos();
    await loadOrganizations();
    setupFilters();
    setupTabs();
}

// ============================================
// FEATURED PROJECTS MODAL
// ============================================
async function openFeaturedProject(projectKey) {
    const project = CONFIG.FEATURED_PROJECTS[projectKey];
    if (!project) return;
    
    const modal = document.getElementById('featured-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('modal-icon').textContent = project.name.substring(0, 2).toUpperCase();
    document.getElementById('modal-icon').style.background = project.gradient;
    document.getElementById('modal-title').textContent = project.name;
    document.getElementById('modal-subtitle').textContent = project.description;
    document.getElementById('modal-site-link').href = project.siteUrl;
    document.getElementById('modal-github-link').href = project.githubRepo 
        ? `https://github.com/${project.githubRepo}` 
        : '#';
    
    ['total-users', 'active-users', 'new-users', 'pageviews', 'visitors', 'deployments'].forEach(id => {
        document.getElementById(`modal-${id}`).textContent = '-';
    });
    
    document.getElementById('modal-activity').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    if (project.supabaseStatsUrl) {
        const stats = await fetchSupabaseStats(project.supabaseStatsUrl);
        if (stats) {
            document.getElementById('modal-total-users').textContent = stats.total?.toLocaleString() || '0';
            document.getElementById('modal-active-users').textContent = stats.active?.toLocaleString() || '0';
            document.getElementById('modal-new-users').textContent = stats.new?.toLocaleString() || '0';
            document.getElementById('modal-pageviews').textContent = stats.pageviewsMonth?.toLocaleString() || '0';
            document.getElementById('modal-visitors').textContent = stats.visitors?.toLocaleString() || '0';
        }
    }
    
    if (project.githubRepo) {
        const [commits, deployments] = await Promise.all([
            fetchGH(`/repos/${project.githubRepo}/commits?per_page=5`),
            fetchGH(`/repos/${project.githubRepo}/deployments?per_page=10`)
        ]);
        
        document.getElementById('modal-deployments').textContent = deployments?.length || '0';
        
        if (commits && commits.length) {
            document.getElementById('modal-activity').innerHTML = commits.map(c => `
                <div class="modal-activity-item">
                    <div class="modal-activity-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="4"/><path d="M12 2v6M12 16v6"/>
                        </svg>
                    </div>
                    <div class="modal-activity-content">
                        <div class="modal-activity-title">${escapeHtml(c.commit.message.split('\n')[0])}</div>
                        <div class="modal-activity-meta">${c.commit.author?.name || 'Unknown'} • ${timeAgo(c.commit.author?.date)}</div>
                    </div>
                </div>
            `).join('');
        } else {
            document.getElementById('modal-activity').innerHTML = '<div class="empty-state">Nenhuma atividade recente</div>';
        }
    } else {
        document.getElementById('modal-activity').innerHTML = '<div class="empty-state">Configure o repositório GitHub</div>';
    }
}

function closeFeaturedModal() {
    document.getElementById('featured-modal').classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFeaturedModal();
});

// ============================================
// PROFILE & REPOS
// ============================================
async function loadProfile() {
    const user = await fetchGH(`/users/${CONFIG.GITHUB_USERNAME}`);
    if (!user) return;
    
    document.getElementById('username').textContent = user.name || user.login;
    document.getElementById('bio').textContent = user.bio || '';
    document.getElementById('avatar').src = user.avatar_url;
    document.getElementById('followers-count').textContent = user.followers;
    document.getElementById('gists-count').textContent = user.public_gists;
    document.getElementById('github-link').href = user.html_url;
}

async function loadOrganizations() {
    const orgs = await fetchGH(`/users/${CONFIG.GITHUB_USERNAME}/orgs`);
    const container = document.getElementById('orgs-grid');
    const section = document.getElementById('orgs-section');
    
    if (!orgs || !orgs.length) {
        section.style.display = 'none';
        return;
    }
    
    container.innerHTML = orgs.map(org => `
        <a href="https://github.com/${org.login}" target="_blank" class="org-card">
            <img src="${org.avatar_url}" alt="${org.login}" class="org-avatar">
            <span class="org-name">${org.login}</span>
        </a>
    `).join('');
}

async function loadRepos() {
    const repos = await fetchGH(`/users/${CONFIG.GITHUB_USERNAME}/repos?per_page=100&sort=updated`);
    allRepos = repos || [];
    
    document.getElementById('repo-count').textContent = allRepos.length;
    const stars = allRepos.reduce((a, r) => a + r.stargazers_count, 0);
    document.getElementById('stars-count').textContent = stars;
    
    const langs = [...new Set(allRepos.map(r => r.language).filter(Boolean))];
    const langFilter = document.getElementById('filter-language');
    langs.forEach(l => langFilter.innerHTML += `<option value="${l}">${l}</option>`);
    
    renderRepos(allRepos);
}

function renderRepos(repos) {
    const grid = document.getElementById('repos-grid');
    
    if (!repos.length) {
        grid.innerHTML = '<div class="empty-state">Nenhum repositório encontrado</div>';
        return;
    }
    
    grid.innerHTML = repos.map(repo => `
        <div class="repo-card" onclick="openProject('${repo.full_name}')">
            <div class="repo-header">
                <span class="repo-name">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                    </svg>
                    ${repo.name}
                </span>
                <span class="visibility-badge ${repo.private ? 'private' : 'public'}">
                    ${repo.private ? 'Privado' : 'Público'}
                </span>
            </div>
            <p class="repo-desc">${repo.description || 'Sem descrição'}</p>
            <div class="repo-meta">
                ${repo.language ? `<span><span class="lang-dot" style="background: ${langColors[repo.language] || '#8b8b8b'}"></span>${repo.language}</span>` : ''}
                <span><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>${repo.stargazers_count}</span>
                <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7M6 9v12"/></svg>${repo.forks_count}</span>
            </div>
        </div>
    `).join('');
}

// ============================================
// VIEW SWITCHING
// ============================================
function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById(`${viewName}-view`).classList.add('active');
    document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');
    
    if (viewName === 'starred') loadStarred();
    if (viewName === 'gists') loadGists();
    if (viewName === 'activity') loadActivity();
}

function showHome() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('home-view').classList.add('active');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-view="home"]')?.classList.add('active');
    currentRepo = null;
}

async function loadStarred() {
    const grid = document.getElementById('starred-grid');
    grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const starred = await fetchGH(`/users/${CONFIG.GITHUB_USERNAME}/starred?per_page=50`);
    
    if (!starred || !starred.length) {
        grid.innerHTML = '<div class="empty-state">Nenhum repositório starred</div>';
        return;
    }
    
    grid.innerHTML = starred.map(repo => `
        <a href="${repo.html_url}" target="_blank" class="repo-card">
            <div class="repo-header">
                <span class="repo-name"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>${repo.full_name}</span>
            </div>
            <p class="repo-desc">${repo.description || 'Sem descrição'}</p>
            <div class="repo-meta">
                ${repo.language ? `<span><span class="lang-dot" style="background: ${langColors[repo.language] || '#8b8b8b'}"></span>${repo.language}</span>` : ''}
                <span><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>${repo.stargazers_count}</span>
            </div>
        </a>
    `).join('');
}

async function loadGists() {
    const list = document.getElementById('gists-list');
    list.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const gists = await fetchGH(`/users/${CONFIG.GITHUB_USERNAME}/gists?per_page=30`);
    
    if (!gists || !gists.length) {
        list.innerHTML = '<div class="empty-state">Nenhum gist encontrado</div>';
        return;
    }
    
    list.innerHTML = gists.map(gist => {
        const files = Object.keys(gist.files);
        return `
            <a href="${gist.html_url}" target="_blank" class="gist-card">
                <div class="gist-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg></div>
                <div class="gist-content">
                    <div class="gist-title">${gist.description || files[0]}</div>
                    <div class="gist-meta"><span>${files.length} arquivo${files.length > 1 ? 's' : ''}</span><span>${timeAgo(gist.created_at)}</span></div>
                </div>
            </a>
        `;
    }).join('');
}

async function loadActivity() {
    const timeline = document.getElementById('activity-timeline');
    timeline.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const events = await fetchGH(`/users/${CONFIG.GITHUB_USERNAME}/events?per_page=30`);
    
    if (!events || !events.length) {
        timeline.innerHTML = '<div class="empty-state">Nenhuma atividade recente</div>';
        return;
    }
    
    timeline.innerHTML = events.map(event => {
        let title = '', type = '';
        switch (event.type) {
            case 'PushEvent': title = `Push de ${event.payload.commits?.length || 0} commit(s) em ${event.repo.name}`; type = 'push'; break;
            case 'CreateEvent': title = `Criou ${event.payload.ref_type} em ${event.repo.name}`; type = 'create'; break;
            case 'PullRequestEvent': title = `${event.payload.action} PR em ${event.repo.name}`; type = 'pr'; break;
            case 'IssuesEvent': title = `${event.payload.action} issue em ${event.repo.name}`; type = 'issue'; break;
            case 'WatchEvent': title = `Starred ${event.repo.name}`; type = 'star'; break;
            case 'ForkEvent': title = `Forked ${event.repo.name}`; type = 'fork'; break;
            default: title = `${event.type.replace('Event', '')} em ${event.repo.name}`;
        }
        return `<div class="timeline-item ${type}"><div class="timeline-title">${title}</div><div class="timeline-meta">${timeAgo(event.created_at)}</div></div>`;
    }).join('');
}

// ============================================
// PROJECT DETAIL
// ============================================
async function openProject(fullName) {
    currentRepo = allRepos.find(r => r.full_name === fullName);
    if (!currentRepo) return;
    
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('project-view').classList.add('active');
    window.scrollTo(0, 0);
    
    document.getElementById('project-name').textContent = currentRepo.name;
    document.getElementById('project-description').textContent = currentRepo.description || 'Sem descrição';
    document.getElementById('project-link').href = currentRepo.html_url;
    document.getElementById('project-stars').textContent = currentRepo.stargazers_count;
    document.getElementById('project-forks').textContent = currentRepo.forks_count;
    
    const visibilityEl = document.getElementById('project-visibility');
    visibilityEl.textContent = currentRepo.private ? 'Privado' : 'Público';
    visibilityEl.className = `visibility-badge ${currentRepo.private ? 'private' : 'public'}`;
    
    const langEl = document.getElementById('project-language');
    if (currentRepo.language) {
        langEl.innerHTML = `<span class="lang-dot" style="background: ${langColors[currentRepo.language] || '#8b8b8b'}"></span>${currentRepo.language}`;
        langEl.style.display = 'flex';
    } else {
        langEl.style.display = 'none';
    }
    
    ['commits', 'branches', 'prs', 'issues', 'releases', 'contributors', 'actions', 'views', 'alerts'].forEach(id => {
        document.getElementById(`stat-${id}`).textContent = '-';
    });
    
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
        card.onclick = () => switchProjectTab(card.dataset.tab);
    });
    document.querySelector('[data-tab="commits"]').classList.add('active');
    
    loadLanguages(); loadCodeStats(); loadCommits(); loadBranches();
    loadPullRequests(); loadIssues(); loadReleases(); loadContributors();
    loadActions(); loadTraffic(); loadAlerts();
}

function switchProjectTab(tabName) {
    document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

async function loadLanguages() {
    const languages = await fetchGH(`/repos/${currentRepo.full_name}/languages`);
    const bar = document.getElementById('languages-bar');
    const legend = document.getElementById('languages-legend');
    
    if (!languages || !Object.keys(languages).length) {
        bar.innerHTML = ''; legend.innerHTML = '<span class="empty-state">Sem dados</span>'; return;
    }
    
    const total = Object.values(languages).reduce((a, b) => a + b, 0);
    bar.innerHTML = Object.entries(languages).map(([lang, bytes]) => 
        `<div class="lang-segment" style="width: ${(bytes/total*100).toFixed(1)}%; background: ${langColors[lang] || '#8b8b8b'}"></div>`
    ).join('');
    legend.innerHTML = Object.entries(languages).map(([lang, bytes]) => 
        `<div class="legend-item"><span class="legend-dot" style="background: ${langColors[lang] || '#8b8b8b'}"></span>${lang} ${(bytes/total*100).toFixed(1)}%</div>`
    ).join('');
}

async function loadCodeStats() {
    const container = document.getElementById('code-stats');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const stats = await fetchGH(`/repos/${currentRepo.full_name}/stats/contributors`);
    if (!stats || !stats.length) {
        container.innerHTML = '<div class="code-stat-card"><h4>Total de Commits</h4><div class="code-stat-value">-</div></div>';
        return;
    }
    
    let adds = 0, dels = 0, commits = 0;
    stats.forEach(c => c.weeks.forEach(w => { adds += w.a; dels += w.d; commits += w.c; }));
    
    container.innerHTML = `
        <div class="code-stat-card"><h4>Total de Commits</h4><div class="code-stat-value">${commits.toLocaleString()}</div></div>
        <div class="code-stat-card"><h4>Linhas Adicionadas</h4><div class="code-stat-value additions">+${adds.toLocaleString()}</div></div>
        <div class="code-stat-card"><h4>Linhas Removidas</h4><div class="code-stat-value deletions">-${dels.toLocaleString()}</div></div>
        <div class="code-stat-card"><h4>Contributors</h4><div class="code-stat-value">${stats.length}</div></div>
    `;
}

async function loadCommits() {
    const panel = document.getElementById('tab-commits');
    panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const commits = await fetchGH(`/repos/${currentRepo.full_name}/commits?per_page=20`);
    if (!commits?.length) { panel.innerHTML = '<div class="empty-state">Nenhum commit</div>'; document.getElementById('stat-commits').textContent = '0'; return; }
    document.getElementById('stat-commits').textContent = commits.length + '+';
    panel.innerHTML = commits.map(c => `
        <a href="${c.html_url}" target="_blank" class="list-item">
            <div class="list-content"><div class="list-title">${escapeHtml(c.commit.message.split('\n')[0])}</div><div class="list-meta"><span>${c.commit.author?.name || 'Unknown'}</span><span>${timeAgo(c.commit.author?.date)}</span></div></div>
            <span class="commit-sha">${c.sha.substring(0,7)}</span>
            <svg class="list-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
        </a>
    `).join('');
}

async function loadBranches() {
    const panel = document.getElementById('tab-branches');
    panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const branches = await fetchGH(`/repos/${currentRepo.full_name}/branches?per_page=30`);
    if (!branches?.length) { panel.innerHTML = '<div class="empty-state">Nenhuma branch</div>'; document.getElementById('stat-branches').textContent = '0'; return; }
    document.getElementById('stat-branches').textContent = branches.length;
    panel.innerHTML = branches.map(b => `
        <div class="branch-item"><span class="branch-name"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9"/></svg>${b.name}</span>${b.name === currentRepo.default_branch ? '<span class="branch-default">default</span>' : ''}</div>
    `).join('');
}

async function loadPullRequests() {
    const panel = document.getElementById('tab-prs');
    panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const prs = await fetchGH(`/repos/${currentRepo.full_name}/pulls?state=all&per_page=20`);
    if (!prs?.length) { panel.innerHTML = '<div class="empty-state">Nenhum PR</div>'; document.getElementById('stat-prs').textContent = '0'; return; }
    document.getElementById('stat-prs').textContent = prs.length;
    panel.innerHTML = prs.map(pr => {
        const status = pr.merged_at ? 'merged' : pr.state;
        return `<a href="${pr.html_url}" target="_blank" class="list-item"><span class="status-dot ${status}"></span><div class="list-content"><div class="list-title">${escapeHtml(pr.title)}</div><div class="list-meta"><span>#${pr.number}</span><span>${pr.user?.login}</span><span>${timeAgo(pr.created_at)}</span></div></div><span class="list-badge">${pr.merged_at ? 'Merged' : pr.state}</span><svg class="list-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></a>`;
    }).join('');
}

async function loadIssues() {
    const panel = document.getElementById('tab-issues');
    panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const issues = await fetchGH(`/repos/${currentRepo.full_name}/issues?state=all&per_page=20`);
    const real = issues?.filter(i => !i.pull_request) || [];
    if (!real.length) { panel.innerHTML = '<div class="empty-state">Nenhuma issue</div>'; document.getElementById('stat-issues').textContent = '0'; return; }
    document.getElementById('stat-issues').textContent = real.length;
    panel.innerHTML = real.map(i => `<a href="${i.html_url}" target="_blank" class="list-item"><span class="status-dot ${i.state}"></span><div class="list-content"><div class="list-title">${escapeHtml(i.title)}</div><div class="list-meta"><span>#${i.number}</span><span>${i.user?.login}</span><span>${timeAgo(i.created_at)}</span></div></div>${i.labels?.length ? `<span class="list-badge">${i.labels[0].name}</span>` : ''}<svg class="list-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></a>`).join('');
}

async function loadReleases() {
    const panel = document.getElementById('tab-releases');
    panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const releases = await fetchGH(`/repos/${currentRepo.full_name}/releases?per_page=15`);
    if (!releases?.length) { panel.innerHTML = '<div class="empty-state">Nenhuma release</div>'; document.getElementById('stat-releases').textContent = '0'; return; }
    document.getElementById('stat-releases').textContent = releases.length;
    panel.innerHTML = releases.map(r => `<a href="${r.html_url}" target="_blank" class="list-item"><div class="list-content"><div class="list-title">${r.name || r.tag_name}</div><div class="list-meta"><span>${r.tag_name}</span><span>${timeAgo(r.published_at)}</span></div></div>${r.prerelease ? '<span class="list-badge">Pre-release</span>' : ''}<svg class="list-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></a>`).join('');
}

async function loadContributors() {
    const panel = document.getElementById('tab-contributors');
    panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const contributors = await fetchGH(`/repos/${currentRepo.full_name}/contributors?per_page=30`);
    if (!contributors?.length) { panel.innerHTML = '<div class="empty-state">Nenhum contributor</div>'; document.getElementById('stat-contributors').textContent = '0'; return; }
    document.getElementById('stat-contributors').textContent = contributors.length;
    panel.innerHTML = `<div class="contributors-grid">${contributors.map(c => `<a href="${c.html_url}" target="_blank" class="contributor-card"><img src="${c.avatar_url}" class="contributor-avatar"><div class="contributor-info"><span class="contributor-name">${c.login}</span><span class="contributor-commits">${c.contributions} commits</span></div></a>`).join('')}</div>`;
}

async function loadActions() {
    const panel = document.getElementById('tab-actions');
    panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const runs = await fetchGH(`/repos/${currentRepo.full_name}/actions/runs?per_page=15`);
    if (!runs?.workflow_runs?.length) { panel.innerHTML = '<div class="empty-state">Nenhum workflow</div>'; document.getElementById('stat-actions').textContent = '0'; return; }
    const wfs = runs.workflow_runs;
    document.getElementById('stat-actions').textContent = wfs.length;
    panel.innerHTML = wfs.map(w => `<a href="${w.html_url}" target="_blank" class="list-item"><span class="status-dot ${w.conclusion || w.status}"></span><div class="list-content"><div class="list-title">${escapeHtml(w.name)}</div><div class="list-meta"><span>${w.head_branch}</span><span>${w.event}</span><span>${timeAgo(w.created_at)}</span></div></div><span class="list-badge">${w.conclusion || w.status}</span><svg class="list-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></a>`).join('');
}

async function loadTraffic() {
    const panel = document.getElementById('tab-traffic');
    panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const [views, clones] = await Promise.all([fetchGH(`/repos/${currentRepo.full_name}/traffic/views`), fetchGH(`/repos/${currentRepo.full_name}/traffic/clones`)]);
    if (!views && !clones) { panel.innerHTML = '<div class="empty-state">Sem dados de tráfego</div>'; document.getElementById('stat-views').textContent = '-'; return; }
    document.getElementById('stat-views').textContent = views?.count || 0;
    panel.innerHTML = `<div class="traffic-grid"><div class="traffic-card"><div class="traffic-value">${views?.count || 0}</div><div class="traffic-label">Views (14d)</div></div><div class="traffic-card"><div class="traffic-value">${views?.uniques || 0}</div><div class="traffic-label">Únicos</div></div><div class="traffic-card"><div class="traffic-value">${clones?.count || 0}</div><div class="traffic-label">Clones</div></div><div class="traffic-card"><div class="traffic-value">${clones?.uniques || 0}</div><div class="traffic-label">Cloners</div></div></div>`;
}

async function loadAlerts() {
    const panel = document.getElementById('tab-alerts');
    panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const alerts = await fetchGH(`/repos/${currentRepo.full_name}/dependabot/alerts?state=open&per_page=20`);
    if (!alerts?.length) { panel.innerHTML = '<div class="empty-state">Nenhum alerta</div>'; document.getElementById('stat-alerts').textContent = '0'; return; }
    document.getElementById('stat-alerts').textContent = alerts.length;
    panel.innerHTML = alerts.map(a => {
        const sev = a.security_advisory?.severity || 'medium';
        return `<div class="alert-card"><div class="alert-icon ${sev}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div class="alert-content"><div class="alert-title">${a.security_advisory?.summary || 'Vulnerabilidade'}</div><div class="alert-desc">${a.dependency?.package?.name || ''}</div><div class="alert-meta">${timeAgo(a.created_at)}</div></div><span class="alert-severity ${sev}">${sev}</span></div>`;
    }).join('');
}

// ============================================
// UTILS
// ============================================
function setupFilters() {
    document.getElementById('filter-visibility')?.addEventListener('change', applyFilters);
    document.getElementById('filter-language')?.addEventListener('change', applyFilters);
}

function applyFilters() {
    const vis = document.getElementById('filter-visibility').value;
    const lang = document.getElementById('filter-language').value;
    let filtered = allRepos;
    if (vis === 'public') filtered = filtered.filter(r => !r.private);
    if (vis === 'private') filtered = filtered.filter(r => r.private);
    if (lang !== 'all') filtered = filtered.filter(r => r.language === lang);
    renderRepos(filtered);
}

function setupTabs() {
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', () => switchProjectTab(card.dataset.tab));
    });
}

function timeAgo(date) {
    if (!date) return '';
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    const intervals = [{l:'ano',s:31536000},{l:'mês',s:2592000},{l:'dia',s:86400},{l:'h',s:3600},{l:'min',s:60}];
    for (const i of intervals) { const c = Math.floor(s / i.s); if (c >= 1) return `${c} ${i.l}${c > 1 && i.l.length > 1 ? 's' : ''} atrás`; }
    return 'agora';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Start
init();
