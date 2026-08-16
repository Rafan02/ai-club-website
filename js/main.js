/* ==========================================================================
   AI CLUB — public site behaviour
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const state = Store.getState();
  const cfg = state.config;
  const data = state.data;

  initTraces();
  initNav();
  initJoinLinks(cfg);
  initFooter(cfg);
  initReveal();

  renderAnnouncement(data.news);
  renderIntroIsStatic(); // no-op placeholder for symmetry, cards are static HTML
  renderStats(data.stats);
  renderAchievements(data.achievements);
  renderOlympiad(data.olympiad);
  renderProjects(data.projects);
  renderEvents(data.events);
  renderNews(data.news);
  renderGallery(data.gallery);
  renderTeam(data.team);
  renderResources(data.resources);
  renderFAQ(data.faq);

  initFactWidget();
  initAssistant(data, cfg);
  initModals();
  initLightbox();
});

/* ---------------- circuit-trace dividers ---------------- */
function initTraces(){
  document.querySelectorAll(".trace").forEach((el, i) => {
    const gid = "traceGrad" + i;
    el.innerHTML = `
      <svg viewBox="0 0 1200 46" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#45e0ff" stop-opacity="0"/>
            <stop offset="50%" stop-color="#5b7fff" stop-opacity="1"/>
            <stop offset="100%" stop-color="#a35bff" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0,23 C 200,5 300,41 500,23 S 800,5 1200,23" stroke="url(#${gid})" style="stroke:url(#${gid})"/>
        <circle cx="240" cy="15" r="3"/>
        <circle cx="620" cy="27" r="2.4"/>
        <circle cx="960" cy="13" r="3"/>
      </svg>`;
  });
}

/* ---------------- nav ---------------- */
function initNav(){
  const nav = document.getElementById("site-nav");
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");

  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 12);
  });

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.classList.toggle("active", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.classList.remove("active");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

/* ---------------- join buttons + footer/contact from config ---------------- */
function initJoinLinks(cfg){
  document.querySelectorAll("[data-join-link]").forEach(a => {
    if (cfg.joinUrl && cfg.joinUrl.trim()){
      a.href = cfg.joinUrl.trim();
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.href = "#join";
    }
  });
}

function initFooter(cfg){
  const locEl = document.getElementById("footer-location");
  if (locEl) locEl.textContent = cfg.contact.location;
  const advEl = document.getElementById("footer-advisor");
  if (advEl) advEl.textContent = "Faculty Advisor: " + cfg.contact.advisor;

  const setSocial = (id, url) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (url && url.trim()){ el.href = url.trim(); el.target = "_blank"; el.rel = "noopener"; el.removeAttribute("aria-disabled"); }
    else { el.href = "#"; el.setAttribute("aria-disabled","true"); el.style.opacity = ".4"; el.style.cursor = "default"; }
  };
  setSocial("social-instagram", cfg.social.instagram);
  setSocial("social-facebook", cfg.social.facebook);
  setSocial("social-youtube", cfg.social.youtube);

  const contactEmail = document.getElementById("contact-email-link");
  if (contactEmail){ contactEmail.href = "mailto:" + cfg.contact.email; contactEmail.textContent = cfg.contact.email; }
}

function renderIntroIsStatic(){ /* Learn/Build/Compete/Collaborate cards are static markup by design */ }

