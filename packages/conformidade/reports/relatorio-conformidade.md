# Relatório de execução do harness de conformidade §7.6 — contrato AMH×IntensiCare v1

*Artefato gerado por `@intensicare/conformidade` — não editar à mão.*

## 0. O que este relatório NÃO é

1. **Não é evidência de compatibilidade com a AMH.** Nenhum cenário foi executado contra a AMH: não existe sandbox pinado, não existe manifesto de contrato publicado (`manifest_sha256: null`, `pinned: false`, `aceito: false`) e nenhum ambiente similar a produção está provisionado. O achado permanece **candidato a integração**.
2. **Não move a matriz de elegibilidade.** 47/47 permanecem inelegíveis; `Observation` da AMH permanece não consumível; o *safety case* permanece M0; nenhuma via acionável foi aberta.
3. **Não fecha gate, bloqueador, risco, hazard, ADR ou OS.** Em particular NÃO fecha o Gate G3, cujas condições de dado povoado, ambiente similar a produção e falha/recuperação dependem de camadas 2-4.
4. **Não demonstra o comportamento do produto.** A camada anticorrupção exercitada é a implementação de REFERÊNCIA deste harness; ligar o caminho de ingestão de produção (`apps/api`) a estas verificações é trabalho pendente.
5. **Nenhum dado real foi acessado.** Todas as fixtures são 100% sintéticas, com marcador `SYNTH-`; o valor do identificador de fonte da fixture inválida NÃO é reproduzido em lugar algum deste relatório.

## 1. Regra de veredito

Cada cenário foi decomposto nas cláusulas do seu *então*. Cláusula que é obrigação do **consumidor** virou VERIFICAÇÃO executável; cláusula que é obrigação do **produtor** (a AMH) ou que vive em outro pacote da V2 virou LIMITAÇÃO declarada — limitação **não** é cláusula satisfeita.

- `FALHOU` — alguma verificação executada falhou.
- `PASSOU` — **todas** as verificações foram executadas e passaram.
- `NÃO EXECUTÁVEL` — alguma verificação não pôde ser executada. **Cenário parcialmente executado não passa.**

A coluna *cobertura* é independente do veredito: `integral` só quando não há verificação bloqueada **nem** limitação declarada.

## 2. Pin local das fixtures

Este pin é do conjunto de fixtures **do repositório** — coisa distinta do pin do pacote de contrato publicado pela AMH, que CTS-22 exige e que não existe. Ele serve para que uma fixture adulterada seja detectada em vez de mudar o veredito de um cenário em silêncio.

Diretório: `/Users/familia/code/intensicare-V2/docs/08-interoperability/amh-data/contract-v1/fixtures`

**Estado do pin: CONFERIDO**

| Fixture | Papel | SHA-256 (12 primeiros) | Pin |
|---|---|---|---|
| `alias.valid.json` | valid | `a7d86fe7aba7` | conferido |
| `merge.valid.json` | valid | `dee7b2af4041` | conferido |
| `unmerge.valid.json` | valid | `f33b9dc04e29` | conferido |
| `restore.valid.json` | valid | `bdd795529d4d` | conferido |
| `reassignment.valid.json` | valid | `fafbb65e1f9e` | conferido |
| `erasure.valid.json` | valid | `6c18650b529c` | conferido |
| `alias.missing-idempotency-key.invalid.json` | invalid | `320477e95ee3` | conferido |
| `merge.ref-nova-igual-antiga.invalid.json` | invalid | `6b6b306088f1` | conferido |
| `unmerge.emissao-antes-do-fato.invalid.json` | invalid | `2cf2b716b364` | conferido |
| `erasure.identificador-de-fonte-cru.invalid.json` | invalid | `6b60c268ee98` | conferido |

## 3. Sumário

| Métrica | Valor |
|---|---:|
| Cenários executados (tentativa de execução) | 22 |
| PASSOU | 12 |
| FALHOU | 0 |
| NÃO EXECUTÁVEL | 10 |
| Verificações executadas (cenários + semântica) | 63 |
| Verificações bloqueadas | 20 |

## 4. Cenários — veredito por cenário

| Cenário | Título | Veredito | Cobertura | Verificações (exec./total) |
|---|---|---|---|---|
| **CTS-01** | Linha de base: evento válido é aplicado com proveniência completa | PASSOU | parcial | 4/4 |
| **CTS-02** | Duplicata: redelivery exata não altera o estado | PASSOU | parcial | 5/5 |
| **CTS-03** | `idempotency_key` igual em tenant distinto não é duplicata | NÃO EXECUTÁVEL SEM AMH | nenhuma | 0/1 |
| **CTS-04** | Atraso: chegada tardia é degradação visível, não silêncio | PASSOU | parcial | 3/3 |
| **CTS-05** | Fora de ordem: evento antigo após evento novo não regride estado | PASSOU | parcial | 4/4 |
| **CTS-06** | Empate total de tempos: fail-closed em vez de escolha arbitrária | NÃO EXECUTÁVEL SEM AMH | nenhuma | 0/1 |
| **CTS-07** | Evento inválido: sem chave de idempotência | PASSOU | parcial | 4/4 |
| **CTS-08** | Evento inválido: `merge` com ref nova igual à antiga | PASSOU | parcial | 2/2 |
| **CTS-09** | Evento inválido: emissão anterior ao fato | PASSOU | parcial | 3/3 |
| **CTS-10** | Correção e supersessão, incluindo referência pendente | PASSOU | parcial | 5/5 |
| **CTS-11** | Merge/unmerge com replay: equivalência malha ⇔ `resolve` | NÃO EXECUTÁVEL SEM AMH | nenhuma | 0/2 |
| **CTS-12** | *Backfill* de eventos de identidade | PASSOU | parcial | 3/3 |
| **CTS-13** | `erasure` / *tombstone*: aposentadoria não é deleção | PASSOU | parcial | 4/4 |
| **CTS-14** | `resolve` com `as_of` anterior ao *minting* da ref | NÃO EXECUTÁVEL SEM AMH | nenhuma | 0/1 |
| **CTS-15** | `resolve` sobre ref `retired` | NÃO EXECUTÁVEL SEM AMH | nenhuma | 0/2 |
| **CTS-16** | *Downtime* do consumidor, recuperação e detecção de lacuna | NÃO EXECUTÁVEL SEM AMH | parcial | 1/3 |
| **CTS-17** | Deriva: versão desconhecida, campo obrigatório removido, campo novo | NÃO EXECUTÁVEL SEM AMH | parcial | 1/4 |
| **CTS-18** | Transição cruzando `{amh_tenant, legal_entity}` é rejeitada | NÃO EXECUTÁVEL SEM AMH | nenhuma | 0/1 |
| **CTS-19** | `resolve` fora do escopo autorizado: negativa e impossibilidade de *bypass* | NÃO EXECUTÁVEL SEM AMH | nenhuma | 0/2 |
| **CTS-20** | Identificador de fonte cru no envelope é rejeitado | PASSOU | parcial | 4/4 |
| **CTS-21** | Propósito fora do vocabulário fechado é rejeitado | PASSOU | parcial | 2/2 |
| **CTS-22** | Pin do contrato: digest divergente reprova o pacote inteiro | NÃO EXECUTÁVEL SEM AMH | nenhuma | 0/1 |

