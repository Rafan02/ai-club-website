/* ==========================================================================
   Hero neural-network particle background.
   Lightweight canvas2D — no dependencies, respects reduced-motion.
   ========================================================================== */
(function(){
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w, h, dpr;
  let nodes = [];
  let mouse = { x: -9999, y: -9999, active:false };
  let raf = null;

  const COLORS = ["69,224,255", "91,127,255", "163,91,255"];

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    buildNodes();
  }

  function buildNodes(){
    const density = Math.min(90, Math.max(36, Math.floor((w*h)/22000)));
    nodes = [];
    for (let i=0;i<density;i++){
      nodes.push({
        x: Math.random()*w,
        y: Math.random()*h,
        vx: (Math.random()-0.5)*0.25,
        vy: (Math.random()-0.5)*0.25,
        r: Math.random()*1.6 + 0.8,
        c: COLORS[i % COLORS.length],
        pulse: Math.random()*Math.PI*2
      });
    }
  }

  function step(){
    ctx.clearRect(0,0,w,h);

    // update
    for (const n of nodes){
      n.x += n.vx; n.y += n.vy;
      n.pulse += 0.01;
      if (n.x < -20) n.x = w+20; if (n.x > w+20) n.x = -20;
      if (n.y < -20) n.y = h+20; if (n.y > h+20) n.y = -20;

      if (mouse.active){
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < 140){
          const f = (140-dist)/140 * 0.6;
          n.x += (dx/dist||0) * f;
          n.y += (dy/dist||0) * f;
        }
      }
    }

    // connections
    const maxDist = 130;
    for (let i=0;i<nodes.length;i++){
      for (let j=i+1;j<nodes.length;j++){
        const a = nodes[i], b = nodes[j];
        const dx = a.x-b.x, dy = a.y-b.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < maxDist){
          const op = (1 - dist/maxDist) * 0.22;
          ctx.strokeStyle = `rgba(${a.c},${op})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.stroke();
        }
      }
      // link to mouse for a "reacting" feel
      if (mouse.active){
        const a = nodes[i];
        const dx = a.x-mouse.x, dy = a.y-mouse.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < 170){
          const op = (1 - dist/170) * 0.35;
          ctx.strokeStyle = `rgba(69,224,255,${op})`;
          ctx.beginPath();
          ctx.moveTo(a.x,a.y); ctx.lineTo(mouse.x,mouse.y);
          ctx.stroke();
        }
      }
    }

    // nodes
    for (const n of nodes){
      const glow = 0.55 + Math.sin(n.pulse)*0.25;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${n.c},${glow})`;
      ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
      ctx.fill();
    }

    if (!reduceMotion) raf = requestAnimationFrame(step);
  }

  function onMove(e){
    const rect = canvas.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    mouse.x = cx; mouse.y = cy; mouse.active = true;
  }
  function onLeave(){ mouse.active = false; }

  window.addEventListener("resize", resize);
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseleave", onLeave);
  canvas.addEventListener("touchmove", onMove, {passive:true});
  canvas.addEventListener("touchend", onLeave);

  resize();
  if (reduceMotion){
    step(); // draw one static frame, no animation loop
  } else {
    raf = requestAnimationFrame(step);
  }
})();
