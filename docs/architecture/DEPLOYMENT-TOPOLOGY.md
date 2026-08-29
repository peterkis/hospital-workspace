# Deployment Topology

## Initial controlled environment

```text
Nginx / internal TLS
  ├─ immutable Workspace static releases
  ├─ Gateway/BFF
  ├─ Collaboration
  ├─ Hosp Access
  ├─ Tickets
  ├─ Fee
  ├─ Handover
  ├─ Agent Gateway
  └─ Knowledge

PostgreSQL 18
Redis
S3-compatible object storage
```

Initial deployment may use one server host for multiple processes, but each service has:

- independent working directory;
- env file;
- systemd unit;
- health/readiness;
- graceful stop;
- immutable release;
- rollback pointer;
- logs and metrics.

## Desktop

- x64 per-machine MSI;
- Tauri 2;
- Evergreen or controlled offline WebView2;
- no in-app updater until governance is approved;
- browser fallback remains available.

## TLS

Desktop packaging does not replace certificate governance.

- use internal DNS names;
- issue SAN-correct certificates from hospital CA;
- distribute root trust through managed endpoints;
- no global ignore-certificate-errors;
- exact pinned fallback only by explicit ADR and build feature.

## Release

```text
build
-> manifest/hash/secret/symlink checks
-> no-egress bundle
-> deploy new immutable directory
-> migrate with recovery point
-> start and health
-> switch registry/Nginx pointer
-> observe
-> rollback pointer if required
```

## Pilot and production

- HW-11 approves controlled pilot only.
- HW-12 closes capacity and HA blockers for production.
- A successful local build is not a deployment approval.