## 5. Cenários — detalhe, evidência e limitações

### CTS-01 — Linha de base: evento válido é aplicado com proveniência completa

**Veredito: PASSOU** · cobertura: parcial · interfaces: IF-01 · exigência §7.6: linha de base do envelope (§7.6)

*Fixtures:* `alias.valid.json`

*Controles/hazards citados na fonte:* HAZ-0012, DOM-0002

- **CTS-01.C1 — PASSOU**
  - *Cláusula:* o envelope é persistido imutável ANTES de qualquer reconhecimento (HAZ-0012)
  - *Evidência:* journal=1 entrada(s), sha256 idêntico ao da fixture pinada; com journal durável falhando: veredito="nao-durabilizado", acknowledged=false, journal=0
- **CTS-01.C2 — PASSOU**
  - *Cláusula:* a transição é aplicada com `occurred_at` como tempo do fato (nunca 'agora')
  - *Evidência:* veredito="aplicado"; occurred_at aplicado=2026-08-15T10:00:00Z; occurred_at da fixture=2026-08-15T10:00:00Z
- **CTS-01.C3 — PASSOU**
  - *Cláusula:* a proveniência registra event_id, idempotency_key, versão de contrato, versão de mapeamento e `quality: unknown` explícito (perda L-02)
  - *Evidência:* event_id=11111111-1111-4111-8111-000000000001; contrato v1; mapeamento=conformidade-acl/0.1.0; quality=unknown; digest de manifesto pinado=null (nenhum manifesto publicado); tempos de fonte e de pipeline em campos distintos (emitted=2026-08-15T10:00:05Z, received=2026-08-15T10:00:06.000Z)
- **CTS-01.C4 — PASSOU**
  - *Cláusula:* nenhum fato clínico passado é re-chaveado
  - *Evidência:* a projeção contém 2 ref(s) e NENHUM fato clínico — a camada não conhece fato clínico, logo re-chavear é impossível por construção; alcance derivado declarado na proveniência (perda L-03)

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-02 — Duplicata: redelivery exata não altera o estado

**Veredito: PASSOU** · cobertura: parcial · interfaces: IF-01..IF-06 · exigência §7.6: duplicate (§7.6)

*Fixtures:* `alias.valid.json (entregue duas vezes)`

*Controles/hazards citados na fonte:* HAZ-0009

- **CTS-02.C1 — PASSOU**
  - *Cláusula:* a segunda entrega é deduplicada
  - *Evidência:* vereditos: aplicado, deduplicado
- **CTS-02.C2 — PASSOU**
  - *Cláusula:* o estado da malha é idêntico ao de CTS-01
  - *Evidência:* impressão da malha após a redelivery é idêntica à da entrega única
- **CTS-02.C3 — PASSOU**
  - *Cláusula:* a duplicata é contada como operação normal, não como incidente
  - *Evidência:* quarentena=0 entrada(s) após a redelivery
- **CTS-02.C4 — PASSOU**
  - *Cláusula:* idempotência de EFEITO como segunda defesa: aplicar a mesma transição duas vezes produziria o mesmo estado
  - *Evidência:* dobra da projeção sobre a lista de transições duplicada produz a mesma malha
- **CTS-02.C5 — PASSOU**
  - *Cláusula:* a chave usada é a DO CONTRATO, jamais derivada de dado do paciente
  - *Evidência:* merge e unmerge compartilham as mesmas refs e chaves de idempotência distintas: vereditos aplicado, aplicado — nenhum foi deduplicado, logo a chave não é derivada do sujeito (HAZ-0009)

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-03 — `idempotency_key` igual em tenant distinto não é duplicata

**Veredito: NÃO EXECUTÁVEL SEM AMH** · cobertura: nenhuma · interfaces: IF-01..IF-06 · exigência §7.6: duplicate (§7.6)

*Fixtures:* `alias.valid.json + variante com `amh_tenant` distinto [FIXTURE AUSENTE F-1]`

*Controles/hazards citados na fonte:* HAZ-0013, HAZ-0012

- **CTS-03.C1 — NÃO EXECUTÁVEL** — causa: fixture ausente no pacote de contrato (§5 de cenarios-teste-consumidor.md)
  - *Cláusula:* dois eventos com a mesma `idempotency_key` em escopos distintos são AMBOS aplicados
  - *Evidência:* a fixture F-1 (mesma chave em tenant distinto) não existe no pacote de contrato; fabricá-la seria inventar um evento da AMH para fazer o cenário passar. OBSERVADO no código: a chave de dedup implementada é `{amh_tenant, legal_entity, idempotency_key}` — mas isso é asserção sobre a V2, não execução deste cenário, que exige o par de eventos que a fixture forneceria.

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-04 — Atraso: chegada tardia é degradação visível, não silêncio

**Veredito: PASSOU** · cobertura: parcial · interfaces: IF-01..IF-06 · exigência §7.6: delay (§7.6)

*Fixtures:* `merge.valid.json (entrega retardada)`

*Controles/hazards citados na fonte:* HAZ-0010, HAZ-0017, HAZ-0025, DOM-0007

- **CTS-04.C1 — PASSOU**
  - *Cláusula:* o evento é aplicado na sua posição por `occurred_at` (nunca 'agora')
  - *Evidência:* occurred_at aplicado=2026-08-15T11:00:00Z; recebido em 2026-08-15T17:00:07.000Z (6 h depois) — o instante de recebimento não entrou na ordenação
