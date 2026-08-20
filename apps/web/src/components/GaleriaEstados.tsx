/**
 * apps/web/src/components/GaleriaEstados.tsx
 *
 * Galeria de revisão que renderiza TODOS os identificadores obrigatórios do
 * §11, agrupados pelas seis famílias do
 * `docs/10-ux-and-accessibility/modelo-de-estados-obrigatorios.md`.
 *
 * POR QUE EXISTE. ADR-0021 F4: "a ausência de um estado obrigatório é defeito
 * bloqueante de revisão, não uma melhoria futura". Sem uma superfície que
 * mostre os 51 identificadores lado a lado (as sete famílias anteriores somam 44 —
 * o "43" que este comentário trazia estava um a menos, recontado ao acrescentar as
 * famílias 8 e 9), a única forma de verificar
 * cobertura era ler o union type — e um tipo declarado não prova que existe
 * texto, tom, glifo e marcação acessível para cada valor. A galeria também é
 * o alvo mais denso do axe: uma varredura aqui cobre todas as combinações de
 * tom/contraste de uma vez.
 *
 * HONESTIDADE. Esta tela é um catálogo de APRESENTAÇÃO. Nada aqui é dado de
 * paciente, nada aqui foi originado por transporte real, e os estados de
 * conectividade `reproduzindo`/`reconciliado` são exibidos ainda que o
 * transporte que os produziria (replay por cursor, ADR-0011 P4) não exista
 * nesta fatia — a própria tela declara isso, em vez de sugerir capacidade.
 *
 * Só é alcançável em desenvolvimento (`?estados`, guardado em `App.tsx`).
 */
import type {
  EstadoAvaliacao,
  EstadoCarregamento,
  EstadoConectividade,
  EstadoFrescor,
  EstadoItemTrabalho,
  EstadoSessao,
  FrescorVisao,
  IdadeVisao,
} from "../domain/estados.js";
import {
  type SituacaoProntidao,
  textoAvaliacao,
  textoCarregamento,
  textoConectividade,
  textoFrescor,
  textoFrescorVisao,
  textoIdadeVisao,
  textoItemTrabalho,
  textoProntidao,
  textoSessao,
} from "../domain/linguagem.js";
import { BadgeTom } from "./BadgeTom.js";

const CARREGAMENTO: EstadoCarregamento[] = [
  "carregando",
  "vazio",
  "indisponivel",
  "proibido",
  "tempo_esgotado",
  "retentando",
  "parcial",
  "pronto",
  "erro",
];

const FRESCOR: EstadoFrescor[] = [
  "atual",
  "envelhecendo",
  "desatualizado",
  "expirado",
  "ausente",
  "invalido",
  "conflitante",
  "corrigido",
  "substituido",
];

const AVALIACAO: EstadoAvaliacao[] = [
  "valida",
  "parcial",
  "nao_avaliada",
  "desatualizada",
  "invalida",
];

const ITEM_TRABALHO: EstadoItemTrabalho[] = [
  "nao_atribuido",
  "atribuido",
  "reconhecido",
  "escalado",
  "sobreposto",
  "resolvido",
  "suprimido",
  "reaberto",
];

const CONECTIVIDADE: EstadoConectividade[] = [
  "online",
  "degradado",
  "offline",
  "reconectando",
  "reproduzindo",
  "reconciliado",
];

const SESSAO: EstadoSessao[] = [
  "ativa",
  "expirando",
  "expirada",
  "recuperada",
  "trabalho_nao_salvo_protegido",
];

const FRESCOR_VISAO: FrescorVisao[] = ["atual", "desatualizado_apos_falha"];

const IDADE_VISAO: IdadeVisao[] = ["sem_leitura", "no_ciclo", "ciclo_perdido"];

const PRONTIDAO: SituacaoProntidao[] = ["ready", "degraded", "not_ready", "nao_lida"];

interface FamiliaProps<T extends string> {
  titulo: string;
  idSecao: string;
  nota: string;
  valores: readonly T[];
  traduzir: (valor: T) => { texto: string; tom: Parameters<typeof BadgeTom>[0]["tom"] };
}

