# Things to confirm

Every item below is shown on the live site in square brackets until you replace it.
`pnpm check:content` (after a build) fails if a bracketed placeholder appears on any
page and is not listed here, so this file cannot go out of date quietly.

**How to fill them in**

- Items marked **SITE** live in [`src/content/site.ts`](src/content/site.ts). Change the value there once and it updates everywhere, including inside sentences in `content.json`.
- Everything else is copy in [`content.json`](content.json). Search for the exact text, replace it, rebuild.

## Reply time (SITE)

| Exact text   | Where it shows                                                                                                                                            | Change it in     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `[24 hours]` | Home hero "Reply within [24 hours]", the contact band, footer "Replies within [24 hours]", How we work (CTA band and "One clear channel"), Thank you page | `SITE.replyTime` |

The phone number, email, Instagram and WhatsApp channel are now real and live in `SITE` in the same file. They are not placeholders.

## Tool logos (src/content/site.ts)

The brand logos shown on the Services rows, "How it feels", the service pages and the About page are the tools we **list** for each service (`SERVICE_VISUALS[slug].tools` and `ABOUT_TOOLS` in `src/content/site.ts`, marked `CONFIRM: only keep logos for tools we really use`). Remove any tool you do not really use. The logos are trademarks of their owners and are used only to show the tools we work with. The scene images also show tool logos; if you drop a tool, regenerate or replace that scene.

## Payment, ownership and process terms (content.json)

| Exact text           | Page                                                                              | Notes                                                                                    |
| -------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `[terms to confirm]` | How we work, Plan stage: "A deposit to begin [terms to confirm]."                 | `how[1].need`                                                                            |
| `[Terms to confirm]` | How we work, "Paid in stages" card                                                | `workingTerms[3]`                                                                        |
| `[To confirm]`       | How we work, "It is yours" card ("...when the project is paid for. [To confirm]") | `workingTerms[1]`                                                                        |
| `[weekly]`           | How we work, Build stage: "A demo link [weekly]."                                 | `how[2].get`                                                                             |
| `[2 days]`           | How we work, Build stage: "Feedback within [2 days] of each demo."                | `how[2].need`                                                                            |
| `[To confirm]`       | About page, under the tools list ("Tools we use most")                            | `about.tools.note`. Also confirm the list itself, `ABOUT_TOOLS` in `src/content/site.ts` |

## Service FAQ answers (content.json)

| Exact text                                                                              | Page                                                          |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `[To confirm: code and designs are handed to you when the project is paid for.]`        | Web applications, FAQ "Who owns the code?"                    |
| `[To confirm: store developer accounts are in your name and paid by you.]`              | Mobile apps, FAQ "Who pays the store fees?"                   |
| `[To confirm: exact setup per project.]`                                                | Management systems, FAQ "Is our data safe?"                   |
| `[To confirm: typical first signals appear in X to Y weeks, depending on the channel.]` | Digital marketing, FAQ "How long until we see results?"       |
| `[To confirm: typically X to Y days, depending on the size of the business.]`           | Tech consulting and automation, FAQ "How long is the review?" |

## Not placeholders, but please check

- **Hero status chips** ("Booking confirmed", "New enquiry", "Process automated") on the home hero are decorative interface labels from the design, not claims. They are hidden from screen readers.
- **Button colour.** The primary gradient now starts at `#3B66F0` (the approved design had `#4F7BFF`) so white button text passes AA (4.8:1). Everything else about the buttons is unchanged.
- **Open Graph image** (`public/og.png`) uses the headline "We engineer growth for your business." Regenerate with `pnpm assets` if the headline changes.
