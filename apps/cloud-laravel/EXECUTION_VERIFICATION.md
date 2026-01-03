# Execution Verification for Domain Flows

The sandbox blocks Packagist, so direct Composer installs here fail. Use the Docker-based runner below to fetch dependencies and execute the domain feature tests in an isolated environment.

## Prerequisites
- Docker and Docker Compose available on the host.

## Steps
1. From `apps/cloud-laravel`, build the test image:
   ```bash
   docker compose -f docker-compose.test.yml build
   ```
2. Run the full test suite (uses the SQLite in-memory testing config from `phpunit.xml`):
   ```bash
   docker compose -f docker-compose.test.yml run --rm laravel-test
   ```

## Expected Results
- `composer install` completes inside the container.
- `php artisan test` executes the feature suite, including `DomainExecutionFlowTest`, proving:
  - License creation/assignment
  - Edge server creation/deletion
  - Camera creation/deletion
  - User assignment/deletion
  - Capability enforcement and rollbacks
- All tests pass with exit code 0. The container run will output the PHPUnit summary showing green status.

## Manual Verification (if Docker is unavailable)
Replicate the same commands locally after running `composer install` in `apps/cloud-laravel`, ensuring the `.env.testing` variables match those in `docker-compose.test.yml` (SQLite DB, fixed `APP_KEY`). Then run:
```bash
php artisan test
```