function Familia<T extends string>({ titulo, idSecao, nota, valores, traduzir }: FamiliaProps<T>) {
  return (
    <section aria-labelledby={idSecao} className="galeria-familia">
      <h3 id={idSecao}>
        {titulo} <small>({valores.length})</small>
      </h3>
      <p>{nota}</p>
      <ul className="galeria-lista">
        {valores.map((valor) => {
          const { texto, tom } = traduzir(valor);
          return (
            <li key={valor} data-identificador={valor} className="galeria-item">
              <code>{valor}</code>
              <BadgeTom texto={texto} tom={tom} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Catálogo completo dos estados obrigatórios do §11 (revisão, apenas dev). */
export function GaleriaEstados() {
  return (
    <section aria-labelledby="galeria-titulo">
      <h2 id="galeria-titulo">Galeria de estados obrigatórios (§11)</h2>
      <p>
        Catálogo de APRESENTAÇÃO para revisão de UI. Nenhum item abaixo é dado de paciente, e nenhum
        foi originado por transporte real. Os textos em pt-BR são PROVISÓRIOS: a ratificação de
        terminologia clínica corre pelo processo da ADR-0029 (condição C2, ainda aberta) e nenhuma
        redação aqui é definitiva.
      </p>

      <Familia
        titulo="1. Carregamento (componente/tela)"
        idSecao="galeria-carregamento"
        nota="Estados de obtenção de uma tela ou lista. `erro`, `indisponivel` e `proibido` são anunciados assertivamente e oferecem ação de recuperação."
        valores={CARREGAMENTO}
        traduzir={textoCarregamento}
      />

      <Familia
        titulo="2. Frescor do dado clínico"
        idSecao="galeria-frescor"
        nota="Originado no backend a partir do tempo clínico de fonte (ADR-0008 N5/SAF-0004). O frontend nunca infere estes valores."
        valores={FRESCOR}
        traduzir={textoFrescor}
      />

      <Familia
        titulo="3. Avaliação clínica"
        idSecao="galeria-avaliacao"
        nota="`nao_avaliada` e `invalida` são fail-closed: nunca exibem escore, banda ou cor de severidade, e nunca reusam o tom de 'sem problema' (HAZ-0005; ADR-0029 P1)."
        valores={AVALIACAO}
        traduzir={textoAvaliacao}
      />

      <Familia
        titulo="4. Item de trabalho (alerta)"
        idSecao="galeria-item-trabalho"
        nota="Ciclo de vida da ADR-0009 W1. `reconhecido` (ciência) é deliberadamente distinto de `resolvido` (encerramento) — ADR-0029 P5."
        valores={ITEM_TRABALHO}
        traduzir={textoItemTrabalho}
      />

      <Familia
        titulo="5. Conectividade"
        idSecao="galeria-conectividade"
        nota="`reproduzindo` e `reconciliado` passaram a ter ORIGEM REAL: o canal SSE (ADR-0011 P4) está fiado na casca e os estados do fio chegam à tela pela ponte `CONECTIVIDADE_POR_ESTADO_CONEXAO`. Deixaram de ser catálogo de apresentação. O que continua valendo: o push nunca traz dado clínico — ele diz QUE releia, e quem lê é a projeção autoritativa (P7/P8); e replay finito não é chamado de tempo real."
        valores={CONECTIVIDADE}
        traduzir={textoConectividade}
      />

      <Familia
        titulo="6. Sessão"
        idSecao="galeria-sessao"
        nota="Originada no provedor de sessão (ADR-0015 tem direção aceita (GDEC-0016), mas nenhum IdP real foi contratado). `trabalho_nao_salvo_protegido` declara preservação e reapresentação para confirmação — jamais reenvio automático (ADR-0009 W2)."
        valores={SESSAO}
        traduzir={textoSessao}
      />

      <Familia
        titulo="7. Frescor da visão (transporte)"
        idSecao="galeria-frescor-visao"
        nota="Introduzido no ACH-07 e SEPARADO da família 2: descreve apenas se o conteúdo em tela é anterior a uma falha de recarga. Não é juízo clínico."
        valores={FRESCOR_VISAO}
        traduzir={textoFrescorVisao}
      />

      <Familia
        titulo="8. Idade da visão (transporte)"
        idSecao="galeria-idade-visao"
        nota="Introduzida ao fechar LAC-L1 e ORTOGONAL à família 7: aquela responde 'a última tentativa falhou?', esta responde 'há quanto tempo foi a última leitura bem-sucedida?'. `ciclo_perdido` fala do CICLO DE RECARGA desta tela (premissa reversível de engenharia), jamais de frescor clínico — janelas e horizontes são conteúdo de rule release (VAL-0023, VALIDATION REQUIRED)."
        valores={IDADE_VISAO}
        traduzir={textoIdadeVisao}
      />

      <Familia
        titulo="9. Prontidão do serviço (GET /v1/readyz)"
        idSecao="galeria-prontidao"
        nota="Veredito ORIGINADO no backend (ADR-0020 O4). Nesta instalação a superfície responde 503 permanente — retrato honesto do safety case M0, não defeito. As RAZÕES não aparecem aqui porque não são traduzidas pelo frontend: o código é vocabulário fechado e o texto pt-BR vem do servidor (ADR-0008 N3). `nao_lida` é o caso fail-closed em que o frontend não obteve veredito algum."
        valores={PRONTIDAO}
        traduzir={textoProntidao}
      />
    </section>
  );
}
