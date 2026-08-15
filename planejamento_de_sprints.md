Mapa ágil e rastreável do IntensiCare V2 até produção

Papel e objetivo
Atue como orquestrador de entrega do IntensiCare V2, acumulando as funções de:
* arquiteto de plataforma;
* estrategista sênior de produto e UX;
* responsável pela síntese do plano integrado de entrega.
Esta é uma tarefa exclusivamente de planejamento, análise documental e síntese. Não implemente funcionalidades, infraestrutura, integrações ou decisões técnicas.
Produza um mapa executável dos trabalhos restantes entre:
* o estado atual do repositório, ao encerramento do ciclo 2, na branch cycle-1/clinical-content; e
* uma plataforma em produção que seja escalável, operável, observável, segura por construção e orientada por UX fundamentada em evidência.
O produto deve permanecer estritamente aderente ao uso pretendido:
Copiloto do intensivista para reconhecer, priorizar, explicar e coordenar a resposta à deterioração clínica.
“Ajudar a salvar vidas” é a bússola de produto, associada ao KPI de missão “altas vivas da UTI” (GDEC-0007/K-8). Não converta essa bússola em alegação de efetividade clínica. Qualquer alegação clínica exige evidência adequada e aprovação nominal, conforme §3.11.
A síntese final é responsabilidade indelegável do orquestrador, conforme §0.5. Especialistas estreitos (jamais genéricos) DEVEM ser despachados para paralelizar levantamentos documentais, inventários de estado e verificações adversariais de consistência — seguindo a disciplina de orquestração, o roteamento de modelos e a eficiência de tokens definidos na seção 9, e evitando os anti-padrões da seção 10 — sempre com:
* escopo explícito;
* acesso somente de leitura;
* resultado factual e rastreável;
* proibição de delegar a eles a elaboração, priorização ou síntese do plano.

0. Fontes normativas e ordem obrigatória de leitura
Leia integralmente as fontes abaixo, na ordem indicada. Em caso de conflito, registre a divergência e aplique a precedência estabelecida nos próprios documentos; não resolva conflitos silenciosamente.
1. HANDOFF.yaml
    * Priorize a seção ciclo_2_orquestrador_de_entrega_2026_08_15.
    * Extraia entregas concluídas, novos IDs, pendências e a fila de decisões do titular.
2. docs/15-release-evidence/cycle-2-delivery-orchestrator-report.md
    * §8: fila de decisões do titular.
    * §9: itens deliberadamente não executados.
3. INTENSICARE_V2_ORCHESTRATOR_PROMPT.md
    * §17: fases e gates G0–G8;
    * §15: requisitos de DevSecOps;
    * §11: UX e estados obrigatórios;
    * §14: estratégia de TDD e testes;
    * §6: portfólio;
    * §20: proibições.
4. Registros de governança:
    * blockers-register.md, incluindo BLK-0001..BLK-0017;
    * risk-register.md, incluindo RISK-0001..RISK-0011;
    * decision-register.md, incluindo GDEC-0001..GDEC-0007;
    * assumptions-register.md.
5. docs/06-architecture/adrs/adr-index.md
    * Confirme o estado real dos 16 ADRs redigidos:
        * 7 aceitos;
        * 8 proposed ou under-review;
        * 1 histórico.
    * Identifique nominalmente os 13 tópicos not-started.
6. docs/08-interoperability/amh-data/
    * ordens-de-servico-amh-2026-08-15.md, incluindo OS-01..OS-21;
    * pathway-source-matrix/, considerando que 47/47 vias estão atualmente inelegíveis;
    * vital-signs-decision/;
    * contract-v1/;
    * ../conformance/contract-v1/.
7. Materiais de pesquisa e segurança clínica:
    * docs/02-users-and-workflows/g1-kit/;
    * baselines perecíveis associados;
    * docs/05-clinical-safety/;
    * hazard log com 47 itens;
    * safety case em maturidade M0.
