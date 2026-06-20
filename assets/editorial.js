(function () {
  const root = document.documentElement;
  const menuButton = document.querySelector('[data-menu-toggle]');
  const navLinks = document.querySelector('[data-nav-links]');
  const themeButtons = document.querySelectorAll('[data-theme-toggle]');

  function readTheme() {
    try { return localStorage.getItem('aurora-theme'); } catch (error) { return null; }
  }

  function writeTheme(value) {
    try { localStorage.setItem('aurora-theme', value); } catch (error) {}
  }

  function setTheme(value) {
    const next = value === 'dark' ? 'dark' : 'light';
    root.dataset.theme = next;
    themeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(next === 'dark'));
      button.setAttribute('aria-label', next === 'dark' ? 'Bytt til lys modus' : 'Bytt til mørk modus');
      button.textContent = next === 'dark' ? '☼' : '◐';
    });
  }

  setTheme(readTheme() || 'light');

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(next);
      writeTheme(next);
    });
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'aurora-theme') setTheme(event.newValue || 'light');
  });

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
  }

  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-links] a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const page = href.split('#')[0] || 'index.html';
    if (page === currentPage) link.classList.add('is-active');
  });

  document.querySelectorAll('button[data-arch-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const shell = button.closest('[data-architecture]');
      if (!shell) return;
      const mode = button.dataset.archMode || 'normal';
      shell.dataset.archMode = mode;
      shell.querySelectorAll('button[data-arch-mode]').forEach((item) => {
        const active = item.dataset.archMode === mode;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      const caption = shell.querySelector('[data-arch-caption]');
      if (caption) caption.textContent = {
        normal: 'Normal dataflyt: OPC UA passerer gjennom ASA som eksplisitt conduit, mens Jump Host gir kontrollert administrativ vei.',
        attack: 'Blokkerte angrep: direkte forsøk mot interne soner stopper ved implicit deny og skal logges for sporbarhet.',
        opc: 'OPC UA-detalj: kun TCP/46040 og TCP/46041 er ment å krysse site-grensen mellom AURORA og NORØNNA.'
      }[mode] || '';
    });
  });

  document.querySelectorAll('button[data-topology-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const shell = button.closest('[data-topology]');
      if (!shell) return;
      const mode = button.dataset.topologyMode || 'drift';
      shell.dataset.topologyMode = mode;
      shell.querySelectorAll('button[data-topology-mode]').forEach((item) => {
        const active = item.dataset.topologyMode === mode;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      const title = shell.querySelector('[data-topology-title]');
      const body = shell.querySelector('[data-topology-body]');
      const copy = {
        drift: ['Driftsvisning', 'Realisert dual-site-lab med ASA som sonegrense, app01 i OPC-UA-Zone og app02 i NORØNNA-GW.'],
        opc: ['OPC UA-conduit', 'Fremhev de to tillatte OPC UA-retningene mellom AURORA og NORØNNA. Alt annet skal være stengt.'],
        seg: ['Segmentering', 'Fokuser på ASA, VLAN-grenser, IDMZ, OOB-MGMT og implicit deny som normaltilstand.'],
        planned: ['Planlagte soner', 'FIELD, AP-INFRA, EWS og IMS-utvidelse er del av arkitekturen, men markeres tydelig som planlagt eller ikke sluttverifisert.']
      }[mode];
      if (title && copy) title.textContent = copy[0];
      if (body && copy) body.textContent = copy[1];
    });
  });

  document.querySelectorAll('[data-test-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.testFilter || 'all';
      const section = button.closest('[data-tests]');
      if (!section) return;
      section.querySelectorAll('[data-test-filter]').forEach((item) => {
        const active = item.dataset.testFilter === value;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      section.querySelectorAll('[data-test-card]').forEach((card) => {
        card.classList.toggle('is-visible', value === 'all' || card.dataset.testCard === value);
      });
    });
  });

  document.querySelectorAll('[data-tests]').forEach((section) => {
    const first = section.querySelector('[data-test-filter="all"]') || section.querySelector('[data-test-filter]');
    if (first) first.click();
  });

  const quiz = document.querySelector('[data-quiz]');
  if (!quiz) return;

  const questionBanks = {
    short: {
      size: 6,
      label: 'Kort awareness',
      questions: [
        {
          q: 'Hva er OT i en enkel forklaring?',
          a: ['Systemer som overvåker eller styrer fysiske prosesser', 'Vanlige kontorverktøy som e-post og regneark', 'En skylagringstjeneste for bilder'],
          correct: 0,
          note: 'OT påvirker den fysiske verden: produksjon, energi, vann, transport og andre driftsprosesser.'
        },
        {
          q: 'Hvorfor angår OT-sikkerhet også folk uten teknisk bakgrunn?',
          a: ['Fordi feil og angrep kan påvirke drift, sikkerhet og mennesker', 'Fordi det bare handler om raskere internett', 'Fordi det kun er relevant for programmerere'],
          correct: 0,
          note: 'Awareness handler om å oppdage risiko tidlig og vite når man skal stoppe opp og melde fra.'
        },
        {
          q: 'Hva bør du gjøre med en ukjent USB-minnepinne du finner på jobb?',
          a: ['Ikke koble den til, og meld fra til riktig kontaktpunkt', 'Teste den raskt på nærmeste PC', 'Gi den videre uten å si noe'],
          correct: 0,
          note: 'Ukjente USB-enheter kan være laget for å lure brukere eller introdusere skadevare.'
        },
        {
          q: 'Hva er phishing?',
          a: ['Forsøk på å lure deg til å klikke, logge inn eller dele informasjon', 'En trygg metode for å dele passord', 'En måte å kjøle ned serverrom på'],
          correct: 0,
          note: 'Phishing kan være første steg i større hendelser, også i organisasjoner som drifter OT-miljøer.'
        },
        {
          q: 'Hva betyr minste privilegium?',
          a: ['At brukere og systemer bare får tilgangen de faktisk trenger', 'At alle får administratorrettigheter for enkelhet', 'At passord deles i teamet'],
          correct: 0,
          note: 'Mindre tilgang gir mindre skade hvis en konto eller maskin blir kompromittert.'
        },
        {
          q: 'Hvorfor bør private dingser ikke kobles ukritisk til driftsnett?',
          a: ['De kan introdusere ukjent risiko, skadevare eller feil trafikk', 'De gjør alltid nettverket sikrere', 'Det har aldri betydning hva som kobles til'],
          correct: 0,
          note: 'Kontroll på utstyr og tilkoblinger er en grunnleggende del av OT-sikkerhet.'
        },
        {
          q: 'Hva bør du gjøre hvis et system oppfører seg uvanlig?',
          a: ['Melde fra tidlig gjennom riktig kanal', 'Ignorere det hvis systemet fortsatt virker', 'Prøve tilfeldige innstillinger til det går over'],
          correct: 0,
          note: 'Tidlig varsling kan gjøre at små avvik stoppes før de blir store hendelser.'
        },
        {
          q: 'Hvorfor er backup viktig?',
          a: ['For å kunne komme tilbake i drift etter feil eller angrep', 'For å slippe å dokumentere systemer', 'For å gjøre passord unødvendig'],
          correct: 0,
          note: 'Backup er først nyttig når gjenoppretting faktisk er testet og ansvar er tydelig.'
        },
        {
          q: 'Hva er en trygg reaksjon hvis noen ber deg dele passord raskt?',
          a: ['Ikke del passord; bruk godkjente rutiner for tilgang', 'Del passordet hvis personen virker travel', 'Skriv passordet på en lapp ved skjermen'],
          correct: 0,
          note: 'Passord skal være personlige. Deling ødelegger sporbarhet og gjør ansvar uklart.'
        },
        {
          q: 'Hva betyr nettverkssegmentering på et grunnleggende nivå?',
          a: ['Å dele nettverket i områder slik at ikke alt står åpent mot alt', 'Å koble alle systemer til samme nett', 'Å fjerne alle brannmurer for enklere drift'],
          correct: 0,
          note: 'Segmentering begrenser hvor langt et problem kan spre seg.'
        },
        {
          q: 'Hvorfor bør man låse skjermen når man går fra arbeidsplassen?',
          a: ['For å hindre at andre bruker kontoen din', 'For å spare nettverkskapasitet', 'For å gjøre oppdateringer vanskeligere'],
          correct: 0,
          note: 'En ulåst skjerm kan gi tilgang til systemer og informasjon du har ansvar for.'
        },
        {
          q: 'Hva bør være målet med sikkerhetsopplæring?',
          a: ['Å gjøre det lettere å oppdage og rapportere risiko i hverdagen', 'Å legge all skyld på enkeltpersoner', 'Å erstatte tekniske sikkerhetstiltak'],
          correct: 0,
          note: 'God awareness gjør folk tryggere på hva de skal gjøre, ikke bare hva de ikke skal gjøre.'
        }
      ]
    },
    deep: {
      size: 12,
      label: 'Dypere OT-awareness',
      questions: [
        {
          q: 'Hva betyr defense in depth i OT-sikkerhet?',
          a: ['Flere lag med tiltak begrenser skade hvis ett lag svikter', 'Ett sterkt passord erstatter alt annet', 'Alle systemer plasseres i samme nett'],
          correct: 0,
          note: 'Defense in depth kombinerer mennesker, prosesser og teknologi i flere uavhengige barrierer.'
        },
        {
          q: 'Hvorfor prioriteres tilgjengelighet ofte høyt i OT?',
          a: ['Stopp eller feil kan påvirke fysiske prosesser og HMS', 'Konfidensialitet betyr aldri noe', 'OT-systemer kan alltid restartes uten risiko'],
          correct: 0,
          note: 'OT må beskytte data og systemer samtidig som driften holdes trygg og stabil.'
        },
        {
          q: 'Hva er poenget med soner og conduits?',
          a: ['Å gruppere systemer etter funksjon/risiko og styre flyt mellom dem', 'Å gjøre kommunikasjon fri mellom alle systemer', 'Å fjerne behovet for tilgangsstyring'],
          correct: 0,
          note: 'Soner og conduits gjør arkitekturen lettere å forstå, teste og revidere.'
        },
        {
          q: 'Hva er god praksis for fjernaksess til OT?',
          a: ['Godkjenning, MFA, tidsbegrensing, logging og kontrollert mellomledd', 'Permanent delt administratorbruker', 'Direkte tilgang fra internett til alle systemer'],
          correct: 0,
          note: 'Fjernaksess er nyttig, men bør behandles som en kontrollert og sporbar høy-risiko funksjon.'
        },
        {
          q: 'Hvorfor kan patching i OT kreve mer planlegging enn i IT?',
          a: ['Kompatibilitet, oppetid og prosessrisiko må vurderes først', 'OT-systemer trenger aldri oppdateringer', 'Patching bør alltid gjøres uten testing'],
          correct: 0,
          note: 'Når patching må vente, bør risikoen reduseres med kompenserende tiltak.'
        },
        {
          q: 'Hva er kompenserende tiltak?',
          a: ['Andre kontroller som reduserer risiko når idealtiltak ikke kan brukes med en gang', 'Å ignorere risiko fordi systemet er gammelt', 'Å fjerne logging for å spare ressurser'],
          correct: 0,
          note: 'Segmentering, strengere tilgang, overvåking og prosedyrer kan være kompenserende tiltak.'
        },
        {
          q: 'Hva er verdien av passiv nettverksovervåking i OT?',
          a: ['Avvik kan oppdages uten å forstyrre sårbare systemer unødvendig', 'Den endrer automatisk alle kontrollere', 'Den gjør backup overflødig'],
          correct: 0,
          note: 'Passiv overvåking passer ofte bedre enn aggressive skann i stabilitetskritiske miljøer.'
        },
        {
          q: 'Hva bør hendelsesrespons i OT alltid ta hensyn til?',
          a: ['Sikker drift og fysisk konsekvens før tekniske tiltak gjennomføres', 'Å slette alle logger raskt', 'Å koble fra tilfeldige systemer uten koordinering'],
          correct: 0,
          note: 'Respons må koordineres med drift, sikkerhet og de som kjenner prosessen.'
        },
        {
          q: 'Hva kjennetegner en god backupstrategi for OT?',
          a: ['Testet gjenoppretting, beskyttede kopier og dokumentert ansvar', 'Kun én kopi på samme maskin', 'Backup som aldri prøves før en krise'],
          correct: 0,
          note: 'Backup er en beredskap, ikke bare en fil som ligger et sted.'
        },
        {
          q: 'Hvorfor er logging og sporbarhet viktig?',
          a: ['Det gjør det mulig å oppdage, forstå og dokumentere hendelser', 'Det erstatter tilgangskontroll', 'Det gjør systemer immune'],
          correct: 0,
          note: 'Uten sporbarhet blir det vanskelig å vite hva som skjedde og når.'
        },
        {
          q: 'Hva er applikasjonskontroll eller allowlisting?',
          a: ['Bare godkjente programmer får kjøre', 'Alle nedlastede programmer får kjøre automatisk', 'Programmer bytter passord for brukeren'],
          correct: 0,
          note: 'Allowlisting passer ofte godt på stabile OT-maskiner med kjent funksjon.'
        },
        {
          q: 'Hva betyr hardening?',
          a: ['Å redusere angrepsflate ved å fjerne eller sikre unødvendige funksjoner', 'Å gjøre passord kortere', 'Å åpne flere tjenester for feilsøking'],
          correct: 0,
          note: 'Hardening handler om tjenester, kontoer, standardpassord, konfigurasjon og tilgang.'
        },
        {
          q: 'Hvorfor er standardpassord spesielt farlig i OT?',
          a: ['De er ofte kjent, gjenbrukt og kan gi rask tilgang til kritisk utstyr', 'De er alltid sterkere enn egne passord', 'De blokkerer all fjernaksess automatisk'],
          correct: 0,
          note: 'Standardpassord bør fjernes eller endres gjennom kontrollerte rutiner.'
        },
        {
          q: 'Hva kan være et tegn på avvik i et OT-nett?',
          a: ['Ukjent utstyr eller nye uventede forbindelser', 'At systemer oppfører seg som normalt', 'At dokumentasjonen stemmer med virkeligheten'],
          correct: 0,
          note: 'Avvik fra normaltilstand er ofte verdt å undersøke i stabile OT-miljøer.'
        },
        {
          q: 'Hvorfor bør leverandørtilgang revideres jevnlig?',
          a: ['Gamle eller unødvendige tilganger kan bli stående som risiko', 'Leverandører trenger alltid permanent tilgang', 'Revisjon gjør logging unødvendig'],
          correct: 0,
          note: 'Tilgang bør følge faktisk behov, ansvar og tidsrom.'
        },
        {
          q: 'Hva er en tabletop-øvelse?',
          a: ['En gjennomgang av et tenkt scenario for å øve roller og beslutninger', 'En fysisk test av skrivebordets styrke', 'En måte å slette gamle planer på'],
          correct: 0,
          note: 'Øvelser gjør det lettere å handle rolig når noe faktisk skjer.'
        },
        {
          q: 'Hvorfor er dokumentasjon en sikkerhetskontroll?',
          a: ['Den gjør systemet forståelig under drift, endring og hendelser', 'Den erstatter alle tekniske barrierer', 'Den bør bare finnes i hodet til én person'],
          correct: 0,
          note: 'God dokumentasjon reduserer feil, misforståelser og personavhengighet.'
        },
        {
          q: 'Hva er risikoen med gamle OT-protokoller?',
          a: ['De kan mangle moderne autentisering, kryptering eller integritetskontroll', 'De er alltid sikrere enn nye protokoller', 'De kan ikke observeres i trafikk'],
          correct: 0,
          note: 'Eldre protokoller kan være nødvendige, men må beskyttes med arkitektur og kontroller.'
        }
      ]
    }
  };

  let activeMode = 'short';
  let score = 0;
  let index = 0;
  let questions = [];

  const questionEl = quiz.querySelector('[data-quiz-question]');
  const optionsEl = quiz.querySelector('[data-quiz-options]');
  const noteEl = quiz.querySelector('[data-quiz-note]');
  const progressEl = quiz.querySelector('[data-quiz-progress]');
  const scoreEl = quiz.querySelector('[data-quiz-score]');
  const ringEl = quiz.querySelector('[data-quiz-ring]');
  const modeButtons = quiz.querySelectorAll('[data-quiz-mode]');
  const restartButton = quiz.querySelector('[data-quiz-restart]');

  function shuffle(items) {
    const output = [...items];
    for (let i = output.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [output[i], output[j]] = [output[j], output[i]];
    }
    return output;
  }

  function prepareQuestion(item) {
    return {
      ...item,
      answers: shuffle(item.a.map((text, answerIndex) => ({
        text,
        correct: answerIndex === item.correct
      })))
    };
  }

  function syncMeta() {
    const total = questions.length || questionBanks[activeMode].size;
    if (progressEl) progressEl.textContent = `${Math.min(index + 1, total)} / ${total}`;
    if (scoreEl) scoreEl.textContent = `${score}/${total}`;
    if (ringEl) ringEl.textContent = `${score}/${total}`;
  }

  function renderResult() {
    const total = questions.length;
    const ratio = score / total;
    const feedback = ratio >= 0.85
      ? 'Sterkt sikkerhetsblikk. Du ser både menneskelige og tekniske risikopunkter.'
      : ratio >= 0.55
        ? 'God start. Ta gjerne en ny tilfeldig runde og les forklaringene nøye.'
        : 'Ta en rolig awareness-runde til, særlig på tilgang, USB, fjernaksess, backup og rapportering.';

    questionEl.textContent = 'Runden er ferdig';
    optionsEl.textContent = '';
    noteEl.textContent = `Du fikk ${score} av ${total}. ${feedback}`;
    index = total - 1;
    syncMeta();
  }

  function renderQuestion() {
    const item = questions[index];
    questionEl.textContent = item.q;
    optionsEl.textContent = '';
    noteEl.textContent = '';
    syncMeta();

    item.answers.forEach((answer) => {
      const button = document.createElement('button');
      button.className = 'quiz-option';
      button.type = 'button';
      button.textContent = answer.text;
      button.dataset.correct = String(answer.correct);
      button.addEventListener('click', () => {
        if (answer.correct) score += 1;
        noteEl.textContent = item.note;
        optionsEl.querySelectorAll('.quiz-option').forEach((option) => {
          const isCorrect = option.dataset.correct === 'true';
          option.classList.toggle('is-correct', isCorrect);
          option.classList.toggle('is-wrong', option === button && !isCorrect);
          option.disabled = true;
        });
        syncMeta();
        window.setTimeout(() => {
          index += 1;
          if (index >= questions.length) renderResult();
          else renderQuestion();
        }, 1050);
      });
      optionsEl.appendChild(button);
    });
  }

  function startQuiz(mode) {
    activeMode = questionBanks[mode] ? mode : 'short';
    const bank = questionBanks[activeMode];
    score = 0;
    index = 0;
    questions = shuffle(bank.questions).slice(0, bank.size).map(prepareQuestion);
    modeButtons.forEach((button) => {
      const active = button.dataset.quizMode === activeMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    renderQuestion();
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => startQuiz(button.dataset.quizMode || 'short'));
  });

  if (restartButton) restartButton.addEventListener('click', () => startQuiz(activeMode));

  startQuiz(activeMode);
})();
