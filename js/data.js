/* ==========================================================================
   AI CLUB — shared data layer
   Everything the public site and the admin dashboard read/write lives here.
   Storage: browser localStorage (no backend/server required).

   NOTE FOR ADMINS: content added through /admin.html is saved in the
   browser's local storage. That means it lives on the device/browser the
   admin used to add it. See README.md for notes on moving to a shared
   backend later if the club wants multiple admins editing from anywhere.
   ========================================================================== */

const STORAGE_KEY = "aiclub_data_v1";

/* ---------------------------------------------------------------------
   1. ONE-TIME CONFIG
   Edit these directly, or change them from Admin → Settings (saved
   values in localStorage always override these defaults).
--------------------------------------------------------------------- */
const DEFAULT_CONFIG = {
  // Registration destination isn't decided yet — set this the moment it is.
  // Until then the "Join" buttons scroll to the on-page Join section.
  joinUrl: "",
  social: {
    instagram: "",
    facebook: "",
    youtube: ""
  },
  contact: {
    email: "aiclub@cantonmentschool.example",
    school: "Cantonment English School And College",
    advisor: "To be announced",
    location: "Cantonment English School And College campus"
  },
  // Admin dashboard lock screen. This is a lightweight deterrent (not
  // strong security — it's a static site with no server), meant to stop
  // casual visitors from finding /admin.html and editing content.
  // Default password is "aiclub2026" — CHANGE THIS from Admin → Settings
  // the first time you log in.
  adminPasswordHash: "1343cff3b024bf51"
};