- **CTS-04.C2 — PASSOU**
  - *Cláusula:* a idade e o atraso da lane são expostos como sinal operacional
  - *Evidência:* atraso máximo observado=21600000 ms (limiar do harness=60000 ms; PARÂMETRO DO HARNESS — a AMH não declarou latência (OS-17 crit. 3 VALIDATION_REQUIRED))
- **CTS-04.C3 — PASSOU**
  - *Cláusula:* a saúde da lane NÃO é reportada como normal enquanto o atraso persistir
  - *Evidência:* estado da lane="degradada"

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.
- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* medir latência REAL é camada 4 e exige o produtor; o limiar usado é parâmetro do harness porque a AMH não declarou latência (OS-17 crit. 3, VALIDATION_REQUIRED).

### CTS-05 — Fora de ordem: evento antigo após evento novo não regride estado

**Veredito: PASSOU** · cobertura: parcial · interfaces: IF-01..IF-06 · exigência §7.6: out-of-order (§7.6)

*Fixtures:* `alias.valid.json`, `merge.valid.json`, `unmerge.valid.json`

*Controles/hazards citados na fonte:* HAZ-0011, DOM-0006

- **CTS-05.C1 — PASSOU**
  - *Cláusula:* a projeção é reconstruída incluindo t1 na sua posição; o estado final é idêntico ao da ordem cronológica
  - *Evidência:* entrega invertida (merge → alias) produz impressão de malha idêntica à cronológica
- **CTS-05.C2 — PASSOU**
  - *Cláusula:* nenhum valor mais novo é sobrescrito por um mais velho (par do MESMO sujeito)
  - *Evidência:* entrega invertida do par merge/unmerge (mesmas refs) converge para a mesma malha; o unmerge chegado antes ficou em retenção pendente até o alvo de correction_of chegar (pendentes agora=0)
- **CTS-05.C3 — PASSOU**
  - *Cláusula:* a visão histórica anterior ao carimbo continua enxergando a aresta como vigente
  - *Evidência:* malha em as_of=2026-08-15T11:00:00Z tem 1 aresta vigente do tipo identity.merge.v1
- **CTS-05.C4 — PASSOU**
  - *Cláusula:* o resultado é idêntico ao de um replay completo
  - *Evidência:* replay da lista de transições retidas reproduz a malha corrente byte a byte

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.
- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* as duas fixtures que o cenário nomeia (alias e merge) são de SUJEITOS DISTINTOS; a cláusula 'mesmo sujeito' foi exercitada com o par merge/unmerge, também pinado.

### CTS-06 — Empate total de tempos: fail-closed em vez de escolha arbitrária

**Veredito: NÃO EXECUTÁVEL SEM AMH** · cobertura: nenhuma · interfaces: IF-01..IF-06 · exigência §7.6: out-of-order (§7.6)

*Fixtures:* `dois eventos com `occurred_at` E `emitted_at` idênticos [FIXTURE AUSENTE F-2]`

*Controles/hazards citados na fonte:* HAZ-0011, DOM-0004

- **CTS-06.C1 — NÃO EXECUTÁVEL** — causa: fixture ausente no pacote de contrato (§5 de cenarios-teste-consumidor.md)
  - *Cláusula:* o par empatado é quarentenado com alarme; nenhuma ordem é escolhida arbitrariamente
  - *Evidência:* a fixture F-2 (empate de `occurred_at` E `emitted_at` no mesmo sujeito) não existe. Ela expõe a lacuna CONF-Q-12 do contrato (o desempate declarado é 'ordem de emissão do produtor', que o envelope não carrega) — inventá-la aqui esconderia a lacuna em vez de registrá-la.

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-07 — Evento inválido: sem chave de idempotência

**Veredito: PASSOU** · cobertura: parcial · interfaces: IF-01 · exigência §7.6: evento inválido (§7.6)

*Fixtures:* `alias.missing-idempotency-key.invalid.json`

*Controles/hazards citados na fonte:* HAZ-0009, DOM-0004

- **CTS-07.C1 — PASSOU**
  - *Cláusula:* a mensagem é quarentenada com a razão correta (invariante 2)
  - *Evidência:* razão registrada: missing_idempotency_key:idempotency_key
- **CTS-07.C2 — PASSOU**
  - *Cláusula:* a mensagem NÃO é aplicada
  - *Evidência:* transições aplicadas=0
- **CTS-07.C3 — PASSOU**
  - *Cláusula:* a mensagem NÃO é descartada e o envelope íntegro é retido
  - *Evidência:* envelope retido com sha256 idêntico ao da fixture pinada (320477e95ee3…)
- **CTS-07.C4 — PASSOU**
  - *Cláusula:* a contagem de quarentena sobe e é visível
  - *Evidência:* contagem por razão: {"missing_idempotency_key:idempotency_key":1}; por token: {"missing_idempotency_key":1}

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-08 — Evento inválido: `merge` com ref nova igual à antiga

**Veredito: PASSOU** · cobertura: parcial · interfaces: IF-02 · exigência §7.6: evento inválido (§7.6)

*Fixtures:* `merge.ref-nova-igual-antiga.invalid.json`

*Controles/hazards citados na fonte:* HAZ-0027

- **CTS-08.C1 — PASSOU**
  - *Cláusula:* a mensagem é quarentenada (invariante 3) e alarmada
  - *Evidência:* razão registrada: merge_refs_identical
- **CTS-08.C2 — PASSOU**
  - *Cláusula:* evento sem efeito é defeito do produtor, jamais no-op silenciosamente absorvido
  - *Evidência:* transições=0; quarentena=1 (absorver em silêncio produziria 0 e 0)

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-09 — Evento inválido: emissão anterior ao fato

**Veredito: PASSOU** · cobertura: parcial · interfaces: IF-03 · exigência §7.6: evento inválido (§7.6)

*Fixtures:* `unmerge.emissao-antes-do-fato.invalid.json`

*Controles/hazards citados na fonte:* HAZ-0026

- **CTS-09.C1 — PASSOU**
  - *Cláusula:* a mensagem é quarentenada (invariante 4)
  - *Evidência:* razão registrada: emitted_before_occurred