/* ---------------- scroll reveal ---------------- */
function initReveal(){
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)){ els.forEach(e=>e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach(e => io.observe(e));
}

function markReveal(container){
  container.querySelectorAll(":scope > *").forEach(el => el.classList.add("reveal"));
  initReveal();
}

/* ---------------- announcement bar ---------------- */
function renderAnnouncement(news){
  const bar = document.getElementById("announce-bar");
  const published = (news||[]).filter(n => n.status !== "Archived");
  const pinned = published.find(n => n.pinned) || published[0];
  if (!pinned){ bar.style.display = "none"; return; }
  document.getElementById("announce-text").innerHTML =
    `<b>${escapeHTML(pinned.title)}</b> — ${escapeHTML(pinned.description)}`;
  const link = document.getElementById("announce-link");
  link.href = "#news";
}

/* ---------------- stats ---------------- */
function renderStats(stats){
  const map = [
    ["stat-members", stats.members],
    ["stat-projects", stats.projects],
    ["stat-events", stats.events],
    ["stat-awards", stats.awards]
  ];
  map.forEach(([id, target]) => animateCount(document.getElementById(id), target));
}
function animateCount(el, target){
  if (!el) return;
  target = Number(target) || 0;
  if (target === 0){ el.textContent = "0"; return; }
  let cur = 0;
  const step = Math.max(1, Math.ceil(target/40));
  const t = setInterval(() => {
    cur += step;
    if (cur >= target){ cur = target; clearInterval(t); }
    el.textContent = cur;
  }, 30);
}

/* ---------------- achievements ---------------- */
function renderAchievements(list){
  const grid = document.getElementById("achievements-grid");
  const filters = document.getElementById("achievements-filters");
  if (!grid) return;

  const cats = ["All", ...Array.from(new Set(list.map(a => a.category)))];
  filters.innerHTML = cats.map((c,i) => `<button class="filter-chip ${i===0?'active':''}" data-cat="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join("");

  function paint(cat){
    const items = cat === "All" ? list : list.filter(a => a.category === cat);
    if (!items.length){ grid.innerHTML = `<div class="empty-state">No achievements in this category yet.</div>`; return; }
    grid.innerHTML = items.map(a => `
      <article class="card ach-card">
        <div class="ach-top"><span class="tag">${escapeHTML(a.category)}</span><span class="ach-year">${escapeHTML(a.year)}</span></div>
        <h3 class="ach-title">${escapeHTML(a.title)}</h3>
        <p class="ach-desc">${escapeHTML(a.description)}</p>
        ${a.people ? `<div class="ach-people">${escapeHTML(a.people)}</div>` : ""}
        ${a.link ? `<a class="btn btn-ghost btn-sm" href="${escapeHTML(a.link)}" target="_blank" rel="noopener" style="margin-top:6px;align-self:flex-start;">View details</a>` : ""}
      </article>
    `).join("");
    markReveal(grid);
  }
  paint("All");
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    filters.querySelectorAll(".filter-chip").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    paint(btn.dataset.cat);
  });
}

/* ---------------- olympiad ---------------- */
function renderOlympiad(oly){
  const introEl = document.getElementById("olympiad-intro");
  if (introEl) introEl.textContent = oly.intro;
  const tl = document.getElementById("olympiad-timeline");
  if (!tl) return;
  tl.innerHTML = oly.rounds.map(r => `
    <div class="tl-step">
      <div class="tl-line" aria-hidden="true"></div>
      <div class="tl-dot">${escapeHTML((r.title||"?").charAt(0))}</div>
      <h4>${escapeHTML(r.title)}</h4>
      <p>${escapeHTML(r.desc)}</p>
    </div>
  `).join("");
}

/* ---------------- projects ---------------- */
let PROJECTS_CACHE = [];
function renderProjects(list){
  PROJECTS_CACHE = list;
  const grid = document.getElementById("projects-grid");
  const filters = document.getElementById("projects-filters");
  if (!grid) return;

  const cats = ["All", ...Array.from(new Set(list.map(p => p.category)))];
  filters.innerHTML = cats.map((c,i) => `<button class="filter-chip ${i===0?'active':''}" data-cat="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join("");

  function paint(cat){
    const items = cat === "All" ? list : list.filter(p => p.category === cat);
    if (!items.length){ grid.innerHTML = `<div class="empty-state">No projects in this category yet — check back soon.</div>`; return; }
    grid.innerHTML = items.map(p => `
      <article class="card proj-card" data-id="${escapeHTML(p.id)}" tabindex="0" role="button" aria-label="View project ${escapeHTML(p.title)}">
        <div class="proj-thumb">${thumbOrPlaceholder(p.image, p.title)}<span class="proj-status">${escapeHTML(p.status||"")}</span></div>
        <div class="proj-body">
          <span class="proj-cat">${escapeHTML(p.category)}</span>
          <h3>${escapeHTML(p.title)}</h3>
          <p>${escapeHTML(truncate(p.description, 90))}</p>
          <div class="proj-tech">${(p.tech||[]).map(t=>`<span class="tag">${escapeHTML(t)}</span>`).join("")}</div>
        </div>
      </article>
    `).join("");
    markReveal(grid);
    grid.querySelectorAll(".proj-card").forEach(card => {
      const open = () => openProjectModal(card.dataset.id);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); open(); } });
    });
  }
  paint("All");
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    filters.querySelectorAll(".filter-chip").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    paint(btn.dataset.cat);
  });
}

