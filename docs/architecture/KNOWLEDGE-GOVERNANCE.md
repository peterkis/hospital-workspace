# Knowledge Governance Architecture

## Knowledge as a work process

A Knowledge Project is not a folder of embeddings. It is a governed lifecycle:

```text
source acquired
-> parsed
-> proposal extracted
-> terminology/relationship normalized
-> reviewed
-> approved/rejected
-> active
-> superseded/retired
```

## Core entities

- KnowledgeProject
- SourceDocument
- SourceLocator
- KnowledgeNode
- KnowledgeRelation
- Claim
- KnowledgeVersion
- Review
- Decision
- Scope
- Artifact

## Scope

- hospital;
- campus;
- department;
- project.

A narrower scope does not automatically become visible to a broader scope.

## Status

- draft;
- in_review;
- approved;
- active;
- retired;
- rejected.

Retired content remains available to authorized reviewers and provenance queries.

## Human authority

Agent output is a proposal.

Only an authorized human review Decision can:

- approve;
- publish;
- supersede;
- retire;
- reject.

## Search

Search/index is derived:

- authorization and Scope apply before ranking;
- only approved/active content appears by default;
- results include node version and source references;
- index can be deleted and rebuilt;
- embeddings do not become the source of truth.

## Agent team

A knowledge Coordinator can assign:

- parser Worker;
- terminology Worker;
- FHIR Worker;
- relation Worker;
- quality Worker;
- review-preparation Worker.

Conflicts, low confidence and missing sources become blocked/waiting-user work items.
