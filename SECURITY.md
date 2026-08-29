# Security Policy

## Reporting a vulnerability

Do not disclose vulnerabilities, hospital topology, credentials, patient data or exploit details in a public Issue or Discussion.

Use GitHub's private vulnerability reporting/security advisory channel for this repository. If that channel is unavailable, contact the repository owner privately before sharing technical details.

## Public-data boundary

This repository must never contain real hospital configuration, internal network details, credentials, certificates/private keys, real identities, patient data, logs, dumps, backups or production evidence.

See `PUBLIC-DATA-BOUNDARY.md` and run:

```text
python tools/validate_repository.py --git-index
```

before committing.