- **CTS-09.C2 — PASSOU**
  - *Cláusula:* jamais se 'corrige' invertendo campos nem se substitui tempo algum
  - *Evidência:* envelope retido byte a byte idêntico à fixture; nenhuma transição aplicada
- **CTS-09.C3 — PASSOU**
  - *Cláusula:* a razão distingue TEMPO IMPLAUSÍVEL de CAMPO AUSENTE
  - *Evidência:* tempo implausível ⇒ "emitted_before_occurred"; campo ausente ⇒ "missing_idempotency_key:idempotency_key" — tokens observados são distintos (ADR-0008 N5: tempo implausível ⇒ quarentena, com razão própria)

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-10 — Correção e supersessão, incluindo referência pendente

**Veredito: PASSOU** · cobertura: parcial · interfaces: IF-04 · exigência §7.6: correction (§7.6)

*Fixtures:* `erasure.valid.json`, `restore.valid.json`

*Controles/hazards citados na fonte:* HAZ-0008, HAZ-0022

- **CTS-10.C1 — PASSOU**
  - *Cláusula:* o evento corrigido permanece recuperável (nada é sobrescrito nem apagado)
  - *Evidência:* journal retém 2 envelopes; o evento 11111111-1111-4111-8111-000000000006 aparece como REVOGADO na projeção — visível, não removido
- **CTS-10.C2 — PASSOU**
  - *Cláusula:* a relação de correção é explícita e datada
  - *Evidência:* revogação carimbada em 2026-08-16T14:00:00Z, apontando 11111111-1111-4111-8111-000000000006 (fato original em 2026-08-16T12:00:00Z)
- **CTS-10.C3 — PASSOU**
  - *Cláusula:* o passado não é reescrito: o replay anterior ao carimbo enxerga o estado anterior
  - *Evidência:* resolução do consumidor entre erasure e restore="retired"; depois do restore="resolvida"
- **CTS-10.C4 — PASSOU**
  - *Cláusula:* `correction_of` apontando evento nunca visto fica em retenção pendente, NÃO aplicado
  - *Evidência:* veredito="retencao-pendente"; transições aplicadas=0
- **CTS-10.C5 — PASSOU**
  - *Cláusula:* se não resolver, o sujeito é marcado como identidade em revisão
  - *Evidência:* retenções vencidas=1; sujeitos em revisão=1

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.
- *(fixture ausente no pacote de contrato (§5 de cenarios-teste-consumidor.md))* a fixture F-3 (`correction_of` apontando evento INEXISTENTE) não existe; a condição foi produzida por ORDEM DE ENTREGA (restore antes de erasure). O consumidor não consegue distinguir 'nunca existirá' de 'ainda não chegou' — não há número de sequência nem marca d'água (§7.3 da matriz de erro), e essa indistinção é o achado.
- *(comportamento vive em outro pacote da V2 (registrado como pendência, não como satisfeito))* a cláusula 'dispara nova avaliação, a anterior é marcada como superada e os alertas são reconciliados' não foi executada: não existe avaliação clínica implementada (kernel-clinico sem regra; 0 vias acionáveis) e a reconciliação vive na máquina de estados do ADR-0009 (apps/api). Registrado como pendência, não como satisfeito.

### CTS-11 — Merge/unmerge com replay: equivalência malha ⇔ `resolve`

**Veredito: NÃO EXECUTÁVEL SEM AMH** · cobertura: nenhuma · interfaces: IF-02, IF-03, IF-07 · exigência §7.6: merge/unmerge com replay (§7.6)

*Fixtures:* `merge.valid.json`, `unmerge.valid.json`, `restore.valid.json`

*Controles/hazards citados na fonte:* HAZ-0027, DOM-0002, DOM-0003

- **CTS-11.C1 — NÃO EXECUTÁVEL** — causa: interface não existe (IF-07 `resolve(ref, as_of)` não foi exposta)
  - *Cláusula:* para todo `t`, o estado derivado dos eventos com `occurred_at <= t` coincide com a resposta de `resolve(ref, as_of=t)`
  - *Evidência:* IF-07 `resolve(ref, as_of)` não foi exposta pela AMH (a própria minuta registra 'a operação ponto-no-tempo não existe'). Comparar a malha com a resolução LOCAL do consumidor seria V2 contra V2 — a armadilha que §1 do harness recusa. OBSERVADO como evidência colateral: o replay local é determinístico e independente da ordem (impressões idênticas).
- **CTS-11.C2 — NÃO EXECUTÁVEL** — causa: interface não existe (IF-07 `resolve(ref, as_of)` não foi exposta)
  - *Cláusula:* a cadeia de alias retornada cruza, por `event_id`, exatamente com os eventos recebidos
  - *Evidência:* não há resposta de `resolve` com que cruzar; o esquema de resposta sequer existe (CONF-Q-10, fixture ausente F-7).

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-12 — *Backfill* de eventos de identidade

**Veredito: PASSOU** · cobertura: parcial · interfaces: IF-01..IF-06 · exigência §7.6: backfill (§7.6)

*Fixtures:* `as seis fixtures válidas, entregues em lote histórico`

*Controles/hazards citados na fonte:* DOM-0006

- **CTS-12.C1 — PASSOU**
  - *Cláusula:* o resultado do lote é idêntico ao do processamento incremental
  - *Evidência:* impressões de malha idênticas: o instante de RECEBIMENTO (gerado pela V2) não influencia a projeção, que é dobrada por `occurred_at`
- **CTS-12.C2 — PASSOU**
  - *Cláusula:* duplicatas do lote são deduplicadas
  - *Evidência:* vereditos do lote: aplicado, aplicado, aplicado, aplicado, aplicado, quarentenado, deduplicado
- **CTS-12.C3 — PASSOU**
  - *Cláusula:* o *backfill* cobre apenas eventos de IDENTIDADE (dado clínico está fora do v1)
  - *Evidência:* 5 transições aplicadas, todas de tipo identity.*; 1 quarentena(s) — inclui o reassignment retido por alcance indefinido (perda L-10)

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.
- *(comportamento vive em outro pacote da V2 (registrado como pendência, não como satisfeito))* a cláusula 'o backfill não produz alertas retroativos como se os fatos fossem novos' não foi executada: não há motor de alerta neste pacote (ADR-0009 vive em apps/api).

### CTS-13 — `erasure` / *tombstone*: aposentadoria não é deleção