/* ---------------------------------------------------------------------
   2. PLACEHOLDER / SEED CONTENT
   All of this is clearly fake placeholder data so the site looks
   complete on day one. Replace it via the Admin Dashboard.
--------------------------------------------------------------------- */
const DEFAULT_DATA = {

  stats: {
    members: 0,
    projects: 0,
    events: 0,
    awards: 0
  },

  achievements: [
    {
      id: "ach-1",
      title: "Sample Achievement Title",
      category: "Olympiad",
      year: "2026",
      people: "Student name(s) go here",
      description: "Placeholder description of the achievement. Replace with real results once available — add the competition, the round reached, and any recognition earned.",
      image: "",
      link: ""
    },
    {
      id: "ach-2",
      title: "Sample Certificate / Award",
      category: "Award",
      year: "2026",
      people: "Student name(s) go here",
      description: "Placeholder description. Achievements can include competition placements, certificates, or school recognitions.",
      image: "",
      link: ""
    },
    {
      id: "ach-3",
      title: "Sample Project Recognition",
      category: "Project",
      year: "2026",
      people: "Student name(s) go here",
      description: "Placeholder description for a project-based achievement, such as a showcase selection or a completed milestone.",
      image: "",
      link: ""
    }
  ],

  olympiad: {
    intro: "The AI Club's Olympiad track prepares students for national and international AI/Computer Science olympiads through structured practice, mock rounds, and mentor guidance.",
    rounds: [
      { id: "r1", stage: "Preparation", title: "Preparation", desc: "Study sessions, practice sets, and mock tests to build core AI & CS fundamentals." },
      { id: "r2", stage: "Regional Round", title: "Regional Round", desc: "Selected students compete at the regional level. Details published closer to each event." },
      { id: "r3", stage: "National Round", title: "National Round", desc: "Top regional performers advance to represent the club nationally." },
      { id: "r4", stage: "Results", title: "Results", desc: "Outcomes, certificates, and write-ups are shared here once each competition concludes." }
    ]
  },

  projects: [
    {
      id: "proj-1",
      title: "Sample Project — Handwritten Digit Recognizer",
      category: "Machine Learning",
      status: "Completed",
      creators: "Student name(s)",
      description: "Placeholder project description. This is a sample entry showing how a finished project will be displayed — swap in a real project any time from the admin dashboard.",
      tech: ["Python", "Neural Networks"],
      image: "",
      demoLink: "",
      githubLink: ""
    },
    {
      id: "proj-2",
      title: "Sample Project — Maze-Solving Agent",
      category: "Artificial Intelligence",
      status: "In Progress",
      creators: "Student name(s)",
      description: "Placeholder project description for a reinforcement-learning demo built by club members.",
      tech: ["JavaScript", "Reinforcement Learning"],
      image: "",
      demoLink: "",
      githubLink: ""
    },
    {
      id: "proj-3",
      title: "Sample Project — Computer Vision Sorter",
      category: "Computer Vision",
      status: "Completed",
      creators: "Student name(s)",
      description: "Placeholder project description showing a computer-vision based classroom project.",
      tech: ["Python", "OpenCV"],
      image: "",
      demoLink: "",
      githubLink: ""
    }
  ],

  events: [
    {
      id: "evt-1",
      title: "Sample Event — Intro to AI Workshop",
      category: "Workshop",
      date: addDaysISO(10),
      time: "3:30 PM",
      location: "School Computer Lab",
      description: "Placeholder event. A beginner-friendly session introducing what AI is and how the club works.",
      image: "",
      registerLink: "",
      status: "Upcoming"
    },
    {
      id: "evt-2",
      title: "Sample Event — Club Orientation Meeting",
      category: "Club Meeting",
      date: addDaysISO(20),
      time: "4:00 PM",
      location: "Room 204",
      description: "Placeholder event for the club's general orientation meeting for new members.",
      image: "",
      registerLink: "",
      status: "Upcoming"
    },
    {
      id: "evt-3",
      title: "Sample Past Event — First Club Meetup",
      category: "Club Meeting",
      date: addDaysISO(-30),
      time: "3:00 PM",
      location: "School Auditorium",
      description: "Placeholder past event, shown here to demonstrate how completed events move to the past-events area automatically.",
      image: "",
      registerLink: "",
      status: "Past"
    }
  ],

  news: [
    {
      id: "news-1",
      title: "Welcome to the AI Club Website",
      category: "Club Notice",
      date: addDaysISO(-2),
      description: "This is a placeholder announcement. Real news and updates will appear here as the club publishes them.",
      article: "This is placeholder article text. Once the club begins publishing updates, the newest important post will also appear in the announcement bar near the top of the homepage.",
      image: "",
      pinned: true,
      status: "Published"
    },
    {
      id: "news-2",
      title: "Sample News — Workshop Announcement",
      category: "Workshop Announcement",
      date: addDaysISO(-6),
      description: "Placeholder announcement about an upcoming workshop.",
      article: "Placeholder full article text for this news post.",
      image: "",
      pinned: false,
      status: "Published"
    },
    {
      id: "news-3",
      title: "Sample News — Competition Results",
      category: "Competition Results",
      date: addDaysISO(-14),
      description: "Placeholder announcement about competition results.",
      article: "Placeholder full article text for this news post.",
      image: "",
      pinned: false,
      status: "Published"
    }
  ],

  gallery: [
    { id: "g1", album: "Club Meeting", caption: "Sample photo — Club Meeting", image: "" },
    { id: "g2", album: "AI Workshop", caption: "Sample photo — AI Workshop", image: "" },
    { id: "g3", album: "AI Olympiad", caption: "Sample photo — AI Olympiad", image: "" },
    { id: "g4", album: "Competition", caption: "Sample photo — Competition", image: "" },
    { id: "g5", album: "Award Ceremony", caption: "Sample photo — Award Ceremony", image: "" },
    { id: "g6", album: "Club Meeting", caption: "Sample photo — Club Meeting", image: "" }
  ],

  team: [
    { id: "t1", name: "To be announced", position: "Faculty Advisor", bio: "Placeholder biography.", photo: "", social: "" },
    { id: "t2", name: "To be announced", position: "Club President", bio: "Placeholder biography.", photo: "", social: "" },
    { id: "t3", name: "To be announced", position: "Vice President", bio: "Placeholder biography.", photo: "", social: "" },
    { id: "t4", name: "To be announced", position: "General Secretary", bio: "Placeholder biography.", photo: "", social: "" }
  ],

  resources: [
    { id: "res-1", title: "Python Basics for Beginners", category: "Python", difficulty: "Beginner", description: "A starting point for students who are new to programming.", link: "", thumbnail: "" },
    { id: "res-2", title: "What is Machine Learning?", category: "Machine Learning", difficulty: "Beginner", description: "A conceptual introduction to machine learning ideas.", link: "", thumbnail: "" },
    { id: "res-3", title: "Neural Networks Explained", category: "Neural Networks", difficulty: "Intermediate", description: "How neural networks are structured and how they learn.", link: "", thumbnail: "" },
    { id: "res-4", title: "Intro to Computer Vision", category: "Computer Vision", difficulty: "Intermediate", description: "Fundamentals of how machines interpret images.", link: "", thumbnail: "" },
    { id: "res-5", title: "Generative AI Overview", category: "Generative AI", difficulty: "Beginner", description: "An overview of how generative AI tools work.", link: "", thumbnail: "" },
    { id: "res-6", title: "Useful AI Tools for Students", category: "AI Tools", difficulty: "Beginner", description: "A short list of tools students can explore.", link: "", thumbnail: "" }
  ],

  faq: [
    { id: "faq-1", q: "Who can join the AI Club?", a: "Any student of Cantonment English School And College can join." },
    { id: "faq-2", q: "Do I need previous AI experience?", a: "No. The club is designed to help students learn and grow, regardless of starting point." },
    { id: "faq-3", q: "What can I learn?", a: "Members explore Artificial Intelligence, Machine Learning, Python, Computer Vision, Generative AI, and other emerging technologies through hands-on activities." },
    { id: "faq-4", q: "Are there competitions?", a: "Yes — the club prepares students for Olympiads, technology competitions, and hackathons." },
    { id: "faq-5", q: "Does the club organize workshops?", a: "Yes — the club regularly runs workshops, seminars, and hands-on sessions." },
    { id: "faq-6", q: "How can I join?", a: "Use the \u201cJoin the AI Club\u201d button on this website. If the registration link isn't active yet, check back soon or contact the club directly." }
  ]
};

