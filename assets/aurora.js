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
    const questionBanks = {
      short: {
        size: 5,
        questions: [
          {
            q: 'Hva er hovedideen bak nettverkssegmenteringen i AURORA?',
            a: ['Å dele systemet i soner med kontrollerte overganger', 'Å gjøre alle systemer tilgjengelige fra IT/WAN', 'Å samle all trafikk i ett enklere nett'],
            correct: 0,
            note: 'Segmenteringen gjør at hver sone får tydelig funksjon, risiko og eksplisitte tillatte flyter.'
          },
          {
            q: 'Hva simulerer AURORA og NORØNNA i prosjektet?',
            a: ['To separate sites som utveksler prosessdata', 'To like servere i samme subnett', 'En ren skyløsning uten OT-nett'],
            correct: 0,
            note: 'AURORA representerer landanlegg, mens NORØNNA representerer offshore-site i laben.'
          },
          {
            q: 'Hva er OPC UA brukt til i løsningen?',
            a: ['Standardisert utveksling av industridata', 'Vanlig webdesign for nettsiden', 'Backup av GitHub-repoet'],
            correct: 0,
            note: 'OPC UA brukes som kontrollert industriprotokoll mellom AURORA og NORØNNA.'
          },
          {
            q: 'Hvorfor har prosjektet en egen OOB-MGMT-sone?',
            a: ['For å holde administrasjon adskilt fra produksjonstrafikk', 'For å sende all OPC UA-trafikk raskere', 'For å erstatte brannmuren'],
            correct: 0,
            note: 'OOB-MGMT er et separat management-plane for blant annet ASA, ESXi, iDRAC og switch.'
          },
          {
            q: 'Hva er rollen til Cisco ASA i topologien?',
            a: ['Å håndheve sonegrenser og ACL-regler', 'Å lagre historiske prosessdata', 'Å kjøre UaWrapper-programvaren'],
            correct: 0,
            note: 'ASA fungerer som brannmur og slipper kun trafikk som er definert i reglene.'
          },
          {
            q: 'Hva betyr det at noen soner er planlagt, men ikke fysisk sluttverifisert?',
            a: ['De er med i designet, men ble ikke fullt bygget og testet i laben', 'De er feil og skal slettes', 'De er hemmelige produksjonssoner'],
            correct: 0,
            note: 'FIELD, AP-INFRA og EWS er viktige for designbildet, men markeres tydelig som ikke fysisk sluttverifisert.'
          },
          {
            q: 'Hva er en Jump Host i denne arkitekturen?',
            a: ['Et kontrollert mellomledd for administrativ tilgang', 'En ekstra OPC UA-server i feltsonen', 'En åpen snarvei fra IT til alle OT-servere'],
            correct: 0,
            note: 'Jump Host ligger i IDMZ og gir en mer kontrollert administrasjonsvei enn direkte OT-tilgang.'
          },
          {
            q: 'Hvorfor brukes tag-whitelisting i OPC UA-delen?',
            a: ['For å eksponere bare nødvendige datapunkter', 'For å gjøre alle OPC DA-tags offentlige', 'For å slå av autentisering'],
            correct: 0,
            note: 'Whitelisting reduserer eksponert funksjonalitet og støtter prinsippet om minst mulig tilgang.'
          },
          {
            q: 'Hva betyr implicit deny som sikkerhetsprinsipp?',
            a: ['Trafikk blokkeres som standard hvis den ikke er eksplisitt tillatt', 'All trafikk er tillatt til noen sier stopp', 'Bare trådløs trafikk blokkeres'],
            correct: 0,
            note: 'Implicit deny gjør at nye flyter må begrunnes og åpnes aktivt.'
          },
          {
            q: 'Hva viser testdelen av nettsiden?',
            a: ['Hva som ble bygget, blokkert og verifisert', 'Kun lenker til eksterne nyheter', 'En tilfeldig liste uten kobling til arkitekturen'],
            correct: 0,
            note: 'Testoversikten knytter arkitekturen til konkrete verifikasjoner og avgrensninger.'
          },
          {
            q: 'Hvorfor er app01 og app02 plassert i ulike soner?',
            a: ['For å simulere kontrollert dataflyt mellom to sites', 'For å slippe brannmurregler helt', 'For at begge skal dele samme IP-adresse'],
            correct: 0,
            note: 'app01 ligger i AURORA sin OPC-UA-Zone, mens app02 ligger i NORØNNA-GW.'
          },
          {
            q: 'Hva er poenget med defense in depth i et OT-nett?',
            a: ['Flere lag skal begrense konsekvensen av feil eller angrep', 'Ett sterkt passord erstatter segmentering', 'Alle systemer settes på internett for oversikt'],
            correct: 0,
            note: 'Flere kontroller gir mindre skadeflate hvis én mekanisme svikter.'
          }
        ]
      },
      technical: {
        size: 10,
        questions: [
          {
            q: 'Hvilken port bruker NORØNNA-initiert OPC UA mot AURORA i sluttløsningen?',
            a: ['TCP/46040', 'TCP/4840', 'TCP/3389'],
            correct: 0,
            note: 'NORØNNA leser AURORA-tags via app01 på TCP/46040.'
          },
          {
            q: 'Hvilken port brukes for AURORA-initiert retning tilbake mot NORØNNA?',
            a: ['TCP/46041', 'TCP/443', 'TCP/8530'],
            correct: 0,
            note: 'Returretningen er modellert som egen tillatt sesjon på TCP/46041.'
          },
          {
            q: 'Hvor ligger 3p-hvl-app01 i den rettede topologien?',
            a: ['OPC-UA-Zone, VLAN 45, 10.0.45.10', 'OT-SERVER, VLAN 40, 10.0.40.50', 'IDMZ, VLAN 60, 10.0.60.2'],
            correct: 0,
            note: 'app01 er flyttet ut av server-sonen og inn i dedikert OPC-UA-Zone.'
          },
          {
            q: 'Hvor ligger 3p-hvl-app02?',
            a: ['NORØNNA-GW, VLAN 70, 10.0.70.11', 'FIELD, VLAN 10, 10.0.10.11', 'OOB-MGMT, VLAN 99, 10.0.99.11'],
            correct: 0,
            note: 'app02 representerer NORØNNA-siden og kjører Cogent DataHub / UaExpert.'
          },
          {
            q: 'Hvilket VLAN er OOB-MGMT?',
            a: ['VLAN 99', 'VLAN 60', 'VLAN 45'],
            correct: 0,
            note: 'OOB-MGMT er et separat management-plane på VLAN 99.'
          },
          {
            q: 'Hvilket subnett beskriver IDMZ-sonen?',
            a: ['10.0.60.0/24', '10.0.45.0/24', '10.0.99.0/24'],
            correct: 0,
            note: 'IDMZ ligger på VLAN 60 og brukes til Jump Host og brokerfunksjoner.'
          },
          {
            q: 'Hvilken administrativ flyt fra IT/WAN er tillatt i designet?',
            a: ['RDP/3389 til Jump Host i IDMZ', 'Direkte SMB til OT-SERVER', 'OPC UA direkte til FIELD'],
            correct: 0,
            note: 'IT/WAN skal inn via Jump Host, ikke direkte til interne OT-soner.'
          },
          {
            q: 'Hvilke tjenester hører hjemme i OT-SERVER-sonen?',
            a: ['DC/RADIUS, AD-MGMT, WSUS og Historian', 'Kun app02 og UaExpert', 'Kun iDRAC og ESXi-management'],
            correct: 0,
            note: 'OT-SERVER er støttesonen for domenetjenester, patching og historikk.'
          },
          {
            q: 'Hva betyr stateful retur i ASA-konteksten?',
            a: ['Svartrafikk til en tillatt sesjon spores og kan returnere', 'Brannmuren lagrer full prosesshistorikk', 'Returtrafikk må alltid åpnes med alle porter'],
            correct: 0,
            note: 'Stateful inspeksjon gjør at svar på tillatte forbindelser kan håndteres uten å åpne alt.'
          },
          {
            q: 'Hva er konsekvensen av implicit deny på ASA-reglene?',
            a: ['Udefinert trafikk stoppes av standardregelen', 'Alle interne VLAN får automatisk full tilgang', 'Bare OPC UA-trafikk stoppes'],
            correct: 0,
            note: 'Kun eksplisitte permit-regler skal slippe trafikk gjennom sonegrensen.'
          },
          {
            q: 'Hvorfor ligger app01 i OPC-UA-Zone i stedet for OT-SERVER?',
            a: ['For å gi OPC UA-conduiten egen sone og egne ACL-er', 'For å gjøre den del av OOB-MGMT', 'For å fjerne behovet for VLAN'],
            correct: 0,
            note: 'Egen sone gjør transittfunksjonen tydeligere og enklere å kontrollere.'
          },
          {
            q: 'Hva skal OOB-MGMT ikke brukes til?',
            a: ['Produksjons- eller OPC UA-transit', 'Management av ASA og switch', 'Tilgang til ESXi/iDRAC for drift'],
            correct: 0,
            note: 'OOB skal støtte administrasjon, ikke bli en alternativ produksjonsvei.'
          },
          {
            q: 'Hvilke soner er modellert som planlagt kapasitet, men ikke fysisk sluttverifisert?',
            a: ['FIELD, AP-INFRA og EWS', 'OPC-UA-Zone og NORØNNA-GW', 'OOB-MGMT og ASA'],
            correct: 0,
            note: 'Disse sonene er beholdt i arkitekturen, men merket som planlagt / ikke fullt sluttverifisert.'
          },
          {
            q: 'Hva er hensikten med tag-whitelisting i UaWrapper-oppsettet?',
            a: ['Å publisere kun relevante OPC DA-tags som OPC UA', 'Å åpne alle tags for enklere debugging', 'Å flytte alle tags til OOB-MGMT'],
            correct: 0,
            note: 'Tag-whitelisting begrenser eksponeringen fra OPC DA-kilden.'
          },
          {
            q: 'Hvilken ASA-tilkobling brukes som trunk for AURORA-VLAN-ene i topologien?',
            a: ['G1/2 trunk', 'G1/3 OOB', 'G1/4.70 NORØNNA'],
            correct: 0,
            note: 'AURORA-siden er vist med ASA G1/2 som trunk for VLAN 10/20/40/45/50/60.'
          },
          {
            q: 'Hvilken ASA-tilkobling er knyttet til NORØNNA-siden?',
            a: ['G1/4.70', 'G1/2 trunk', 'G1/3 OOB'],
            correct: 0,
            note: 'NORØNNA-GW er vist som ekstern site-grense på ASA G1/4.70.'
          },
          {
            q: 'Hvilken ASA-tilkobling er dedikert til OOB-MGMT?',
            a: ['G1/3', 'G1/4.70', 'G1/2 trunk'],
            correct: 0,
            note: 'OOB-MGMT er knyttet til en egen dedikert ASA-port.'
          },
          {
            q: 'Hvorfor er de to OPC UA-retningene skilt med egne porter?',
            a: ['For å beskrive to eksplisitte sesjonsretninger mellom sitene', 'For å omgå ACL-ene på ASA', 'For å blande OOB og produksjonstrafikk'],
            correct: 0,
            note: 'Portene 46040 og 46041 gjør retningene tydelige i brannmurregler og tester.'
          }
        ]
      }
    };
    let index = 0;
    let score = 0;
    let activeMode = 'short';
    let questions = [];
    const qEl = quiz.querySelector('[data-quiz-question]');
    const optionsEl = quiz.querySelector('[data-quiz-options]');
    const noteEl = quiz.querySelector('[data-quiz-note]');
    const progressEl = quiz.querySelector('[data-quiz-progress]');
    const scoreEl = quiz.querySelector('[data-quiz-score]');
    const modeButtons = quiz.querySelectorAll('[data-quiz-mode]');
    const restartButton = quiz.querySelector('[data-quiz-restart]');

    function shuffle(items) {
      const shuffled = [...items];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    function prepareQuestion(item) {
      const answers = item.a.map((text, answerIndex) => ({
        text,
        correct: answerIndex === item.correct
      }));
      return { ...item, answers: shuffle(answers) };
    }

    function syncModeButtons() {
      modeButtons.forEach(button => {
        const active = button.dataset.quizMode === activeMode;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    function renderResult() {
      const total = questions.length;
      const ratio = score / total;
      const feedback = ratio >= 0.8
        ? 'Solid kontroll på prosjektet.'
        : ratio >= 0.5
          ? 'God start, men se gjerne topologien én gang til.'
          : 'Ta en rolig runde gjennom arkitektur- og topologisiden, så sitter dette bedre.';

      qEl.textContent = 'Ferdig';
      optionsEl.textContent = '';
      progressEl.textContent = `${total} / ${total}`;
      scoreEl.textContent = `${score}/${total}`;
      noteEl.textContent = `Du fikk ${score} av ${total}. ${feedback}`;
    }

    function renderQuestion() {
      const item = questions[index];
      qEl.textContent = item.q;
      optionsEl.textContent = '';
      noteEl.textContent = '';
      progressEl.textContent = `${index + 1} / ${questions.length}`;
      scoreEl.textContent = `${score}/${questions.length}`;
      item.answers.forEach(answer => {
        const button = document.createElement('button');
        button.className = 'quiz-option';
        button.type = 'button';
        button.textContent = answer.text;
        button.dataset.correct = String(answer.correct);
        button.addEventListener('click', () => {
          const correct = answer.correct;
          if (correct) score += 1;
          scoreEl.textContent = `${score}/${questions.length}`;
          noteEl.textContent = item.note;
          optionsEl.querySelectorAll('button').forEach(btn => {
            const isCorrectAnswer = btn.dataset.correct === 'true';
            btn.classList.toggle('is-correct', isCorrectAnswer);
            btn.classList.toggle('is-wrong', btn === button && !isCorrectAnswer);
            btn.disabled = true;
          });
          setTimeout(() => {
            index += 1;
            if (index >= questions.length) {
              renderResult();
            } else {
              renderQuestion();
            }
          }, 1100);
        });
        optionsEl.appendChild(button);
      });
    }

    function startQuiz(mode) {
      activeMode = questionBanks[mode] ? mode : 'short';
      const bank = questionBanks[activeMode];
      questions = shuffle(bank.questions).slice(0, bank.size).map(prepareQuestion);
      index = 0;
      score = 0;
      syncModeButtons();
      renderQuestion();
    }

    modeButtons.forEach(button => {
      button.addEventListener('click', () => startQuiz(button.dataset.quizMode || 'short'));
    });
    if (restartButton) {
      restartButton.addEventListener('click', () => startQuiz(activeMode));
    }
    startQuiz(activeMode);
  }
})();