**Veredito: PASSOU** · cobertura: parcial · interfaces: IF-06, IF-07 · exigência §7.6: erasure / tombstone (§7.6)

*Fixtures:* `erasure.valid.json`

*Controles/hazards citados na fonte:* DOM-0002

- **CTS-13.C1 — PASSOU**
  - *Cláusula:* a ref é marcada `retired`
  - *Evidência:* estado da ref na malha="retired"
- **CTS-13.C2 — PASSOU**
  - *Cláusula:* a ref não é deletada nem reutilizada e continua resolvendo no consumidor
  - *Evidência:* resolução local="retired"; a ref permanece na malha e o envelope permanece no journal append-only
- **CTS-13.C3 — PASSOU**
  - *Cláusula:* o `null` é interpretado como 'não há sucessor' e nunca confundido com campo ausente
  - *Evidência:* estado do campo subject_ref_nova="null-asserted" (três estados distintos: present / null-asserted / absent — perda L-08)
- **CTS-13.C4 — PASSOU**
  - *Cláusula:* a V2 não implementa deleção local por conta própria
  - *Evidência:* a camada não expõe operação de deleção: o journal é append-only e a aposentadoria é um ESTADO na projeção, não a remoção de um registro

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.
- *(interface não existe (IF-07 `resolve(ref, as_of)` não foi exposta))* a garantia de que a AMH continua respondendo `resolve` para a ref aposentada é do PRODUTOR (IF-07) e não foi verificada — a resolução exercida acima é a do consumidor sobre envelopes retidos.
- *(comportamento vive em outro pacote da V2 (registrado como pendência, não como satisfeito))* o que a V2 faz com seus PRÓPRIOS envelopes e fatos retidos após um `erasure` não é decidido por este contrato (política de retenção: ADR-0018 + determinação legal pendente).

### CTS-14 — `resolve` com `as_of` anterior ao *minting* da ref

**Veredito: NÃO EXECUTÁVEL SEM AMH** · cobertura: nenhuma · interfaces: IF-07 · exigência §7.6: resolve as_of pré-minting (§7.6)

*Fixtures:* `ref de alias.valid.json com `as_of` anterior [FIXTURE AUSENTE F-7]`

*Controles/hazards citados na fonte:* HAZ-0005, HAZ-0039, DOM-0004

- **CTS-14.C1 — NÃO EXECUTÁVEL** — causa: interface não existe (IF-07 `resolve(ref, as_of)` não foi exposta)
  - *Cláusula:* a resposta carrega a condição explícita `nao-mintada-em-as_of`
  - *Evidência:* IF-07 não existe e não há esquema de resposta (CONF-Q-10; fixture ausente F-7). OBSERVADO no consumidor: a resolução local devolve `desconhecida-no-consumidor` — deliberadamente um token DIFERENTE, porque o consumidor não sabe quando a ref foi mintada; afirmar `nao-mintada-em-as_of` seria inventar conhecimento que só a AMH tem.

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-15 — `resolve` sobre ref `retired`

**Veredito: NÃO EXECUTÁVEL SEM AMH** · cobertura: nenhuma · interfaces: IF-07 · exigência §7.6: resolve sobre ref retired (§7.6)

*Fixtures:* `ref de erasure.valid.json [FIXTURE AUSENTE F-7 para a resposta]`

*Controles/hazards citados na fonte:* HAZ-0005, HAZ-0039, HAZ-0021

- **CTS-15.C1 — NÃO EXECUTÁVEL** — causa: interface não existe (IF-07 `resolve(ref, as_of)` não foi exposta)
  - *Cláusula:* a resposta carrega `status: retired` e a data do fato
  - *Evidência:* IF-07 não existe; nenhuma resposta de `resolve` pode ser exercitada (fixture ausente F-7).
- **CTS-15.C2 — NÃO EXECUTÁVEL** — causa: interface não existe (IF-07 `resolve(ref, as_of)` não foi exposta)
  - *Cláusula:* com `as_of` anterior à aposentadoria, a resolução vigente naquele instante é devolvida
  - *Evidência:* idem — a propriedade equivalente foi exercida na resolução LOCAL em CTS-10.C3, o que não substitui a verificação contra o produtor.

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-16 — *Downtime* do consumidor, recuperação e detecção de lacuna

**Veredito: NÃO EXECUTÁVEL SEM AMH** · cobertura: parcial · interfaces: IF-01..IF-07 · exigência §7.6: downtime e recuperação (§7.6)

*Fixtures:* `sequência das seis válidas, com interrupção no meio`

*Controles/hazards citados na fonte:* HAZ-0012, HAZ-0025, HAZ-0043

- **CTS-16.C1 — PASSOU**
  - *Cláusula:* nenhuma mensagem é reconhecida sem persistência durável
  - *Evidência:* com a persistência durável falhando: veredito="nao-durabilizado", acknowledged=false, journal=0