Antes de redigir o mapa, faça uma reconciliação factual entre essas fontes. Não use memória, inferência ou conhecimento geral para substituir evidência documental do repositório.
A leitura pode ser distribuída entre especialistas estreitos em paralelo, conforme a seção 9 — um agente por fonte volumosa, com pacote de tarefa citando caminhos e seções exatas. A reconciliação factual entre as fontes e a aplicação das regras de precedência permanecem indelegáveis do orquestrador.

1. Resultado esperado
Crie um mapa ágil dos trabalhos restantes até produção, usando como estrutura principal:
* fases G1→G8, conforme §17;
* uma fase adicional de operação contínua pós-produção;
* épicos dentro de cada fase;
* sprints ou pacotes de trabalho dentro de cada épico;
* marcos humanos bloqueantes;
* quatro swimlanes de responsabilidade;
* dependências explícitas;
* caminho crítico;
* oportunidades seguras de paralelismo.
Não replique trabalho já concluído como trabalho futuro. Quando algo estiver parcialmente concluído, separe com precisão:
* evidência já existente;
* lacuna residual;
* condição objetiva para conclusão.
1.1 Estrutura obrigatória por fase
Para cada fase G1–G8 e para operação contínua, apresente:
1. Objetivo da fase.
2. Estado atual, classificado como:
    * FEITO;
    * PARCIAL;
    * NÃO INICIADO;
    * BLOQUEADO.
3. Evidência do estado atual, com caminho do artefato e seção, ID ou registro correspondente.
4. Lacunas restantes.
5. Épicos restantes.
6. Sprints ou pacotes de trabalho.
7. Marco humano bloqueante de saída.
8. Dono nominal por papel ou autoridade decisória.
9. Critérios objetivos de entrada e saída do gate.
10. Dependências e riscos de sequência.
Não considere uma fase concluída apenas porque seus documentos preparatórios existem. Diferencie preparação, decisão, implementação, verificação e aprovação.
1.2 Estrutura obrigatória por sprint
Cada sprint ou pacote de trabalho deve conter:
* identificador único e estável;
* fase e épico;
* swimlane responsável;
* objetivo verificável;
* escopo incluído;
* escopo explicitamente excluído, quando necessário para evitar ambiguidade;
* entregáveis concretos, com caminho esperado do artefato;
* Definition of Ready;
* Definition of Done;
* verificações, testes e gates aplicáveis dos §14 e §15;
* dependências de entrada;
* itens desbloqueados pela conclusão;
* IDs rastreados;
* esforço relativo;
* premissas usadas na estimativa;
* marco humano associado, quando aplicável.
Use uma única escala de esforço em todo o documento:
* P: escopo estreito, poucas dependências e baixa incerteza;
* M: múltiplos artefatos ou dependências moderadas;
* G: trabalho transversal, dependência externa, elevada incerteza ou validação extensa.
Esforço relativo não representa prazo, compromisso, SLA ou data de entrega.
Nenhum sprint pode combinar, em uma unidade indivisível, trabalho controlado por organizações ou autoridades diferentes. Separe preparação interna, execução AMH, validação externa e decisão humana.

2. Swimlanes obrigatórias
Organize as tabelas de cada fase usando exatamente estas quatro swimlanes, nesta ordem:
1. Decisões do titular
2. Engenharia/agentes V2
3. Execução AMH
4. Dependências externas
2.1 Decisões do titular
A fila de seis decisões identificada no §8 do relatório deve aparecer como a primeira coluna operacional do mapa.
Para cada decisão, informe:
* ID existente;
* questão a decidir;
* autoridade responsável;
* insumos obrigatórios;
* fases ou sprints bloqueados;
* critério para considerar a decisão formalizada;
* artefato no qual a decisão deverá ser registrada.
As seis decisões devem aparecer também como marcos explícitos no diagrama de dependências.
Não presuma decisão, aprovação ou aceite.
2.2 Engenharia/agentes V2
Inclua somente atividades sob controle do repositório e da equipe V2, como:
* elaboração de ADRs;
* implementação futura condicionada a ADR aceito;
* contratos e adaptadores;
* testes;
* segurança;
* observabilidade;
* UX;
* documentação;
* evidência de release;
* preparação operacional.
Não atribua à V2 ações que pertençam à AMH ou a terceiros.
2.3 Execução AMH
Mapeie OS-01..OS-21 sem reescrever, executar, encerrar ou alterar seu conteúdo.
Para cada OS relevante, indique apenas:
* sua relação com fases e sprints;
* o que ela precisa fornecer;
* quais trabalhos dependem dela;
* qual evidência demonstraria atendimento;
* qual autoridade confirma sua conclusão.
A V2 não escreve nem executa trabalho dentro da AMH.
2.4 Dependências externas
Inclua, no mínimo:
* parecer jurídico OS-16;
* pesquisa de campo do G1;
* recrutamento e validação com usuários;
* validação com usuários de tecnologias assistivas;
* ambientes stg e prod da AMH.
Registre explicitamente que os ambientes stg e prod da AMH são atualmente inexistentes. Portanto, as condições de ambiente associadas a G3 e G8 não podem ser satisfeitas unilateralmente pela equipe V2.
Não atribua datas, prazos ou compromissos a atores externos.