function openProjectModal(id){
  const p = PROJECTS_CACHE.find(x => x.id === id);
  if (!p) return;
  const box = document.getElementById("modal-body");
  box.innerHTML = `
    <div class="modal-media">${thumbOrPlaceholder(p.image, p.title)}</div>
    <div class="modal-content">
      <div class="modal-meta"><span class="tag">${escapeHTML(p.category)}</span><span class="tag">${escapeHTML(p.status||"")}</span></div>
      <h2>${escapeHTML(p.title)}</h2>
      <p>${escapeHTML(p.description)}</p>
      ${p.creators ? `<p style="color:var(--cyan);font-family:var(--font-mono);font-size:.85rem;">By ${escapeHTML(p.creators)}</p>` : ""}
      <div class="proj-tech">${(p.tech||[]).map(t=>`<span class="tag">${escapeHTML(t)}</span>`).join("")}</div>
      <div class="modal-links">
        ${p.demoLink ? `<a class="btn btn-primary btn-sm" href="${escapeHTML(p.demoLink)}" target="_blank" rel="noopener">View demo</a>` : ""}
        ${p.githubLink ? `<a class="btn btn-ghost btn-sm" href="${escapeHTML(p.githubLink)}" target="_blank" rel="noopener">View code</a>` : ""}
      </div>
    </div>`;
  openModal();
}

/* ---------------- events ---------------- */
function renderEvents(list){
  const grid = document.getElementById("events-grid");
  const tabs = document.getElementById("events-tabs");
  if (!grid) return;

  const upcoming = list.filter(e => !isPastDate(e.date)).sort((a,b)=>a.date.localeCompare(b.date));
  const past = list.filter(e => isPastDate(e.date)).sort((a,b)=>b.date.localeCompare(a.date));

  function paint(which){
    const items = which === "past" ? past : upcoming;
    if (!items.length){
      grid.innerHTML = `<div class="empty-state">${which === "past" ? "No past events yet." : "No upcoming events right now — check back soon."}</div>`;
      return;
    }
    grid.innerHTML = items.map(ev => {
      const dp = dateParts(ev.date);
      return `
      <article class="card event-card ${which==='past'?'past':''}">
        <div class="event-date"><b>${dp.day}</b><span>${dp.mon}</span></div>
        <div class="event-info">
          <span class="tag" style="margin-bottom:8px;">${escapeHTML(ev.category)}</span>
          <h3>${escapeHTML(ev.title)}</h3>
          <p>${escapeHTML(truncate(ev.description, 80))}</p>
          <div class="event-meta">${escapeHTML(ev.time||"")} · ${escapeHTML(ev.location||"")}</div>
          ${(which!=='past' && ev.registerLink) ? `<a class="btn btn-primary btn-sm" style="margin-top:12px;" href="${escapeHTML(ev.registerLink)}" target="_blank" rel="noopener">Register</a>` : ""}
        </div>
      </article>`;
    }).join("");
    markReveal(grid);
  }
  paint("upcoming");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    tabs.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    paint(btn.dataset.tab);
  });
}

