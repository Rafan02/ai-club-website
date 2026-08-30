/* ==========================================================================
   AI CLUB — Admin Dashboard logic
   Deliberately simple: sidebar → section → list + one form.
   Everything is saved via Store (localStorage) from data.js.
   ========================================================================== */

const PANELS = ["dashboard","events","projects","news","achievements","gallery","team","resources","faq","settings"];
const AUTH_KEY = "aiclub_admin_unlocked";

document.addEventListener("DOMContentLoaded", () => {
  initLockScreen();
});

/* ---------------- lock screen / auth ---------------- */
function initLockScreen(){
  const lockScreen = document.getElementById("lock-screen");
  const app = document.getElementById("admin-app");
  const input = document.getElementById("lock-input");
  const submit = document.getElementById("lock-submit");
  const error = document.getElementById("lock-error");

  function tryUnlock(){
    const cfg = Store.getConfig();
    const pw = input.value;
    if (simpleHash(pw) === cfg.adminPasswordHash){
      sessionStorage.setItem(AUTH_KEY, "1");
      lockScreen.style.display = "none";
      app.style.display = "flex";
      initAdminApp();
    } else {
      error.classList.add("show");
      input.value = "";
      input.focus();
    }
  }

  submit.addEventListener("click", tryUnlock);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  input.addEventListener("input", () => error.classList.remove("show"));

  // Already unlocked this browser tab/session? Skip straight to the dashboard.
  if (sessionStorage.getItem(AUTH_KEY) === "1"){
    lockScreen.style.display = "none";
    app.style.display = "flex";
    initAdminApp();
  } else {
    input.focus();
  }
}

/* ---------------- dashboard init (runs only after unlock) ---------------- */
function initAdminApp(){
  if (initAdminApp._done) return; // guard against double-init
  initAdminApp._done = true;

  initSidebar();
  renderDashboard();
  renderEventsPanel();
  renderProjectsPanel();
  renderNewsPanel();
  renderAchievementsPanel();
  renderGalleryPanel();
  renderTeamPanel();
  renderResourcesPanel();
  renderFaqPanel();
  renderSettingsPanel();
  goTo(location.hash ? location.hash.slice(1) : "dashboard");

  const logout = document.getElementById("admin-logout");
  if (logout){
    logout.addEventListener("click", (e) => {
      e.preventDefault();
      sessionStorage.removeItem(AUTH_KEY);
      location.reload();
    });
  }
}

/* ---------------- sidebar / routing ---------------- */
function initSidebar(){
  document.querySelectorAll(".sb-link").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(a.dataset.panel);
    });
  });
  document.getElementById("admin-menu-toggle").addEventListener("click", () => {
    document.getElementById("admin-sidebar").classList.toggle("open");
  });
}
const PANEL_TITLES = {
  dashboard: "Dashboard", events: "Events", projects: "Projects", news: "News & Announcements",
  achievements: "Achievements", gallery: "Gallery", team: "Team", resources: "Learning Hub Resources",
  faq: "FAQ", settings: "Settings"
};
function goTo(panel){
  if (!PANELS.includes(panel)) panel = "dashboard";
  PANELS.forEach(p => {
    document.getElementById("panel-"+p).style.display = (p===panel) ? "block" : "none";
  });
  document.querySelectorAll(".sb-link").forEach(a => a.classList.toggle("active", a.dataset.panel===panel));
  document.getElementById("admin-sidebar").classList.remove("open");
  document.getElementById("admin-title").textContent = PANEL_TITLES[panel] || "Dashboard";
  location.hash = panel;
  window.scrollTo({top:0});
  if (panel === "dashboard") renderDashboard();
}

