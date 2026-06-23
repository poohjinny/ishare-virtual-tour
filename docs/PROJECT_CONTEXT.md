# Project context

> **Why** this project exists and how to run the stakeholder demo.  
> **What to build next:** [ROADMAP.md](./ROADMAP.md).  
> **Product contracts:** [PRODUCT_SPEC.md](./PRODUCT_SPEC.md).

Phase 0 (proof demo) is complete. Delivered scope and active backlog live in
[ROADMAP.md](./ROADMAP.md) only — not duplicated here.

---

## Background

SeekBeak is embedded in the iShare website as a third-party 360° virtual tour.
Known limitations:

- **Navigation** — disorienting scene changes, unclear current location
- **Transitions** — abrupt cuts between scenes
- **Hotspot UX** — limited customisation within embed constraints
- **No contextual AI** — cannot answer location-specific questions

This project is an **in-house virtual tour** to deliver a better experience and
eventually replace the SeekBeak embed.

---

## Stakeholder pitch

> "We design entry views per scene, show the full tour path in a side panel, use
> zoom + fade transitions, and provide an AI assistant that knows where you are
> — things the SeekBeak embed cannot do with configuration alone."

---

## SeekBeak vs in-house

| SeekBeak issue                            | In-house solution                                     |
| ----------------------------------------- | ----------------------------------------------------- |
| Wrong facing direction after scene change | `targetView` (yaw/pitch/zoom) per nav hotspot in JSON |
| User doesn't know where they are          | Explore + breadcrumb with active location + history   |
| Unclear where hotspot leads               | Nav label on hover + scene list                       |
| Abrupt scene cuts                         | `transition.ts` — pan → zoom → fade → target view     |
| No location-aware help                    | Guide with `currentSceneId` + knowledge JSON          |

These priorities shaped Phase 0: navigation first, then transitions, hotspots,
popups, Guide, embed.

---

## Demo tour — Ken Sargent House

Original proof used three scenes (`overview` → `main-entrance` → `reception`).
The tour has since grown (naming opportunities, more scenes). Live content:
`tours/ken-sargent-house.json`, [catalog](../tours/catalog.json).

**Why start at overview (original demo):**

1. Spatial context — facility layout in seconds
2. Navigation story — intentional routing via hotspot or Explore
3. Transition impact — aerial → ground-level benefits from zoom + fade
4. Info + nav in one opening scene

---

## 3-minute stakeholder demo script

1. **Overview loads** — Explore shows locations; overview highlighted
2. **Info hotspot** — facility intro popup (branded UI)
3. **Nav or Explore** — transition to Main Entrance (zoom + fade)
4. **Entrance** — view faces the door (`targetView`)
5. **Reception** — nav or Explore; lands at welcome desk
6. **Back** — history returns to previous scene
7. **Guide** — ask a scene-relevant FAQ
8. **Closing** — "Scene views are designed in JSON; SeekBeak cannot do this with
   config alone."

For multi-tour platform demo, start at `/` (client intro) then enter Ken Sargent
House. Embed demo: `/{tourId}/{firstScene}?embed=1` — see
[PRODUCT_SPEC.md](./PRODUCT_SPEC.md).

---

## Related documents

| Document                             | Topic                                 |
| ------------------------------------ | ------------------------------------- |
| [ROADMAP.md](./ROADMAP.md)           | Backlog, Phase 1–3, sprint checklists |
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) | URL, embed, catalog, schemas          |
