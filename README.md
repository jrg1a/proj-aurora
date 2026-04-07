# 🏭 Project AURORA

<div align="center">

![Project AURORA](https://img.shields.io/badge/Project-AURORA-00d4ff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTV6TTIgMTdsOSA1IDktNXYtNmwtOSA1LTktNXoiLz48L3N2Zz4=)
![HVL](https://img.shields.io/badge/HVL-Høgskulen%20på%20Vestlandet-005b99?style=for-the-badge)
![ABB](https://img.shields.io/badge/ABB-Samarbeid-ff0000?style=for-the-badge)
![License](https://img.shields.io/badge/Lisens-MIT-green?style=for-the-badge)
![IEC 62443](https://img.shields.io/badge/Standard-IEC%2062443-orange?style=for-the-badge)

**Sikker OT/ICS-nettverksarkitektur for industrielle kontrollsystemer**

*Bacheloroppgave · Elektroingeniør – Cyberfysisk Nettverksteknologi · HVL 2026*

[🌐 Se EXPO-nettsiden](https://jrg1a.github.io/proj-aurora/) · [📊 Arkitekturdiagram](aurora-nettverksarkitektur.html) · [🔄 Dataflytdiagram](dataflow-diagram.html)

</div>

---

## 📖 Om prosjektet

Project AURORA er en bacheloroppgave der vi designer, bygger og tester en komplett OT-nettverksarkitektur fra bunnen av. Prosjektet simulerer et realistisk industriscenario med to geografisk adskilte sites — **AURORA** (onshore) og **NORØNNA** (offshore) — som utveksler prosessdata over **OPC UA (IEC 62541)**.

Prosjektet er utført i samarbeid med **ABB**, som trenger offline-testing av sin UaWrapper-programvare for en CO₂-fangst-kunde. Siden ABB 800xA ikke kan flyttes fysisk, simulerer vi det med OPC Connect Server og Matrikon Explorer i en labmiljø.

### Hovedmål

- Designe en nettverksarkitektur som oppfyller **IEC 62443** (sikkerhetsnivå SL-T 2)
- Implementere **Purdue-modellen** med klare soner og betingede kommunikasjonskanaler
- Konvertere **OPC DA → OPC UA** via UaWrapper med SignAndEncrypt og tag-filtrering
- Dokumentere og teste forsvar mot kjente **MITRE ATT&CK for ICS**-teknikker

---

## 🗺️ Nettverksarkitektur

Arkitekturen er bygget rundt **8 VLANer** fordelt på 5 sikkerhetssoner, separert av en **Cisco ASA 5506-X** brannmur med VLAN-subinterfaces.

```mermaid
graph TB
    subgraph WAN["🌐 WAN (VLAN 100)"]
        NORONNA["🏗️ NORØNNA (Offshore Site)"]
    end

    ASA["🔥 Cisco ASA 5506-X\nBrannmur · ACL · VLAN-ruting"]

    subgraph IDMZ["🟡 IDMZ — Industrial DMZ (VLAN 40/50)"]
        JH["💻 Jump Host\nRDP/SSH inn-punkt"]
        DB["📡 Data-broker\nOPC UA → WAN"]
        HIST["🗄️ Historian"]
    end

    subgraph IT["🔵 IT-sone (VLAN 60/70)"]
        EWS["🖥️ EWS\nEngineering Workstation"]
        DC["🔐 DC / RADIUS\nActive Directory"]
        WSUS["⬇️ WSUS\nPatch-server"]
    end

    subgraph OT["🔴 OT / Field-sone (VLAN 10/20)"]
        SENSORS["⚙️ Sensorer og aktuatorer\n802.1X Access Points"]
        APP01["🔄 app01 — UaWrapper\nOPC DA → OPC UA"]
        APP02["🔄 app02 — Cogent DataHub\nOPC DA-server"]
    end

    subgraph MGMT["⚫ OOB-MGMT (VLAN 99)"]
        CONSOLE["🖥️ Console-server\nOut-of-band admin"]
    end

    NORONNA <-->|"OPC UA\nSignAndEncrypt\nTCP 4840"| ASA
    ASA <-->|"Kontrollert"| IDMZ
    ASA <-->|"Begrenset"| IT
    ASA <-->|"Streng ACL"| OT
    APP01 -->|"OPC UA"| DB
    JH -.->|"RDP/SSH\ngjennom IDMZ"| EWS
    ASA -.->|"Kun admin"| MGMT

    style WAN fill:#0d1a2e,color:#fff,stroke:#00d4ff
    style ASA fill:#2d1b00,color:#fff,stroke:#ff6b00
    style IDMZ fill:#2d2d00,color:#fff,stroke:#ffd700
    style IT fill:#001a33,color:#fff,stroke:#0080ff
    style OT fill:#1a0000,color:#fff,stroke:#ff4444
    style MGMT fill:#111,color:#aaa,stroke:#555
```

---

## 🔒 Sikkerhetssoner (IEC 62443 / Purdue-modellen)

```mermaid
graph LR
    subgraph L5["Nivå 5 — Enterprise"]
        CLOUD["Cloud / WAN"]
    end
    subgraph L4["Nivå 4 — Site Business"]
        IT_NET["IT-nettverk"]
    end
    subgraph IDMZ_ZONE["IDMZ — Barriere"]
        DMZ["Jump Host · Historian<br/>Data-broker"]
    end
    subgraph L3["Nivå 3 — Site Operations"]
        EWS_ZONE["EWS · WSUS · DC"]
    end
    subgraph L2["Nivå 2 — Control"]
        CTRL["HMI · SCADA"]
    end
    subgraph L1_L0["Nivå 0–1 — Field"]
        FIELD["PLC · RTU · Sensorer"]
    end

    L5 -->|"Brannmur"| L4
    L4 -->|"ASA ACL"| IDMZ_ZONE
    IDMZ_ZONE -->|"Streng filtrering"| L3
    L3 -->|"Begrenset"| L2
    L2 --> L1_L0

    style IDMZ_ZONE fill:#2d2d00,stroke:#ffd700,color:#fff
    style L1_L0 fill:#1a0000,stroke:#ff4444,color:#fff
```

---

## 🛡️ MITRE ATT&CK for ICS — Dekket

| Teknikk | ID | AURORA-tiltak |
|---|---|---|
| Exploitation of Remote Services | T0866 | VLAN-segmentering + ASA ACL |
| Valid Accounts | T0859 | AD/RADIUS + 802.1X |
| Remote Services (lateral movement) | T0886 | Jump Host i IDMZ som eneste inngang |
| Unauthorized Command Message | T0855 | OPC UA SignAndEncrypt + tag-filtrering |
| Manipulation of Control | T0831 | UaWrapper kun lesetilgang |
| Modify Controller Tasking | T0821 | FIELD-sone isolert fra IT/IDMZ |

---

## 🌐 Showcase-nettside

Prosjektet har en fullstendig interaktiv showcase-nettside som dekker:

| Side/seksjon | Beskrivelse |
|---|---|
| 🎯 **Hero** | Animert nettverksvisualisering |
| ⚠️ **Trusselbildet** | 9 virkelige OT-angrep, sektorstatistikk, angrepssimulering |
| 🗺️ **Arkitekturdiagram** | Interaktiv SVG med 3 visningsmoduser |
| 🔐 **MITRE ATT&CK** | ICS kill chain, teknikkkort, tiltakstabell |
| 📊 **Dataflytdiagram** | Sone-til-sone trafikk med protokoller/porter |
| 🔥 **Brannfakler** | Provoserende påstander om OT-sikkerhet (flippkort) |
| 🧠 **Quiz** | 14 tankevkkende spørsmål om OT-sikkerhet |
| 👥 **Team** | Gruppemedlemmer og roller |

---

## 🛠️ Teknologier

<div align="center">

![OPC UA](https://img.shields.io/badge/OPC%20UA-IEC%2062541-blue?style=flat-square)
![Cisco ASA](https://img.shields.io/badge/Cisco-ASA%205506--X-1ba0d7?style=flat-square&logo=cisco)
![IEC 62443](https://img.shields.io/badge/IEC-62443-orange?style=flat-square)
![HTML5](https://img.shields.io/badge/HTML5-showcase-e34f26?style=flat-square&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Canvas%20API-f7df1e?style=flat-square&logo=javascript&logoColor=black)

</div>

| Kategori | Teknologi |
|---|---|
| **Protokoll** | OPC UA (IEC 62541), OPC DA (DCOM) |
| **Konvertering** | UaWrapper (ABB), Cogent DataHub |
| **Brannmur** | Cisco ASA 5506-X, VLAN-subinterfaces |
| **Autentisering** | Active Directory, RADIUS, 802.1X |
| **Standard** | IEC 62443, Purdue Model, NIS2 |
| **Nettside** | HTML5, CSS3, Canvas API, SVG |

---

## 📁 Repo-innhold

```
📂 proj-aurora/
├── 📄 index.html                       # Showcase-nettside (GitHub Pages entry point)
├── 📄 aurora-expo.html                 # Showcase-nettside
├── 📄 aurora-nettverksarkitektur.html  # Interaktivt arkitekturdiagram (SVG)
├── 📄 dataflow-diagram.html            # Dataflytdiagram med protokoller/porter
├── 📄 brannfakler.html                 # Provoserende OT-sikkerhetspåstander
├── 📄 quiz.html                        # Interaktiv OT-sikkerhetsquiz (14 spørsmål)
├── 📄 LICENSE                          # MIT-lisens
└── 📄 README.md                        # Denne filen
```

---

## 🚀 Kjør lokalt

Nettsiden er ren HTML/CSS/JS — ingen bygg-steg nødvendig:

```bash
git clone https://github.com/jrg1a/proj-aurora.git
cd proj-aurora

# Åpne direkte i nettleser
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

> **Merk:** Arkitekturdiagrammet lastes inn via `fetch()` fra `aurora-nettverksarkitektur.html`. For full funksjonalitet, kjør via en lokal webserver:
> ```bash
> python3 -m http.server 8080
> # Åpne http://localhost:8080
> ```

---

## 👥 Team

| Navn | Rolle |
|---|---|
| **Jørgen Austnes** | Elektroingeniør · Cyberfysisk Nettverksteknologi |
| **Axel Sigmar Lien** | Elektroingeniør · Cyberfysisk Nettverksteknologi |
| **Christopher Yarranton Rossebø** | Elektroingeniør · Cyberfysisk Nettverksteknologi |

**Veileder:** Guang Yang (HVL)
**Industripartner:** Erik Serck-Hanssen (ABB)

---

## 📄 Lisens

Dette prosjektet er lisensiert under **MIT-lisensen** — se [LICENSE](LICENSE) for detaljer.

> Bacheloroppgave utført ved Høgskulen på Vestlandet (HVL) i samarbeid med ABB AS, 2026.

---

<div align="center">
  <sub>Project AURORA · HVL / ABB · 2026 · Elektroingeniør – Cyberfysisk Nettverksteknologi</sub>
</div>
