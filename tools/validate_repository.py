#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import sys
import tomllib
from collections import defaultdict, deque
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML is required. Run: python -m pip install -r tools/requirements-bootstrap.txt", file=sys.stderr)
    raise SystemExit(2)

ROOT = Path(__file__).resolve().parents[1]
TEXT_SUFFIXES = {".md", ".yaml", ".yml", ".json", ".toml", ".txt", ".py", ".ps1", ".sh", ".ts", ".tsx", ".js", ".mjs", ".rs", ".prisma", ".env"}
REQUIRED = [
    ".gitignore", ".gitattributes", ".editorconfig", "AGENTS.md", "README.md",
    "SECURITY.md", "CONTRIBUTING.md", "COPYRIGHT.md", "PUBLIC-DATA-BOUNDARY.md",
    ".github/workflows/checks.yml", ".github/rulesets/main-protection.json",
    ".github/PATH-OWNERSHIP.yaml", "docs/program/ROADMAP.md",
    "docs/program/tasks/HW-00.yaml", "docs/adr/0008-public-single-repository-and-externalized-private-config.md",
    "docs/governance/SOL-ACCEPTANCE-POLICY.md",
    "docs/program/prompts/SOL-TASK-ACCEPTANCE.md",
    "docs/program/prompts/SOL-ARCHITECTURE-SECURITY.md",
    "docs/program/prompts/SOL-PHASE-GATE.md",
    "docs/program/templates/SOL-TASK-ACCEPTANCE-REPORT.md",
    "docs/program/templates/SOL-ARCHITECTURE-SECURITY-REPORT.md",
    "docs/program/templates/SOL-PHASE-GATE-REPORT.md",
]
BANNED_PATH_PARTS = {
    "config/local", "config/private", "runtime-config", "deploy/private", "deploy/targets",
    "certificates/local", "certificates/private", "branding/private", "secrets", "evidence/private",
}
BANNED_EXTENSIONS = {".key", ".p12", ".pfx", ".jks", ".keystore", ".kdb", ".csr", ".srl"}
BANNED_PATTERNS = [
    ("private_ipv4", re.compile(r"\b(?:10\.(?!0\.0\.)\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b")),
    ("internal_hostname", re.compile(r"\b(?![a-z0-9.-]*example\.internal\b)[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:local|lan|corp)\b", re.I)),
    ("private_key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
]
REQUIRED_IGNORE = [
    ".env", "config/local/", "config/private/", "runtime-config/", "deploy/private/",
    "deploy/targets/", "certificates/local/", "certificates/private/", "branding/private/",
    "secrets/", "evidence/private/", "*.key", "*.pfx", "*.p12",
]
EXPECTED_CUSTOM_AGENTS = {
    "luna_docs", "luna_explorer", "luna_fixtures", "luna_inventory",
    "terra_browser", "terra_contracts", "terra_migrator", "terra_reviewer",
    "terra_security", "terra_tester", "terra_worker",
    "sol_acceptance", "sol_architecture_security", "sol_phase_gate",
}
VALID_MODELS = {"gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol"}
VALID_PROGRAM_AGENTS = EXPECTED_CUSTOM_AGENTS | {"parent_codex"}
VALID_ACCEPTANCE_AGENTS = {
    "terra_reviewer", "terra_security", "sol_acceptance",
    "sol_architecture_security", "sol_phase_gate",
}
VALID_ACCEPTANCE_TIERS = {"terra", "sol-acceptance", "sol-architecture-security", "sol-phase-gate"}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def tracked_files() -> list[Path] | None:
    if not (ROOT / ".git").exists():
        return None
    cp = subprocess.run(["git", "-C", str(ROOT), "ls-files", "-z"], capture_output=True, check=True)
    return [ROOT / x.decode("utf-8") for x in cp.stdout.split(b"\0") if x]


def candidate_files(index_only: bool) -> list[Path]:
    tracked = tracked_files()
    if index_only and tracked is None:
        raise RuntimeError("--git-index requires an initialized Git repository")
    if tracked is not None:
        return [p for p in tracked if p.is_file()]
    return [p for p in ROOT.rglob("*") if p.is_file() and ".git" not in p.parts and "__pycache__" not in p.parts]


def parse_structured(files: list[Path], errors: list[str]) -> None:
    for p in files:
        rp = rel(p)
        try:
            if p.suffix == ".json":
                json.loads(p.read_text(encoding="utf-8-sig"))
            elif p.suffix == ".toml":
                tomllib.loads(p.read_text(encoding="utf-8-sig"))
            elif p.suffix in {".yaml", ".yml"}:
                yaml.safe_load(p.read_text(encoding="utf-8-sig"))
        except Exception as exc:
            errors.append(f"structured-parse:{rp}:{exc}")


def check_agents(errors: list[str]) -> None:
    agent_dir = ROOT / ".codex/agents"
    actual: set[str] = set()
    for path in sorted(agent_dir.glob("*.toml")):
        try:
            data = tomllib.loads(path.read_text(encoding="utf-8-sig"))
        except Exception as exc:
            errors.append(f"agent-parse:{rel(path)}:{exc}")
            continue
        name = data.get("name")
        if not isinstance(name, str) or not name:
            errors.append(f"agent-missing-name:{rel(path)}")
            continue
        actual.add(name)
        for field in ("description", "developer_instructions", "model", "model_reasoning_effort", "sandbox_mode"):
            if field not in data:
                errors.append(f"agent-missing-field:{name}:{field}")
        model = data.get("model")
        if model not in VALID_MODELS:
            errors.append(f"agent-unapproved-model:{name}:{model}")
        sandbox = data.get("sandbox_mode")
        if sandbox not in {"read-only", "workspace-write"}:
            errors.append(f"agent-invalid-sandbox:{name}:{sandbox}")
        if name.startswith("sol_"):
            if model != "gpt-5.6-sol":
                errors.append(f"sol-agent-wrong-model:{name}:{model}")
            if sandbox != "read-only":
                errors.append(f"sol-agent-not-read-only:{name}:{sandbox}")
    if actual != EXPECTED_CUSTOM_AGENTS:
        errors.append(f"custom-agent-set-mismatch:expected-{sorted(EXPECTED_CUSTOM_AGENTS)}:actual-{sorted(actual)}")

    config = tomllib.loads((ROOT / ".codex/config.toml").read_text(encoding="utf-8-sig"))
    agents = config.get("agents", {})
    if agents.get("enabled") is not True:
        errors.append("codex-agents-not-enabled")
    if agents.get("max_concurrent_threads_per_session") != 8:
        errors.append("codex-agent-thread-limit-must-be-8")
    if agents.get("default_subagent_model") == "gpt-5.6-sol":
        errors.append("sol-must-not-be-default-subagent")


def check_program(errors: list[str]) -> tuple[dict[str, dict], dict[str, dict]]:
    phase_files = sorted((ROOT / "docs/program/tasks").glob("HW-*.yaml"))
    if len(phase_files) != 13:
        errors.append(f"phase-task-file-count:expected-13:actual-{len(phase_files)}")

    phases: dict[str, dict] = {}
    tasks: dict[str, dict] = {}
    task_source: dict[str, str] = {}
    for path in phase_files:
        data = yaml.safe_load(path.read_text(encoding="utf-8-sig"))
        if not isinstance(data, dict):
            errors.append(f"phase-not-mapping:{rel(path)}")
            continue
        phase_id = data.get("id")
        if not isinstance(phase_id, str) or not re.fullmatch(r"HW-[0-9]{2}", phase_id):
            errors.append(f"invalid-phase-id:{rel(path)}:{phase_id}")
            continue
        if phase_id in phases:
            errors.append(f"duplicate-phase-id:{phase_id}")
        phases[phase_id] = data

        policy = data.get("acceptance_policy")
        if not isinstance(policy, dict):
            errors.append(f"phase-acceptance-policy-missing:{phase_id}")
        else:
            gate = policy.get("phase_gate")
            if not isinstance(gate, dict):
                errors.append(f"phase-gate-policy-missing:{phase_id}")
            else:
                required = gate.get("required_agents") or []
                if "sol_phase_gate" not in required:
                    errors.append(f"phase-gate-missing-sol:{phase_id}")
                if gate.get("required_sol_phase_outcome") != "PASS_RECOMMENDED":
                    errors.append(f"phase-gate-outcome-invalid:{phase_id}")
                if gate.get("final_decision_owner") != "parent_codex":
                    errors.append(f"phase-final-owner-invalid:{phase_id}")
            if not isinstance(policy.get("sol_unavailable"), str) or "BLOCKED" not in policy.get("sol_unavailable", ""):
                errors.append(f"phase-sol-unavailable-policy-invalid:{phase_id}")

        phase_tasks = data.get("tasks")
        if not isinstance(phase_tasks, list) or not phase_tasks:
            errors.append(f"phase-tasks-missing:{phase_id}")
            continue
        for task in phase_tasks:
            if not isinstance(task, dict):
                errors.append(f"task-not-mapping:{phase_id}")
                continue
            task_id = task.get("id")
            if not isinstance(task_id, str) or not re.fullmatch(r"HW[0-9]{2}-[0-9]{2}", task_id):
                errors.append(f"invalid-task-id:{phase_id}:{task_id}")
                continue
            if task_id in tasks:
                errors.append(f"duplicate-task:{task_id}")
            tasks[task_id] = task
            task_source[task_id] = rel(path)

            for field in (
                "title", "primary_owner", "supporting_agents", "execution_mode", "parallel_group",
                "risk", "depends_on", "allowed_paths", "objective", "steps", "validation",
                "acceptance", "evidence", "stop_if", "acceptance_tier",
                "acceptance_agents", "acceptance_outcome",
            ):
                if field not in task:
                    errors.append(f"task-missing-field:{task_id}:{field}")

            if task.get("primary_owner") not in VALID_PROGRAM_AGENTS:
                errors.append(f"task-unknown-primary-owner:{task_id}:{task.get('primary_owner')}")
            for agent in task.get("supporting_agents") or []:
                if agent not in VALID_PROGRAM_AGENTS:
                    errors.append(f"task-unknown-supporting-agent:{task_id}:{agent}")
            if not task.get("allowed_paths"):
                errors.append(f"task-empty-allowed-paths:{task_id}")
            if len(task.get("stop_if") or []) < 3:
                errors.append(f"task-insufficient-stop-rules:{task_id}")

            tier = task.get("acceptance_tier")
            acceptance_agents = task.get("acceptance_agents") or []
            outcome = task.get("acceptance_outcome")
            if tier not in VALID_ACCEPTANCE_TIERS:
                errors.append(f"task-invalid-acceptance-tier:{task_id}:{tier}")
            if not isinstance(acceptance_agents, list) or not acceptance_agents:
                errors.append(f"task-empty-acceptance-agents:{task_id}")
            else:
                for agent in acceptance_agents:
                    if agent not in VALID_ACCEPTANCE_AGENTS:
                        errors.append(f"task-invalid-acceptance-agent:{task_id}:{agent}")
            if tier == "terra" and (acceptance_agents != ["terra_reviewer"] or outcome != "APPROVED"):
                errors.append(f"task-terra-route-invalid:{task_id}")
            elif tier == "sol-acceptance" and ("sol_acceptance" not in acceptance_agents or outcome != "ACCEPT"):
                errors.append(f"task-sol-acceptance-route-invalid:{task_id}")
            elif tier == "sol-architecture-security" and ("sol_architecture_security" not in acceptance_agents or outcome != "ACCEPT"):
                errors.append(f"task-sol-architecture-route-invalid:{task_id}")
            elif tier == "sol-phase-gate" and ("sol_phase_gate" not in acceptance_agents or outcome != "PASS_RECOMMENDED"):
                errors.append(f"task-sol-phase-route-invalid:{task_id}")

        final_task = phase_tasks[-1]
        if final_task.get("acceptance_tier") != "sol-phase-gate" or "sol_phase_gate" not in (final_task.get("acceptance_agents") or []):
            errors.append(f"phase-final-task-not-sol-gate:{phase_id}:{final_task.get('id')}")

    expected_phases = {f"HW-{i:02d}" for i in range(13)}
    if set(phases) != expected_phases:
        errors.append(f"phase-id-set-mismatch:expected-{sorted(expected_phases)}:actual-{sorted(phases)}")
    if len(tasks) != 103:
        errors.append(f"task-count:expected-103:actual-{len(tasks)}")

    # Phase DAG.
    phase_indeg = {x: 0 for x in phases}
    phase_adj: dict[str, list[str]] = defaultdict(list)
    for phase_id, data in phases.items():
        for dep in data.get("dependsOn", []) or []:
            if dep not in phases:
                errors.append(f"unknown-phase-dependency:{phase_id}->{dep}")
                continue
            phase_adj[dep].append(phase_id)
            phase_indeg[phase_id] += 1
    queue = deque([x for x, d in phase_indeg.items() if d == 0])
    phase_seen = 0
    while queue:
        current = queue.popleft()
        phase_seen += 1
        for nxt in phase_adj[current]:
            phase_indeg[nxt] -= 1
            if phase_indeg[nxt] == 0:
                queue.append(nxt)
    if phase_seen != len(phases):
        errors.append("phase-dependency-cycle")

    # Task DAG.
    indeg = {x: 0 for x in tasks}
    adj: dict[str, list[str]] = defaultdict(list)
    for task_id, task in tasks.items():
        for dep in task.get("depends_on", []) or []:
            if dep not in tasks:
                errors.append(f"unknown-task-dependency:{task_id}->{dep}")
                continue
            adj[dep].append(task_id)
            indeg[task_id] += 1
    queue = deque([x for x, d in indeg.items() if d == 0])
    task_seen = 0
    while queue:
        current = queue.popleft()
        task_seen += 1
        for nxt in adj[current]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                queue.append(nxt)
    if task_seen != len(tasks):
        errors.append("task-dependency-cycle")

    return phases, tasks


def check_machine_projections(tasks: dict[str, dict], errors: list[str]) -> None:
    all_csv = ROOT / "docs/program/machine/all-work-packages.csv"
    tracker_csv = ROOT / "docs/program/machine/work-package-tracker.csv"
    with all_csv.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != 103:
        errors.append(f"all-work-packages-row-count:expected-103:actual-{len(rows)}")
    if {row.get("task_id") for row in rows} != set(tasks):
        errors.append("all-work-packages-task-set-mismatch")
    required_columns = {"acceptance_tier", "acceptance_agents", "acceptance_outcome"}
    if not required_columns.issubset(set(rows[0].keys()) if rows else set()):
        errors.append("all-work-packages-missing-sol-columns")
    for row in rows:
        tid = row.get("task_id")
        if not tid or tid not in tasks:
            continue
        task = tasks[tid]
        if row.get("acceptance_tier") != str(task.get("acceptance_tier")):
            errors.append(f"all-work-packages-tier-drift:{tid}")
        if row.get("acceptance_outcome") != str(task.get("acceptance_outcome")):
            errors.append(f"all-work-packages-outcome-drift:{tid}")

    with tracker_csv.open(encoding="utf-8-sig", newline="") as handle:
        tracker = list(csv.DictReader(handle))
    if len(tracker) != 103:
        errors.append(f"tracker-row-count:expected-103:actual-{len(tracker)}")
    tracker_columns = {"acceptance_tier", "acceptance_agents", "required_acceptance_outcome", "sol_acceptance_status"}
    if not tracker_columns.issubset(set(tracker[0].keys()) if tracker else set()):
        errors.append("tracker-missing-sol-columns")

    summary = json.loads((ROOT / "docs/program/machine/package-summary.json").read_text(encoding="utf-8-sig"))
    if summary.get("customAgentCount") != 14:
        errors.append(f"package-summary-agent-count:{summary.get('customAgentCount')}")
    if summary.get("customAgents") != {"luna": 4, "terra": 7, "sol": 3}:
        errors.append(f"package-summary-agent-breakdown:{summary.get('customAgents')}")
    if summary.get("workPackageCount") != 103 or summary.get("phaseCount") != 13:
        errors.append("package-summary-program-count-drift")

    baseline = json.loads((ROOT / "docs/program/machine/baseline-manifest.json").read_text(encoding="utf-8-sig"))
    strategy = baseline.get("acceptanceStrategy", {})
    if not isinstance(strategy.get("sol"), dict):
        errors.append("baseline-manifest-missing-sol-strategy")
    if strategy.get("finalEngineeringDecision") != "parent_codex":
        errors.append("baseline-manifest-final-owner-invalid")


def check_public_boundary(files: list[Path], errors: list[str]) -> None:
    for p in files:
        rp = rel(p)
        lower = rp.lower()
        for banned in BANNED_PATH_PARTS:
            if lower == banned or lower.startswith(banned + "/"):
                errors.append(f"banned-tracked-path:{rp}")
        if p.suffix.lower() in BANNED_EXTENSIONS:
            errors.append(f"banned-extension:{rp}")
        if p.suffix.lower() == ".pem" and not (rp.endswith(".example.pem") or rp.startswith("certificates/test-public/")):
            errors.append(f"unapproved-pem:{rp}")
        if p.suffix.lower() not in TEXT_SUFFIXES and p.name not in {".gitignore", ".gitattributes", ".editorconfig"}:
            continue
        if rp == "tools/validate_repository.py":
            continue
        try:
            text = p.read_text(encoding="utf-8-sig", errors="strict")
        except Exception:
            continue
        for name, pattern in BANNED_PATTERNS:
            for match in pattern.finditer(text):
                line = text.count("\n", 0, match.start()) + 1
                errors.append(f"public-pattern:{name}:{rp}:{line}")


def check_ignores(errors: list[str]) -> None:
    text = (ROOT / ".gitignore").read_text(encoding="utf-8")
    for pattern in REQUIRED_IGNORE:
        if pattern not in text:
            errors.append(f"missing-gitignore-pattern:{pattern}")


def check_ruleset(errors: list[str]) -> None:
    data = json.loads((ROOT / ".github/rulesets/main-protection.json").read_text(encoding="utf-8"))
    if data.get("enforcement") != "active":
        errors.append("ruleset-not-active")
    includes = data.get("conditions", {}).get("ref_name", {}).get("include", [])
    if "~DEFAULT_BRANCH" not in includes:
        errors.append("ruleset-does-not-target-default-branch")
    types = {x.get("type") for x in data.get("rules", [])}
    for required in {"deletion", "non_fast_forward", "pull_request", "required_status_checks"}:
        if required not in types:
            errors.append(f"ruleset-missing:{required}")
    checks = []
    for rule in data.get("rules", []):
        if rule.get("type") == "required_status_checks":
            checks = [x.get("context") for x in rule.get("parameters", {}).get("required_status_checks", [])]
    if "checks" not in checks:
        errors.append("ruleset-missing-check-context:checks")
    workflow = (ROOT / ".github/workflows/checks.yml").read_text(encoding="utf-8")
    if not re.search(r"(?m)^\s{2}checks:\s*$", workflow):
        errors.append("workflow-job-name-must-be-checks")
    if "pull_request:" not in workflow or "push:" not in workflow:
        errors.append("workflow-missing-push-or-pr-trigger")


def check_text_quality(files: list[Path], errors: list[str]) -> None:
    for p in files:
        if p.suffix.lower() not in TEXT_SUFFIXES and p.name not in {".gitignore", ".gitattributes", ".editorconfig"}:
            continue
        try:
            raw = p.read_bytes()
            text = raw.decode("utf-8-sig")
        except Exception as exc:
            errors.append(f"text-encoding:{rel(p)}:{exc}")
            continue
        if b"\x00" in raw:
            errors.append(f"nul-byte:{rel(p)}")
        for offset, ch in enumerate(text):
            if ord(ch) < 32 and ch not in "\r\n\t":
                line = text.count("\n", 0, offset) + 1
                errors.append(f"unexpected-control-character:{rel(p)}:{line}:U+{ord(ch):04X}")
        if not text.endswith("\n"):
            errors.append(f"missing-final-newline:{rel(p)}")
        if p.suffix.lower() != ".md":
            for i, line in enumerate(text.splitlines(), start=1):
                if line.rstrip(" \t") != line:
                    errors.append(f"trailing-whitespace:{rel(p)}:{i}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--git-index", action="store_true", help="validate tracked/staged repository content")
    ap.add_argument("--report", default=None)
    args = ap.parse_args()
    errors: list[str] = []
    for required in REQUIRED:
        if not (ROOT / required).exists():
            errors.append(f"missing-required:{required}")
    files = candidate_files(args.git_index)
    parse_structured(files, errors)
    check_agents(errors)
    _, tasks = check_program(errors)
    check_machine_projections(tasks, errors)
    check_public_boundary(files, errors)
    check_ignores(errors)
    check_ruleset(errors)
    check_text_quality(files, errors)
    agents_size = len((ROOT / "AGENTS.md").read_bytes())
    if agents_size >= 32768:
        errors.append("root-AGENTS-exceeds-32KiB")
    report = {
        "schemaVersion": "hospital-workspace.repository-validation.v2",
        "root": str(ROOT),
        "fileCount": len(files),
        "phaseCountExpected": 13,
        "taskCountExpected": 103,
        "customAgentCountExpected": 14,
        "solAgentCountExpected": 3,
        "rootAgentsBytes": agents_size,
        "mode": "git-index" if args.git_index else "working-tree",
        "status": "PASS" if not errors else "FAIL",
        "errors": errors,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if args.report:
        Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