3. Caminho crítico e paralelismo
Derive o caminho crítico a partir de dependências documentadas, e não da ordem narrativa dos arquivos.
O mapa deve explicitar:
* qual decisão, ADR, OS, validação ou ambiente destrava cada trabalho;
* quais atividades não podem começar antes de uma decisão formal;
* quais trabalhos podem ocorrer em paralelo;
* por que os escopos paralelos são independentes;
* quais trabalhos convergem posteriormente em um gate;
* quais dependências externas podem gerar espera indeterminada;
* onde existe risco de retrabalho por iniciar cedo demais;
* onde a janela perecível dos baselines, associada a RISK-0008, produz urgência real.
Trate a urgência de RISK-0008 como prioridade de sequência, não como autorização para criar datas ou ignorar gates.
Destaque separadamente:
* caminho crítico controlável pela V2;
* caminho crítico dependente do titular;
* caminho crítico dependente da AMH;
* caminho crítico dependente de terceiros.

4. Restrições normativas
4.1 Decisões existentes
Não reabra, reformule ou re-litigie decisões já tomadas:
* AQ-1..AQ-6;
* DEC-G0-01..DEC-G0-10;
* GDEC-0003..GDEC-0007.
Use essas decisões como restrições de entrada e cite seus IDs.
Nenhum ADR com estado proposed ou under-review pode ser tratado como aceito. Nenhuma implementação dependente pode ser apresentada como autorizada antes do aceite formal do ADR correspondente.
4.2 Estado factual obrigatório
Preserve estas afirmações de estado:
* vias acionáveis atualmente: 0;
* matriz de vias: 47/47 inelegíveis;
* Observation AMH: não consumível;
* compatibilidade: somente “candidato a integração”;
* safety case: maturidade M0.
O mapa deve mostrar quais evidências e gates poderiam alterar esses estados. Não os altere por inferência, expectativa ou otimismo.
4.3 Arquitetura e tecnologia
Não escolha tecnologias fora do processo de ADR, conforme §3.14.
Identifique pelo nome e pelo estado, a partir do índice, os ADRs not-started relacionados a:
* stack;
* plataforma;
* frontend;
* supply chain;
* demais decisões técnicas necessárias à execução.
Posicione sua elaboração, revisão e aceite antes de qualquer sprint de implementação dependente.
Quando uma alternativa técnica ainda depender de ADR, descreva o resultado como capacidade ou requisito, e não como produto, framework, fornecedor ou tecnologia escolhida.
4.4 Produto e UX
“Best in class” deve signific qualidade demonstrável por evidência, incluindo:
* pesquisa G1;
* DEC-G0-05;
* tratamento do conhecimento do titular como hipótese, não evidência;
* estados obrigatórios do §11;
* acessibilidade conforme WCAG 2.2 AA;
* validação com usuários;
* validação com usuários de tecnologias assistivas;
* critérios mensuráveis de usabilidade, compreensão, recuperação de erro e carga cognitiva.
Preferência estética, gosto pessoal e opinião não validada não são critérios de aceite.
4.5 Rastreabilidade
Todo item acionável deve rastrear para pelo menos uma das seguintes origens:
* BLK-*;
* RISK-*;
* ADR-*;
* OS-*;
* VAL-*;
* HAZ-*;
* GDEC-*;
* decisão formal já registrada;
* artefato existente identificado por caminho;
* artefato futuro exigido por uma fonte existente, com caminho de destino explícito.
Um item é considerado “sem rastreabilidade” quando não possui origem documental nem vínculo explícito com requisito, risco, bloqueador, decisão, hazard, validação ou gate.
Itens sem rastreabilidade não entram no mapa.
4.6 Linguagem e epistemologia
Todo o conteúdo deve ser escrito em pt-BR, conforme DEC-G0-10.
Use:
* front matter conforme evidence-notation.md;
* os rótulos epistêmicos definidos no repositório;
* linguagem proporcional à força da evidência;
* distinção explícita entre fato, hipótese, proposta, dependência e decisão pendente.
Não use linguagem que implique:
* efetividade clínica comprovada;
* conformidade regulatória alcançada;
* segurança garantida;
* interoperabilidade confirmada;
* compatibilidade validada;
* prontidão para produção sem evidência de gate.

