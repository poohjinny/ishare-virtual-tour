# Project context

> **Why** this project exists and how to run the stakeholder demo.  
> **What to build next:** [ROADMAP.md](.../ROADMAP.md).  
> **Product contracts:** [PRODUCT_SPEC.md](./PRODUCT_SPEC.md).

Phase 0 (proof demo) and **Phase 1 (Production v1)** are complete — see
[ROADMAP.md](.../ROADMAP.md). Parent-site iframe `src` swaps happen per tour at
launch (Client rollout), not as a Phase 1 blocker. Active backlog lives in
ROADMAP only — not duplicated here.

---

## Background

SeekBeak is embedded in the iShare website as a third-party 360° virtual tour.
Known limitations:

- **Navigation** — disorienting scene changes, unclear current location
- **Transitions** — abrupt cuts between scenes
- **Hotspot UX** — limited customisation within embed constraints
- **No contextual AI** — cannot answer location-specific questions

This project is an **in-house virtual tour** to deliver a better experience and
replace SeekBeak embeds on ishare.ca / client sites.

---

## Stakeholder pitch

> "We design entry views per scene, show the full tour path in Explore, use
> zoom + fade transitions, and provide a Tour Guide that knows where you are —
> things the SeekBeak embed cannot do with configuration alone."

---

## SeekBeak vs in-house

| SeekBeak issue                            | In-house solution                                     |
| ----------------------------------------- | ----------------------------------------------------- |
| Wrong facing direction after scene change | `targetView` (yaw/pitch/zoom) per nav hotspot in JSON |
| User doesn't know where they are          | Explore + breadcrumb with active location + history   |
| Unclear where hotspot leads               | Nav label on hover + scene list                       |
| Abrupt scene cuts                         | `transition.ts` — pan → zoom → fade → target view     |
| No location-aware help                    | Guide with `currentSceneId` + assembled tour context  |

These priorities shaped Phase 0: navigation first, then transitions, hotspots,
popups, Guide, embed.

---

## Demo tour — Ken Sargent House

Live content: `tours/t_l01wnq8eh6.json`, [catalog](../tours/catalog.json).
Scene ids are opaque (`s_*`); titles are what visitors see.

| Scene          | Id             | Role in the original pitch                         |
| -------------- | -------------- | -------------------------------------------------- |
| Overview       | `s_dtv27wfrbi` | First scene — aerial / outdoor context             |
| Main Entrance  | `s_zlz39v1fjz` | Ground-level arrival (`targetView` faces the door) |
| Reception      | `s_vddzraqi1q` | Welcome desk                                       |

The tour has since grown (naming opportunities, more places). The three-scene
path above is still the stakeholder story.

**Why start at Overview:**

1. Spatial context — facility layout in seconds
2. Navigation story — intentional routing via hotspot or Explore
3. Transition impact — aerial → ground-level benefits from zoom + fade
4. Info + nav in one opening scene

---

## 3-minute stakeholder demo script

1. **Overview loads** (`s_dtv27wfrbi`) — Explore shows locations; Overview
   highlighted
2. **Info hotspot** — facility intro popup (branded UI)
3. **Nav or Explore** — transition to Main Entrance (`s_zlz39v1fjz`, zoom + fade)
4. **Entrance** — view faces the door (`targetView`)
5. **Reception** (`s_vddzraqi1q`) — nav or Explore; lands at welcome desk
6. **Back** — history returns to previous scene
7. **Guide** — ask a scene-relevant FAQ
8. **Closing** — "Scene views are designed in JSON; SeekBeak cannot do this with
   config alone."

For multi-tour platform demo, start at `/` (client intro) then enter Ken Sargent
House. Embed demo: `/t_l01wnq8eh6/s_dtv27wfrbi?embed=1` — see
[PRODUCT_SPEC.md](./PRODUCT_SPEC.md).

---

## Related documents

| Document                             | Topic                          |
| ------------------------------------ | ------------------------------ |
| [ROADMAP.md](.../ROADMAP.md)           | Backlog, Phase 2–3             |
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) | URL, embed, catalog, schemas   |
