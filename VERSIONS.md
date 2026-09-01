# Versions

| Component | Version | Checked |
|---|---|---|
| `@modelcontextprotocol/sdk` | ^1.30.0 | 2026-09-01 |
| `zod` | ^3.23.8 | 2026-09-01 |
| Node | >= 20 | 2026-09-01 |
| Vimeo API | 3.4 | 2026-09-01 |

## 1.0.0

First release. 43 tools across videos, folders, showcases, chapters, captions
and transcripts, comments, tags, privacy and embed presets.

Notes from the build, verified against the live API on 2026-09-01:

- Vimeo fixes a token's scopes at creation. `delete` and `video_files` are off
  by default and cannot be added afterwards, so `doctor` names every tool that
  a missing scope disables rather than leaving it to a 403.
- Analytics and teams answer 404 on a free plan rather than 402.
  `get_video_analytics` translates that into a plain explanation.
- The bulk folder endpoints take their video list as a `uris` query parameter.
  The bulk showcase endpoint takes a `videos` body field and replaces the
  showcase contents, so it is deliberately not exposed.
- The published 3.4 OpenAPI mirror has no chapter paths, while the live API
  serves them. Chapter support was verified against the live API.
