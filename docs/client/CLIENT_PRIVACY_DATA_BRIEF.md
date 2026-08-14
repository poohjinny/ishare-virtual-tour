# Virtual tour — privacy & data brief

> Client-facing overview of how the iShare Virtual Tour handles cookies, local
> storage, Tour Guide questions, and analytics.  
> Share this with client IT / privacy contacts before launch when Tour Guide is
> enabled, or when they ask about cookies and data.

**Not legal advice.** Align retention, subprocessors, and contact details with
FMI / iShare before sending externally. Cross-links:
[CLIENT_REQUIRED_INFORMATION.md](./CLIENT_REQUIRED_INFORMATION.md) (intake),
[EMBED.md](../ops/EMBED.md) (iframe).

---

## What the tour is

The virtual tour is a web experience (360° panorama and/or 3D) that visitors
open on your site or on an iShare-hosted URL. In the current product phase there
is **no visitor login** and **no payment capture** inside the tour.

---

## Cookies

The tour application does **not** set tracking or advertising cookies, and it
does not use login or session cookies for visitors.

If your own website adds analytics or marketing tags on the parent page that
embeds the tour, those remain governed by **your** cookie and privacy notices.

---

## Information stored in the visitor’s browser

The tour may keep small amounts of data in the browser (for example
`localStorage`) so the experience works smoothly:

- First-visit tips or coach marks
- Tour Guide conversation on that device (when Guide is enabled)
- Viewer preferences (such as control layout)

This stays on the visitor’s device for those features. It is not used as a
marketing profile inside the tour app.

---

## Tour Guide (when enabled)

Tour Guide lets visitors ask questions about the facility and their current
place in the tour.

When someone sends a question:

1. The question and relevant tour context (for example current location and tour
   content) are sent to our Tour Guide service so it can answer.
2. The reply is shown in the tour.
3. An in-app notice reminds visitors not to share personal or health information
   in chat.

**Please do not encourage visitors to enter personal, health, or donor details
in Tour Guide.** Use your normal contact or giving channels for that.

**For FMI / iShare to complete before external send:**

| Topic                                            | Value |
| ------------------------------------------------ | ----- |
| How long Guide messages are retained (if logged) | _TBD_ |
| AI / LLM subprocessor (if applicable)            | _TBD_ |
| Privacy questions contact                        | _TBD_ |
| Link to your privacy policy (optional in-app)    | _TBD_ |

---

## Analytics and embeds

When the tour runs inside an iframe on your site (`?embed=1`), it can notify the
parent page about simple lifecycle events (for example loaded, scene change,
resize) via `postMessage`. That lets **your** site measure engagement if you
choose to listen.

The tour does not ship a third-party analytics SDK in the current phase.
Analytics on the host page (tags, UTM, tag managers) remain under your control
and your privacy policy.

---

## Security and hosting

- Tours are served over **HTTPS**.
- Embeds need your IT to allow the agreed iframe host (CSP / frame settings).
- See [EMBED.md](../ops/EMBED.md) for the technical embed checklist.

---

## What we ask clients to acknowledge

Before launch with Tour Guide enabled, please confirm you understand that
visitor questions are sent to the Tour Guide service to generate answers about
the tour, and that personal or health information should not be submitted in
chat.

Content approval (copy, naming prices, media rights) remains a separate intake
item in [CLIENT_REQUIRED_INFORMATION.md](./CLIENT_REQUIRED_INFORMATION.md).
