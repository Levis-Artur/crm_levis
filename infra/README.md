# Infrastructure Notes

- `docker-compose.yml` lives at the repository root for discoverability and one-command startup.
- `infra/mysql` is reserved for future init scripts and seed/bootstrap SQL when the schema exists.
- `infra/redis` is reserved for future Redis config overrides if queue tuning is needed.
- `web` and `api` services are defined as placeholders under the Compose `app` profile so database/cache infra can start independently.
