# Public Data Boundary

## Tracked and public

- Generic application and service source code
- Versioned contracts and schemas
- Synthetic fixtures and test data
- Generic deployment templates with placeholders
- Public architecture, Program, ADR and governance documents
- Public CI and Ruleset recipes

## Never tracked

- Real hospital or campus names, logos and organization codes
- Real employee, department, patient, diagnosis, identity or encounter data
- Internal IP addresses, DNS names, server roles, firewall rules and asset identifiers
- Real HIS/API/database/Redis/SSO endpoints and field mappings that disclose deployment details
- Passwords, API keys, tokens, client secrets, encryption keys and signing material
- Production certificates, certificate fingerprints and private keys
- Runtime logs, screenshots, traces, database dumps, backups and internal evidence
- Environment-specific Nginx/systemd/Windows deployment files

## Approved synthetic namespace

Use only clearly synthetic values in tracked examples:

```text
Example Hospital
workspace.example.internal
auth.example.internal
10.0.0.0/24
synthetic-user-001
synthetic-department-001
synthetic-patient-001
```

## Local configuration

Create private files only under ignored paths. Start from the examples in `config/examples/` and never remove the ignore rules to make deployment easier.

## Verification

Run:

```text
python tools/validate_repository.py
python tools/validate_repository.py --git-index
```

The checker is a minimum control. Human staged-diff review remains mandatory.
