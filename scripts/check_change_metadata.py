#!/usr/bin/env python3
"""check_change_metadata.py — Gate de metadados de mudança para IntensiCare V2.

Escopo
------
Implementa `docs/14-devsecops-and-delivery/politica-de-metadados-de-mudanca.md`:
todo Pull Request deve referenciar, no corpo do PR OU em pelo menos um
commit do intervalo `<base>..<head>`, ao menos um ID pertencente à
taxonomia de rastreabilidade (`docs/00-governance/traceability-policy.md`
§1/§1.1).

Uso
---
    python3 scripts/check_change_metadata.py --base <sha> --head <sha>

Onde `--base` e `--head` são referências resolvíveis pelo `git` local
(SHAs completos ou curtos, nomes de branch/tag). Em CI (ver
`.github/workflows/metadados-gates.yml`), estes são preenchidos a partir
de `github.event.pull_request.base.sha` e `...head.sha`.

O corpo do PR é lido, best-effort, do payload do evento do GitHub Actions
(`$GITHUB_EVENT_PATH`, campo `pull_request.body`) quando presente. Fora de
um runner do GitHub Actions (ex.: execução local), essa fonte
simplesmente não contribui nenhum texto — o gate ainda funciona apenas
com os commits do intervalo.

Prefixos reconhecidos
----------------------
Union de três conjuntos, todos já documentados em
`docs/00-governance/traceability-policy.md` — este script não inventa
nenhum prefixo novo (anti-padrão 5):

  1. Os 17 prefixos ratificados em §1 (taxonomia do prompt) mais `RISK`,
     que já está entre eles.
  2. As 4 extensões de governança do mesmo §1 (`EVID`, `ASM`, `GDEC`,
     `BLK`).
  3. `SPR`, `OS` e `THR` — citados explicitamente na instrução desta
     tarefa (§15.1 item G) como exemplos obrigatórios do campo "IDs
     rastreados (Refs:)" do template de PR. `SPR` também está listado em
     `traceability-policy.md` §1.1 (rótulo document-local ao par
     mapa+backlog). `THR` está listado no mesmo §1.1 (pendente de
     ratificação, mas já "usável para cross-referencing entre documentos"
     por regra explícita daquela seção). `OS` ("ordem de serviço") é
     usado de forma consistente em todo o repositório (ex.: OS-16,
     OS-19) mas não está formalmente listado em nenhuma das duas seções
     da política de rastreabilidade — incluído aqui apenas porque a
     instrução desta tarefa o cita nominalmente como prefixo esperado no
     campo Refs:.

Este conjunto é deliberadamente **não exaustivo** em relação a todo o
§1.1 (que também lista `CRV`, `QAS`, `IDP`, `IDN`, `NIU`, `SM`, `HM`,
`WF`, `UR`, `MD`, `MG`, `EPC`, `SR`, `OC` — a maioria document-local a um
único par de documentos, alguns fora do formato `<PREFIX>-<NNNN>`
exigido por `traceability-policy.md` §2 regra 1). Alargar este conjunto é
uma mudança de baixo risco (não inventa ID novo, apenas ensina o script a
reconhecer um prefixo já documentado em outro lugar) — não deve ser feita
silenciosamente; registre o motivo aqui, como as três notas acima fazem.

Design
------
* Pure Python 3 stdlib, mesma convenção de `check_doc_conventions.py` e
  `check_forbidden_content.py` (sem dependência de terceiros garantida no
  runner).
* Falha (`exit 1`) sempre que nenhuma referência reconhecível for
  encontrada, ou quando o intervalo git não puder ser resolvido — um erro
  silencioso (`exit 0` por engano) seria pior que um falso-negativo
  ocasional, na mesma lógica de "vermelho continua vermelho" de
  `INTENSICARE_V2_ORCHESTRATOR_PROMPT.md` §3 regra 13.
* Não resolve o ID citado contra nenhum catálogo/registro — apenas
  reconhece a *forma* `<PREFIX>-<sufixo alfanumérico>`. Ver
  `politica-de-metadados-de-mudanca.md` §3.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys

# Grupo 1 — taxonomia núcleo, traceability-policy.md §1 (17 prefixos do
# prompt, RISK incluso).
CORE_TAXONOMY_PREFIXES = {
    "OUT", "USR", "PRD", "CLR", "SAF", "SEC", "NFR", "ADR", "DOM", "API",
    "EVT", "UX", "OPS", "TST", "VAL", "HAZ", "RISK",
}

# Grupo 2 — extensões de governança do mesmo §1.
GOVERNANCE_PREFIXES = {"EVID", "ASM", "GDEC", "BLK"}

# Grupo 3 — citados explicitamente na instrução desta tarefa (ver
# docstring do módulo, "Prefixos reconhecidos", itens 3).
TASK_CITED_PREFIXES = {"SPR", "OS", "THR"}

RECOGNIZED_PREFIXES = (
    CORE_TAXONOMY_PREFIXES | GOVERNANCE_PREFIXES | TASK_CITED_PREFIXES
)

# `\b<PREFIXO>-<primeiro caractere alfanumérico>` — não valida a forma
# completa do ID (dígitos, largura, sufixo composto tipo CRV-SOFA-0301),
# apenas detecta presença de uma referência plausível. Ordena por
# comprimento decrescente antes de montar a alternância para que nenhum
# prefixo mais curto capture parcialmente um mais longo (não há colisão
# de prefixo-substring no conjunto atual, mas a ordenação é defensiva).
_ALTERNATION = "|".join(
    re.escape(p) for p in sorted(RECOGNIZED_PREFIXES, key=len, reverse=True)
)
ID_REFERENCE_RE = re.compile(rf"\b(?:{_ALTERNATION})-[A-Za-z0-9]")


def find_references(text: str) -> list[str]:
    """Retorna a lista (não deduplicada) de trechos que casam com o
    padrão de ID reconhecido, cada um capturado como a menor janela
    `<PREFIXO>-<sufixo alfanumérico contíguo>` a partir do ponto de
    casamento — suficiente para reportar ao usuário o que foi achado sem
    pretender ser um parser completo de ID."""
    refs = []
    # Reaplica um padrão mais generoso para capturar o sufixo inteiro
    # (dígitos/letras/hífens), só para fins de relatório legível.
    full_re = re.compile(rf"\b(?:{_ALTERNATION})-[A-Za-z0-9][A-Za-z0-9-]*")
    for m in full_re.finditer(text):
        refs.append(m.group(0))
    return refs


def read_pr_body() -> str:
    """Best-effort: lê o corpo do PR do payload do evento do GitHub
    Actions, se disponível. Retorna string vazia se não estiver rodando
    em um evento de pull_request ou se o arquivo/campo não existir —
    nunca lança exceção, pois esta é uma fonte opcional."""
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path or not os.path.isfile(event_path):
        return ""
    try:
        with open(event_path, "r", encoding="utf-8") as f:
            payload = json.load(f)
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return ""
    pr = payload.get("pull_request")
    if not isinstance(pr, dict):
        return ""
    body = pr.get("body")
    return body if isinstance(body, str) else ""


def read_commit_messages(repo_root: str, base: str, head: str) -> tuple[list[str], str | None]:
    """Retorna (lista de mensagens de commit completas, erro-ou-None).

    Em caso de erro de resolução do intervalo (ref inexistente, não é um
    repositório git, etc.), retorna lista vazia e uma mensagem de erro
    pt-BR — o chamador decide como reportar."""
    try:
        result = subprocess.run(
            [
                "git", "log", "--no-color",
                f"--pretty=format:%H%x1f%B%x1e",
                f"{base}..{head}",
            ],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        return [], "o executável 'git' não foi encontrado neste ambiente."

    if result.returncode != 0:
        stderr = (result.stderr or "").strip()
        return [], (
            f"'git log {base}..{head}' falhou (código {result.returncode}). "
            f"Verifique se ambas as referências existem localmente (histórico "
            f"completo pode ser necessário — 'fetch-depth: 0' em CI). "
            f"Detalhe: {stderr}"
        )

    raw = result.stdout
    entries = [e for e in raw.split("\x1e") if e.strip()]
    messages = []
    for entry in entries:
        # cada entry é "<hash>\x1f<corpo completo da mensagem>"
        parts = entry.split("\x1f", 1)
        msg = parts[1] if len(parts) == 2 else parts[0]
        messages.append(msg)
    return messages, None


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Verifica se o PR (corpo) ou os commits do intervalo "
            "<base>..<head> referenciam ao menos um ID da taxonomia de "
            "rastreabilidade, per politica-de-metadados-de-mudanca.md."
        )
    )
    parser.add_argument("--base", required=True, help="Referência git base (ex.: SHA do commit base do PR).")
    parser.add_argument("--head", required=True, help="Referência git head (ex.: SHA do commit head do PR).")
    args = parser.parse_args()

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    pr_body = read_pr_body()
    commit_messages, git_error = read_commit_messages(repo_root, args.base, args.head)

    if git_error is not None and not pr_body:
        # Sem commits legíveis E sem corpo de PR: não há nada a verificar
        # e a causa mais provável é um problema de configuração do
        # checkout/intervalo — falha alto e claro em vez de passar por
        # ausência de sinal.
        print(
            "check_change_metadata: FALHA — não foi possível ler commits "
            f"do intervalo '{args.base}..{args.head}' nem um corpo de PR.\n"
            f"  - git: {git_error}\n"
            "Fix: confirme que o checkout tem histórico suficiente "
            "(fetch-depth: 0 ou ao menos os dois SHAs) e que --base/--head "
            "foram passados corretamente. Se rodando fora de um evento de "
            "pull_request do GitHub Actions, o corpo do PR não está "
            "disponível — nesse caso os commits são a única fonte."
        )
        return 1

    if git_error is not None:
        print(
            "check_change_metadata: AVISO — não foi possível ler commits "
            f"do intervalo '{args.base}..{args.head}' ({git_error}); "
            "verificando apenas o corpo do PR."
        )

    pr_refs = find_references(pr_body) if pr_body else []
    commit_refs: list[str] = []
    for msg in commit_messages:
        commit_refs.extend(find_references(msg))

    all_refs = pr_refs + commit_refs

    if not all_refs:
        prefixes_list = ", ".join(f"{p}-" for p in sorted(RECOGNIZED_PREFIXES))
        print(
            "check_change_metadata: FALHA — nenhuma referência a ID da "
            "taxonomia de rastreabilidade foi encontrada no corpo do PR "
            f"nem nos {len(commit_messages)} commit(s) do intervalo "
            f"'{args.base}..{args.head}'.\n\n"
            "Fix: adicione ao menos uma referência (ex.: 'Refs: GDEC-0017, "
            "SPR-G7-1') no corpo do PR (.github/PULL_REQUEST_TEMPLATE.md, "
            "seção 'IDs rastreados') ou no título/corpo de pelo menos um "
            "commit do intervalo. Prefixos reconhecidos: "
            f"{prefixes_list}\n\n"
            "Ver docs/14-devsecops-and-delivery/politica-de-metadados-de-"
            "mudanca.md e docs/00-governance/traceability-policy.md §1/§1.1."
        )
        return 1

    unique_refs = sorted(set(all_refs))
    print(
        "check_change_metadata: OK — referência(s) a ID de taxonomia "
        f"encontrada(s): {', '.join(unique_refs)} "
        f"(corpo do PR: {len(pr_refs)} ocorrência(s); "
        f"commits ({len(commit_messages)} lido(s)): "
        f"{len(commit_refs)} ocorrência(s))."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
