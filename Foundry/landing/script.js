// ===== Particles Canvas =====
(function () {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width, height;
  const particles = [];
  const PARTICLE_COUNT = 40;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  class Particle {
    constructor() {
      this.reset(true);
    }
    reset(initial) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.size = Math.random() * 1.5 + 0.5;
      this.speedY = -(Math.random() * 0.4 + 0.1);
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.6 + 0.1;
      this.life = Math.random() * 500 + 200;
      this.age = 0;
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      this.age++;
      if (this.y < -10 || this.age > this.life) {
        this.reset(false);
      }
    }
    draw(ctx) {
      const alpha = this.opacity * (1 - this.age / this.life);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 158, 11, ${alpha})`;
      ctx.fill();
      ctx.shadowBlur = this.size * 3;
      ctx.shadowColor = `rgba(245, 158, 11, ${alpha * 0.5})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.update();
      p.draw(ctx);
    }
    requestAnimationFrame(animate);
  }

  resize();
  animate();
  window.addEventListener('resize', resize);
})();

// ===== Scroll Reveal =====
(function () {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach((el) => observer.observe(el));
})();

// ===== Navigation Scroll =====
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;

  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    lastScroll = y;
  }, { passive: true });
})();

// ===== Mobile Nav Toggle =====
(function () {
  const toggle = document.getElementById('navToggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
})();

// ===== MCP Tab Switcher =====
(function () {
  const tabs = document.querySelectorAll('.mcp-client-tab');
  const code = document.getElementById('mcpCode');
  const lang = document.getElementById('mcpLang');
  const copyBtn = document.getElementById('mcpCopyBtn');
  if (!code || !lang) return;

  const configs = {
    opencode: {
      lang: 'opencode.json',
      text: `{
  "mcp": {
    "foundry": {
      "type": "local",
      "command": ["node", "/path/to/Foundry/apps/mcp-server/dist/server.js"],
      "enabled": true
    }
  }
}`
    },
    claude: {
      lang: 'settings.json (Claude Code)',
      text: `{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": ["/path/to/Foundry/apps/mcp-server/dist/server.js"]
    }
  }
}`
    },
    cursor: {
      lang: '.cursor/mcp.json',
      text: `{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": ["/path/to/Foundry/apps/mcp-server/dist/server.js"]
    }
  }
}`
    },
    copilot: {
      lang: '.copilot/mcp.json',
      text: `{
  "servers": {
    "foundry": {
      "command": "node",
      "args": ["/path/to/Foundry/apps/mcp-server/dist/server.js"]
    }
  }
}`
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.dataset.tab;
      if (configs[key]) {
        code.textContent = configs[key].text;
        lang.textContent = configs[key].lang;
      }
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(code.textContent || '').then(() => {
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy';
        }, 2000);
      }).catch(() => {});
    });
  }
})();

// ===== Auto-detect OS & Highlight Download =====
(function () {
  const ua = navigator.userAgent.toLowerCase();
  const grid = document.getElementById('downloadGrid');
  if (!grid) return;

  let detected = null;
  if (ua.includes('win')) detected = 'windows';
  else if (ua.includes('mac')) detected = 'mac';
  else if (ua.includes('linux')) detected = 'linux';

  if (detected) {
    const card = grid.querySelector(`[data-platform="${detected}"]`);
    if (card) {
      card.classList.add('highlighted');
      const badge = card.querySelector('.download-badge');
      if (badge) badge.textContent += ' (Your OS)';
    }
  }
})();
