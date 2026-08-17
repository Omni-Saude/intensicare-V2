# @intensicare/conformidade — harness §7.6 executável

Este pacote transforma os **22 cenários dirigidos pelo consumidor** de
[`docs/08-interoperability/conformance/contract-v1/cenarios-teste-consumidor.md`](../../docs/08-interoperability/conformance/contract-v1/cenarios-teste-consumidor.md)
— até aqui uma especificação **em texto**, com estado declarado `NÃO EXECUTADO` — em uma
**suíte que roda**, contra as **fixtures sintéticas pinadas** do repositório
(`docs/08-interoperability/amh-data/contract-v1/fixtures/`), e emite um relatório legível.

---

## LIMITE DURO — leia antes de qualquer número

1. **Isto NÃO demonstra compatibilidade com a AMH.** Nenhum cenário foi executado contra a AMH:
   não existe *sandbox* pinado, não existe manifesto de contrato publicado
   (`contract-manifest.draft.yaml`: `manifest_sha256: null`, `pinned: false`, `aceito: false`) e
   nenhum ambiente similar a produção está provisionado.
2. **NÃO altera o achado "candidato a integração".** Ele permanece exatamente como estava.
3. **NÃO move a matriz 47/47.** Os 47 hazards permanecem inelegíveis; `Observation` da AMH
   permanece não consumível; o *safety case* permanece M0; **0 vias acionáveis**.
4. **NÃO fecha gate, bloqueador, risco, hazard, ADR ou OS** — em particular, **não fecha o Gate
   G3**, cujas condições de dado povoado, ambiente similar a produção e falha/recuperação
   dependem das camadas 2-4 (`inventario-interfaces-e-matriz-compatibilidade.md` §3.1).
5. **NÃO demonstra o comportamento do produto.** O que a suíte exercita é a **implementação de
   referência** da camada anticorrupção que vive *neste pacote*, não o caminho de ingestão de
   `apps/api`. Ligar os dois é trabalho pendente (ver "Pendências").
6. **Nenhum dado real foi acessado.** Todas as fixtures são 100% sintéticas com marcador
   `SYNTH-`; nenhum PSR real, nenhum CPF formatado, nenhum identificador de fonte é reproduzido
   em relatório algum — o valor da fixture inválida fica em quarentena de acesso segregado e
   **não** entra no texto gerado (verificado por teste).

O que a suíte **pode** afirmar é o que `cenarios-teste-consumidor.md` §1 já delimitava: que a
camada anticorrupção **recusa o que deve recusar e preserva o que deve preservar**, de forma
determinística e replayável, sobre as fixtures que existem hoje.

---

## Como rodar

```bash
pnpm --filter @intensicare/conformidade test -- --run   # testes do próprio pacote
pnpm --filter @intensicare/conformidade report          # executa os 22 cenários e gera o relatório
```

O relatório é escrito em `reports/relatorio-conformidade.md` e um resumo vai para a saída padrão.
O comando sai com código `1` se o **pin local das fixtures** reprovar ou se algum cenário
**FALHAR**. Cenário `NÃO EXECUTÁVEL` **não** reprova a execução: é o estado esperado enquanto a
AMH não estiver acessível, e o mapa pede *"22/22 executados (não necessariamente verdes) com
relatório"* — não pede verde.

> PREMISSA (reversível, GDEC-0015/0017): `reports/relatorio-conformidade.md` é mantido no repositório
> (e não ignorado, como em `packages/kernel-clinico`) porque o relatório É o entregável da
> SPR-G3-10; ele é integralmente regenerável pelo comando acima.

---

## Regra de veredito (por que ela é assim)

Cada cenário foi decomposto nas cláusulas do seu *então*. Cada cláusula virou:

| Tipo | Quando | Efeito |
|---|---|---|
| **VERIFICAÇÃO** | é obrigação do **consumidor** (o sujeito deste harness) | executada; `passou` / `falhou` / `nao-executavel` com causa |
| **LIMITAÇÃO** | é obrigação/comportamento do **produtor** (AMH), ou vive em outro pacote da V2 | declarada no relatório como **cláusula NÃO satisfeita** |

- `FALHOU` — alguma verificação executada falhou.
- `PASSOU` — **todas** as verificações foram executadas e passaram.
- `NÃO EXECUTÁVEL` — alguma verificação não pôde ser executada. **Execução parcial não passa.**

A coluna *cobertura* é independente do veredito: `integral` só quando não há verificação
bloqueada **nem** limitação declarada. Na prática, hoje, **nenhum** cenário tem cobertura
integral — todos carregam ao menos a limitação "a AMH não foi exercitada".

Causas de bloqueio são **enumeradas**, nunca texto livre: `amh-indisponivel`, `fixture-ausente`,
`interface-inexistente`, `campo-inexistente-no-contrato`, `manifesto-nao-publicado`,
`fora-do-escopo-deste-pacote`.

---

## O que a suíte deliberadamente NÃO faz

- **Não cria fixture.** Cenário cuja fixture o §5 do harness lista como ausente (F-1, F-2, F-5,
  F-6, F-7) é reportado `NÃO EXECUTÁVEL` com a causa. Fabricar o envelope faltante — em especial
  o de CTS-18, a transição cruzando entidades legais — seria inventar o evento AMH de maior
  consequência de segurança só para vê-lo recusado.
