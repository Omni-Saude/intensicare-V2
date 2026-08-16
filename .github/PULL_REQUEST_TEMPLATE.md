<!--
  PULL_REQUEST_TEMPLATE.md — IntensiCare V2

  Preencha todas as seções abaixo. Este template operacionaliza:
    - docs/00-governance/traceability-policy.md §4 (requisito de vínculo
      PR↔IDs rastreados);
    - docs/14-devsecops-and-delivery/politica-de-metadados-de-mudanca.md
      (política de metadados de mudança — commit/PR deve referenciar ao
      menos um ID rastreado);
    - docs/14-devsecops-and-delivery/politica-dados-sinteticos.md (dados
      sintéticos como default vinculante de desenvolvimento, GDEC-0014/
      GDEC-0017).

  O gate `.github/workflows/metadados-gates.yml` (bloqueante) verifica de
  forma automatizada apenas a presença de ao menos uma referência a ID da
  taxonomia no corpo deste PR ou nos commits do intervalo — ele NÃO
  verifica os demais campos abaixo por completude ou veracidade. O
  preenchimento honesto das demais seções é responsabilidade de quem abre
  o PR e de quem revisa (ver .github/CODEOWNERS).
-->

## Objetivo

<!-- Uma ou duas frases: o que este PR muda e por quê. -->



## Sprints do mapa (SPR-\*)

<!--
  Liste o(s) identificador(es) `SPR-Gn-m` do mapa até produção
  (docs/14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md) a que
  este PR corresponde. `SPR-*` é um rótulo document-local ao par
  mapa+backlog (traceability-policy.md §1.1) — cite-o mesmo assim, é a
  unidade de trabalho corrente.
  Se este PR não corresponde a nenhum sprint do mapa (ex.: correção
  pontual de governança/CI), escreva explicitamente "N/A — <motivo>", não
  deixe em branco.
-->

- Sprint(s):

## IDs rastreados (Refs:)

<!--
  Liste, por prefixo, todo ID da taxonomia (docs/00-governance/
  traceability-policy.md §1/§1.1) que este PR implementa, altera ou afeta
  — hazards e safety requirements mesmo quando NÃO alterados diretamente,
  se a mudança os toca (traceability-policy.md §4 item 2). Exemplos de
  prefixo: HAZ-, SAF-, ADR-, VAL-, GDEC-, OS-, RISK-, THR- (lista não
  exaustiva — use qualquer prefixo já ratificado ou listado em §1.1).

  Formato do trailer (repita também no(s) commit(s), conforme
  politica-de-metadados-de-mudanca.md): uma linha
    Refs: <ID>, <ID>, ...
  em algum lugar deste corpo de PR OU em pelo menos um commit do
  intervalo. O gate `check_change_metadata.py` falha se nenhuma
  referência a ID for encontrada em nenhum dos dois lugares.

  Não invente prefixo novo fora da taxonomia (anti-padrão 5,
  traceability-policy.md §1). Se precisar de um rótulo document-local
  ainda não ratificado, marque-o explicitamente "pendente de ratificação
  em traceability-policy.md §1.1".
-->

Refs:

## Confirmação de dados sintéticos

<!--
  Marque [x] apenas o que for verdadeiro. Nenhum dado real (CPF, PHI,
  portable_subject_ref real) pode entrar neste repositório em nenhuma
  circunstância — docs/14-devsecops-and-delivery/politica-dados-
  sinteticos.md, GDEC-0014/GDEC-0017.
-->

- [ ] Todo dado de exemplo, fixture ou teste introduzido/alterado por este
      PR é sintético, usando a convenção `SYNTH-` (ou `amh:psr:v1:SYNTH-*`
      para PSR) onde aplicável.
- [ ] Nenhum CPF formatado, e-mail real, credencial ou `portable_subject_ref`
      real foi adicionado.
- [ ] Este PR não introduz nem altera dado de exemplo/fixture (marcar se a
      confirmação acima não se aplica — ex.: PR só de documentação/CI).

## Confirmação de gates verdes

<!--
  Confirme que rodou os checks bloqueantes localmente ou que o CI do PR
  está verde antes de solicitar revisão. Os gates atuais (ver
  .github/workflows/) são: doc-conventions, forbidden-content (docs-
  gates.yml), build-and-test (ci-plataforma.yml, quando aplicável ao
  monorepo) e metadados-gates.yml.
-->

- [ ] `python3 scripts/check_doc_conventions.py` — verde.
- [ ] `python3 scripts/check_forbidden_content.py` — verde.
- [ ] `pnpm -r build` e `pnpm -r test -- --run` — verdes (se este PR toca
      `apps/`, `packages/` ou `pnpm-lock.yaml`; marcar N/A caso contrário).
- [ ] Todos os checks obrigatórios do CI deste PR estão verdes no momento
      da solicitação de revisão (não apenas localmente).

## Premissas novas registradas

<!--
  Regime MODO CONSTRUÇÃO (GDEC-0013/0015/0017): toda decisão material nova
  tomada neste PR é registrada como premissa reversível de uma linha, no
  próprio artefato que a adota, no formato:
    PREMISSA (reversível, GDEC-0015/0017): <decisão em uma frase>
  Nenhuma premissa fecha gate, bloqueador, risco ou hazard, nem constitui
  alegação de efetividade clínica, conformidade ou segurança comprovada.
-->

- [ ] Este PR não introduz nenhuma decisão material nova (marcar se
      verdadeiro — ex.: correção editorial, refatoração sem mudança de
      comportamento/decisão).
- [ ] Este PR introduz decisão(ões) material(is) nova(s); cada uma está
      registrada como `PREMISSA (reversível, GDEC-0015/0017): ...` no
      próprio arquivo alterado. Liste os arquivos/linhas abaixo:



## Notas adicionais para quem revisa (opcional)


