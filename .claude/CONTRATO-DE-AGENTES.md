# Contrato comum dos especialistas — consolidação final IntensiCare V2

Leitura obrigatória por **todo** agente antes de qualquer edição.
Fonte: `PROMPT_IMPLEMENTACAO_FINAL_INTENSICARE_V2.md` (§2, §5, §9, §10, §12, §14).

## 1. Idioma e rótulos

Todo material produzido (código, comentários, testes, documentação, mensagens de
erro, handoff) é em **pt-BR**. Use os rótulos epistêmicos de
`docs/00-governance/evidence-notation.md`: `OBSERVED`, `INFERENCE`, `PROPOSAL`,
`VALIDATION REQUIRED`, `BLOQUEADO`. "Não testado" e "bloqueado" são resultados
válidos; otimismo e silêncio não são.

## 2. Estado factual imutável — jamais altere, jamais contradiga

- vias clínicas acionáveis: **0**;
- matriz de vias: **47/47 inelegíveis**;
- `Observation` AMH: **não consumível**;
- compatibilidade AMH: **candidato a integração**, nunca "compatível";
- safety case: **M0**;
- dados reais acessados pela V2: **nenhum** (100% sintético, prefixo `SYNTH-`);
- a fatia é sintética, consultiva e **não** é release de produção;
- `MG-G1..MG-G8` são atos humanos pendentes. Você prepara evidência; não aprova.

Nenhuma mudança sua pode alegar produção, conformidade, segurança comprovada,
compatibilidade AMH ou efetividade clínica.

## 3. Autoridade — o que você NÃO pode decidir

- regra clínica, limiar, janela temporal, vetor de referência, texto clínico
  normativo, taxonomia de razões de status, mapeamento terminológico;
- SLO, banda aceitável, alvo de latência/frescor;
- provedor de nuvem, IdP, região, ambiente AMH;
- aceite de gate, aceitação de risco, alteração de branch protection.

Se a correção exigir qualquer um destes: **pare o item**, registre pedido de
desbloqueio preciso (quem decide, que evidência é necessária, qual o efeito
bloqueante) e continue os demais itens do seu escopo.

**Nunca** altere um vetor de referência, limiar ou regra clínica para fazer um
teste passar.

## 4. Método obrigatório

1. Reproduza o achado no código atual **antes** de editar. Achado herdado é
   hipótese, não fato.
2. Escreva o **teste vermelho primeiro**; só então a menor implementação que o
   torna verde; então a regressão afetada.
3. Toda mudança material cita ao menos um ID existente (`ADR-*`, `HAZ-*`,
   `THR-*`, `SEC-*`, `SAF-*`, `GDEC-*`, `SPR-*`, `PRE-*`, `BLK-*`) e um artefato.
4. Não cunhe prefixo global de ID novo. Se precisar de um ID, peça ao
   orquestrador.
5. Sem refatoração oportunista fora do delta confirmado.
6. Antes de escrever em arquivo compartilhado: releia `git status --short`, o
   diff e o estado em disco.

## 5. Fronteira de escrita

Seu despacho lista **exatamente** os caminhos que você pode criar/editar.
Escrever fora dessa lista é falha de execução — dois agentes nunca editam o mesmo
arquivo. Se precisar de uma mudança fora do seu escopo (por exemplo, fiação em
`apps/api/src/index.ts`), **descreva-a no handoff** e deixe o orquestrador aplicar.

Nunca use `git commit`, `git push`, `git merge`, `git checkout <branch>` nem
`gh`. O orquestrador integra.

Nunca faça merge das branches `cycle-4/*` ou `cycle-5/*`.

## 6. Anti-padrões proibidos (extrato do §10 do prompt)

1. Confundir pacote existente com integração concluída.
2. Confundir schema/HTTP 200/fixture com dado apto para uso.
3. Aceitar tenant de header, query, corpo, URL ou token não verificado.
4. Autorizar recurso comparando dois valores originados do mesmo chamador.
5. Usar superusuário, owner ou `BYPASSRLS` como identidade da aplicação.
6. Generalizar teste de RLS em PGlite para PostgreSQL de produção.
7. Deixar P0 como `expected fail` em pipeline que aparece verde.
8. Fazer fallback de IAM/OIDC indisponível para token local/sintético.
9. Permitir PGlite em memória, fixtures ou token sintético em perfil não-dev.
10. Usar o mesmo endpoint/status para liveness, readiness e startup.
11. Chamar replay finito de SSE de "tempo real".
12. Colocar bearer, PSR, tenant ou identificador do sujeito em query string/log.
13. Manter Promise sem tratamento final, deixando UI presa em carregamento.
14. Exibir dado stale como atual após erro ou reconexão.
15. Alterar vetor/regra para obter verde; otimizar contagem de teste/mutação.
16. Tornar gate consultivo, engolir falha ou usar `continue-on-error`.
17. Usar identificador realista, PHI, CPF, e-mail ou segredo em fixture/log.
18. Tratar ADR aceita como implementada, ou implementação como verificada.
19. Inventar SLO, limiar clínico, banda aceitável ou aprovação ausente.

## 7. Gates que precisam continuar verdes

```
pnpm build && pnpm typecheck && pnpm lint && pnpm check:boundaries \
  && pnpm test && pnpm check:generated && pnpm check:docs && pnpm check:forbidden
```
(equivalente: `pnpm verify`). Rode ao menos o subconjunto que toca seu escopo
antes de encerrar. Baseline a preservar (medida 2026-08-20, máquina ociosa):
**exit 0**, **1.973 testes verdes e 1 pulado**. O pulado é
`apps/api/src/db.test.ts`, condicionado a `PG_TEST_URL`: NÃO é P0 escondido —
avisa em stderr e vira falha dura sob `IC_FRONTEIRA_PG=obrigatoria`.
O `expected fail` de RLS sob PGlite foi eliminado e não deve voltar.

Todo documento novo em `docs/**.md` precisa de front matter YAML com
`status`, `source`/`provenance`, data e `owner`/`collector` — senão
`pnpm check:docs` falha. Nunca use o valor `DECIDED`.

## 8. Formato obrigatório do handoff final

Termine sua resposta com exatamente estas rubricas:

```
OBSERVADO:   o que você reproduziu no código atual, com comando/trecho
ALTERADO:    arquivos criados/editados, um por linha, com o porquê
TESTADO:     testes escritos e o resultado real da execução (comando + saída)
NÃO TESTADO: o que ficou sem cobertura e por quê
ASSUMIDO:    premissas reversíveis adotadas, cada uma com o ADR/ID que a ancora
DECIDIDO:    nada, salvo transcrição de decisão humana já registrada
REJEITADO:   o que o despacho pedia e você não fez, com a razão
EM ABERTO:   pedidos de desbloqueio, dependências humanas/AMH, fiação para o
             orquestrador aplicar em arquivo fora do seu escopo
```

Seu texto final é o valor de retorno lido pelo orquestrador — sem preâmbulo,
sem elogio, sem resumo de atividade. Fatos.