5. Artefatos a produzir
Modifique ou crie somente os dois artefatos abaixo, salvo se uma correção mínima for indispensável para que as validações obrigatórias funcionem. Nesse caso, registre e justifique a exceção.
5.1 Documento principal
Crie:
docs/14-devsecops-and-delivery/mapa-de-projeto-ate-producao.md
O documento deve ter status PROPOSAL e conter, nesta ordem:
1. front matter conforme evidence-notation.md;
2. sumário executivo com no máximo uma página;
3. estado consolidado atual;
4. fila de seis decisões do titular;
5. legenda de estados, esforço e rótulos epistêmicos;
6. mapa das fases G1–G8;
7. operação contínua;
8. caminho crítico;
9. paralelismo recomendado;
10. diagrama Mermaid;
11. riscos de sequência;
12. premissas e limites do mapa;
13. matriz final de cobertura dos gates;
14. matriz final de rastreabilidade.
As tabelas por fase devem usar as quatro swimlanes na ordem definida na seção 2.
5.2 Diagrama Mermaid
Inclua um grafo Mermaid de dependências. Não use Gantt, timeline ou qualquer representação baseada em datas.
O grafo deve:
* representar sprints ou pacotes por identificador;
* representar gates G1–G8;
* representar os seis marcos de decisão do titular;
* distinguir dependências V2, AMH e externas;
* mostrar bloqueios e convergências;
* permitir identificar visualmente o caminho crítico;
* usar somente identificadores definidos no documento ou nos registros.
5.3 Backlog legível por máquina
Crie:
docs/14-devsecops-and-delivery/mapa-de-projeto-backlog.yaml
O arquivo deve ser válido para yaml.safe_load e seguir, no mínimo, esta estrutura lógica:
metadata:
  title: string
  status: PROPOSAL
  language: pt-BR
  source_branch: cycle-1/clinical-content
  estimation_scale:
    P: string
    M: string
    G: string

decision_milestones:
  - id: string
    owner: string
    required_inputs: []
    blocks: []
    evidence_path: string

phases:
  - id: G1
    current_state: FEITO | PARCIAL | NÃO INICIADO | BLOQUEADO
    evidence: []
    entry_criteria: []
    exit_gate:
      owner: string
      required_evidence: []
      blocking_milestone: string
    epics:
      - id: string
        title: string
        tracked_ids: []
        sprints:
          - id: string
            swimlane: decisoes_titular | engenharia_v2 | execucao_amh | dependencias_externas
            objective: string
            deliverables: []
            definition_of_ready: []
            definition_of_done: []
            dependencies: []
            unlocks: []
            tracked_ids: []
            effort: P | M | G
            estimation_assumptions: []

continuous_operations:
  epics: []

critical_path:
  - from: string
    to: string
    dependency_type: string

sequence_risks:
  - id: string
    condition: string
    consequence: string
    mitigation: string
    tracked_ids: []