/* ---------------- news ---------------- */
let NEWS_CACHE = [];
function renderNews(list){
  NEWS_CACHE = list;
  const grid = document.getElementById("news-grid");
  if (!grid) return;
  const published = list.filter(n => n.status !== "Archived").sort((a,b)=>b.date.localeCompare(a.date));
  if (!published.length){ grid.innerHTML = `<div class="empty-state">No news posted yet.</div>`; return; }
  grid.innerHTML = published.slice(0,6).map(n => `
    <article class="card news-card" data-id="${escapeHTML(n.id)}" tabindex="0" role="button" aria-label="Read ${escapeHTML(n.title)}">
      <div class="news-thumb">${thumbOrPlaceholder(n.image, n.title)}</div>
      <div class="news-body">
        <span class="news-date">${formatDate(n.date)} · ${escapeHTML(n.category)}</span>
        <h3>${escapeHTML(n.title)}</h3>
        <p>${escapeHTML(truncate(n.description, 90))}</p>
      </div>
    </article>
  `).join("");
  markReveal(grid);
  grid.querySelectorAll(".news-card").forEach(card => {
    const open = () => openNewsModal(card.dataset.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => { if (e.key==="Enter"||e.key===" "){ e.preventDefault(); open(); } });
  });
}
function openNewsModal(id){
  const n = NEWS_CACHE.find(x => x.id === id);
  if (!n) return;
  const box = document.getElementById("modal-body");
  box.innerHTML = `
    <div class="modal-media">${thumbOrPlaceholder(n.image, n.title)}</div>
    <div class="modal-content">
      <div class="modal-meta"><span class="tag">${escapeHTML(n.category)}</span><span class="tag">${formatDate(n.date)}</span></div>
      <h2>${escapeHTML(n.title)}</h2>
      <p>${escapeHTML(n.article || n.description)}</p>
    </div>`;
  openModal();
}

/* ---------------- gallery ---------------- */
let GALLERY_CACHE = [];
let GALLERY_FILTERED = [];
function renderGallery(list){
  GALLERY_CACHE = list;
  const grid = document.getElementById("gallery-grid");
  const tabs = document.getElementById("gallery-tabs");
  if (!grid) return;

  const albums = ["All", ...Array.from(new Set(list.map(g => g.album)))];
  tabs.innerHTML = albums.map((a,i) => `<button class="filter-chip ${i===0?'active':''}" data-album="${escapeHTML(a)}">${escapeHTML(a)}</button>`).join("");

  function paint(album){
    const items = album === "All" ? list : list.filter(g => g.album === album);
    GALLERY_FILTERED = items;
    if (!items.length){ grid.innerHTML = `<div class="empty-state">No photos in this album yet.</div>`; return; }
    grid.innerHTML = items.map((g,i) => `
      <figure class="gallery-item" data-idx="${i}" tabindex="0" role="button" aria-label="View photo: ${escapeHTML(g.caption)}">
        ${thumbOrPlaceholder(g.image, g.caption, true)}
        <figcaption class="gallery-cap">${escapeHTML(g.caption)}</figcaption>
      </figure>
    `).join("");
    markReveal(grid);
    grid.querySelectorAll(".gallery-item").forEach(item => {
      const open = () => openLightbox(Number(item.dataset.idx));
      item.addEventListener("click", open);
      item.addEventListener("keydown", (e) => { if (e.key==="Enter"||e.key===" "){ e.preventDefault(); open(); } });
    });
  }
  paint("All");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    tabs.querySelectorAll(".filter-chip").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    paint(btn.dataset.album);
  });
}

/* ---------------- team ---------------- */
function renderTeam(list){
  const grid = document.getElementById("team-grid");
  if (!grid) return;
  if (!list.length){ grid.innerHTML = `<div class="empty-state">Team info coming soon.</div>`; return; }
  grid.innerHTML = list.map(t => `
    <div class="card team-card">
      <div class="team-avatar">${t.photo ? `<img src="${t.photo}" alt="${escapeHTML(t.name)}">` : initials(t.name)}</div>
      <h4>${escapeHTML(t.name)}</h4>
      <div class="role">${escapeHTML(t.position)}</div>
      <p class="bio">${escapeHTML(t.bio)}</p>
      ${t.social ? `<a href="${escapeHTML(t.social)}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" style="margin-top:12px;">Profile</a>` : ""}
    </div>
  `).join("");
  markReveal(grid);
}