function addDaysISO(days){
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0,10);
}

/* ---------------------------------------------------------------------
   3. STORAGE ENGINE
--------------------------------------------------------------------- */
const Store = {

  _read(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    }catch(e){
      console.warn("AI Club storage read failed, using defaults.", e);
      return null;
    }
  },

  _write(state){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    }catch(e){
      console.error("AI Club storage write failed (storage may be full).", e);
      return false;
    }
  },

  /** Returns the full app state, seeding defaults on first run. */
  getState(){
    let state = this._read();
    if (!state){
      state = {
        config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
        data: JSON.parse(JSON.stringify(DEFAULT_DATA))
      };
      this._write(state);
    }
    // guard against missing keys if defaults grow over time
    state.config = Object.assign({}, DEFAULT_CONFIG, state.config, {
      social: Object.assign({}, DEFAULT_CONFIG.social, state.config && state.config.social),
      contact: Object.assign({}, DEFAULT_CONFIG.contact, state.config && state.config.contact)
    });
    Object.keys(DEFAULT_DATA).forEach(k => {
      if (!(k in (state.data || {}))) state.data[k] = DEFAULT_DATA[k];
    });
    return state;
  },

  saveState(state){
    return this._write(state);
  },

  getConfig(){ return this.getState().config; },
  getData(){ return this.getState().data; },

  updateConfig(partial){
    const state = this.getState();
    state.config = Object.assign({}, state.config, partial);
    if (partial.social) state.config.social = Object.assign({}, state.config.social, partial.social);
    if (partial.contact) state.config.contact = Object.assign({}, state.config.contact, partial.contact);
    this.saveState(state);
    return state.config;
  },

  /** Generic collection helpers: collection is a key inside `data`, e.g. "events" */
  list(collection){
    return this.getState().data[collection] || [];
  },

  find(collection, id){
    return this.list(collection).find(x => x.id === id) || null;
  },

  upsert(collection, item){
    const state = this.getState();
    const arr = state.data[collection] || (state.data[collection] = []);
    const idx = arr.findIndex(x => x.id === item.id);
    if (idx >= 0) arr[idx] = item;
    else arr.unshift(item);
    this.saveState(state);
    return item;
  },

  remove(collection, id){
    const state = this.getState();
    state.data[collection] = (state.data[collection] || []).filter(x => x.id !== id);
    this.saveState(state);
  },

  setCollection(collection, arr){
    const state = this.getState();
    state.data[collection] = arr;
    this.saveState(state);
  },

  resetAll(){
    const state = {
      config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
      data: JSON.parse(JSON.stringify(DEFAULT_DATA))
    };
    this.saveState(state);
    return state;
  },

  newId(prefix){
    return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  }
};

