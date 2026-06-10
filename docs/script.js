// ===== Particles Canvas =====
(function () {
  var canvas = document.getElementById('particles');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var width, height;
  var particles = [];
  var PARTICLE_COUNT = 40;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  function Particle() {
    this.reset(true);
  }
  Particle.prototype.reset = function (initial) {
    this.x = Math.random() * width;
    this.y = initial ? Math.random() * height : height + 10;
    this.size = Math.random() * 1.5 + 0.5;
    this.speedY = -(Math.random() * 0.4 + 0.1);
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.6 + 0.1;
    this.life = Math.random() * 500 + 200;
    this.age = 0;
  };
  Particle.prototype.update = function () {
    this.y += this.speedY;
    this.x += this.speedX;
    this.age++;
    if (this.y < -10 || this.age > this.life) {
      this.reset(false);
    }
  };
  Particle.prototype.draw = function (ctx) {
    var alpha = this.opacity * (1 - this.age / this.life);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, ' + alpha + ')';
    ctx.fill();
    ctx.shadowBlur = this.size * 3;
    ctx.shadowColor = 'rgba(245, 158, 11, ' + (alpha * 0.5) + ')';
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  for (var i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw(ctx);
    }
    requestAnimationFrame(animate);
  }

  resize();
  animate();
  window.addEventListener('resize', resize);
})();

// ===== Scroll Reveal =====
(function () {
  var reveals = document.querySelectorAll('.reveal');
  var observer = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) {
        var delay = parseInt(entries[i].target.dataset.delay || '0', 10);
        (function (el) {
          setTimeout(function () {
            el.classList.add('visible');
          }, delay);
        })(entries[i].target);
        observer.unobserve(entries[i].target);
      }
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  for (var i = 0; i < reveals.length; i++) {
    observer.observe(reveals[i]);
  }
})();

// ===== Navigation Scroll =====
(function () {
  var nav = document.getElementById('nav');
  if (!nav) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }, { passive: true });
})();

// ===== Mobile Nav Toggle =====
(function () {
  var toggle = document.getElementById('navToggle');
  var links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    links.classList.toggle('open');
  });

  var anchors = links.querySelectorAll('a');
  for (var i = 0; i < anchors.length; i++) {
    anchors[i].addEventListener('click', function () {
      links.classList.remove('open');
    });
  }
})();

// ===== Language Toggle =====
(function () {
  var toggle = document.getElementById('langToggle');
  if (!toggle) return;

  var saved = localStorage.getItem('foundry-lang') || 'en';
  setLang(saved);

  toggle.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-lang') || 'en';
    var next = current === 'en' ? 'vi' : 'en';
    setLang(next);
    localStorage.setItem('foundry-lang', next);
  });

  function setLang(lang) {
    document.documentElement.setAttribute('data-lang', lang);

    var enOpt = toggle.querySelector('[data-lang="en"]');
    var viOpt = toggle.querySelector('[data-lang="vi"]');
    if (enOpt) enOpt.classList.toggle('active', lang === 'en');
    if (viOpt) viOpt.classList.toggle('active', lang === 'vi');

    var els = document.querySelectorAll('[data-lang-en]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var text = lang === 'en' ? el.getAttribute('data-lang-en') : el.getAttribute('data-lang-vi');
      if (text !== null) el.innerHTML = text;
    }

    animateHeroTitle();
  }
})();

// ===== Hero Title Word Animation =====
(function () {
  var accentWords = ['AI', 'Agents', 'Đồng', 'Hành'];

  function animateHeroTitle() {
    var title = document.querySelector('.hero-title');
    if (!title) return;

    var span = title.querySelector('span');
    var text = (span || title).textContent.trim();
    var words = text.split(/\s+/);

    var html = '';
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var delay = i * 55;
      var cls = accentWords.indexOf(w) !== -1 ? 'hword hword-a' : 'hword';
      html += '<span class="' + cls + '" style="animation-delay:' + delay + 'ms">' + w + '</span> ';
    }

    if (span) span.innerHTML = html;
    else title.innerHTML = html;
  }

  window.animateHeroTitle = animateHeroTitle;
  setTimeout(animateHeroTitle, 100);
})();

// ===== MCP Tab Switcher =====
(function () {
  var tabs = document.querySelectorAll('.mcp-client-tab');
  var code = document.getElementById('mcpCode');
  var lang = document.getElementById('mcpLang');
  var copyBtn = document.getElementById('mcpCopyBtn');
  if (!code || !lang) return;

  var configs = {
    opencode: {
      lang: 'opencode.json',
      text: '{\n  "mcp": {\n    "foundry": {\n      "type": "local",\n      "command": ["node", "/path/to/Foundry/apps/mcp-server/dist/server.js"],\n      "enabled": true\n    }\n  }\n}'
    },
    claude: {
      lang: 'settings.json (Claude Code)',
      text: '{\n  "mcpServers": {\n    "foundry": {\n      "command": "node",\n      "args": ["/path/to/Foundry/apps/mcp-server/dist/server.js"]\n    }\n  }\n}'
    },
    cursor: {
      lang: '.cursor/mcp.json',
      text: '{\n  "mcpServers": {\n    "foundry": {\n      "command": "node",\n      "args": ["/path/to/Foundry/apps/mcp-server/dist/server.js"]\n    }\n  }\n}'
    },
    copilot: {
      lang: '.copilot/mcp.json',
      text: '{\n  "servers": {\n    "foundry": {\n      "command": "node",\n      "args": ["/path/to/Foundry/apps/mcp-server/dist/server.js"]\n    }\n  }\n}'
    }
  };

  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
      this.classList.add('active');
      var key = this.dataset.tab;
      if (configs[key]) {
        code.textContent = configs[key].text;
        lang.textContent = configs[key].lang;
      }
    });
  }

  if (copyBtn) {
    var copySvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
    var checkSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';

    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(code.textContent || '').then(function () {
        copyBtn.innerHTML = checkSvg + ' Copied!';
        setTimeout(function () {
          var langText = document.documentElement.getAttribute('data-lang') === 'vi' ? 'Sao Chép' : 'Copy';
          copyBtn.innerHTML = copySvg + ' ' + langText;
        }, 2000);
      }).catch(function () {});
    });
  }
})();

// ===== Auto-detect OS & Highlight Download =====
(function () {
  var ua = navigator.userAgent.toLowerCase();
  var grid = document.getElementById('downloadGrid');
  if (!grid) return;

  var detected = null;
  if (ua.indexOf('win') !== -1) detected = 'windows';

  if (detected) {
    var card = grid.querySelector('[data-platform="' + detected + '"]');
    if (card && !card.classList.contains('disabled')) {
      card.classList.add('highlighted');
      var badge = card.querySelector('.download-badge');
      if (badge) badge.textContent += ' (Your OS)';
    }
  }
})();