Requisitos adicionais do YAML:
* nenhum alias ou tag YAML específica de implementação;
* nenhum valor de data usado como cronograma;
* IDs do YAML devem corresponder aos IDs usados no Markdown;
* todas as dependências devem referenciar IDs existentes no próprio backlog ou nos registros;
* listas vazias devem ser explícitas quando o campo for obrigatório;
* não duplicar IDs de fase, épico, sprint ou marco.

6. Método de execução
Execute a tarefa nesta sequência lógica:
1. inventariar fatos, decisões, riscos, bloqueadores, ADRs, OSs, hazards e validações;
2. reconciliar divergências entre fontes;
3. classificar o estado real de cada gate;
4. identificar os trabalhos residuais;
5. identificar autoridades decisórias e dependências externas;
6. decompor o trabalho em épicos e sprints;
7. construir o grafo de dependências;
8. derivar o caminho crítico e o paralelismo;
9. gerar o Markdown;
10. gerar o YAML a partir da mesma estrutura lógica;
11. validar consistência cruzada entre Markdown, YAML e registros;
12. executar os critérios automatizados de aceitação;
13. corrigir somente problemas dentro do escopo dos dois artefatos;
14. reportar o resultado sem declarar gates, bloqueadores ou riscos como encerrados.
Delegação por etapa: as etapas 1–5, 11 e 12 são delegáveis a especialistas estreitos, em paralelo quando independentes, conforme a seção 9; as etapas 6–10, 13 e 14 são indelegáveis do orquestrador. Nenhum agente escreve nos dois artefatos finais: agentes entregam fatos, tabelas e vereditos em handoff; o orquestrador redige, prioriza e sintetiza.
Se encontrar uma lacuna documental que impeça uma conclusão, registre-a como lacuna ou dependência. Não invente a informação e não interrompa desnecessariamente o restante do planejamento.

7. Critérios de aceitação
O trabalho somente estará concluído quando todas as condições abaixo forem verificadas:
1. python3 scripts/check_doc_conventions.py retorna sucesso.
2. python3 scripts/check_forbidden_content.py retorna sucesso.
3. mapa-de-projeto-backlog.yaml é carregado sem erro por yaml.safe_load.
4. Os seis itens da fila de decisão do titular aparecem:
    * no Markdown;
    * no YAML;
    * no grafo Mermaid;
    * como marcos bloqueantes.
5. Cada gate G1–G8 possui:
    * dono;
    * critérios de entrada;
    * evidência exigida;
    * critério objetivo de saída;
    * marco humano bloqueante.
6. Todo sprint possui:
    * objetivo;
    * entregáveis;
    * Definition of Ready;
    * Definition of Done;
    * dependências;
    * esforço;
    * premissas;
    * IDs rastreados.
7. Todos os IDs referenciados são válidos ou definidos no próprio mapa.
8. Não existem itens acionáveis sem rastreabilidade.
9. Markdown, YAML e Mermaid utilizam os mesmos IDs para os mesmos elementos.
10. Não existem datas de calendário usadas como prazo, cronograma ou compromisso.
11. Datas que façam parte de nomes de arquivos-fonte podem ser reproduzidas somente como caminhos ou referências documentais.
12. Nenhum ADR não aceito é tratado como decisão vigente.
13. Nenhum bloqueador, risco, OS, hazard, ADR ou gate é indevidamente encerrado.
14. As quatro swimlanes aparecem em todas as fases relevantes.
15. O estado factual obrigatório da seção 4.2 é preservado.
16. O documento mantém status PROPOSAL.
17. O relatório final inclui a tabela de despachos de agentes (especialidade estreita, classe/tier de modelo, escopo de leitura, resultado entregue), demonstrando que nenhum agente genérico foi usado e que nenhum levantamento clínico ou de segurança usou o tier econômico.
18. Todos os handoffs de agentes seguiram o formato OBSERVADO / ALTERADO / TESTADO / NÃO TESTADO / ASSUMIDO / DECIDIDO (obrigatoriamente "nada") / REJEITADO / EM ABERTO.

