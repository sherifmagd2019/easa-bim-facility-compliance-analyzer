# EASA BIM Facility Compliance Analyzer

> A Revit add-in and web verification workbench that audits BIM models of Unit Load Device (ULD) inspection and repair facilities against **EASA Part-145** and **Part-IS** facility requirements.

![Status](https://img.shields.io/badge/status-active%20development-orange)
![Revit](https://img.shields.io/badge/Revit-2025%20%7C%202026%20%7C%202027-0696D7)
![.NET](https://img.shields.io/badge/.NET-8%20%7C%2010-512BD4)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Table of Contents

1. [Overview](#overview)
2. [Why this project exists](#why-this-project-exists)
3. [Regulatory scope](#regulatory-scope)
4. [Key features](#key-features)
5. [Architecture](#architecture)
6. [Repository structure](#repository-structure)
7. [Getting started: web workbench](#getting-started-web-workbench)
8. [Getting started: Revit add-in](#getting-started-revit-add-in)
9. [Rule catalog](#rule-catalog)
10. [Configuration](#configuration)
11. [Testing](#testing)
12. [Roadmap](#roadmap)
13. [Limitations and disclaimer](#limitations-and-disclaimer)
14. [Contributing](#contributing)
15. [Author](#author)
16. [License](#license)

---

## Overview

Third-country maintenance organisations applying for initial EASA Part-145 approval must demonstrate that their facilities, tooling and security arrangements meet the regulation. Checking this by hand against a Revit model is slow and hard to repeat.

This project provides two connected parts:

| Part | Technology | Purpose |
|:---|:---|:---|
| **Revit add-in** (`csharp_solution/`) | C#, WPF (MVVM), Revit API via Nice3point | Extracts rooms, doors and equipment from a live Revit model, runs the rule engine, highlights findings in Revit, and exports reports. |
| **Web workbench** (`src/`) | React 19, Vite, Tailwind CSS 4, three.js | Visual verification environment with a synthetic ULD facility model, a 3D viewer, a ULD route analyzer, a rule engine view and report export. |

Both parts share the same rule catalog and the same compliance vocabulary, so a rule can be tried in the browser before it is run against a real model.

## Why this project exists

The target application is an aeronautical maintenance organisation outside the EU seeking approval under **Rating C20 (Structural Components, ULD)**. It handles certified cargo containers and pallets:

- **Type 1, rigid containers:** AKE (LD3), AKH (LD3-45), DPE, DQF, AMF
- **Type 2, pallets and nets:** PMC (96 x 125 in), PAG (88 x 125 in), PLA, PRA

The tool turns facility requirements into machine-checkable rules, and keeps every conclusion open to challenge by a qualified human reviewer.

## Regulatory scope

| Framework | Coverage in this tool |
|:---|:---|
| Commission Regulation (EU) No 1321/2014, Annex II (Part-145) | `145.A.25` facility requirements, `145.A.40` equipment, tools and material, `145.A.42` component acceptance and segregation |
| Commission Implementing Regulation (EU) 2023/203 (Part-IS) | Physical access control for server infrastructure, airworthiness records and electronic release-to-service systems |
| EASA AMC / GM | Acceptable Means of Compliance and Guidance Material, kept separate from hard law |
| Foreign Part-145 route | Third-country applicants apply to the EASA Foreign Part-145 Approvals Section, not to an EU Member State authority |

Every rule is classified as one of three types so that reviewers can see how much weight it carries:

- `Regulatory`: hard law
- `AMC_GM`: soft law and guidance
- `ProjectAssumption`: an engineering assumption that needs a cited standard and reviewer approval

## Key features

- **Rule-driven BIM checks.** A JSON rule catalog is evaluated by a rule engine, so thresholds can be changed without recompiling.
- **Four-state compliance result.** `Meets modeled check`, `Gap found`, `Needs human review`, `Not assessed`. The tool never claims a facility is "compliant", only that a modeled check passed.
- **Reviewer overrides with an audit trail.** Overrides record the reviewer, role, timestamp, previous and new status, reason and evidence reference.
- **Model completeness check.** Verifies that rooms, doors and equipment carry the parameters the rules need before any rule is run.
- **ULD route and door clearance analysis.** Compares door clear widths against ULD dimensions, equipment envelope and lateral margin.
- **3D facility viewer.** three.js model with element selection and zoom-to-finding.
- **Compliance heat map.** Visual summary of status across the facility.
- **Evidence manager.** Attach documents and non-BIM verification (calibration records, procedures, site inspection).
- **Reports.** PDF (QuestPDF) and Excel (ClosedXML) export from the add-in; ZIP bundle export from the web app.
- **Assessment history.** SQLite persistence for projects, findings, evidence, corrective actions and sessions.
- **Revit integration.** Ribbon tab, element highlighting and navigation from a finding to the model element.

### Workbench workflow

The web app follows the same sequence a reviewer would use:

| Step | View |
|:---|:---|
| - | 3D BIM Facility Model |
| 1 | Project Setup |
| 2 | Model Completeness |
| 3 | Regulatory Scope |
| 4 | ULD Route and Door Clearances |
| 5 | BIM Rule Engine |
| 6 | Findings Explorer |
| 7 | Evidence and Actions |
| 8 | Audit Report |
| 9 | C# and React Guide |

## Architecture

```
                 +-------------------------------+
                 |  rules/*.json  regulations/*.json  |
                 |        config/*.json           |
                 +---------------+---------------+
                                 |
        +------------------------+------------------------+
        |                                                 |
+-------v---------+                              +--------v--------+
|  Web workbench  |                              |  Revit add-in   |
|  React + three  |                              |  C# / WPF       |
|  synthetic data |                              |  live Revit data|
+-----------------+                              +--------+--------+
                                                          |
                              Core -> Regulations -> Rules -> Bim
                                      Evidence -> Reporting -> Persistence
```

The C# solution is split into small projects with one-way dependencies. `Core` holds pure domain models and has no Revit dependency, which keeps the rule engine unit-testable outside Revit.

## Repository structure

```
.
├── src/                          # React web workbench
│   ├── components/               # Views: 3D viewer, rule engine, findings, reports ...
│   ├── data/                     # Synthetic ULD facility dataset
│   ├── utils/                    # ZIP exporter, compliance heat map
│   └── types.ts                  # Shared compliance types
├── public/                       # Static assets
├── csharp_solution/
│   ├── EasaBimCompliance.sln
│   ├── EasaBimCompliance.addin   # Revit add-in manifest
│   ├── Directory.Build.props     # Central build and target-framework settings
│   ├── src/
│   │   ├── EasaCompliance.Core/          # Domain models, enums, DTOs
│   │   ├── EasaCompliance.Regulations/   # Requirement records, applicability logic
│   │   ├── EasaCompliance.Rules/         # Rule definitions and evaluator
│   │   ├── EasaCompliance.Bim/           # Extraction and completeness checks
│   │   ├── EasaCompliance.Evidence/      # Evidence attachments
│   │   ├── EasaCompliance.Reporting/     # PDF and Excel generators
│   │   ├── EasaCompliance.Persistence/   # SQLite repository
│   │   ├── EasaCompliance.UI/            # WPF views and view models
│   │   ├── EasaCompliance.Revit/         # External application and commands
│   │   └── EasaCompliance.Launcher/      # Standalone WPF runner
│   ├── tests/EasaCompliance.Tests/       # xUnit tests
│   ├── rules/easa_part145_rules.json
│   ├── regulations/easa_part145_library.json
│   ├── config/parameter_mappings.json
│   └── database/schema.sql
├── index.html
├── package.json
└── vite.config.ts
```

## Getting started: web workbench

**Prerequisites:** [Node.js](https://nodejs.org/) 20 or later (or [Bun](https://bun.sh/), since a `bun.lock` is included).

```bash
git clone https://github.com/sherifmagd2019/easa-bim-facility-compliance-analyzer.git
cd easa-bim-facility-compliance-analyzer

npm install
npm run dev
```

Open <http://localhost:3000>.

| Script | Description |
|:---|:---|
| `npm run dev` | Start the Vite dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Type-check with `tsc --noEmit` |

The workbench currently runs entirely on the bundled synthetic facility data and does not need an API key.

## Getting started: Revit add-in

### Prerequisites

- Windows 10 or 11 (64-bit)
- Visual Studio 2022 (17.8 or later) with the **.NET desktop development** workload
- .NET 8 SDK (installed with Visual Studio 2022)
- Autodesk Revit 2025, 2026 or 2027
- Optional: .NET 10 SDK, only for the Revit 2027 configurations

### Build configurations

| Configuration | Target framework | Use for |
|:---|:---|:---|
| `Debug` / `Release` (x64) | `net8.0-windows` | Revit 2025 and 2026 (default) |
| `Debug R27` / `Release R27` (x64) | `net10.0-windows` | Revit 2027 |

### Build and install

```cmd
cd csharp_solution
dotnet restore EasaBimCompliance.sln
dotnet build EasaBimCompliance.sln -c Debug
```

The post-build step copies the manifest and binaries to:

```
%APPDATA%\Autodesk\Revit\Addins\<Year>\EasaBimCompliance.addin
%APPDATA%\Autodesk\Revit\Addins\<Year>\EasaBimCompliance\
```

Start Revit, choose **Always Load** when prompted, and open the **EASA Compliance** ribbon tab.

More detail, including fixes for common compiler errors (`CS1705`, `CS0103`, `CS1061`), is in [`csharp_solution/BUILD_AND_INSTALL.md`](csharp_solution/BUILD_AND_INSTALL.md).

### Revit parameter mapping

The add-in does not assume fixed parameter names. `csharp_solution/config/parameter_mappings.json` lists the names it will try, in order, for each value:

| Element | Values mapped |
|:---|:---|
| Rooms | name, number, area, department |
| Doors | clear width, clear height, access control |
| Equipment | asset ID, serial number, calibration due date, workstation |

Edit this file to match your firm's BIM Execution Plan.

## Rule catalog

Rules live in [`csharp_solution/rules/easa_part145_rules.json`](csharp_solution/rules/easa_part145_rules.json).

| Rule ID | Check | Clause | Class | Evaluation type |
|:---|:---|:---|:---|:---|
| `RULE-145-FAC-01` | Physical segregation of quarantine / unserviceable components | 145.A.25(d) | Regulatory | `RoomExistenceCheck` |
| `RULE-145-FAC-02` | Secure bonded parts store presence and access control | 145.A.25(d), 145.A.42(a) | Regulatory | `RoomExistenceCheck` |
| `RULE-145-FAC-03` | Workshop door clear opening width for ULD pallet handling | AMC 145.A.25(a) | AMC / GM | `DoorClearanceCheck` |
| `RULE-145-FAC-04` | Emergency eyewash proximity to chemical / battery station | ANSI/ISEA Z358.1, EN 15154 (cited external standard) | ProjectAssumption | `SpatialDistanceCheck` |
| `RULE-145-FAC-05` | Maintenance tooling asset identification parameters | 145.A.40(a) | Regulatory | `EquipmentAssetPresenceCheck` |
| `RULE-IS-SEC-01` | Server and records physical access security control | IS.I.OR.200, 145.A.42(a) | Regulatory | `SecurityAccessControlCheck` |

Each rule carries its source document, source URL, default severity, enabled flag, a `requiresHumanReview` flag, tunable parameters, the expected outcome and a plain statement of its **limitations**.

### Example: door clearance logic

For `RULE-145-FAC-03`, the rule engine computes the required clear width from the catalog parameters:

```
required clear width = max(uldBaseWidthMm, transporterEnvelopeMm) + lateralMarginMm
                     = max(2438, 2650) + 300
                     = 2950 mm
```

Only doors that look like cargo or bay doors are tested (family names containing *Rollup*, *Overhead* or *Hangar*, or door names containing *ULD* or *Bay*). A door whose clear width is below the required value produces a `Critical` / `Gap found` finding. Tune the three values in the JSON file rather than in code.

## Configuration

| File | Purpose |
|:---|:---|
| `csharp_solution/rules/easa_part145_rules.json` | Enable, disable and tune rules |
| `csharp_solution/regulations/easa_part145_library.json` | Sourced requirement records |
| `csharp_solution/config/parameter_mappings.json` | Map Revit parameter names |
| `.env.example` | Environment variables for the web app (see below) |

### Environment variables (web app)

Copy `.env.example` to `.env.local` if you extend the app with AI features.

| Variable | Required | Description |
|:---|:---|:---|
| `GEMINI_API_KEY` | No | Google Gemini API key. Not used by the current workbench. |
| `APP_URL` | No | Hosting URL, for self-referential links. |

Never commit `.env.local` or any real key. The `.gitignore` already excludes them.

## Testing

```cmd
cd csharp_solution
dotnet test tests/EasaCompliance.Tests/EasaCompliance.Tests.csproj -c Debug
```

Tests use xUnit and FluentAssertions and cover the rule engine and the applicability engine. Type-check the web app with `npm run lint`.

## Roadmap

- [ ] Extend the rule catalog to Part-145 sections 145.A.30 and 145.A.35 where they have a physical-facility component
- [ ] Add IFC import so the workbench can audit models without Revit
- [ ] Add more unit tests for door, spatial and security evaluators
- [ ] Add CI (GitHub Actions) for `npm run lint`, `npm run build` and `dotnet test`
- [ ] Publish a signed installer for the add-in
- [ ] Add regulation-update tracking against new EASA ED Decisions

## Limitations and disclaimer

This is a **decision-support tool**. It assists qualified human reviewers and does **not** certify, approve or guarantee compliance with any EASA requirement.

- A result of `Meets modeled check` means a modeled geometric or parametric check passed. It does not replace physical inspection, procedures in the Maintenance Organisation Exposition (MOE), or competent authority assessment.
- Rules marked `ProjectAssumption` are engineering assumptions, not regulatory text.
- Regulatory content should be checked against the current EASA Easy Access Rules before use in an application. Regulations and AMC/GM are amended periodically.
- The Revit 2027 configurations depend on preview Nice3point packages and may change.

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-change`
3. Commit with a clear message: `git commit -m "Add: new rule for ..."`
4. Push and open a pull request

For a new rule, include the clause reference, the source URL, the classification, and the rule's limitations.

## Author

**Eng. Sherif Ahmad Magdaldin**
Civil / Structural Engineer, Certified BIM Manager
Cairo, Egypt

## License

Released under the [MIT License](LICENSE).
