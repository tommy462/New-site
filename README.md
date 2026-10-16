# Coastal Windows & Conservatories — website concept

An unofficial, independent design concept by **Conquer AI** for Coastal Windows & Conservatories (Newton Abbot, Devon). Not the company's official website and not commissioned or endorsed by them. All interactive tools and forms are demonstrations and send no data. Business facts are taken from the company's current website (coastal-windows.co.uk); visuals are generated illustrations, not photographs of real installations.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321 — live-reloading dev server
# or
npm run build && npm run preview   # production build served at http://localhost:4321
```

Requires Node 18.20+ (tested on Node 22).

## What's inside

| Page | Signature feature |
| --- | --- |
| `/` | **Live Window** — a real-time WebGL view of South Devon lit by the actual sun position over Newton Abbot (and live weather via Open-Meteo when online), with rain running down the glass |
| `/windows/` | **How it opens** — CSS 3D models of every window type, hinged exactly as the real product; window finder; dual-colour picker; Cortizo specs |
| `/doors/` | 3D door explorer (bifold, French, sliding…), plan-view clear-opening comparison, procedural door renders |
| `/door-studio/` | **Door Studio** — compose a door (style, colour range, glass, hardware, sidelights, house number, dusk lighting); shareable links and a shortlist |
| `/conservatories/` | Five styles in plan & elevation, drag-to-compare replacement roof, hup!, porches, Deponti verandas |
| `/light-lab/` | **Light Lab** — Three.js conservatory model with real solar geometry; orientation, date, time and roof type; measured hours of direct sun on the floor |
| `/home-improvements/` | Interactive roofline anatomy ("make it rain"), cladding, flat roofing, kitchen style study |
| `/about/` | Timeline since 1988, teams, plain-English guide to accreditations, coverage map with distance tool |
| `/plan/` | **Project Pathfinder** — adaptive brief builder with live sun-hours for the garden, showroom checklist and demo enquiry |
| `/visit/` | Live open/closed status, daylight-aware visit planner, contact, service request, finance disclosure, payments |

Site-wide: bifold-door page transitions, a sliding-sash menu, live daylight chip in the header, smooth scrolling, reduced-motion support.

## Stack

Astro 5 (static output) · vanilla JS · Three.js (Light Lab only) · Lenis · self-hosted Newsreader, Geist and Geist Mono fonts.

## Before going live

- Replace the generated illustrations with Coastal's own installation photography.
- Confirm accreditations, current offers and finance figures with the business and Novuna.
- Connect forms to Coastal's CRM / email, and the visit planner to a real calendar.
- Remove the "Design concept" labels and `noindex` meta once it's an official site.
