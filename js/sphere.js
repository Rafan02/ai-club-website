/* ==========================================================================
   Interactive neural-network sphere — a literal, draggable 3D wireframe
   globe of AI/ML concept nodes, echoing the club's logo. Pure canvas2D +
   trigonometry, no libraries.
   ========================================================================== */
(function(){
  const canvas = document.getElementById("sphere-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const labelEl = document.getElementById("si-label");
  const descEl = document.getElementById("si-desc");
  const hintEl = document.getElementById("si-hint");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- AI/ML concept glossary — one per node ---- */
  const CONCEPTS = [
    ["Neuron", "The basic unit of a neural network — takes inputs, applies weights, and produces an output."],
    ["Weight", "A number that controls how much influence one neuron's output has on the next."],
    ["Bias", "An extra adjustable value added to a neuron's input, helping it fit patterns more flexibly."],
    ["Activation Function", "A function applied to a neuron's output that lets networks learn non-linear patterns."],
    ["Neural Network", "Layers of connected neurons that transform input data into predictions."],
    ["Layer", "A group of neurons that process data at the same stage of a network."],
    ["Backpropagation", "The algorithm that calculates how to adjust weights after a prediction is wrong."],
    ["Gradient Descent", "An optimization method that nudges weights step-by-step to reduce errors."],
    ["Loss Function", "A formula that measures how far a model's prediction is from the correct answer."],
    ["Epoch", "One full pass of a model through the entire training dataset."],
    ["Overfitting", "When a model memorizes training data too closely and performs poorly on new data."],
    ["Underfitting", "When a model is too simple to capture the patterns in the data."],
    ["Training Data", "The examples a model learns from before it's tested."],
    ["Test Data", "Separate examples used to check how well a trained model generalizes."],
    ["Convolution", "A technique used in computer vision to scan images for local patterns like edges."],
    ["Pooling", "A step that shrinks image data while keeping its most important features."],
    ["Tokenization", "Breaking text into smaller pieces (tokens) a language model can process."],
    ["Embedding", "A way of representing words or items as numeric vectors that capture meaning."],
    ["Attention", "A mechanism that lets a model focus on the most relevant parts of its input."],
    ["Transformer", "A neural network architecture built on attention, behind most modern language models."],
    ["Reinforcement Learning", "Training an agent through trial, error, and reward rather than labeled examples."],
    ["Reward", "The feedback signal a reinforcement learning agent tries to maximize."],
    ["Generative Model", "A model that creates new content — text, images, audio — rather than just classifying."],
    ["Dataset", "A structured collection of examples used to train or evaluate a model."],
    ["Inference", "Using an already-trained model to make a prediction on new data."],
    ["Hyperparameter", "A setting chosen before training (like learning rate) that shapes how a model learns."]
  ];

  let W, H, cx, cy, dpr;
  const R = 150; // local sphere radius
  let nodes = [];
  let edges = [];
  let rotY = 0.4, rotX = -0.15;
  let autoSpin = reduceMotion ? 0 : 0.0018;
  let dragging = false, dragMoved = false, lastX = 0, lastY = 0;
  let selected = -1;

  function buildSphere(){
    const n = CONCEPTS.length;
    nodes = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i=0;i<n;i++){
      const y = 1 - (i/(n-1))*2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y*y));
      const theta = golden * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      nodes.push({ x: x*R, y: y*R, z: z*R, ny: y, label: CONCEPTS[i][0], desc: CONCEPTS[i][1] });
    }
    // connect each node to its 2 nearest neighbours for a clean wireframe
    edges = [];
    const seen = new Set();
    for (let i=0;i<nodes.length;i++){
      const dists = [];
      for (let j=0;j<nodes.length;j++){
        if (i===j) continue;
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, dz=nodes[i].z-nodes[j].z;
        dists.push([j, dx*dx+dy*dy+dz*dz]);
      }
      dists.sort((a,b)=>a[1]-b[1]);
      for (let k=0;k<3;k++){
        const j = dists[k][0];
        const key = i<j ? i+"_"+j : j+"_"+i;
        if (!seen.has(key)){ seen.add(key); edges.push([i,j]); }
      }
    }
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio||1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W*dpr; canvas.height = H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    cx = W/2; cy = H/2;
  }

  function project(n){
    // rotate around Y then X
    let x = n.x, y = n.y, z = n.z;
    let x1 = x*Math.cos(rotY) + z*Math.sin(rotY);
    let z1 = -x*Math.sin(rotY) + z*Math.cos(rotY);
    let y2 = y*Math.cos(rotX) - z1*Math.sin(rotX);
    let z2 = y*Math.sin(rotX) + z1*Math.cos(rotX);
    const focal = 420;
    const persp = focal / (focal + z2);
    return { sx: cx + x1*persp, sy: cy + y2*persp, z: z2, persp };
  }

  function colorFor(ny, alpha){
    // cyan (top) -> violet (bottom), matching the club palette
    const t = (ny+1)/2; // 0..1
    const c1 = [69,224,255], c2 = [163,91,255];
    const r = Math.round(c1[0]+(c2[0]-c1[0])*t);
    const g = Math.round(c1[1]+(c2[1]-c1[1])*t);
    const b = Math.round(c1[2]+(c2[2]-c1[2])*t);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    const proj = nodes.map(project);

    // edges
    edges.forEach(([i,j]) => {
      const a = proj[i], b = proj[j];
      const depth = (a.z + b.z) / 2;
      const op = Math.max(0.06, Math.min(0.5, 0.5 - depth/500));
      ctx.strokeStyle = `rgba(150,170,255,${op})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    });

    // nodes, back-to-front
    const order = proj.map((p,i)=>i).sort((a,b)=>proj[a].z - proj[b].z);
    order.forEach(i => {
      const p = proj[i];
      const isSel = i === selected;
      const baseR = isSel ? 7 : 4.2;
      const rr = baseR * Math.max(0.55, p.persp);
      const alpha = Math.max(0.35, Math.min(1, p.persp));
      ctx.beginPath();
      ctx.fillStyle = colorFor(nodes[i].ny, alpha);
      ctx.shadowColor = colorFor(nodes[i].ny, 1);
      ctx.shadowBlur = isSel ? 18 : 8;
      ctx.arc(p.sx, p.sy, rr, 0, Math.PI*2);
      ctx.fill();
      if (isSel){
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, rr+5, 0, Math.PI*2);
        ctx.stroke();
      }
    });
    ctx.shadowBlur = 0;
  }

  function tick(){
    if (!dragging) rotY += autoSpin;
    draw();
    requestAnimationFrame(tick);
  }

  function hitTest(px, py){
    const proj = nodes.map(project);
    let best = -1, bestD = 22*22;
    proj.forEach((p,i) => {
      const dx = p.sx-px, dy = p.sy-py;
      const d = dx*dx+dy*dy;
      if (d < bestD){ bestD = d; best = i; }
    });
    return best;
  }

  function selectNode(i){
    selected = i;
    if (i >= 0){
      labelEl.textContent = nodes[i].label;
      descEl.textContent = nodes[i].desc;
      if (hintEl) hintEl.style.display = "none";
    }
  }

  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    const t = (e.touches && e.touches.length) ? e.touches[0]
            : (e.changedTouches && e.changedTouches.length) ? e.changedTouches[0]
            : e;
    return { x: t.clientX-rect.left, y: t.clientY-rect.top };
  }

  function onDown(e){
    dragging = true; dragMoved = false;
    const p = getPos(e);
    lastX = p.x; lastY = p.y;
    canvas.classList.add("grabbing");
  }
  function onMove(e){
    if (!dragging) return;
    const p = getPos(e);
    const dx = p.x-lastX, dy = p.y-lastY;
    if (Math.abs(dx)>2 || Math.abs(dy)>2) dragMoved = true;
    rotY += dx*0.008;
    rotX = Math.max(-0.9, Math.min(0.9, rotX + dy*0.008));
    lastX = p.x; lastY = p.y;
  }
  function onUp(e){
    if (dragging && !dragMoved){
      const p = getPos(e);
      const hit = hitTest(p.x, p.y);
      if (hit >= 0) selectNode(hit);
    }
    dragging = false;
    canvas.classList.remove("grabbing");
  }

  canvas.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener("touchstart", onDown, {passive:true});
  canvas.addEventListener("touchmove", onMove, {passive:true});
  canvas.addEventListener("touchend", onUp);

  window.addEventListener("resize", resize);

  buildSphere();
  resize();
  requestAnimationFrame(tick);
})();