/* ---------------- learning hub / resources ---------------- */
function renderResources(list){
  const grid = document.getElementById("hub-grid");
  const topics = document.getElementById("hub-topics");
  if (!grid) return;

  const cats = ["All", ...Array.from(new Set(list.map(r => r.category)))];
  topics.innerHTML = cats.map((c,i) => `<button class="filter-chip ${i===0?'active':''}" data-cat="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join("");

  const diffLevel = { "Beginner":1, "Intermediate":2, "Advanced":3 };
  function paint(cat){
    const items = cat === "All" ? list : list.filter(r => r.category === cat);
    if (!items.length){ grid.innerHTML = `<div class="empty-state">No resources in this topic yet.</div>`; return; }
    grid.innerHTML = items.map(r => {
      const lvl = diffLevel[r.difficulty] || 1;
      const dots = [1,2,3].map(n => `<i class="${n<=lvl?'on':''}"></i>`).join("");
      const inner = `
        <div>
          <span class="tag" style="margin-bottom:8px;">${escapeHTML(r.category)}</span>
          <h4>${escapeHTML(r.title)}</h4>
          <p>${escapeHTML(r.description)}</p>
          <div class="hub-meta"><span class="diff-dot">${dots}</span><span style="font-size:.72rem;color:var(--text-3);font-family:var(--font-mono);">${escapeHTML(r.difficulty)}</span></div>
        </div>
        <span class="hub-arrow" aria-hidden="true">${r.link ? "&#8599;" : ""}</span>`;
      return r.link
        ? `<a class="card hub-item" href="${escapeHTML(r.link)}" target="_blank" rel="noopener">${inner}</a>`
        : `<div class="card hub-item">${inner}</div>`;
    }).join("");
    markReveal(grid);
  }
  paint("All");
  topics.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    topics.querySelectorAll(".filter-chip").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    paint(btn.dataset.cat);
  });
}

/* ---------------- FAQ ---------------- */
function renderFAQ(list){
  const wrap = document.getElementById("faq-list");
  if (!wrap) return;
  wrap.innerHTML = list.map((f,i) => `
    <div class="faq-item glass ${i===0?'open':''}">
      <button class="faq-q" aria-expanded="${i===0}">
        <span>${escapeHTML(f.q)}</span><span class="fq-plus">+</span>
      </button>
      <div class="faq-a"><div class="faq-a-in">${escapeHTML(f.a)}</div></div>
    </div>
  `).join("");
  wrap.querySelectorAll(".faq-item").forEach(item => {
    const q = item.querySelector(".faq-q");
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      wrap.querySelectorAll(".faq-item").forEach(i => { i.classList.remove("open"); i.querySelector(".faq-q").setAttribute("aria-expanded","false"); });
      if (!isOpen){ item.classList.add("open"); q.setAttribute("aria-expanded","true"); }
    });
  });
}

/* ---------------- AI fact widget ---------------- */
function initFactWidget(){
  const btn = document.getElementById("fact-btn");
  const pop = document.getElementById("fact-popover");
  const text = document.getElementById("fact-text");
  const closeBtn = document.getElementById("fact-close");
  if (!btn) return;
  let lastIdx = -1;
  function showFact(){
    let idx = Math.floor(Math.random()*AI_FACTS.length);
    if (idx === lastIdx) idx = (idx+1) % AI_FACTS.length;
    lastIdx = idx;
    text.textContent = AI_FACTS[idx];
    pop.classList.add("open");
  }
  btn.addEventListener("click", showFact);
  closeBtn.addEventListener("click", () => pop.classList.remove("open"));
}

/* ---------------- Ask the AI Club assistant (local, rule-based) ---------------- */
function initAssistant(siteData, cfg){
  const data = siteData; // alias kept for buildLiveContext readability
  const fab = document.getElementById("assist-fab");
  const panel = document.getElementById("assist-panel");
  const closeBtn = document.getElementById("assist-close");
  const body = document.getElementById("assist-body");
  const suggestWrap = document.getElementById("assist-suggest");
  const form = document.getElementById("assist-form");
  const input = document.getElementById("assist-input");
  const sendBtn = form ? form.querySelector("button") : null;
  if (!fab) return;

  // Built-in questions — instant, free, work even if the live AI is down.
  const suggestions = [
    "What does the club do?",
    "Who can join?",
    "Do I need experience?",
    "What can I learn?",
    "Are there competitions?",
    "What events are coming up?",
    "How can I join?",
    "How do I contact the club?"
  ];
  suggestWrap.innerHTML = suggestions.map(s => `<button type="button">${escapeHTML(s)}</button>`).join("");

  function addMsg(text, who){
    const div = document.createElement("div");
    div.className = "msg " + who;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }
  function addTyping(){
    const div = document.createElement("div");
    div.className = "msg bot typing";
    div.innerHTML = "<i></i><i></i><i></i>";
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function builtInAnswer(question){
    const q = question.toLowerCase();
    const has = (...words) => words.some(w => q.includes(w));

    if (has("event", "upcoming", "workshop", "happening")){
      const upcoming = (data.events||[]).filter(e => !isPastDate(e.date)).sort((a,b)=>a.date.localeCompare(b.date));
      if (!upcoming.length) return "There are no upcoming events listed right now — check the Events section again soon.";
      const e = upcoming[0];
      return `The next event is "${e.title}" on ${formatDate(e.date)}${e.time ? " at " + e.time : ""}${e.location ? " in " + e.location : ""}. See the Events section for the full list.`;
    }
    if (has("join", "sign up", "signup", "register", "how can i join", "become a member")){
      return cfg.joinUrl
        ? `You can join through the "Join the AI Club" button at the top or bottom of the page.`
        : `Use the "Join the AI Club" button — it will take you to the Join section. Registration details will be added there once finalized.`;
    }
    if (has("who can join", "eligib", "grade", "student of")){
      return "Any student of Cantonment English School And College can join — no prior AI experience needed.";
    }
    if (has("experience", "beginner", "know nothing", "new to")){
      return "No previous AI experience is required. The club is designed to help students learn and grow from wherever they're starting.";
    }
    if (has("learn", "topic", "curriculum", "python", "machine learning", "what can i")){
      return "Members explore AI, Machine Learning, Python, Computer Vision, and Generative AI through hands-on projects — check the Learning Hub for resources.";
    }
    if (has("project", "build", "showcase")){
      return "The club builds real, hands-on AI projects together — take a look at the Projects section to see current work.";
    }
    if (has("competition", "olympiad", "hackathon", "compete")){
      return "The club prepares students for AI Olympiads, competitions, and hackathons. See the AI Olympiad section for the preparation → results timeline.";
    }
    if (has("what does the club do", "about the club", "what is the club", "what is ai club")){
      return "The AI Club helps students learn AI & Machine Learning, build real projects, prepare for competitions, and collaborate with other curious students — see the About section for the full mission.";
    }
    if (has("contact", "email", "advisor")){
      return `You can reach the club at ${cfg.contact.email}. Faculty advisor: ${cfg.contact.advisor}.`;
    }
    if (has("meeting", "when do you meet", "schedule")){
      return "Meeting times are shared through the Events section and club announcements — check there for the latest schedule.";
    }
    const faqHit = (data.faq||[]).find(f => {
      const qWords = f.q.toLowerCase().split(/\W+/).filter(w=>w.length>3);
      return qWords.some(w => q.includes(w));
    });
    return faqHit ? faqHit.a : null;
  }

  // Simple session guardrails for the live API (cost/abuse control on top of
  // the server-side rate limit — see netlify/functions/ask-ai.js).
  let liveCallsThisSession = 0;
  const MAX_LIVE_CALLS = 15;

  // Build a compact snapshot of live site data to send to the AI so it can
  // answer questions about real events, news, projects, FAQ, etc.
  function buildLiveContext(){
    const lines = [];

    const upcoming = (data.events || [])
      .filter(e => !isPastDate(e.date))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
    if (upcoming.length){
      lines.push("UPCOMING EVENTS:");
      upcoming.forEach(e => {
        const parts = [e.title, formatDate(e.date)];
        if (e.time) parts.push("at " + e.time);
        if (e.location) parts.push("at " + e.location);
        if (e.description) parts.push("— " + e.description);
        lines.push("- " + parts.join(", "));
      });
    } else {
      lines.push("UPCOMING EVENTS: None scheduled at the moment.");
    }

    const recentNews = (data.news || [])
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 3);
    if (recentNews.length){
      lines.push("\nRECENT NEWS:");
      recentNews.forEach(n => {
        lines.push("- " + n.title + (n.date ? " (" + formatDate(n.date) + ")" : ""));
      });
    }

    const recentAchievements = (data.achievements || []).slice(0, 5);
    if (recentAchievements.length){
      lines.push("\nRECENT ACHIEVEMENTS:");
      recentAchievements.forEach(a => {
        lines.push("- " + a.title + (a.description ? ": " + a.description : ""));
      });
    }

    const projects = (data.projects || []).slice(0, 5);
    if (projects.length){
      lines.push("\nCLUB PROJECTS:");
      projects.forEach(p => {
        lines.push("- " + p.title + (p.description ? ": " + p.description : ""));
      });
    }

    const faqs = (data.faq || []);
    if (faqs.length){
      lines.push("\nFAQ:");
      faqs.forEach(f => lines.push("Q: " + f.q + "\nA: " + f.a));
    }

    const contact = cfg.contact || {};
    lines.push("\nCONTACT:");
    if (contact.email) lines.push("- Email: " + contact.email);
    if (contact.advisor) lines.push("- Faculty Advisor: " + contact.advisor);
    if (contact.location) lines.push("- Location: " + contact.location);

    if (cfg.joinUrl) lines.push("\nJOIN LINK: " + cfg.joinUrl);

    const s = data.stats || {};
    if (s.members || s.projects || s.events || s.awards){
      lines.push("\nCLUB STATS: " +
        (s.members ? s.members + " members, " : "") +
        (s.projects ? s.projects + " projects, " : "") +
        (s.events ? s.events + " events, " : "") +
        (s.awards ? s.awards + " awards" : "")
      );
    }

    return lines.join("\n");
  }

  async function askLiveAI(question){
    const liveContext = buildLiveContext();
    const res = await fetch("/api/ask-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, liveContext })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json.answer;
  }

  async function handleQuestion(question, { preferBuiltIn } = {}){
    addMsg(question, "user");

    // For button taps: answer from built-in logic (instant, free, no API).
    // For typed questions: ALSO try built-in first — if it's a clear match,
    // answer instantly instead of wasting a Groq call.
    const canned = builtInAnswer(question);
    if (preferBuiltIn && canned){ setTimeout(() => addMsg(canned, "bot"), 200); return; }

    // Fuzzy match: if typed question is clearly about something the built-in
    // handles perfectly (events, join, contact), use the built-in answer.
    // This avoids Groq calls for simple questions the site data already covers.
    if (!preferBuiltIn && canned){
      const q = question.toLowerCase();
      const clearMatch =
        q.includes("upcoming") || q.includes("next event") || q.includes("event") ||
        q.includes("when is") || q.includes("schedule") || q.includes("meeting") ||
        q.includes("join") || q.includes("register") || q.includes("sign up") ||
        q.includes("contact") || q.includes("email") || q.includes("advisor");
      if (clearMatch){ setTimeout(() => addMsg(canned, "bot"), 200); return; }
    }

    if (liveCallsThisSession >= MAX_LIVE_CALLS){
      addMsg("That's a lot of questions! Try the buttons above, or browse the FAQ section for more.", "bot");
      return;
    }

    if (sendBtn) sendBtn.disabled = true;
    if (input) input.disabled = true;
    const typingEl = addTyping();
    liveCallsThisSession++;

    try {
      const answer = await askLiveAI(question);
      typingEl.remove();
      addMsg(answer, "bot");
    } catch (err){
      typingEl.remove();
      if (canned){
        addMsg(canned, "bot");
      } else {
        addMsg("Sorry, the live assistant isn't available right now — try one of the buttons above or check the FAQ section.", "error");
      }
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      if (input) input.disabled = false;
    }
  }

  function open(){ panel.classList.add("open"); fab.setAttribute("aria-expanded","true"); }
  function close(){ panel.classList.remove("open"); fab.setAttribute("aria-expanded","false"); }

  fab.addEventListener("click", () => panel.classList.contains("open") ? close() : open());
  closeBtn.addEventListener("click", close);

  suggestWrap.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    handleQuestion(b.textContent, { preferBuiltIn: true });
  });

  if (form){
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      input.value = "";
      handleQuestion(val, { preferBuiltIn: false });
    });
  }
}

/* ---------------- modal (project / news) ---------------- */
function initModals(){
  const overlay = document.getElementById("modal-overlay");
  const closeBtn = document.getElementById("modal-close");
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}
function openModal(){
  const overlay = document.getElementById("modal-overlay");
  overlay.classList.add("open");
  document.body.classList.add("no-scroll");
}
function closeModal(){
  const overlay = document.getElementById("modal-overlay");
  overlay.classList.remove("open");
  document.body.classList.remove("no-scroll");
}

/* ---------------- lightbox (gallery) ---------------- */
let LB_INDEX = 0;
function initLightbox(){
  const lb = document.getElementById("lightbox");
  document.getElementById("lb-close").addEventListener("click", closeLightbox);
  document.getElementById("lb-prev").addEventListener("click", () => stepLightbox(-1));
  document.getElementById("lb-next").addEventListener("click", () => stepLightbox(1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });
}
function openLightbox(idx){
  LB_INDEX = idx;
  paintLightbox();
  document.getElementById("lightbox").classList.add("open");
  document.body.classList.add("no-scroll");
}
function stepLightbox(dir){
  LB_INDEX = (LB_INDEX + dir + GALLERY_FILTERED.length) % GALLERY_FILTERED.length;
  paintLightbox();
}
function paintLightbox(){
  const g = GALLERY_FILTERED[LB_INDEX];
  if (!g) return;
  const img = document.getElementById("lightbox-img");
  img.src = g.image || placeholderDataURI(g.caption);
  img.alt = g.caption || "";
  document.getElementById("lightbox-cap").textContent = `${g.caption || ""} ${g.album ? "· " + g.album : ""}`;
}
function closeLightbox(){
  document.getElementById("lightbox").classList.remove("open");
  document.body.classList.remove("no-scroll");
}

/* ---------------- helpers ---------------- */
function truncate(str, n){
  if (!str) return "";
  return str.length > n ? str.slice(0,n-1).trim() + "…" : str;
}
function initials(name){
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]||"")[0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}
function thumbOrPlaceholder(src, label){
  const finalSrc = src || placeholderDataURI(label);
  return `<img src="${finalSrc}" alt="${escapeHTML(label||"")}" loading="lazy">`;
}
/** Generates a small SVG-as-data-URI placeholder image (gradient + neural-node motif). No network request needed. */
function placeholderDataURI(label){
  const hue = hashHue(label||"AI");
  const hue2 = (hue+70)%360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},80%,55%)" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="hsl(${hue2},80%,55%)" stop-opacity="0.55"/>
      </linearGradient>
    </defs>
    <rect width="640" height="400" fill="#0c0f1c"/>
    <rect width="640" height="400" fill="url(#g)"/>
    <g stroke="rgba(255,255,255,0.55)" stroke-width="2" fill="none">
      <circle cx="220" cy="150" r="10"/>
      <circle cx="420" cy="130" r="10"/>
      <circle cx="320" cy="240" r="13"/>
      <circle cx="200" cy="290" r="10"/>
      <circle cx="440" cy="280" r="10"/>
      <path d="M228 160 L308 232 M412 138 L332 230 M228 158 L206 282 M412 140 L432 272" stroke-opacity="0.5"/>
    </g>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function hashHue(str){
  let h = 0;
  for (let i=0;i<str.length;i++) h = (h*31 + str.charCodeAt(i)) % 360;
  return h;
}
