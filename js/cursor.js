/* ==========================================================================
   Custom cursor — glowing dot + trailing ring, grows on interactive elements.
   Skipped entirely on touch devices (no real cursor there).
   ========================================================================== */
(function(){
  if (window.matchMedia("(pointer: coarse)").matches) return;
  if (!window.matchMedia("(hover: hover)").matches) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const dot = document.createElement("div");
  dot.className = "cc-dot";
  const ring = document.createElement("div");
  ring.className = "cc-ring";
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.documentElement.classList.add("cc-active");

  let mx = window.innerWidth/2, my = window.innerHeight/2;
  let rx = mx, ry = my;
  let raf = null;
  let visible = false;
  let pressed = false;

  const HOVER_SELECTOR = "a, button, input, select, textarea, [role='button'], .card, .faq-q, .tab-btn, .filter-chip, .gallery-item, [tabindex]";

  function placeDot(x, y){
    dot.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
  }
  function placeRing(x, y){
    ring.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%) scale(${pressed ? 0.85 : 1})`;
  }

  function loop(){
    rx += (mx - rx) * 0.2;
    ry += (my - ry) * 0.2;
    placeRing(rx, ry);
    if (Math.abs(mx-rx) > 0.4 || Math.abs(my-ry) > 0.4){
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }

  document.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    placeDot(mx, my);
    if (!visible){ visible = true; dot.style.opacity = "1"; ring.style.opacity = "1"; }
    if (reduceMotion){
      rx = mx; ry = my;
      placeRing(rx, ry);
    } else if (!raf){
      raf = requestAnimationFrame(loop);
    }
  }, { passive:true });

  document.addEventListener("mouseleave", () => {
    dot.style.opacity = "0"; ring.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    dot.style.opacity = "1"; ring.style.opacity = "1";
  });

  document.addEventListener("mouseover", (e) => {
    if (e.target.closest && e.target.closest(HOVER_SELECTOR)){
      dot.classList.add("hover"); ring.classList.add("hover");
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest && e.target.closest(HOVER_SELECTOR)){
      dot.classList.remove("hover"); ring.classList.remove("hover");
    }
  });

  document.addEventListener("mousedown", () => { pressed = true; placeRing(rx, ry); });
  document.addEventListener("mouseup", () => { pressed = false; placeRing(rx, ry); });
})();