/* ---------------- toast ---------------- */
function toast(msg){
  const t = document.getElementById("admin-toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove("show"), 2200);
}

/* ---------------- image upload helper ---------------- */
/** Reads a file input, downsizes it on a canvas, and returns a compressed data URL via callback. */
function readImage(fileInput, maxW, cb){
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")){ toast("Please choose an image file."); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, (maxW||1200) / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      cb(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function imagePickerHTML(id, currentSrc){
  return `
    <div class="img-picker" id="${id}-wrap">
      <div class="img-preview" id="${id}-preview">${currentSrc ? `<img src="${currentSrc}">` : `<span>No image</span>`}</div>
      <div class="img-picker-actions">
        <label class="btn btn-ghost btn-sm" for="${id}">Choose image</label>
        <input type="file" id="${id}" accept="image/*" style="display:none;">
        <button type="button" class="btn btn-ghost btn-sm" data-clear-img="${id}">Remove</button>
      </div>
    </div>`;
}
function wireImagePicker(id, onChange, initial){
  let current = initial || "";
  const input = document.getElementById(id);
  const preview = document.getElementById(id+"-preview");
  input.addEventListener("change", () => {
    readImage(input, 1400, (dataUrl) => {
      current = dataUrl;
      preview.innerHTML = `<img src="${dataUrl}">`;
      onChange(current);
    });
  });
  document.querySelector(`[data-clear-img="${id}"]`).addEventListener("click", () => {
    current = "";
    preview.innerHTML = `<span>No image</span>`;
    input.value = "";
    onChange(current);
  });
  return () => current;
}

/* ---------------- generic list-with-form panel builder ---------------- */
function emptyRow(msg){ return `<div class="admin-empty">${msg}</div>`; }

/* ==========================================================================
   DASHBOARD
   ========================================================================== */
function renderDashboard(){
  const data = Store.getData();
  const cfg = Store.getConfig();
  const el = document.getElementById("panel-dashboard");
  const counts = {
    events: data.events.length,
    projects: data.projects.length,
    news: data.news.filter(n=>n.status!=="Archived").length,
    achievements: data.achievements.length,
    gallery: data.gallery.length,
    team: data.team.length,
    resources: data.resources.length,
    faq: data.faq.length
  };
  el.innerHTML = `
    <div class="admin-welcome">
      <h2>Welcome back 👋</h2>
      <p>This is where you manage everything visitors see on the public site. Pick a section on the left, then add, edit, or delete content — changes appear on the website immediately.</p>
    </div>
    <div class="dash-grid">
      ${dashCard("Events", counts.events, "events")}
      ${dashCard("Projects", counts.projects, "projects")}
      ${dashCard("News Posts", counts.news, "news")}
      ${dashCard("Achievements", counts.achievements, "achievements")}
      ${dashCard("Gallery Photos", counts.gallery, "gallery")}
      ${dashCard("Team Members", counts.team, "team")}
      ${dashCard("Resources", counts.resources, "resources")}
      ${dashCard("FAQ Items", counts.faq, "faq")}
    </div>
    <div class="admin-card" style="margin-top:22px;">
      <h3>Homepage stats (Achievements section)</h3>
      <p class="admin-hint">These are the big editable numbers shown on the public Achievements section — set them to real figures any time.</p>
      <div class="form-grid four" style="margin-top:14px;">
        <label>Members<input type="number" min="0" id="stat-members-input" value="${data.stats.members}"></label>
        <label>Projects<input type="number" min="0" id="stat-projects-input" value="${data.stats.projects}"></label>
        <label>Events Held<input type="number" min="0" id="stat-events-input" value="${data.stats.events}"></label>
        <label>Awards<input type="number" min="0" id="stat-awards-input" value="${data.stats.awards}"></label>
      </div>
      <button class="btn btn-primary btn-sm" style="margin-top:16px;" id="save-stats-btn">Save stats</button>
    </div>
    ${!cfg.joinUrl ? `<div class="admin-notice">⚠️ The "Join the AI Club" button doesn't have a registration link yet. Set it in <a href="#settings" data-panel-link="settings">Settings</a> once it's ready.</div>` : ""}
  `;
  document.getElementById("save-stats-btn").addEventListener("click", () => {
    const state = Store.getState();
    state.data.stats = {
      members: Number(document.getElementById("stat-members-input").value)||0,
      projects: Number(document.getElementById("stat-projects-input").value)||0,
      events: Number(document.getElementById("stat-events-input").value)||0,
      awards: Number(document.getElementById("stat-awards-input").value)||0
    };
    Store.saveState(state);
    toast("Stats saved.");
  });
  el.querySelectorAll("[data-panel-link]").forEach(a=>a.addEventListener("click",(e)=>{e.preventDefault();goTo(a.dataset.panelLink);}));
}
function dashCard(label, count, panel){
  return `<a class="dash-card" href="#${panel}" data-panel-link="${panel}"><b>${count}</b><span>${label}</span></a>`;
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-panel-link]");
  if (a){ e.preventDefault(); goTo(a.dataset.panelLink); }
});

/* ==========================================================================
   EVENTS
   ========================================================================== */
