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
            q: 'Hva er OT i en enkel forklaring?',
            a: ['Systemer som overvåker eller styrer fysiske prosesser', 'Kun vanlige kontor-PC-er og e-post', 'En type skylagring for bilder'],
            correct: 0,
            note: 'OT handler om teknologi som påvirker den fysiske verden, for eksempel produksjon, energi, vann eller transport.'
          },
          {
            q: 'Hvorfor er OT-sikkerhet viktig for folk som ikke jobber teknisk?',
            a: ['Fordi feil og angrep kan påvirke drift, sikkerhet og fysiske prosesser', 'Fordi det bare handler om raskere internett', 'Fordi det kun gjelder utviklere'],
            correct: 0,
            note: 'OT-sikkerhet handler ikke bare om data. Det kan også handle om trygg drift og konsekvenser ute i virkeligheten.'
          },
          {
            q: 'Hva bør du gjøre hvis du finner en ukjent USB-minnepinne på jobb?',
            a: ['Ikke koble den til, og meld fra til riktig kontaktpunkt', 'Teste den raskt på nærmeste PC', 'Gi den videre til noen andre uten å si noe'],
            correct: 0,
            note: 'Ukjente USB-enheter kan inneholde skadevare eller være laget for å lure brukere.'
          },
          {
            q: 'Hva er phishing?',
            a: ['Forsøk på å lure deg til å klikke, logge inn eller dele informasjon', 'En metode for å kjøle ned serverrom', 'En godkjent måte å dele passord på'],
            correct: 0,
            note: 'Phishing kan være starten på større hendelser, også i miljøer som støtter OT-drift.'
          },
          {
            q: 'Hvorfor er sterke passord og MFA viktig?',
            a: ['Det gjør det vanskeligere å misbruke kontoer', 'Det gjør maskiner raskere', 'Det erstatter behovet for all annen sikkerhet'],
            correct: 0,
            note: 'MFA gir et ekstra hinder dersom et passord blir gjettet, lekket eller stjålet.'
          },
          {
            q: 'Hva bør du gjøre hvis et system oppfører seg uvanlig?',
            a: ['Melde fra tidlig i stedet for å ignorere det', 'Skru av alt uten å si fra', 'Prøve tilfeldige innstillinger til det virker'],
            correct: 0,
            note: 'Tidlig varsling kan gjøre at små problemer stoppes før de blir store hendelser.'
          },
          {
            q: 'Hvorfor bør private dingser ikke kobles ukritisk til OT- eller driftsnett?',
            a: ['De kan introdusere ukjent risiko og skadevare', 'De gjør alltid nettverket sikrere', 'Det har ingen betydning hvor utstyret kobles til'],
            correct: 0,
            note: 'Ukjent utstyr kan bryte kontrollen på hva som finnes i miljøet.'
          },
          {
            q: 'Hva betyr nettverkssegmentering på et grunnleggende nivå?',
            a: ['Å dele nettverket i områder slik at ikke alt står åpent mot alt', 'Å koble alle systemer til samme trådløse nett', 'Å fjerne alle brannmurer for enklere drift'],
            correct: 0,
            note: 'Segmentering begrenser hvor langt et problem kan spre seg.'
          },
          {
            q: 'Hvorfor er backup viktig i OT-miljøer?',
            a: ['For å kunne komme tilbake i drift etter feil eller angrep', 'For å slippe å dokumentere systemene', 'For å gjøre passord unødvendig'],
            correct: 0,
            note: 'Backup er først verdifull når den faktisk kan brukes til gjenoppretting.'
          },
          {
            q: 'Hva betyr minste privilegium?',
            a: ['At brukere og systemer bare får tilgangen de trenger', 'At alle får administratorrettigheter for enkelhet', 'At passord deles i teamet'],
            correct: 0,
            note: 'Mindre tilgang betyr mindre skade hvis en konto eller maskin blir kompromittert.'
          },
          {
            q: 'Hva bør skje før en ekstern leverandør får fjernaksess?',
            a: ['Tilgangen bør være godkjent, tidsbegrenset og sporbar', 'Tilgangen bør deles på e-post til alle', 'Leverandøren bør få permanent full tilgang'],
            correct: 0,
            note: 'Leverandørtilgang er nyttig, men må styres fordi den kan bli en vei inn i kritiske miljøer.'
          },
          {
            q: 'Hvorfor er fysisk adgang en del av cybersikkerheten?',
            a: ['Fysisk tilgang kan gi mulighet til å koble til, endre eller ødelegge utstyr', 'Fysisk adgang har aldri noe med data å gjøre', 'Det gjelder bare vanlige kontorbygg'],
            correct: 0,
            note: 'I OT kan en kabel, port eller lokal skjerm være like viktig som en innlogging.'
          },
          {
            q: 'Hva er en trygg reaksjon hvis noen ber deg dele passord raskt?',
            a: ['Ikke del passord, og bruk godkjente rutiner for tilgang', 'Del passordet hvis personen virker travel', 'Skriv passordet på en lapp ved skjermen'],
            correct: 0,
            note: 'Passord skal være personlige. Deling gjør sporbarhet og ansvar uklart.'
          },
          {
            q: 'Hvorfor er det nyttig å vite hvilke systemer man har?',
            a: ['Man kan ikke beskytte eller oppdatere noe man ikke kjenner til', 'Det er bare nyttig for innkjøp', 'Det gjør sikkerhetstesting unødvendig'],
            correct: 0,
            note: 'Oversikt over utstyr, programvare og eiere er grunnmuren i god sikkerhet.'
          },
          {
            q: 'Hva betyr tilgjengelighet i OT?',
            a: ['At viktige systemer virker når driften trenger dem', 'At alle på internett kan nå systemet', 'At data alltid publiseres offentlig'],
            correct: 0,
            note: 'I OT kan nedetid gi store konsekvenser for produksjon, sikkerhet og økonomi.'
          },
          {
            q: 'Hvorfor bør endringer i OT planlegges?',
            a: ['Små endringer kan få store konsekvenser for drift og sikkerhet', 'Planlegging er bare nødvendig i kontornett', 'Det er alltid tryggest å endre direkte i produksjon'],
            correct: 0,
            note: 'Planlagte endringer gjør det lettere å teste, rulle tilbake og forstå hva som skjedde.'
          },
          {
            q: 'Hva er et godt første steg hvis du er usikker på en sikkerhetssituasjon?',
            a: ['Spørre eller melde fra gjennom riktig kanal', 'Gjette og håpe det går bra', 'Legge ut detaljer offentlig for å få raske svar'],
            correct: 0,
            note: 'Awareness handler også om å vite når man skal stoppe opp og spørre.'
          },
          {
            q: 'Hvorfor bør man låse skjermen når man går fra arbeidsplassen?',
            a: ['For å hindre at andre bruker kontoen din', 'For å spare strøm på nettverket', 'For å gjøre maskinen vanskeligere å oppdatere'],
            correct: 0,
            note: 'En ulåst skjerm kan gi tilgang til systemer du har ansvar for.'
          },
          {
            q: 'Hva er en vanlig grunn til å holde IT og OT delvis adskilt?',
            a: ['OT har andre krav til stabilitet, sikkerhet og konsekvens', 'OT trenger aldri nettverk', 'IT og OT bør alltid ha samme regler uten vurdering'],
            correct: 0,
            note: 'OT må ofte beskyttes på en måte som tar hensyn til drift og fysiske prosesser.'
          },
          {
            q: 'Hva bør være målet med sikkerhetsopplæring?',
            a: ['Å gjøre det lettere å oppdage og rapportere risiko i hverdagen', 'Å legge all skyld på enkeltpersoner', 'Å erstatte tekniske sikkerhetstiltak'],
            correct: 0,
            note: 'God awareness gjør folk tryggere på hva de skal gjøre, ikke bare hva de ikke skal gjøre.'
          }
        ]
      },
      technical: {
        size: 10,
        questions: [
          {
            q: 'Hva betyr defense in depth i OT-sikkerhet?',
            a: ['Flere lag med tiltak skal begrense skade hvis ett lag svikter', 'Ett sterkt passord erstatter alle andre tiltak', 'Alle systemer plasseres i samme nett for enklere drift'],
            correct: 0,
            note: 'Defense in depth kombinerer mennesker, prosesser og teknologi i flere beskyttende lag.'
          },
          {
            q: 'Hvorfor prioriteres ofte tilgjengelighet og sikker drift høyt i OT?',
            a: ['Fordi stopp eller feil kan påvirke fysiske prosesser og HMS', 'Fordi konfidensialitet aldri betyr noe i OT', 'Fordi OT-systemer alltid kan restartes uten risiko'],
            correct: 0,
            note: 'OT handler ofte om kontinuitet og trygg kontroll av fysiske prosesser.'
          },
          {
            q: 'Hva er poenget med soner og conduits?',
            a: ['Å gruppere systemer etter funksjon/risiko og styre flyt mellom dem', 'Å gjøre all kommunikasjon fri mellom alle systemer', 'Å fjerne behovet for tilgangsstyring'],
            correct: 0,
            note: 'Soner og conduits gjør sikkerhetsmodellen tydeligere og mer testbar.'
          },
          {
            q: 'Hva er en god praksis for fjernaksess til OT?',
            a: ['Godkjenning, MFA, tidsbegrensing, logging og kontrollert mellomledd', 'Permanent delt administratorbruker', 'Direkte tilgang fra internett til alle systemer'],
            correct: 0,
            note: 'Fjernaksess er en vanlig angrepsvei og bør være stramt kontrollert.'
          },
          {
            q: 'Hvorfor kan patching i OT kreve mer planlegging enn i vanlige IT-miljøer?',
            a: ['Fordi kompatibilitet, oppetid og prosessrisiko må vurderes først', 'Fordi OT-systemer aldri trenger sikkerhetsoppdateringer', 'Fordi patching alltid bør gjøres uten testing'],
            correct: 0,
            note: 'Når patching må vente, bør risikoen reduseres med kompenserende tiltak.'
          },
          {
            q: 'Hva er kompenserende tiltak?',
            a: ['Andre kontroller som reduserer risiko når idealtiltak ikke kan brukes med en gang', 'Å ignorere risiko fordi systemet er gammelt', 'Å fjerne all logging for å spare ressurser'],
            correct: 0,
            note: 'Eksempler kan være segmentering, strengere tilgang, overvåking eller midlertidige prosedyrer.'
          },
          {
            q: 'Hva er verdien av passiv nettverksovervåking i OT?',
            a: ['Man kan oppdage avvik uten å forstyrre sårbare systemer unødvendig', 'Den endrer automatisk alle kontrollere', 'Den gjør backup overflødig'],
            correct: 0,
            note: 'Passiv overvåking passer ofte bedre enn aggressive skann i miljøer der stabilitet er kritisk.'
          },
          {
            q: 'Hva bør en hendelsesrespons i OT alltid ta hensyn til?',
            a: ['Sikker drift og fysisk konsekvens før man gjør tekniske tiltak', 'Å slette alle logger så raskt som mulig', 'Å koble fra tilfeldige systemer uten koordinering'],
            correct: 0,
            note: 'I OT må respons koordineres med drift, sikkerhet og de som kjenner prosessen.'
          },
          {
            q: 'Hva kjennetegner en god backupstrategi for OT?',
            a: ['Testet gjenoppretting, beskyttede kopier og dokumentert ansvar', 'Kun én kopi på samme maskin', 'Backup som aldri prøves før en krise'],
            correct: 0,
            note: 'Backup er en beredskap, ikke bare en fil som ligger et sted.'
          },
          {
            q: 'Hvorfor er logging og sporbarhet viktig?',
            a: ['Det gjør det mulig å oppdage, forstå og dokumentere hendelser', 'Det erstatter behovet for tilgangskontroll', 'Det gjør systemene automatisk immune'],
            correct: 0,
            note: 'Uten sporbarhet blir det vanskelig å vite hva som skjedde, når det skjedde og hvem som var involvert.'
          },
          {
            q: 'Hva er applikasjonskontroll eller allowlisting?',
            a: ['Bare godkjente programmer får kjøre', 'Alle nedlastede programmer får kjøre automatisk', 'Programmer bytter passord for brukeren'],
            correct: 0,
            note: 'Allowlisting kan være nyttig på stabile OT-maskiner med kjent funksjon.'
          },
          {
            q: 'Hva betyr hardening?',
            a: ['Å redusere angrepsflate ved å fjerne eller sikre unødvendige funksjoner', 'Å gjøre passord kortere', 'Å åpne flere tjenester for enkel feilsøking'],
            correct: 0,
            note: 'Hardening kan handle om tjenester, kontoer, standardpassord, konfigurasjon og tilgang.'
          },
          {
            q: 'Hvorfor er standardpassord spesielt farlig i OT?',
            a: ['De er ofte kjent, gjenbrukt og kan gi rask tilgang til kritisk utstyr', 'De er alltid sterkere enn egne passord', 'De blokkerer all fjernaksess automatisk'],
            correct: 0,
            note: 'Standardpassord bør fjernes eller endres gjennom kontrollerte rutiner.'
          },
          {
            q: 'Hva er et godt tegn på mulig avvik i et OT-nett?',
            a: ['Ukjent utstyr eller nye uventede forbindelser', 'At alle systemer gjør akkurat det de pleier', 'At dokumentasjonen stemmer med virkeligheten'],
            correct: 0,
            note: 'Avvik fra normaltilstand er ofte verdt å undersøke, særlig i stabile OT-miljøer.'
          },
          {
            q: 'Hvorfor bør leverandørtilgang revideres jevnlig?',
            a: ['Gamle eller unødvendige tilganger kan bli stående som risiko', 'Leverandører trenger alltid permanent tilgang', 'Revisjon gjør logging unødvendig'],
            correct: 0,
            note: 'Tilganger bør følge behov, ansvar og tidsrom, ikke bare historikk.'
          },
          {
            q: 'Hva er en tabletop-øvelse?',
            a: ['En gjennomgang av et tenkt scenario for å øve roller og beslutninger', 'En fysisk test av skrivebordets styrke', 'En måte å slette gamle hendelsesplaner på'],
            correct: 0,
            note: 'Øvelser gjør det lettere å handle rolig når noe faktisk skjer.'
          },
          {
            q: 'Hvorfor er dokumentasjon en sikkerhetskontroll?',
            a: ['Den gjør det mulig å forstå systemet raskt under drift og hendelser', 'Den erstatter tekniske barrierer fullstendig', 'Den bør bare finnes i hodet til én person'],
            correct: 0,
            note: 'God dokumentasjon reduserer feil, misforståelser og avhengighet av enkeltpersoner.'
          },
          {
            q: 'Hva er risikoen med gamle OT-protokoller?',
            a: ['De kan mangle moderne autentisering, kryptering eller integritetskontroll', 'De er alltid sikrere enn nye protokoller', 'De kan ikke observeres i nettverkstrafikk'],
            correct: 0,
            note: 'Eldre protokoller kan fortsatt være nødvendige, men bør beskyttes med arkitektur og kontroller.'
          },
          {
            q: 'Hva er egress-kontroll?',
            a: ['Å styre hvilken trafikk som får gå ut fra et område eller system', 'Å gi alle systemer fri vei til internett', 'Å slå av all overvåking'],
            correct: 0,
            note: 'Utgående trafikk kan være like viktig å kontrollere som inngående trafikk.'
          },
          {
            q: 'Hvorfor bør kritiske kontoer gjennomgås jevnlig?',
            a: ['For å fjerne gamle rettigheter og oppdage uheldige privilegier', 'For å gjøre alle kontoer til administratorer', 'For å slippe MFA'],
            correct: 0,
            note: 'Tilgang som var riktig før, kan bli feil når roller, systemer eller leverandører endres.'
          },
          {
            q: 'Hva er en sikker baseline?',
            a: ['En kjent, dokumentert og godkjent standardkonfigurasjon', 'Et tilfeldig skjermbilde av systemet', 'En liste over passord som alle kan bruke'],
            correct: 0,
            note: 'Baseline gjør det lettere å se avvik og bygge nye systemer likt.'
          },
          {
            q: 'Hva bør man gjøre før man kobler inn en ny laptop i et OT-miljø?',
            a: ['Sikre at den er godkjent, oppdatert og håndtert etter rutine', 'Koble den rett inn for å spare tid', 'Bruke privat maskin hvis den er raskere'],
            correct: 0,
            note: 'Nye endepunkter kan introdusere sårbarheter, skadevare eller uønsket trafikk.'
          },
          {
            q: 'Hvorfor er rollefordeling viktig ved en hendelse?',
            a: ['Folk vet hvem som tar beslutninger, hvem som kommuniserer og hvem som gjør tekniske tiltak', 'Alle gjør alt samtidig uten koordinering', 'Ingen trenger å loggføre hva som skjer'],
            correct: 0,
            note: 'Klare roller reduserer kaos og feil under tidspress.'
          },
          {
            q: 'Hva er forskjellen på safety og security i OT?',
            a: ['Safety handler om å unngå skade; security handler om å hindre uautorisert påvirkning', 'De betyr alltid nøyaktig det samme', 'Security gjelder bare kontor-PC-er'],
            correct: 0,
            note: 'I OT henger safety og security tett sammen fordi cyberhendelser kan påvirke fysisk sikkerhet.'
          },
          {
            q: 'Hvorfor bør sikkerhet bygges inn i rutiner, ikke bare teknologi?',
            a: ['Mennesker og beslutninger avgjør ofte om tiltakene faktisk virker', 'Teknologi løser alltid alt alene', 'Rutiner gjør tekniske tiltak unødvendige'],
            correct: 0,
            note: 'Awareness, ansvar og gode arbeidsmåter er en sentral del av OT-sikkerhet.'
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
        ? 'Sterkt OT-sikkerhetsblikk.'
        : ratio >= 0.5
          ? 'God start. Ta gjerne en ny runde og legg merke til hvorfor svarene betyr noe i drift.'
          : 'Ta en rolig awareness-runde med fokus på USB, passord, fjernaksess, backup og rapportering.';

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