/* ---------------------------------------------------------------------
   4. AI FACTS (predefined — no external API needed)
--------------------------------------------------------------------- */
const AI_FACTS = [
  "The term \u201cArtificial Intelligence\u201d was first coined in 1956 at a workshop held at Dartmouth College.",
  "A neural network's \u201cneurons\u201d are loosely inspired by biological neurons, but they're really just weighted sums passed through a function.",
  "The first chatbot, ELIZA, was created in 1966 and simulated a psychotherapist by rephrasing what users typed.",
  "AlphaGo, developed by DeepMind, defeated a world champion Go player in 2016 — decades earlier than many experts predicted was possible.",
  "Convolutional Neural Networks (CNNs), widely used in image recognition, were inspired by how the visual cortex processes images.",
  "Reinforcement learning agents can learn to play games purely through trial and error, without ever being told the rules directly.",
  "Generative AI models don't \u201cmemorize\u201d most of what they output — they learn statistical patterns from huge amounts of data.",
  "Some of the earliest AI programs in the 1950s could already play checkers and prove basic math theorems.",
  "The \u201cTuring Test,\u201d proposed by Alan Turing in 1950, asks whether a machine's conversation can be indistinguishable from a human's.",
  "Modern speech recognition systems often use the same core building blocks (transformers) as large language models.",
  "Computer vision models can be tricked by \u201cadversarial examples\u201d — tiny pixel changes invisible to humans that cause big misclassifications.",
  "The word \u201crobot\u201d comes from the Czech word \u201crobota,\u201d meaning forced labor, first used in a 1920 play.",
  "Training a large AI model can involve processing far more text than any single human could read in a lifetime.",
  "Machine learning models don't truly \u201cunderstand\u201d language — they predict patterns based on statistics learned from data.",
  "Self-driving car systems combine computer vision, sensor fusion, and planning algorithms working together in real time."
];

/* ---------------------------------------------------------------------
   5. SMALL UTILITIES shared across pages
--------------------------------------------------------------------- */
function escapeHTML(str){
  if (str == null) return "";
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function formatDate(iso){
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function dateParts(iso){
  if (!iso) return { day:"--", mon:"---" };
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return { day:"--", mon:"---" };
  return {
    day: d.getDate(),
    mon: d.toLocaleDateString("en-US", { month:"short" }).toUpperCase()
  };
}

function isPastDate(iso){
  if (!iso) return false;
  const d = new Date(iso + "T00:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  return d < today;
}

/**
 * Lightweight, dependency-free string hash (not cryptographically secure).
 * Used only to avoid storing the admin password in plain text in localStorage
 * / page source. This is a deterrent for a static site with no backend, not
 * strong security — see README for real hardening options.
 */
function simpleHash(str){
  let h1 = 5381, h2 = 52711;
  for (let i=0;i<str.length;i++){
    const c = str.charCodeAt(i);
    h1 = (h1 * 33) ^ c;
    h2 = (h2 * 33) ^ c;
  }
  h1 = h1 >>> 0; h2 = h2 >>> 0;
  return h1.toString(16).padStart(8,"0") + h2.toString(16).padStart(8,"0");
}