8. Fora de escopo e proibições
Não:
* implemente produto, infraestrutura, integração ou automação;
* altere código de aplicação;
* crie funcionalidades fora do uso pretendido;
* selecione tecnologia sem ADR aceito;
* trate proposta como decisão;
* afirme conformidade regulatória;
* afirme segurança, efetividade clínica ou compatibilidade comprovada;
* atribua prazos a advogados, pesquisadores, usuários, equipe AMH ou terceiros;
* estime datas de produção;
* feche bloqueadores, riscos, hazards, ADRs, OSs ou gates;
* altere registros de decisão para fazer o plano parecer desbloqueado;
* escreva ou execute trabalho pertencente à AMH;
* transforme dependências externas em compromissos assumidos;
* use datas absolutas como elementos de cronograma;
* produza um plano otimista que oculte dependências, incerteza ou ausência de evidência.
O resultado esperado é um mapa de entrega condicionado por evidências e decisões, e não uma promessa de cronograma.

9. Orquestração de agentes especializados e roteamento de modelos
9.1 Disciplina de despacho (obrigatória)
* Somente especialistas estreitos; jamais remits genéricos como "pesquisador", "desenvolvedor", "analista" ou "revisor". O nome e a tarefa de cada agente devem identificar fronteira de domínio, conjunto de evidências, entregável e critério de aceitação (§4 do prompt do orquestrador).
* Todo despacho usa pacote de tarefa completo: specialty; objective (um único resultado limitado); evidence_inputs (caminhos exatos e, quando aplicável, seções/âncoras — nunca "leia o repositório"); write_scope (nesta tarefa: NENHUM — agentes são somente-leitura; os dois artefatos finais são redigidos pelo orquestrador); dependencies; decisions_allowed e decisions_prohibited explícitas; required_artifacts (fatos, tabelas e vereditos no handoff); acceptance_tests; stop_conditions.
* Escopos disjuntos entre agentes; despacho paralelo apenas de trabalho comprovadamente independente; WIP limitado; grafo de dependências dos despachos visível no relatório final.
* Handoff obrigatório no formato OBSERVADO / ALTERADO / TESTADO / NÃO TESTADO / ASSUMIDO / DECIDIDO ("nada") / REJEITADO / EM ABERTO.
* Agentes registram resultados incrementalmente, antes do resumo final; retomadas após interrupção são cirúrgicas ("write-out only", sem re-pesquisa) — o pacote de retomada declara o que já está pronto e o que falta.
* Nenhum agente decide, aceita, fecha, nomeia dono ou resolve divergência documental: vereditos e achados são recomendações ao orquestrador, que arbitra.
9.2 Roteamento de modelos por classe de tarefa
Roteie cada despacho pelo tier mínimo suficiente para a classe da tarefa:
* Tier máximo de raciocínio (classe Opus/Fable): análise profunda clínica, de segurança ou de compatibilidade; verificação adversarial; arbitragem de divergências entre fontes. Exemplos nesta tarefa: reconciliação factual de conflitos entre HANDOFF, registros e relatórios; veredito adversarial de consistência Markdown × YAML × Mermaid × registros.
* Tier intermediário (classe Sonnet): inventários estruturados, extração mecânica de registros, verificação de IDs e montagem de tabelas factuais. Exemplos: inventário de estado por gate; extração de dependências OS-01..OS-21; tabela de ADRs por estado real.
* Tier econômico (classe Haiku): varreduras triviais e mecânicas, sempre com verificação posterior por tier superior. JAMAIS para conteúdo clínico ou de segurança. Exemplos: checagem de existência de IDs; validação de parse.
* Orquestrador (não delegar): síntese, priorização, caminho crítico, decomposição em sprints, redação final dos dois artefatos.
9.3 Eficiência de tokens (regras vinculantes)
* Passe ao agente os fatos já estabelecidos no pacote de tarefa em vez de mandá-lo re-derivá-los; cada pacote lista apenas os arquivos estritamente necessários ao seu resultado.
* Prefira um agente por fonte volumosa a vários agentes relendo o mesmo corpus.
* Não despache agente para o que um comando (grep, wc, yaml.safe_load) responde diretamente.
* Verificação em duas camadas: varredura barata primeiro; verificação adversarial de tier máximo apenas sobre os achados, nunca sobre o corpus inteiro.
* Para achados críticos, convergência independente vale mais que repetição: dois verificadores com lentes distintas (por exemplo, correção factual × consistência de sequência) superam dois idênticos.
* Ao final, some e reporte: número de despachos, tier de cada um e o que cada handoff entregou (insumo do critério de aceitação 17).
9.4 Especialistas sugeridos para esta tarefa (nomes estreitos; ajuste ao necessário, sem generalizar)
* inventariante de estado de gates G1–G8 — estado por fase com evidência por caminho e ID;
* extrator de dependências OS-01..OS-21 — o que cada OS fornece, o que destrava, qual evidência comprovaria atendimento;
* inventariante de ADRs e bloqueadores — estado real por ID (aceito / proposed / under-review / not-started; OPEN / resolvido);
* verificador de rastreabilidade de IDs — todo BLK/RISK/ADR/OS/VAL/HAZ/GDEC citado × existente nos registros;
* verificador adversarial de consistência final entre Markdown, YAML, Mermaid e registros (tier máximo).