- **CTS-16.C2 — NÃO EXECUTÁVEL** — causa: interface não existe (IF-07 `resolve(ref, as_of)` não foi exposta)
  - *Cláusula:* a conferência de integridade malha × `resolve(ref, as_of)` é executada para os sujeitos afetados
  - *Evidência:* IF-07 é o ÚNICO mecanismo de detecção de lacuna disponível (§7.3: o envelope não carrega número de sequência nem marca d'água) e não existe.
- **CTS-16.C3 — NÃO EXECUTÁVEL** — causa: interface não existe (IF-07 `resolve(ref, as_of)` não foi exposta)
  - *Cláusula:* quando um evento foi definitivamente perdido, a divergência com `resolve` detecta a lacuna
  - *Evidência:* sem IF-07, uma lacuna é INVISÍVEL por inspeção — este é um achado estrutural do contrato, não uma limitação do harness.

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.
- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* a recuperação após indisponibilidade real (camadas 2/4) exige ambiente alcançável; só `dev` está provisionado e o manifesto registra que a condição de ambiente similar a produção do G3 NÃO pode ser satisfeita com dev apenas.

### CTS-17 — Deriva: versão desconhecida, campo obrigatório removido, campo novo

**Veredito: NÃO EXECUTÁVEL SEM AMH** · cobertura: parcial · interfaces: IF-00, IF-01..IF-06 · exigência §7.6: drift detection (§7.6)

*Fixtures:* `variantes de alias.valid.json [FIXTURES AUSENTES F-5]`

*Controles/hazards citados na fonte:* HAZ-0032, QAS-0013

- **CTS-17.C1 — PASSOU**
  - *Cláusula:* campo adicional desconhecido (D3) é ACEITO, RETIDO e CONTADO — *tolerant reader* significa não falhar, não significa não notar
  - *Evidência:* campos desconhecidos observados=["_fixture"]; contagem acumulada=1; retidos na proveniência da tradução
- **CTS-17.C2 — NÃO EXECUTÁVEL** — causa: fixture ausente no pacote de contrato (§5 de cenarios-teste-consumidor.md)
  - *Cláusula:* evento com `event_type_version` desconhecida (D2) é quarentenado e alarmado
  - *Evidência:* fixture F-5 (variante de versão desconhecida) não existe no pacote de contrato.
- **CTS-17.C3 — NÃO EXECUTÁVEL** — causa: fixture ausente no pacote de contrato (§5 de cenarios-teste-consumidor.md)
  - *Cláusula:* evento SEM campo obrigatório do envelope mínimo em lane antes válida (D4) é quarentenado com alarme alto
  - *Evidência:* fixture F-5 (variante com campo obrigatório removido) não existe. A fixture `alias.missing-idempotency-key.invalid.json` exercita a INVARIANTE 2 (CTS-07), não a DERIVA D4 — a distinção é 'lane antes válida que passou a omitir o campo', que exige o histórico da lane.
- **CTS-17.C4 — NÃO EXECUTÁVEL** — causa: fixture ausente no pacote de contrato (§5 de cenarios-teste-consumidor.md)
  - *Cláusula:* sufixo de `event_type` e `event_type_version` discordantes (L-09) ⇒ quarentena
  - *Evidência:* fixture F-5 (variante discordante) não existe.

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-18 — Transição cruzando `{amh_tenant, legal_entity}` é rejeitada

**Veredito: NÃO EXECUTÁVEL SEM AMH** · cobertura: nenhuma · interfaces: IF-01..IF-06 · exigência §7.6: tenant-isolation (§7.6)

*Fixtures:* `merge.valid.json com refs de escopos distintos [FIXTURE AUSENTE F-6]`

*Controles/hazards citados na fonte:* HAZ-0003, HAZ-0013, HAZ-0027

- **CTS-18.C1 — NÃO EXECUTÁVEL** — causa: fixture ausente no pacote de contrato (§5 de cenarios-teste-consumidor.md)
  - *Cláusula:* a transição que cruza escopos é rejeitada fail-closed com alarme de segurança e de segurança clínica
  - *Evidência:* a fixture F-6 não existe — todas as dez fixtures pinadas estão no MESMO escopo (SYNTH-TENANT-A / SYNTH-LE-00000001). Fabricar um envelope cruzando escopos seria inventar o evento AMH de maior consequência de segurança justamente para vê-lo recusado. A verificação da FUNÇÃO de recusa existe como teste unitário do pacote, que é asserção sobre a V2, não execução deste cenário.

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.
- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* a afirmação de que a AMH IMPEDE a transição cruzada exige camada 2 e é indemonstrável pelo lado consumidor.

### CTS-19 — `resolve` fora do escopo autorizado: negativa e impossibilidade de *bypass*

**Veredito: NÃO EXECUTÁVEL SEM AMH** · cobertura: nenhuma · interfaces: IF-07 · exigência §7.6: negative-auth (§7.6)

*Fixtures:* `— (teste negativo de autorização)`

*Controles/hazards citados na fonte:* HAZ-0013, HAZ-0014

- **CTS-19.C1 — NÃO EXECUTÁVEL** — causa: interface não existe (IF-07 `resolve(ref, as_of)` não foi exposta)
  - *Cláusula:* a operação nega com condição explícita quando se tenta resolver ref de outro escopo
  - *Evidência:* não há operação `resolve` a chamar. AQ-6 exige teste negativo afirmando a IMPOSSIBILIDADE do bypass — demonstrável apenas contra a interface real.
- **CTS-19.C2 — NÃO EXECUTÁVEL** — causa: interface não existe (IF-07 `resolve(ref, as_of)` não foi exposta)
  - *Cláusula:* se a resposta contiver qualquer ref fora do escopo autorizado, a resposta inteira é descartada e alarmada (defesa em profundidade R-4)
  - *Evidência:* não há resposta a inspecionar.

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-20 — Identificador de fonte cru no envelope é rejeitado

**Veredito: PASSOU** · cobertura: parcial · interfaces: IF-06 · exigência §7.6: evento inválido / política de dados (§7.6)

*Fixtures:* `erasure.identificador-de-fonte-cru.invalid.json`

*Controles/hazards citados na fonte:* HAZ-0001

- **CTS-20.C1 — PASSOU**
  - *Cláusula:* a mensagem é rejeitada e alarmada como violação de contrato E de política de dados
  - *Evidência:* razão registrada: raw_source_identifier_present:raw_source_identifier (qualificador = NOME do campo)
- **CTS-20.C2 — PASSOU**
  - *Cláusula:* nunca é 'aceita ignorando o campo extra' — a proibição é de CONTEÚDO, e a regra de *tolerant reader* não a cobre
  - *Evidência:* transições aplicadas=0 (aceitar-e-ignorar produziria 1)
- **CTS-20.C3 — PASSOU**
  - *Cláusula:* o envelope é retido em quarentena de ACESSO SEGREGADO
  - *Evidência:* entrada de quarentena marcada segregada=true
- **CTS-20.C4 — PASSOU**
  - *Cláusula:* o VALOR do identificador não é reproduzido em relatório
  - *Evidência:* o qualificador da razão carrega apenas o NOME do campo; nenhum caminho deste harness copia o valor para o relatório

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

### CTS-21 — Propósito fora do vocabulário fechado é rejeitado

**Veredito: PASSOU** · cobertura: parcial · interfaces: transversal IF-01..IF-07 · exigência §7.6: negative-auth / propósito (§7.6)

*Fixtures:* `— (contexto de consumo)`

*Controles/hazards citados na fonte:* AQ-3, DEC-G0-03

- **CTS-21.C1 — PASSOU**
  - *Cláusula:* consumo sob qualquer propósito que não `tratamento` é rejeitado fail-closed
  - *Evidência:* veredito="recusado"; nada foi consumido (journal=0)
- **CTS-21.C2 — PASSOU**
  - *Cláusula:* a base legal JAMAIS deriva de `ie_perm_sms_email` ou de qualquer permissão de contato
  - *Evidência:* veredito="recusado"; razão=legal_basis_from_contact_permission:ie_perm_sms_email

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.
- *(comportamento vive em outro pacote da V2 (registrado como pendência, não como satisfeito))* a verificação cobre a camada anticorrupção deste harness; que TODO caminho de consumo do produto seja mono-propósito é asserção sobre apps/api e não foi executada.

### CTS-22 — Pin do contrato: digest divergente reprova o pacote inteiro

**Veredito: NÃO EXECUTÁVEL SEM AMH** · cobertura: nenhuma · interfaces: IF-00 · exigência §7.6: drift detection (§7.6)

*Fixtures:* `— (requer manifesto publicado)`

- **CTS-22.C1 — NÃO EXECUTÁVEL** — causa: manifesto de contrato não publicado (`manifest_sha256: null`, `pinned: false`)
  - *Cláusula:* quando o digest calculado diverge do pinado, o PACOTE INTEIRO é rejeitado e a lane para visivelmente
  - *Evidência:* nenhum manifesto de contrato existe: `contract-manifest.draft.yaml` traz `manifest_sha256: null`, `pinned: false`, `aceito: false`. OBSERVADO como evidência colateral: este harness pina LOCALMENTE as 10 fixtures do repositório por SHA-256 e reprova a execução inteira se qualquer digest divergir — o que é OUTRA coisa, e não substitui o pin do pacote publicado pela AMH.

**Limitações declaradas (cláusulas NÃO satisfeitas por esta execução):**

- *(AMH indisponível (nenhum sandbox pinado, nenhum ambiente alcançável))* nada aqui evidencia o que a AMH EMITE ou IMPEDE: o produtor não foi exercitado, nenhum ambiente foi alcançado e nenhum dado real foi acessado.

## 6. Verificações de semântica

### Dimensão: identidade

*Sujeito da verificação:* contrato-amh (fixtures pinadas)

- **SEM-ID.1 — PASSOU**
  - *Cláusula:* toda ref que atravessa a fronteira é OPACA, na forma `amh:psr:v1:<...>`
  - *Evidência:* 18 refs observadas nas fixtures pinadas, todas com o prefixo amh:psr:v1:
- **SEM-ID.2 — PASSOU**
  - *Cláusula:* toda ref é sintética (marcador `SYNTH-`) — nenhum PSR real aparece
  - *Evidência:* nenhuma ref na forma real `amh:psr:v1:<uuidv4>` foi observada em qualquer fixture
- **SEM-ID.3 — PASSOU**
  - *Cláusula:* a identidade é preservada VERBATIM — nenhuma normalização, nenhum re-minting
  - *Evidência:* as 9 refs presentes na projeção são exatamente strings vindas das fixtures; a camada não reescreve, não completa e não normaliza ref alguma
- **SEM-ID.4 — PASSOU**
  - *Cláusula:* identificador de fonte cru NÃO sobrevive à fronteira (invariante 1)
  - *Evidência:* a única fixture com identificador de fonte é inválida por construção; entregue isoladamente, é quarentenada em acesso segregado e NENHUMA transição é aplicada (o valor do identificador não é copiado para lugar algum)

### Dimensão: encontro

*Sujeito da verificação:* modelo canônico V2 (cenário SYNTH G7)

- **SEM-ENC.1 — NÃO EXECUTÁVEL** — causa: o contrato v1 não carrega o campo (exclusão deliberada, registrada na contabilidade de perda)
  - *Cláusula:* o encontro clínico é preservado do contrato AMH ao modelo canônico
  - *Evidência:* o envelope de identidade v1 NÃO carrega encontro — decisão explícita do contrato ('eventos de ciclo de vida e `resolve` operam sobre a ref em si'), registrada como perda L-03. A chave canônica do fato clínico é `(tenant, PSR, encontro)` (ADR-0005 M2), logo aplicar uma transição de ref exige percorrer os fatos daquele PSR — alcance que é CÁLCULO DA V2, jamais afirmação da fonte.
- **SEM-ENC.2 — PASSOU**
  - *Cláusula:* no lado V2, todo fato clínico carrega encontro explícito (verificação sobre o cenário SYNTH G7, NÃO sobre o contrato AMH)
  - *Evidência:* 24 observações sintéticas, todas ligadas a um dos 2 encontros do cenário — nenhuma observação órfã de encontro

### Dimensão: timestamp

*Sujeito da verificação:* contrato-amh (fixtures pinadas)

- **SEM-TS.1 — PASSOU**
  - *Cláusula:* `occurred_at` e `emitted_at` são preservados VERBATIM, como recebidos
  - *Evidência:* proveniência retém occurred_at=2026-08-15T10:00:00Z e emitted_at=2026-08-15T10:00:05Z exatamente como estão na fixture; nenhum é re-serializado nem re-normalizado
- **SEM-TS.2 — PASSOU**
  - *Cláusula:* tempo de FONTE e tempo de PIPELINE vivem em campos distintos e nunca se confundem
  - *Evidência:* os quatro instantes (occurred, emitted, received, persisted) são campos separados na proveniência (ADR-0005 M3; HAZ-0007)
- **SEM-TS.3 — PASSOU**
  - *Cláusula:* nenhum tempo ausente é substituído por 'agora', pelo tempo de recebimento ou por vizinho
  - *Evidência:* envelope sem `occurred_at`/`emitted_at` é QUARENTENADO (campo obrigatório 1..1), nunca completado — regra não-negociável §3-8, DOM-0009
- **SEM-TS.4 — NÃO EXECUTÁVEL** — causa: o contrato v1 não carrega o campo (exclusão deliberada, registrada na contabilidade de perda)
  - *Cláusula:* offset original, precisão original e valor-fonte cru do tempo são preservados
  - *Evidência:* perda L-01: o envelope v1 carrega APENAS o instante normalizado em UTC. Offset e precisão anteriores à normalização da AMH são irrecuperáveis, e este harness NÃO os infere — um fato com precisão de dia chega indistinguível de um com precisão de segundo. CONF-Q-05 ao dono AMH (campo opcional novo seria mudança compatível).

### Dimensão: unidade

*Sujeito da verificação:* modelo canônico V2 (cenário SYNTH G7)

- **SEM-UN.1 — NÃO EXECUTÁVEL** — causa: o contrato v1 não carrega o campo (exclusão deliberada, registrada na contabilidade de perda)
  - *Cláusula:* a unidade de medida é preservada do contrato AMH ao modelo canônico
  - *Evidência:* o contrato v1 NÃO carrega unidade alguma: `Observation` está explicitamente excluída (contradição C-1 — o único profile da IG fixa `category` em `laboratory`, excluindo sinais vitais por construção) e o envelope de identidade não tem campo de valor. 'Unidade de internação' (`CareUnit`) também não atravessa esta fronteira.
- **SEM-UN.2 — PASSOU**
  - *Cláusula:* no lado V2, a unidade de ORIGEM é retida verbatim e nenhum par canônico é inventado (verificação sobre o cenário SYNTH G7, NÃO sobre o contrato AMH)
  - *Evidência:* unidades de origem observadas: rpm, %, bpm, mmHg, Cel — retidas como vieram; converter para UCUM é decisão da borda de ingestão sob tabela versionada (ADR-0005 M5), e unidade não-conversível vai a quarentena, nunca a 'mais próxima' (HAZ-0032)

### Dimensão: proveniencia

*Sujeito da verificação:* contrato-amh (fixtures pinadas)

- **SEM-PROV.1 — PASSOU**
  - *Cláusula:* cada transição aplicada retém o envelope de origem íntegro (digest + tamanho)
  - *Evidência:* 5 transições aplicadas, todas com digest SHA-256 do envelope retido
- **SEM-PROV.2 — PASSOU**
  - *Cláusula:* a proveniência carrega identidade da mensagem, versão de contrato e versão de MAPEAMENTO
  - *Evidência:* sem versão de mapeamento, 'reinterpretamos o dado' vira reescrita de história — ela é registrada em toda transição
- **SEM-PROV.3 — PASSOU**
  - *Cláusula:* a qualidade de fonte é `unknown` EXPLÍCITO, jamais default silencioso a `valid`
  - *Evidência:* perda L-02: a lane de identidade não carrega dimensão de qualidade; a ausência é registrada como fato (fail-closed, ADR-0005 M4), nunca preenchida (HAZ-0040)
- **SEM-PROV.4 — PASSOU**
  - *Cláusula:* o digest do manifesto de contrato pinado é registrado como `null` — ausência declarada
  - *Evidência:* nenhum manifesto foi publicado pela AMH (`manifest_sha256: null`, `pinned: false`); a proveniência REGISTRA a ausência em vez de omitir o campo
- **SEM-PROV.5 — PASSOU**
  - *Cláusula:* o tipo de evento de origem é retido mesmo quando dois tipos convergem para a mesma forma
  - *Evidência:* tipos de origem retidos: identity.alias.v1, identity.merge.v1, identity.unmerge.v1, identity.erasure.v1, identity.restore.v1 — perda L-11 evitada: `alias` e `merge` produzem a mesma transição observável, e a distinção auditável só sobrevive porque o tipo é retido
- **SEM-PROV.6 — PASSOU**
  - *Cláusula:* o ALCANCE derivado é registrado como cálculo da V2, nunca como afirmação da fonte
  - *Evidência:* perda L-03 registrada explicitamente na proveniência de cada transição

### Dimensão: replay

*Sujeito da verificação:* contrato-amh (fixtures pinadas)

- **SEM-RPL.1 — PASSOU**
  - *Cláusula:* replay determinístico: mesmos envelopes retidos + mesma versão de mapeamento ⇒ mesma malha
  - *Evidência:* 3 execuções da projeção sobre os mesmos envelopes produziram 1 impressão(ões) distinta(s) — DOM-0003
- **SEM-RPL.2 — PASSOU**
  - *Cláusula:* a projeção é independente da ORDEM DE ENTREGA (dobra por `occurred_at`)
  - *Evidência:* 6 permutações determinísticas (todas as rotações + a ordem inversa) produziram 1 impressão(ões) distinta(s)
- **SEM-RPL.3 — PASSOU**
  - *Cláusula:* a visão histórica em `t` é reconstruível e o passado não é reescrito por fato posterior
  - *Evidência:* a MESMA ref, sobre o MESMO conjunto de envelopes retidos, resolve para três condições explícitas conforme `as_of`: `desconhecida-no-consumidor` antes do `erasure` (jamais 'sem dados, logo normal' — DOM-0004/HAZ-0005), `retired` entre `erasure` e `restore`, e `resolvida` depois do carimbo de `restore`
- **SEM-RPL.4 — NÃO EXECUTÁVEL** — causa: interface não existe (IF-07 `resolve(ref, as_of)` não foi exposta)
  - *Cláusula:* critério de aceitação do replay: para todo `t`, o estado derivado coincide com `resolve(ref, as_of=t)`
  - *Evidência:* IF-07 não existe. Este é o critério de aceitação declarado pelo contrato (§3) e sustenta DOM-0002/DOM-0003 — sem ele, o replay é verificável apenas contra si mesmo, o que não é evidência de compatibilidade.

## 7. O que permanece bloqueado por terceiros

| Bloqueio | Consequência para este harness |
|---|---|
| Sandbox AMH pinado inexistente (SPR-G3-11) | nenhum cenário pode ser executado contra o produtor; toda cláusula de produtor permanece indemonstrada |
| IF-07 `resolve(ref, as_of)` não exposta | CTS-11, CTS-14, CTS-15, CTS-16 e SEM-RPL.4 ficam sem o critério de aceitação declarado pelo contrato |
| Manifesto de contrato não publicado (OS-19) | CTS-22 fica sem objeto: não há digest a conferir |
| Fixtures ausentes F-1, F-2, F-5, F-6, F-7 | CTS-03, CTS-06, CTS-17 (parcial), CTS-18 e CTS-14/CTS-15 não têm insumo; nenhuma foi fabricada |
| Ambiente similar a produção não provisionado | a condição do Gate G3 permanece insatisfeita — o próprio manifesto registra que dev não a satisfaz |

---

*Nenhum cenário foi forçado a verde; nenhuma fixture foi criada ou alterada; nenhum identificador real foi acessado ou reproduzido; nenhuma decisão foi registrada por este relatório.*
