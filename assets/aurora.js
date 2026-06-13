(function() {
  const root = document.documentElement;
  const themeButtons = document.querySelectorAll('[data-theme-toggle]');

  function getStoredTheme() {
    try { return localStorage.getItem('aurora-theme'); } catch (e) { return null; }
  }

  function setStoredTheme(theme) {
    try { localStorage.setItem('aurora-theme', theme); } catch (e) {}
  }

  function syncThemeButtons() {
    const isLight = root.classList.contains('light');
    themeButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(isLight));
      button.setAttribute('aria-label', isLight ? 'Bytt til mørk modus' : 'Bytt til lys modus');
    });
  }

  const savedTheme = getStoredTheme();
  if (savedTheme === 'light') root.classList.add('light');
  if (savedTheme === 'dark') root.classList.remove('light');

  themeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const isLight = root.classList.toggle('light');
      setStoredTheme(isLight ? 'light' : 'dark');
      syncThemeButtons();
    });
  });
  syncThemeButtons();

  window.addEventListener('storage', event => {
    if (event.key !== 'aurora-theme') return;
    root.classList.toggle('light', event.newValue === 'light');
    syncThemeButtons();
  });

  const menuButton = document.querySelector('[data-menu-toggle]');
  const navLinks = document.querySelector('[data-nav-links]');
  if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
  }

  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-links] a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const page = href.split('#')[0] || 'index.html';
    if (page === currentPage) link.classList.add('is-active');
  });

  document.querySelectorAll('[data-count]').forEach(el => {
    const target = Number(el.dataset.count || 0);
    if (!target) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 36));
    const tick = () => {
      current = Math.min(target, current + step);
      el.textContent = String(current);
      if (current < target) requestAnimationFrame(tick);
    };
    tick();
  });

  function setupCanvas(canvas) {
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    const nodes = [];
    let width = 0;
    let height = 0;
    let pointer = { x: -9999, y: -9999 };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = canvas.width = Math.max(1, Math.floor(rect.width * devicePixelRatio));
      height = canvas.height = Math.max(1, Math.floor(rect.height * devicePixelRatio));
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      const count = Math.max(26, Math.floor(rect.width / 34));
      nodes.length = 0;
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.32,
          vy: (Math.random() - 0.5) * 0.32,
          r: Math.random() * 1.8 + 1.2,
          hue: [166, 211, 44, 12, 260][i % 5]
        });
      }
    }

    canvas.addEventListener('pointermove', event => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    });
    canvas.addEventListener('pointerleave', () => { pointer = { x: -9999, y: -9999 }; });

    function draw() {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > rect.width) node.vx *= -1;
        if (node.y < 0 || node.y > rect.height) node.vy *= -1;

        const pull = Math.hypot(node.x - pointer.x, node.y - pointer.y);
        if (pull < 150) {
          node.x += (node.x - pointer.x) * 0.002;
          node.y += (node.y - pointer.y) * 0.002;
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const distance = Math.hypot(node.x - other.x, node.y - other.y);
          if (distance < 132) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `hsla(${node.hue}, 80%, 62%, ${0.16 * (1 - distance / 132)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${node.hue}, 80%, 64%, 0.72)`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    resize();
    addEventListener('resize', resize);
    draw();
  }

  document.querySelectorAll('[data-network-canvas]').forEach(setupCanvas);

  const topology = document.querySelector('[data-topology]');
  if (topology) {
    const info = {
      drift: {
        title: 'Driftsvisning',
        body: 'Realisert lab med app01 i OPC-UA-Zone, app02 i NORØNNA-GW og ASA som sonegrense.',
        tags: ['VLAN 45', 'VLAN 70', 'ASA ACL']
      },
      opc: {
        title: 'OPC UA-conduit',
        body: 'NORØNNA initierer mot AURORA på TCP/46040. AURORA initierer egen sesjon tilbake på TCP/46041.',
        tags: ['TCP/46040', 'TCP/46041', 'UaWrapper']
      },
      seg: {
        title: 'Segmentering',
        body: 'Produksjon, IDMZ, OOB og IT/WAN er separert med VLAN og eksplisitte brannmurregler.',
        tags: ['IEC 62443', 'Purdue', 'implicit deny']
      },
      planned: {
        title: 'Planlagt kapasitet',
        body: 'FIELD, AP-INFRA og EWS er modellert i arkitekturen, men ikke fysisk verifisert i slutt-testen.',
        tags: ['VLAN 10', 'VLAN 20', 'VLAN 50']
      },
      app01: {
        mode: 'opc',
        title: '3p-hvl-app01',
        body: 'AURORA-noden eksponerer whiteliste-de tags via UaWrapper på opc.tcp://10.0.45.10:46040.',
        tags: ['10.0.45.10', 'VLAN 45', 'UaWrapper']
      },
      app02: {
        mode: 'opc',
        title: '3p-hvl-app02',
        body: 'NORØNNA-noden kjører Cogent DataHub og UaExpert og verifiserer mottak av OPC UA-data.',
        tags: ['10.0.70.11', 'VLAN 70', 'DataHub']
      },
      asa: {
        mode: 'seg',
        title: 'Cisco ASA 5506-X',
        body: 'Brannmuren håndhever soneskille og slipper kun definerte OPC UA- og administrasjonsflyter.',
        tags: ['G1/2', 'G1/3', 'G1/4']
      },
      idmz: {
        mode: 'seg',
        title: 'IDMZ',
        body: 'Jump Host og brokerfunksjoner ligger i overgangssonen mellom IT/WAN og OT-nettet.',
        tags: ['10.0.60.0/24', 'RDP', 'broker']
      },
      oob: {
        mode: 'seg',
        title: 'OOB-MGMT',
        body: 'Separat management-plane for ASA, ESXi, iDRAC og switch. Ikke produksjonstransit.',
        tags: ['VLAN 99', 'management', 'isolert']
      }
    };
    const title = topology.querySelector('[data-topology-title]');
    const body = topology.querySelector('[data-topology-body]');
    const tags = topology.querySelector('[data-topology-tags]');
    const buttons = Array.from(topology.querySelectorAll('[data-topology-mode]'));
    const hotspots = Array.from(topology.querySelectorAll('[data-node]'));

    function render(id) {
      const item = info[id] || info.drift;
      if (title) title.textContent = item.title;
      if (body) body.textContent = item.body;
      if (tags) {
        tags.textContent = '';
        item.tags.forEach(tag => {
          const chip = document.createElement('span');
          chip.className = 'tag teal';
          chip.textContent = tag;
          tags.appendChild(chip);
        });
      }
    }

    function setMode(mode) {
      topology.dataset.mode = mode;
      buttons.forEach(button => {
        const active = button.dataset.topologyMode === mode;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.dataset.topologyMode || 'drift';
        hotspots.forEach(node => node.classList.remove('is-active'));
        setMode(mode);
        render(mode);
      });
    });

    hotspots.forEach(node => {
      const id = node.dataset.node;
      const activate = () => {
        const item = info[id];
        if (!item) return;
        if (item.mode) setMode(item.mode);
        hotspots.forEach(n => n.classList.remove('is-active'));
        node.classList.add('is-active');
        render(id);
      };
      node.addEventListener('click', activate);
      node.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });
    setMode('drift');
    render('drift');
  }

  const filters = document.querySelectorAll('[data-test-filter]');
  if (filters.length) {
    const cards = document.querySelectorAll('[data-test-card]');
    const applyFilter = value => {
      filters.forEach(filter => {
        const active = filter.dataset.testFilter === value;
        filter.classList.toggle('is-active', active);
        filter.setAttribute('aria-pressed', String(active));
      });
      cards.forEach(card => {
        const visible = value === 'all' || card.dataset.testCard === value;
        card.classList.toggle('is-visible', visible);
      });
    };
    filters.forEach(filter => filter.addEventListener('click', () => applyFilter(filter.dataset.testFilter || 'all')));
    applyFilter('all');
  }

  const scenarioBoard = document.querySelector('[data-scenario-board]');
  if (scenarioBoard) {
    const copy = document.querySelector('[data-scenario-copy]');
    const tabs = document.querySelectorAll('[data-scenario]');
    const lines = scenarioBoard.querySelectorAll('[data-scenario-line]');
    const text = {
      normal: 'Normal drift holder OPC UA i en snever conduit mellom app01 og app02, mens administrasjon går via Jump Host og OOB holdes separat.',
      attack: 'Angrepsforsøk mot OT-servere og OOB tones røde fordi de ikke skal ha direkte vei gjennom ASA-reglene.',
      recovery: 'Gjenoppretting handler om sporbar konfigurasjon, isolerte managementflater og verifiserbare teststeg.'
    };
    function setScenario(name) {
      tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.scenario === name));
      lines.forEach(line => line.classList.toggle('is-hot', line.dataset.scenarioLine === name));
      if (copy) copy.textContent = text[name] || text.normal;
    }
    tabs.forEach(tab => tab.addEventListener('click', () => setScenario(tab.dataset.scenario || 'normal')));
    setScenario('normal');
  }

  const quiz = document.querySelector('[data-quiz]');
  if (quiz) {
    const questions = [
      {
        q: 'Hvilken port bruker NORØNNA-initiert OPC UA mot AURORA i sluttløsningen?',
        a: ['TCP/46040', 'TCP/4840', 'TCP/3389'],
        correct: 0,
        note: 'NORØNNA leser AURORA-tags via app01 på TCP/46040.'
      },
      {
        q: 'Hvor ligger 3p-hvl-app01 i den rettede topologien?',
        a: ['OPC-UA-Zone, VLAN 45', 'OT-SERVER, VLAN 40', 'IDMZ, VLAN 60'],
        correct: 0,
        note: 'app01 er flyttet ut av server-sonen og inn i dedikert OPC-UA-Zone.'
      },
      {
        q: 'Hva er hovedpoenget med OOB-MGMT?',
        a: ['Separat management-plane', 'Produksjonsdata til Historian', 'Åpen klienttilgang fra IT/WAN'],
        correct: 0,
        note: 'OOB skal ikke bære produksjons- eller OPC UA-transit.'
      }
    ];
    let index = 0;
    let score = 0;
    const qEl = quiz.querySelector('[data-quiz-question]');
    const optionsEl = quiz.querySelector('[data-quiz-options]');
    const noteEl = quiz.querySelector('[data-quiz-note]');
    const progressEl = quiz.querySelector('[data-quiz-progress]');
    const scoreEl = quiz.querySelector('[data-quiz-score]');

    function renderQuestion() {
      const item = questions[index];
      qEl.textContent = item.q;
      optionsEl.textContent = '';
      noteEl.textContent = '';
      progressEl.textContent = `${index + 1} / ${questions.length}`;
      item.a.forEach((answer, answerIndex) => {
        const button = document.createElement('button');
        button.className = 'quiz-option';
        button.type = 'button';
        button.textContent = answer;
        button.addEventListener('click', () => {
          const correct = answerIndex === item.correct;
          button.classList.add(correct ? 'is-correct' : 'is-wrong');
          if (correct) score += 1;
          noteEl.textContent = item.note;
          optionsEl.querySelectorAll('button').forEach(btn => { btn.disabled = true; });
          setTimeout(() => {
            index += 1;
            if (index >= questions.length) {
              qEl.textContent = 'Ferdig';
              optionsEl.textContent = '';
              progressEl.textContent = `${questions.length} / ${questions.length}`;
              noteEl.textContent = `Du fikk ${score} av ${questions.length}.`;
              scoreEl.textContent = `${score}/${questions.length}`;
            } else {
              renderQuestion();
            }
          }, 900);
        });
        optionsEl.appendChild(button);
      });
    }
    renderQuestion();
  }
})();
