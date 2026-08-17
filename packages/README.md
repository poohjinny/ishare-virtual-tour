# Shared packages

Cross-app contracts belong here once both applications consume them.

Planned extractions:

- `tour-schema` — `Tour`, `PublishedTourBundle`, runtime validation
- `tour-api-client` — typed viewer and admin API calls

Until extraction, the canonical viewer types remain in
`apps/tour-viewer/src/types/`.
