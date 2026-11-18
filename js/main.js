(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- header + mobile menu ---------- */
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  const toggle = document.getElementById('menu-toggle');
  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.querySelectorAll('#nav a').forEach(a => a.addEventListener('click', () => {
    document.body.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', false);
  }));

  /* ---------- practice tabs ---------- */
  const tabs = document.querySelectorAll('.switch [role="tab"]');
  const pill = document.querySelector('.switch__pill');
  const placePill = (btn) => { pill.style.width = btn.offsetWidth + 'px'; pill.style.transform = 'translateX(' + btn.offsetLeft + 'px)'; };
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => { b.setAttribute('aria-selected', b === btn); document.getElementById(b.getAttribute('aria-controls')).hidden = b !== btn; });
    placePill(btn);
    const list = document.getElementById(btn.getAttribute('aria-controls'));
    if (hasGsap && !reduce) gsap.from(list.children, {y:24, opacity:0, duration:.6, stagger:.06, ease:'power3.out'});
    if (hasGsap) ScrollTrigger.refresh();
  }));
  const placeActive = () => placePill(document.querySelector('.switch [aria-selected="true"]'));
  window.addEventListener('resize', placeActive); document.fonts && document.fonts.ready.then(placeActive); placeActive();

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item button').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.nextElementSibling;
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !open);
      panel.style.height = open ? '0px' : panel.scrollHeight + 'px';
    });
  });

  /* ---------- form ---------- */
  const form = document.getElementById('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const name = form.elements.name, phone = form.elements.phone;
    const setErr = (el, msg) => { el.nextElementSibling.textContent = msg; if (msg) ok = false; };
    setErr(name, name.value.trim() ? '' : 'Enter your name so we know who to ask for.');
    setErr(phone, /^[+\d][\d\s-]{8,}$/.test(phone.value.trim()) ? '' : 'Enter a 10-digit mobile number, with or without +91.');
    if (!ok) { form.querySelector('.error:not(:empty)').previousElementSibling.focus(); return; }
    document.getElementById('f-submit').querySelector('span').textContent = 'Request sent';
    document.getElementById('form-done').classList.add('is-visible');
    form.reset();
  });

  /* ---------- disclaimer gate, then hero sequence ---------- */
  const gate = document.getElementById('disclaimer');
  let accepted = false;
  try { accepted = sessionStorage.getItem('sutra-disclaimer') === '1'; } catch(e) {}
  const start = () => { if (hasGsap) initMotion(); };
  if (!accepted) {
    gate.hidden = false;
    document.getElementById('disclaimer-accept').focus();
    document.getElementById('disclaimer-accept').addEventListener('click', () => {
      try { sessionStorage.setItem('sutra-disclaimer','1'); } catch(e) {}
      if (hasGsap && !reduce) gsap.to(gate, {opacity:0, duration:.4, onComplete:() => { gate.hidden = true; start(); }});
      else { gate.hidden = true; start(); }
    });
  } else start();

  /* ---------- motion ---------- */
  function initMotion(){
    gsap.registerPlugin(ScrollTrigger);
    if (reduce) { gsap.set('#stamp', {opacity:1}); return; }

    // Lenis smooth scroll
    if (window.Lenis) {
      const lenis = new Lenis({duration:1.15, smoothWheel:true});
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
        const id = a.getAttribute('href'); if (id.length < 2) return;
        const el = document.querySelector(id); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, {offset:-70});
      }));
    }

    // Hero: the single orchestrated entrance
    const tl = gsap.timeline({defaults:{ease:'power4.out'}});
    tl.from('.hero h1 .line > span', {yPercent:110, duration:1.2, stagger:.1})
      .from('#hero-deed .deed__clip', {clipPath:'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)', duration:1.4, ease:'expo.inOut'}, 0.1)
      .from('#hero-deed img', {scale:1.25, duration:1.8, ease:'power3.out'}, 0.1)
      .from('#hero-deed', {'--fold':'0px', duration:.8, ease:'back.out(2)'}, 1.1)
      .from('.seal', {scale:0, rotate:-120, duration:1, ease:'back.out(1.6)'}, 0.9)
      .from('[data-hero-fade]', {opacity:0, y:20, duration:.9, stagger:.08}, 0.55);

    // Parallax inside dog-eared frames
    document.querySelectorAll('[data-parallax]').forEach(img => {
      const amt = parseFloat(img.dataset.parallax) || 8;
      gsap.fromTo(img, {yPercent:-amt}, {yPercent:amt * .6, ease:'none', scrollTrigger:{trigger:img.closest('.deed'), start:'top bottom', end:'bottom top', scrub:true}});
    });

    // Scroll reel: rows drift with scroll, opposite directions
    document.querySelectorAll('[data-reel]').forEach(row => {
      row.innerHTML += row.innerHTML; // duplicate for length
      const dir = parseFloat(row.dataset.reel);
      gsap.fromTo(row, {xPercent: dir < 0 ? 0 : -25}, {xPercent: dir < 0 ? -25 : 0, ease:'none', scrollTrigger:{trigger:'.reel', start:'top bottom', end:'bottom top', scrub:.6}});
    });

    // Journey: pinned side-scroll reel with the registration stamp
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const track = document.getElementById('journey-track');
      const dist = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {x:() => -dist(), ease:'none', scrollTrigger:{
        trigger:'#journey-pin', start:'top top', end:() => '+=' + dist(), pin:true, scrub:.8, invalidateOnRefresh:true, anticipatePin:1,
        onUpdate:self => gsap.set('#journey-bar', {scaleX:self.progress})
      }});
      track.querySelectorAll('.step').forEach(step => {
        gsap.from(step.querySelector('.step__no'), {yPercent:40, opacity:0, ease:'power2.out', scrollTrigger:{trigger:step, containerAnimation:tween, start:'left 95%', end:'left 60%', scrub:true}});
      });
      gsap.fromTo('#stamp', {opacity:0, scale:2.2, rotate:-35}, {opacity:.95, scale:1, rotate:-12, ease:'power4.in', scrollTrigger:{trigger:document.getElementById('stamp').closest('.step'), containerAnimation:tween, start:'left 65%', end:'left 35%', scrub:.4}});
    });
    mm.add('(max-width: 860px)', () => {
      gsap.fromTo('#stamp', {opacity:0, scale:2.2, rotate:-35}, {opacity:.95, scale:1, rotate:-12, ease:'power4.in', scrollTrigger:{trigger:document.getElementById('stamp').closest('.step'), start:'center 85%', end:'center 55%', scrub:.4}});
    });

    // Partners: staggered rise with the stepped layout
    gsap.from('.partner', {y:80, opacity:0, duration:1.1, stagger:.12, ease:'power3.out', scrollTrigger:{trigger:'.partners', start:'top 80%'}});

    // Footer wordmark slides in from the side
    gsap.fromTo('.footer__mark', {xPercent:12}, {xPercent:-4, ease:'none', scrollTrigger:{trigger:'.site-footer', start:'top bottom', end:'bottom bottom', scrub:true}});

    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