function renderEventsPanel(){
  const el = document.getElementById("panel-events");
  el.innerHTML = `
    <div class="admin-toolbar"><h2>Events</h2><button class="btn btn-primary btn-sm" id="ev-add-btn">+ Add Event</button></div>
    <div class="admin-list" id="ev-list"></div>
    <div class="admin-card" id="ev-form-card" style="display:none;"></div>
  `;
  document.getElementById("ev-add-btn").addEventListener("click", () => openEventForm(null));
  paintEventsList();
}
function paintEventsList(){
  const list = Store.list("events").slice().sort((a,b)=>b.date.localeCompare(a.date));
  const wrap = document.getElementById("ev-list");
  if (!list.length){ wrap.innerHTML = emptyRow("No events yet. Click \u201c+ Add Event\u201d to create one."); return; }
  wrap.innerHTML = list.map(e => `
    <div class="admin-row">
      <div class="ar-thumb">${e.image ? `<img src="${e.image}">` : `<span>🗓️</span>`}</div>
      <div class="ar-info">
        <b>${escapeHTML(e.title)}</b>
        <span>${formatDate(e.date)} · ${escapeHTML(e.time||"")} · ${escapeHTML(e.category)} ${isPastDate(e.date) ? " · <em>Past</em>" : ""}</span>
      </div>
      <div class="ar-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${e.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-del="${e.id}">Delete</button>
      </div>
    </div>
  `).join("");
  wrap.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openEventForm(b.dataset.edit)));
  wrap.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>{
    if (confirm("Delete this event?")){ Store.remove("events", b.dataset.del); paintEventsList(); renderDashboard(); toast("Event deleted."); }
  }));
}
function openEventForm(id){
  const item = id ? Store.find("events", id) : { id: Store.newId("evt"), title:"", category:"Workshop", date:"", time:"", location:"", description:"", image:"", registerLink:"" };
  const card = document.getElementById("ev-form-card");
  card.style.display = "block";
  card.innerHTML = `
    <h3>${id ? "Edit Event" : "Add Event"}</h3>
    <div class="form-grid">
      <label>Event Name<input type="text" id="ev-title" value="${escapeAttr(item.title)}" placeholder="e.g. Intro to AI Workshop"></label>
      <label>Category
        <select id="ev-category">
          ${["Workshop","Seminar","Competition","Hackathon","Club Meeting","Guest Speaker","AI Demonstration","Training Session","Other"].map(c=>`<option ${item.category===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Date<input type="date" id="ev-date" value="${item.date||""}"></label>
      <label>Time<input type="text" id="ev-time" value="${escapeAttr(item.time)}" placeholder="e.g. 3:30 PM"></label>
      <label>Location<input type="text" id="ev-location" value="${escapeAttr(item.location)}" placeholder="e.g. Computer Lab"></label>
      <label>Registration Link (optional)<input type="text" id="ev-reglink" value="${escapeAttr(item.registerLink)}" placeholder="https://…"></label>
    </div>
    <label class="block">Description<textarea id="ev-desc" rows="3">${escapeHTML(item.description)}</textarea></label>
    <label class="block">Cover Image</label>
    ${imagePickerHTML("ev-img", item.image)}
    <div class="form-actions">
      <button class="btn btn-primary" id="ev-save">Publish</button>
      <button class="btn btn-ghost" id="ev-cancel">Cancel</button>
    </div>
  `;
  const getImg = wireImagePicker("ev-img", ()=>{}, item.image);
  document.getElementById("ev-cancel").addEventListener("click", ()=>{ card.style.display="none"; });
  document.getElementById("ev-save").addEventListener("click", () => {
    const title = document.getElementById("ev-title").value.trim();
    const date = document.getElementById("ev-date").value;
    if (!title || !date){ toast("Please add an event name and date."); return; }
    const updated = {
      id: item.id,
      title,
      category: document.getElementById("ev-category").value,
      date,
      time: document.getElementById("ev-time").value.trim(),
      location: document.getElementById("ev-location").value.trim(),
      description: document.getElementById("ev-desc").value.trim(),
      registerLink: document.getElementById("ev-reglink").value.trim(),
      image: getImg(),
      status: isPastDate(date) ? "Past" : "Upcoming"
    };
    Store.upsert("events", updated);
    card.style.display = "none";
    paintEventsList();
    renderDashboard();
    toast("Event saved.");
  });
}

/* ==========================================================================
   PROJECTS
   ========================================================================== */
function renderProjectsPanel(){
  const el = document.getElementById("panel-projects");
  el.innerHTML = `
    <div class="admin-toolbar"><h2>Projects</h2><button class="btn btn-primary btn-sm" id="pj-add-btn">+ Add Project</button></div>
    <div class="admin-list" id="pj-list"></div>
    <div class="admin-card" id="pj-form-card" style="display:none;"></div>
  `;
  document.getElementById("pj-add-btn").addEventListener("click", () => openProjectForm(null));
  paintProjectsList();
}
function paintProjectsList(){
  const list = Store.list("projects");
  const wrap = document.getElementById("pj-list");
  if (!list.length){ wrap.innerHTML = emptyRow("No projects yet. Click \u201c+ Add Project\u201d to create one."); return; }
  wrap.innerHTML = list.map(p => `
    <div class="admin-row">
      <div class="ar-thumb">${p.image ? `<img src="${p.image}">` : `<span>🛠️</span>`}</div>
      <div class="ar-info"><b>${escapeHTML(p.title)}</b><span>${escapeHTML(p.category)} · ${escapeHTML(p.status)}</span></div>
      <div class="ar-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${p.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-del="${p.id}">Delete</button>
      </div>
    </div>
  `).join("");
  wrap.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openProjectForm(b.dataset.edit)));
  wrap.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>{
    if (confirm("Delete this project?")){ Store.remove("projects", b.dataset.del); paintProjectsList(); renderDashboard(); toast("Project deleted."); }
  }));
}
function openProjectForm(id){
  const item = id ? Store.find("projects", id) : { id: Store.newId("proj"), title:"", category:"Artificial Intelligence", status:"In Progress", creators:"", description:"", tech:[], image:"", demoLink:"", githubLink:"" };
  const card = document.getElementById("pj-form-card");
  card.style.display = "block";
  card.innerHTML = `
    <h3>${id ? "Edit Project" : "Add Project"}</h3>
    <div class="form-grid">
      <label>Project Title<input type="text" id="pj-title" value="${escapeAttr(item.title)}"></label>
      <label>Category
        <select id="pj-category">
          ${["Artificial Intelligence","Machine Learning","Computer Vision","Generative AI","Web","Robotics","Other"].map(c=>`<option ${item.category===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Status
        <select id="pj-status">
          ${["Planned","In Progress","Completed"].map(c=>`<option ${item.status===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Student Creator(s)<input type="text" id="pj-creators" value="${escapeAttr(item.creators)}" placeholder="e.g. Jane D., Rafi H."></label>
      <label>Technologies (comma separated)<input type="text" id="pj-tech" value="${escapeAttr((item.tech||[]).join(", "))}" placeholder="Python, OpenCV"></label>
      <label>Demo Link (optional)<input type="text" id="pj-demo" value="${escapeAttr(item.demoLink)}" placeholder="https://…"></label>
      <label>GitHub Link (optional)<input type="text" id="pj-github" value="${escapeAttr(item.githubLink)}" placeholder="https://github.com/…"></label>
    </div>
    <label class="block">Description<textarea id="pj-desc" rows="3">${escapeHTML(item.description)}</textarea></label>
    <label class="block">Cover Image</label>
    ${imagePickerHTML("pj-img", item.image)}
    <div class="form-actions">
      <button class="btn btn-primary" id="pj-save">Publish</button>
      <button class="btn btn-ghost" id="pj-cancel">Cancel</button>
    </div>
  `;
  const getImg = wireImagePicker("pj-img", ()=>{}, item.image);
  document.getElementById("pj-cancel").addEventListener("click", ()=>{ card.style.display="none"; });
  document.getElementById("pj-save").addEventListener("click", () => {
    const title = document.getElementById("pj-title").value.trim();
    if (!title){ toast("Please add a project title."); return; }
    const updated = {
      id: item.id,
      title,
      category: document.getElementById("pj-category").value,
      status: document.getElementById("pj-status").value,
      creators: document.getElementById("pj-creators").value.trim(),
      description: document.getElementById("pj-desc").value.trim(),
      tech: document.getElementById("pj-tech").value.split(",").map(t=>t.trim()).filter(Boolean),
      demoLink: document.getElementById("pj-demo").value.trim(),
      githubLink: document.getElementById("pj-github").value.trim(),
      image: getImg()
    };
    Store.upsert("projects", updated);
    card.style.display = "none";
    paintProjectsList();
    renderDashboard();
    toast("Project saved.");
  });
}

/* ==========================================================================
   NEWS
   ========================================================================== */
function renderNewsPanel(){
  const el = document.getElementById("panel-news");
  el.innerHTML = `
    <div class="admin-toolbar"><h2>News &amp; Announcements</h2><button class="btn btn-primary btn-sm" id="nw-add-btn">+ Add Post</button></div>
    <div class="admin-list" id="nw-list"></div>
    <div class="admin-card" id="nw-form-card" style="display:none;"></div>
  `;
  document.getElementById("nw-add-btn").addEventListener("click", () => openNewsForm(null));
  paintNewsList();
}
function paintNewsList(){
  const list = Store.list("news").slice().sort((a,b)=>b.date.localeCompare(a.date));
  const wrap = document.getElementById("nw-list");
  if (!list.length){ wrap.innerHTML = emptyRow("No news posts yet."); return; }
  wrap.innerHTML = list.map(n => `
    <div class="admin-row">
      <div class="ar-thumb">${n.image ? `<img src="${n.image}">` : `<span>📰</span>`}</div>
      <div class="ar-info"><b>${escapeHTML(n.title)} ${n.pinned ? '<span class="pill">Pinned</span>' : ""}</b><span>${formatDate(n.date)} · ${escapeHTML(n.category)} · ${escapeHTML(n.status)}</span></div>
      <div class="ar-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${n.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-del="${n.id}">Delete</button>
      </div>
    </div>
  `).join("");
  wrap.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openNewsForm(b.dataset.edit)));
  wrap.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>{
    if (confirm("Delete this post?")){ Store.remove("news", b.dataset.del); paintNewsList(); renderDashboard(); toast("Post deleted."); }
  }));
}
function openNewsForm(id){
  const item = id ? Store.find("news", id) : { id: Store.newId("news"), title:"", category:"Club Notice", date: new Date().toISOString().slice(0,10), description:"", article:"", image:"", pinned:false, status:"Published" };
  const card = document.getElementById("nw-form-card");
  card.style.display = "block";
  card.innerHTML = `
    <h3>${id ? "Edit Post" : "Add Post"}</h3>
    <div class="form-grid">
      <label>Title<input type="text" id="nw-title" value="${escapeAttr(item.title)}"></label>
      <label>Category
        <select id="nw-category">
          ${["Event Announcement","Competition Announcement","Competition Results","Workshop Announcement","Club Notice","New Project","General Update","Achievement"].map(c=>`<option ${item.category===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Date<input type="date" id="nw-date" value="${item.date}"></label>
      <label>Status
        <select id="nw-status">
          ${["Published","Archived"].map(c=>`<option ${item.status===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
    </div>
    <label class="block"><input type="checkbox" id="nw-pinned" ${item.pinned?"checked":""}> Show in homepage announcement bar</label>
    <label class="block">Short Description<textarea id="nw-shortdesc" rows="2">${escapeHTML(item.description)}</textarea></label>
    <label class="block">Full Article<textarea id="nw-article" rows="5">${escapeHTML(item.article)}</textarea></label>
    <label class="block">Cover Image</label>
    ${imagePickerHTML("nw-img", item.image)}
    <div class="form-actions">
      <button class="btn btn-primary" id="nw-save">Publish</button>
      <button class="btn btn-ghost" id="nw-cancel">Cancel</button>
    </div>
  `;
  const getImg = wireImagePicker("nw-img", ()=>{}, item.image);
  document.getElementById("nw-cancel").addEventListener("click", ()=>{ card.style.display="none"; });
  document.getElementById("nw-save").addEventListener("click", () => {
    const title = document.getElementById("nw-title").value.trim();
    if (!title){ toast("Please add a title."); return; }
    const updated = {
      id: item.id,
      title,
      category: document.getElementById("nw-category").value,
      date: document.getElementById("nw-date").value,
      status: document.getElementById("nw-status").value,
      pinned: document.getElementById("nw-pinned").checked,
      description: document.getElementById("nw-shortdesc").value.trim(),
      article: document.getElementById("nw-article").value.trim(),
      image: getImg()
    };
    Store.upsert("news", updated);
    card.style.display = "none";
    paintNewsList();
    renderDashboard();
    toast("Post saved.");
  });
}

/* ==========================================================================
   ACHIEVEMENTS
   ========================================================================== */
function renderAchievementsPanel(){
  const el = document.getElementById("panel-achievements");
  el.innerHTML = `
    <div class="admin-toolbar"><h2>Achievements</h2><button class="btn btn-primary btn-sm" id="ac-add-btn">+ Add Achievement</button></div>
    <div class="admin-list" id="ac-list"></div>
    <div class="admin-card" id="ac-form-card" style="display:none;"></div>
  `;
  document.getElementById("ac-add-btn").addEventListener("click", () => openAchievementForm(null));
  paintAchievementsList();
}
function paintAchievementsList(){
  const list = Store.list("achievements");
  const wrap = document.getElementById("ac-list");
  if (!list.length){ wrap.innerHTML = emptyRow("No achievements yet."); return; }
  wrap.innerHTML = list.map(a => `
    <div class="admin-row">
      <div class="ar-thumb">${a.image ? `<img src="${a.image}">` : `<span>🏆</span>`}</div>
      <div class="ar-info"><b>${escapeHTML(a.title)}</b><span>${escapeHTML(a.category)} · ${escapeHTML(a.year)}</span></div>
      <div class="ar-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${a.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-del="${a.id}">Delete</button>
      </div>
    </div>
  `).join("");
  wrap.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openAchievementForm(b.dataset.edit)));
  wrap.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>{
    if (confirm("Delete this achievement?")){ Store.remove("achievements", b.dataset.del); paintAchievementsList(); renderDashboard(); toast("Achievement deleted."); }
  }));
}
function openAchievementForm(id){
  const item = id ? Store.find("achievements", id) : { id: Store.newId("ach"), title:"", category:"Olympiad", year:String(new Date().getFullYear()), people:"", description:"", image:"", link:"" };
  const card = document.getElementById("ac-form-card");
  card.style.display = "block";
  card.innerHTML = `
    <h3>${id ? "Edit Achievement" : "Add Achievement"}</h3>
    <div class="form-grid">
      <label>Title<input type="text" id="ac-title" value="${escapeAttr(item.title)}"></label>
      <label>Category
        <select id="ac-category">
          ${["Olympiad","Competition","Award","Certificate","Placement","School Recognition","Project","Other"].map(c=>`<option ${item.category===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Year / Date<input type="text" id="ac-year" value="${escapeAttr(item.year)}"></label>
      <label>Student Name(s)<input type="text" id="ac-people" value="${escapeAttr(item.people)}"></label>
      <label>External Link (optional)<input type="text" id="ac-link" value="${escapeAttr(item.link)}" placeholder="https://…"></label>
    </div>
    <label class="block">Description<textarea id="ac-desc" rows="3">${escapeHTML(item.description)}</textarea></label>
    <label class="block">Image / Certificate Photo</label>
    ${imagePickerHTML("ac-img", item.image)}
    <div class="form-actions">
      <button class="btn btn-primary" id="ac-save">Publish</button>
      <button class="btn btn-ghost" id="ac-cancel">Cancel</button>
    </div>
  `;
  const getImg = wireImagePicker("ac-img", ()=>{}, item.image);
  document.getElementById("ac-cancel").addEventListener("click", ()=>{ card.style.display="none"; });
  document.getElementById("ac-save").addEventListener("click", () => {
    const title = document.getElementById("ac-title").value.trim();
    if (!title){ toast("Please add a title."); return; }
    const updated = {
      id: item.id,
      title,
      category: document.getElementById("ac-category").value,
      year: document.getElementById("ac-year").value.trim(),
      people: document.getElementById("ac-people").value.trim(),
      link: document.getElementById("ac-link").value.trim(),
      description: document.getElementById("ac-desc").value.trim(),
      image: getImg()
    };
    Store.upsert("achievements", updated);
    card.style.display = "none";
    paintAchievementsList();
    renderDashboard();
    toast("Achievement saved.");
  });
}

/* ==========================================================================
   GALLERY
   ========================================================================== */
function renderGalleryPanel(){
  const el = document.getElementById("panel-gallery");
  el.innerHTML = `
    <div class="admin-toolbar"><h2>Gallery</h2><button class="btn btn-primary btn-sm" id="gl-add-btn">+ Add Photo</button></div>
    <p class="admin-hint">Organize photos into albums (e.g. "AI Workshop", "AI Olympiad", "Club Meeting"). Visitors can filter by album on the public site.</p>
    <div class="admin-list" id="gl-list"></div>
    <div class="admin-card" id="gl-form-card" style="display:none;"></div>
  `;
  document.getElementById("gl-add-btn").addEventListener("click", () => openGalleryForm(null));
  paintGalleryList();
}
function paintGalleryList(){
  const list = Store.list("gallery");
  const wrap = document.getElementById("gl-list");
  if (!list.length){ wrap.innerHTML = emptyRow("No photos yet."); return; }
  wrap.innerHTML = list.map(g => `
    <div class="admin-row">
      <div class="ar-thumb">${g.image ? `<img src="${g.image}">` : `<span>🖼️</span>`}</div>
      <div class="ar-info"><b>${escapeHTML(g.caption||"Untitled photo")}</b><span>Album: ${escapeHTML(g.album)}</span></div>
      <div class="ar-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${g.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-del="${g.id}">Delete</button>
      </div>
    </div>
  `).join("");
  wrap.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openGalleryForm(b.dataset.edit)));
  wrap.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>{
    if (confirm("Delete this photo?")){ Store.remove("gallery", b.dataset.del); paintGalleryList(); renderDashboard(); toast("Photo deleted."); }
  }));
}
function openGalleryForm(id){
  const item = id ? Store.find("gallery", id) : { id: Store.newId("g"), album:"Club Meeting", caption:"", image:"" };
  const card = document.getElementById("gl-form-card");
  card.style.display = "block";
  card.innerHTML = `
    <h3>${id ? "Edit Photo" : "Add Photo"}</h3>
    <div class="form-grid">
      <label>Album
        <select id="gl-album">
          ${["AI Workshop","AI Olympiad","Club Meeting","Competition","Award Ceremony","Other"].map(c=>`<option ${item.album===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Caption<input type="text" id="gl-caption" value="${escapeAttr(item.caption)}"></label>
    </div>
    <label class="block">Photo</label>
    ${imagePickerHTML("gl-img", item.image)}
    <div class="form-actions">
      <button class="btn btn-primary" id="gl-save">Publish</button>
      <button class="btn btn-ghost" id="gl-cancel">Cancel</button>
    </div>
  `;
  const getImg = wireImagePicker("gl-img", ()=>{}, item.image);
  document.getElementById("gl-cancel").addEventListener("click", ()=>{ card.style.display="none"; });
  document.getElementById("gl-save").addEventListener("click", () => {
    const updated = {
      id: item.id,
      album: document.getElementById("gl-album").value,
      caption: document.getElementById("gl-caption").value.trim(),
      image: getImg()
    };
    Store.upsert("gallery", updated);
    card.style.display = "none";
    paintGalleryList();
    renderDashboard();
    toast("Photo saved.");
  });
}

/* ==========================================================================
   TEAM
   ========================================================================== */
function renderTeamPanel(){
  const el = document.getElementById("panel-team");
  el.innerHTML = `
    <div class="admin-toolbar"><h2>Team</h2><button class="btn btn-primary btn-sm" id="tm-add-btn">+ Add Member</button></div>
    <div class="admin-list" id="tm-list"></div>
    <div class="admin-card" id="tm-form-card" style="display:none;"></div>
  `;
  document.getElementById("tm-add-btn").addEventListener("click", () => openTeamForm(null));
  paintTeamList();
}
function paintTeamList(){
  const list = Store.list("team");
  const wrap = document.getElementById("tm-list");
  if (!list.length){ wrap.innerHTML = emptyRow("No team members yet."); return; }
  wrap.innerHTML = list.map(t => `
    <div class="admin-row">
      <div class="ar-thumb">${t.photo ? `<img src="${t.photo}">` : `<span>🧑‍💻</span>`}</div>
      <div class="ar-info"><b>${escapeHTML(t.name)}</b><span>${escapeHTML(t.position)}</span></div>
      <div class="ar-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${t.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-del="${t.id}">Delete</button>
      </div>
    </div>
  `).join("");
  wrap.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openTeamForm(b.dataset.edit)));
  wrap.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>{
    if (confirm("Delete this member?")){ Store.remove("team", b.dataset.del); paintTeamList(); renderDashboard(); toast("Member deleted."); }
  }));
}
function openTeamForm(id){
  const item = id ? Store.find("team", id) : { id: Store.newId("t"), name:"", position:"Technical Team", bio:"", photo:"", social:"" };
  const card = document.getElementById("tm-form-card");
  card.style.display = "block";
  card.innerHTML = `
    <h3>${id ? "Edit Member" : "Add Member"}</h3>
    <div class="form-grid">
      <label>Name<input type="text" id="tm-name" value="${escapeAttr(item.name)}"></label>
      <label>Position
        <select id="tm-position">
          ${["Faculty Advisor","Club President","Vice President","General Secretary","Technical Team","Media & Design Team","Other"].map(c=>`<option ${item.position===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Social Link (optional)<input type="text" id="tm-social" value="${escapeAttr(item.social)}" placeholder="https://…"></label>
    </div>
    <label class="block">Short Biography<textarea id="tm-bio" rows="3">${escapeHTML(item.bio)}</textarea></label>
    <label class="block">Photo</label>
    ${imagePickerHTML("tm-img", item.photo)}
    <div class="form-actions">
      <button class="btn btn-primary" id="tm-save">Publish</button>
      <button class="btn btn-ghost" id="tm-cancel">Cancel</button>
    </div>
  `;
  const getImg = wireImagePicker("tm-img", ()=>{}, item.photo);
  document.getElementById("tm-cancel").addEventListener("click", ()=>{ card.style.display="none"; });
  document.getElementById("tm-save").addEventListener("click", () => {
    const name = document.getElementById("tm-name").value.trim();
    if (!name){ toast("Please add a name."); return; }
    const updated = {
      id: item.id,
      name,
      position: document.getElementById("tm-position").value,
      social: document.getElementById("tm-social").value.trim(),
      bio: document.getElementById("tm-bio").value.trim(),
      photo: getImg()
    };
    Store.upsert("team", updated);
    card.style.display = "none";
    paintTeamList();
    renderDashboard();
    toast("Member saved.");
  });
}

/* ==========================================================================
   RESOURCES (Learning Hub)
   ========================================================================== */
function renderResourcesPanel(){
  const el = document.getElementById("panel-resources");
  el.innerHTML = `
    <div class="admin-toolbar"><h2>Learning Hub Resources</h2><button class="btn btn-primary btn-sm" id="rs-add-btn">+ Add Resource</button></div>
    <div class="admin-list" id="rs-list"></div>
    <div class="admin-card" id="rs-form-card" style="display:none;"></div>
  `;
  document.getElementById("rs-add-btn").addEventListener("click", () => openResourceForm(null));
  paintResourcesList();
}
function paintResourcesList(){
  const list = Store.list("resources");
  const wrap = document.getElementById("rs-list");
  if (!list.length){ wrap.innerHTML = emptyRow("No resources yet."); return; }
  wrap.innerHTML = list.map(r => `
    <div class="admin-row">
      <div class="ar-thumb">${r.thumbnail ? `<img src="${r.thumbnail}">` : `<span>📘</span>`}</div>
      <div class="ar-info"><b>${escapeHTML(r.title)}</b><span>${escapeHTML(r.category)} · ${escapeHTML(r.difficulty)}</span></div>
      <div class="ar-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${r.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-del="${r.id}">Delete</button>
      </div>
    </div>
  `).join("");
  wrap.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openResourceForm(b.dataset.edit)));
  wrap.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>{
    if (confirm("Delete this resource?")){ Store.remove("resources", b.dataset.del); paintResourcesList(); renderDashboard(); toast("Resource deleted."); }
  }));
}
function openResourceForm(id){
  const item = id ? Store.find("resources", id) : { id: Store.newId("res"), title:"", category:"Python", difficulty:"Beginner", description:"", link:"", thumbnail:"" };
  const card = document.getElementById("rs-form-card");
  card.style.display = "block";
  card.innerHTML = `
    <h3>${id ? "Edit Resource" : "Add Resource"}</h3>
    <div class="form-grid">
      <label>Title<input type="text" id="rs-title" value="${escapeAttr(item.title)}"></label>
      <label>Category
        <select id="rs-category">
          ${["Python","Artificial Intelligence","Machine Learning","Computer Vision","Neural Networks","Generative AI","AI Tools"].map(c=>`<option ${item.category===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Difficulty
        <select id="rs-difficulty">
          ${["Beginner","Intermediate","Advanced"].map(c=>`<option ${item.difficulty===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>External Link<input type="text" id="rs-link" value="${escapeAttr(item.link)}" placeholder="https://…"></label>
    </div>
    <label class="block">Description<textarea id="rs-desc" rows="2">${escapeHTML(item.description)}</textarea></label>
    <label class="block">Thumbnail (optional)</label>
    ${imagePickerHTML("rs-img", item.thumbnail)}
    <div class="form-actions">
      <button class="btn btn-primary" id="rs-save">Publish</button>
      <button class="btn btn-ghost" id="rs-cancel">Cancel</button>
    </div>
  `;
  const getImg = wireImagePicker("rs-img", ()=>{}, item.thumbnail);
  document.getElementById("rs-cancel").addEventListener("click", ()=>{ card.style.display="none"; });
  document.getElementById("rs-save").addEventListener("click", () => {
    const title = document.getElementById("rs-title").value.trim();
    if (!title){ toast("Please add a title."); return; }
    const updated = {
      id: item.id,
      title,
      category: document.getElementById("rs-category").value,
      difficulty: document.getElementById("rs-difficulty").value,
      link: document.getElementById("rs-link").value.trim(),
      description: document.getElementById("rs-desc").value.trim(),
      thumbnail: getImg()
    };
    Store.upsert("resources", updated);
    card.style.display = "none";
    paintResourcesList();
    renderDashboard();
    toast("Resource saved.");
  });
}

/* ==========================================================================
   FAQ
   ========================================================================== */
function renderFaqPanel(){
  const el = document.getElementById("panel-faq");
  el.innerHTML = `
    <div class="admin-toolbar"><h2>FAQ</h2><button class="btn btn-primary btn-sm" id="fq-add-btn">+ Add Question</button></div>
    <div class="admin-list" id="fq-list"></div>
    <div class="admin-card" id="fq-form-card" style="display:none;"></div>
  `;
  document.getElementById("fq-add-btn").addEventListener("click", () => openFaqForm(null));
  paintFaqList();
}
function paintFaqList(){
  const list = Store.list("faq");
  const wrap = document.getElementById("fq-list");
  if (!list.length){ wrap.innerHTML = emptyRow("No FAQ items yet."); return; }
  wrap.innerHTML = list.map(f => `
    <div class="admin-row">
      <div class="ar-thumb"><span>❓</span></div>
      <div class="ar-info"><b>${escapeHTML(f.q)}</b><span>${escapeHTML(truncateAdmin(f.a, 70))}</span></div>
      <div class="ar-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${f.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-del="${f.id}">Delete</button>
      </div>
    </div>
  `).join("");
  wrap.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openFaqForm(b.dataset.edit)));
  wrap.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>{
    if (confirm("Delete this FAQ item?")){ Store.remove("faq", b.dataset.del); paintFaqList(); renderDashboard(); toast("FAQ item deleted."); }
  }));
}
function openFaqForm(id){
  const item = id ? Store.find("faq", id) : { id: Store.newId("faq"), q:"", a:"" };
  const card = document.getElementById("fq-form-card");
  card.style.display = "block";
  card.innerHTML = `
    <h3>${id ? "Edit Question" : "Add Question"}</h3>
    <label class="block">Question<input type="text" id="fq-q" value="${escapeAttr(item.q)}"></label>
    <label class="block">Answer<textarea id="fq-a" rows="3">${escapeHTML(item.a)}</textarea></label>
    <div class="form-actions">
      <button class="btn btn-primary" id="fq-save">Publish</button>
      <button class="btn btn-ghost" id="fq-cancel">Cancel</button>
    </div>
  `;
  document.getElementById("fq-cancel").addEventListener("click", ()=>{ card.style.display="none"; });
  document.getElementById("fq-save").addEventListener("click", () => {
    const q = document.getElementById("fq-q").value.trim();
    const a = document.getElementById("fq-a").value.trim();
    if (!q || !a){ toast("Please fill in both the question and answer."); return; }
    Store.upsert("faq", { id: item.id, q, a });
    card.style.display = "none";
    paintFaqList();
    renderDashboard();
    toast("FAQ saved.");
  });
}

/* ==========================================================================
   SETTINGS
   ========================================================================== */
function renderSettingsPanel(){
  const cfg = Store.getConfig();
  const el = document.getElementById("panel-settings");
  el.innerHTML = `
    <h2>Settings</h2>
    <div class="admin-card">
      <h3>Join the Club — registration link</h3>
      <p class="admin-hint">Not decided yet? Leave this blank — the "Join the AI Club" buttons will simply scroll visitors to the Join section instead of breaking.</p>
      <label class="block">Registration URL<input type="text" id="set-joinurl" value="${escapeAttr(cfg.joinUrl)}" placeholder="https://forms.gle/…"></label>
    </div>
    <div class="admin-card">
      <h3>Social Media</h3>
      <div class="form-grid">
        <label>Instagram<input type="text" id="set-instagram" value="${escapeAttr(cfg.social.instagram)}" placeholder="https://instagram.com/…"></label>
        <label>Facebook<input type="text" id="set-facebook" value="${escapeAttr(cfg.social.facebook)}" placeholder="https://facebook.com/…"></label>
      </div>
    </div>
    <div class="admin-card">
      <h3>Contact Information</h3>
      <div class="form-grid">
        <label>Club Email<input type="text" id="set-email" value="${escapeAttr(cfg.contact.email)}"></label>
        <label>Faculty Advisor<input type="text" id="set-advisor" value="${escapeAttr(cfg.contact.advisor)}"></label>
        <label>Location<input type="text" id="set-location" value="${escapeAttr(cfg.contact.location)}"></label>
      </div>
    </div>
    <button class="btn btn-primary" id="set-save">Save Settings</button>

    <div class="admin-card" style="margin-top:34px;">
      <h3>Change Admin Password</h3>
      <p class="admin-hint">This is a simple deterrent (no backend/server to enforce it), but it keeps casual visitors out of the dashboard. Pick something the club officers will remember.</p>
      <div class="form-grid">
        <label>New Password<input type="password" id="set-newpass" autocomplete="new-password"></label>
        <label>Confirm New Password<input type="password" id="set-newpass2" autocomplete="new-password"></label>
      </div>
      <button class="btn btn-ghost btn-sm" id="set-savepass" style="margin-top:14px;">Update Password</button>
    </div>

    <div class="admin-card" style="margin-top:34px;border-color:rgba(255,107,107,.3);">
      <h3 style="color:var(--danger);">Danger Zone</h3>
      <p class="admin-hint">Reset all content back to the original placeholder data. This cannot be undone.</p>
      <button class="btn btn-danger btn-sm" id="set-reset">Reset all content</button>
    </div>
  `;
  document.getElementById("set-save").addEventListener("click", () => {
    Store.updateConfig({
      joinUrl: document.getElementById("set-joinurl").value.trim(),
      social: {
        instagram: document.getElementById("set-instagram").value.trim(),
        facebook: document.getElementById("set-facebook").value.trim()
      },
      contact: {
        email: document.getElementById("set-email").value.trim(),
        advisor: document.getElementById("set-advisor").value.trim(),
        location: document.getElementById("set-location").value.trim()
      }
    });
    toast("Settings saved.");
    renderDashboard();
  });
  document.getElementById("set-savepass").addEventListener("click", () => {
    const p1 = document.getElementById("set-newpass").value;
    const p2 = document.getElementById("set-newpass2").value;
    if (!p1 || p1.length < 4){ toast("Password should be at least 4 characters."); return; }
    if (p1 !== p2){ toast("Passwords don't match."); return; }
    Store.updateConfig({ adminPasswordHash: simpleHash(p1) });
    document.getElementById("set-newpass").value = "";
    document.getElementById("set-newpass2").value = "";
    toast("Password updated. You'll need it next time you log in.");
  });
  document.getElementById("set-reset").addEventListener("click", () => {
    if (confirm("This will erase all edits and restore the original placeholder content. Continue?")){
      Store.resetAll();
      toast("All content reset.");
      location.reload();
    }
  });
}

/* ---------------- small helpers ---------------- */
function escapeAttr(str){ return escapeHTML(str); }
function truncateAdmin(str, n){ if(!str) return ""; return str.length>n ? str.slice(0,n-1).trim()+"…" : str; }