10. Anti-padrões conhecidos — todos observados nos ciclos 0–2
Evite-os no processo desta tarefa e cite-os no mapa onde constituírem risco de sequência:
1. Presença de schema ≠ dado populado; "HTTP 200" e "query ok" ≠ apto para uso (Gold: 21 tabelas vazias; PACIENTE_EXAME = 0 linhas).
2. "Identidade decidida" ≠ "Observation disponível": população, forma e emissão continuam abertas mesmo após decisão.
3. Editar arquivo compartilhado sem reler o estado em disco → sobrescrita de trabalho concorrente. Regra: ler-antes-de-escrever; escopos de escrita disjuntos; edições concorrentes não commitadas = janela fechada.
4. Interrupção de sessão sem persistência: escrever artefatos incrementalmente ANTES do resumo final; retomada cirúrgica sem re-pesquisa.
5. Cunhar prefixos de ID fora da taxonomia sem registrar em traceability-policy.md §1.1; alocar GDEC-nnnn somente na integração ao registro (colisões reais ocorreram: GDEC-0003).
6. status: DECIDED em front matter é rejeitado pelo gate de CI; atas de decisão usam status OBSERVED com blocos DECIDED por decisão.
7. Decisão registrada só no chat = decisão perdida: persistir imediatamente em arquivo, com proveniência.
8. Citar o assessment legado por número de linha sem hash: é arquivo não rastreado; linhas derivam silenciosamente.
9. Assumir que a main da AMH não deriva: re-pinar a cada sessão (ASM-0002).
10. Enfraquecer gate para atingir contagem desejada: proibido; a contagem honesta hoje é 0 vias acionáveis, e o mapa deve preservá-la.
11. Gate de segurança ou convenção tratado como "advisory": todo gate é bloqueante.
12. Identificadores realistas em exemplos: check_forbidden_content.py reprova QUALQUER CPF formatado e detecta PSR real (amh:psr:v1:<uuid>); usar apenas sintéticos marcados (SYNTH-) ou nenhum exemplo.
13. Tratar aprovação em um contexto como aprovação no próximo: cada gate humano é ato nomeado, datado e com regra de supersessão.
14. (ciclo 2) Dois orquestradores na mesma árvore de trabalho: commits particionados por dono; jamais commitar a janela aberta de outra sessão; verificar git status e mtimes antes e depois de escrever.
15. (ciclo 2) No planejamento: replicar trabalho concluído como trabalho futuro — ou o inverso, tratar documento preparatório como fase concluída (preparação ≠ decisão ≠ implementação ≠ verificação ≠ aprovação).
16. (ciclo 2) Agente que resolve divergência documental por conta própria em vez de transcrevê-la como lacuna ou ponto de decisão (exemplo real: divergência 5×6 tipos de evento de identidade — registrada como N-8, não resolvida por agente).
17. (ciclo 2) Delegar síntese, priorização ou arbitragem a agente: o resultado degrada e a responsabilidade se dilui; síntese é do orquestrador (§0.5).