- **Não escreve emulador da AMH.** `cenarios-teste-consumidor.md` §1 é explícito: um emulador
  escrito pela V2 a partir da minuta da V2 executaria **V2 contra V2**, todos os cenários
  passariam, e o resultado provaria apenas consistência interna.
- **Não compara a malha com a própria resolução local** e chama isso de equivalência. O critério
  de aceitação do replay (contrato §3) é a coincidência com `resolve(ref, as_of)` da AMH —
  IF-07, que **não existe**. CTS-11 e SEM-RPL.4 ficam bloqueados por isso, e o replay local
  aparece apenas como evidência colateral, nomeada como tal.
- **Não força verde.** Variações de **entrega** (duplicar, atrasar, inverter ordem, entregar em
  lote histórico) são técnica sancionada pelo próprio harness (CTS-02, CTS-04, CTS-05, CTS-12) e
  não fabricam payload: o envelope entregue é **byte a byte** a fixture pinada.

---

## Pin local das fixtures ≠ pin do contrato (CTS-22)

O pacote pina as dez fixtures por **SHA-256** (`PINNED_FIXTURE_DIGESTS`). Divergência de digest
**reprova a execução inteira**: os 22 cenários passam a `FALHOU` com a divergência como razão, e
as verificações semânticas não rodam. Isso existe para que **uma fixture adulterada seja detectada
em vez de mudar um veredito em silêncio**.

Isso **não é** CTS-22. CTS-22 exige o pin do **pacote de contrato publicado pela AMH**, que não
existe. O relatório diz as duas coisas lado a lado, para que ninguém leia uma como a outra.

---

## Verificações de semântica

Seis dimensões (§7.6, "campo a campo, com contabilidade de perda"). Duas delas **não existem no
contrato v1** e o pacote diz isso em vez de fabricar verificação:

| Dimensão | Onde é verificada | Observação |
|---|---|---|
| identidade | fixtures pinadas | refs opacas, `SYNTH-`, preservadas verbatim, sem re-*minting* |
| **encontro** | *modelo canônico V2 (cenário SYNTH G7)* | **perda L-03**: o envelope de identidade não carrega encontro, por decisão do contrato |
| timestamp | fixtures pinadas | `occurred_at`/`emitted_at` verbatim; tempos de fonte e de pipeline em campos distintos; **perda L-01** (offset/precisão) declarada, nunca inferida |
| **unidade** | *modelo canônico V2 (cenário SYNTH G7)* | `Observation` está excluída do v1 (contradição C-1); nenhuma unidade atravessa esta fronteira |
| proveniência | fixtures pinadas | envelope retido + identidade + versões + `quality: unknown` explícito (**L-02**) + digest de manifesto `null` |
| replay | fixtures pinadas | determinismo, independência da ordem de entrega, visão histórica por `as_of`; o **critério de aceitação** (§3) fica bloqueado por IF-07 |

---

## Decisões de semântica tomadas aqui (todas reversíveis, todas declaradas)

Duas escolhas foram necessárias para que a projeção fosse bem definida. Nenhuma é regra clínica;
ambas são de **camada de contrato** e estão registradas como pendência ao dono AMH.

1. **PREMISSA (reversível, GDEC-0015/0017): transição com `correction_of` produz REVOGAÇÃO
   carimbada, não aresta nova.** O contrato não diz. Sob a leitura alternativa, `unmerge`
   criaria a aresta invertida do `merge` que desfaz — o que acrescenta *aliasing* em vez de
   desfazê-lo e produz **ciclo de resolução** com as fixtures pinadas; e o `restore` (cujas refs
   `antiga` e `nova` são idênticas na fixture) viraria um auto-alias. Parente de L-12/CONF-Q-09.
2. **PREMISSA (reversível, GDEC-0015/0017): vocabulário de razão de quarentena derivado das seis
   invariantes do envelope**, não de ADR-0008 N3 — N3 governa razão de *status de avaliação*
   (`missing_required_input`, `stale_input`, ...) e não nomeia "chave de idempotência ausente".
   Condição não coberta cai no *fallback* total `unspecified_condition` (N9). Consolidar os dois
   vocabulários é decisão de arquitetura pendente.

Além disso, `identity.reassignment.v1` é **quarentenado fail-closed** com razão
`reassignment_scope_undefined` e os sujeitos são marcados **identidade em revisão** — exatamente
o que a **perda L-10** exige enquanto o alcance da reatribuição não for explícito no contrato
(HAZ-0001/HAZ-0002). A fixture é declarada "válida" pelo pacote de contrato e ainda assim não é
aplicada: a divergência é intencional e está no relatório.

---

## Pendências registradas por este pacote

1. **A camada anticorrupção de produção não está ligada a este harness.** As verificações provam
   a implementação de referência local, não `apps/api`.
2. **Reconciliação de avaliação/alerta não foi exercitada** (CTS-10, CTS-12): não há regra
   clínica implementada (`kernel-clinico` sem regra; 0 vias acionáveis) e a máquina de estados do
   ADR-0009 vive fora deste pacote.
3. **Limiar de atraso de lane é parâmetro do harness**, não número da AMH — a latência
   permanece `VALIDATION_REQUIRED` (OS-17 critério 3).
4. **Ambiguidade `unmerge` × `restore` (L-12)** e **desempate de tempos (CONF-Q-12)** continuam
   abertas ao dono AMH.

---

*Sem PHI, credenciais ou identificadores reais. Nenhuma alegação de efetividade clínica é feita
por este pacote. Nada aqui fecha gate, bloqueador, risco, hazard, ADR ou OS.*
