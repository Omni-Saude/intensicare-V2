/**
 * apps/web/e2e/vocabulario-de-banda.spec.ts
 *
 * A MESMA invariante do teste de unidade (`src/domain/vocabularioDeBanda.test.ts`),
 * medida em NAVEGADOR REAL sobre o bundle real: **o que o backend emitiu como
 * banda é o que o clínico lê na tela — com o nome que o backend usou.**
 *
 * POR QUE ISTO PRECISA EXISTIR SEPARADO DO TESTE DE UNIDADE. A unidade prova a
 * função; esta prova o CAMINHO INTEIRO: resposta HTTP de verdade atravessando o
 * proxy do Vite, o cliente real, o mapeamento, a camada de linguagem, o React e
 * o CSS. O defeito corrigido (`alerta → alto`) vivia exatamente numa junta
 * entre camadas, e o gate de unidade da época estava verde.
 *
 * A GRADE É FORNECIDA PELA ROTA, e não pela API, pelo mesmo motivo já
 * registrado em `resiliencia-rede.spec.ts`: sem bundle de regra clínica
 * assinado carregado, `/v1/projecoes/grade-leitos` devolve toda linha sem
 * avaliação computada — nenhuma banda existiria, e o laço abaixo iteraria
 * sobre zero selos, passando verde sem ter olhado a tela. A sessão continua
 * REAL (autenticada pela API); o que é determinístico é a pré-condição.
 *
 * A ASSERÇÃO NÃO CONHECE A REDAÇÃO. Ela não procura "Banda de risco: alerta";
 * procura a invariante: o rótulo contém a palavra da banda emitida e não
 * contém a palavra de nenhuma outra. Assim ela sobrevive à ratificação de
 * terminologia da ADR-0029 (condição C2, ABERTA) e continua reprovando uma
 * renomeação.
 *
 * Dados 100% sintéticos (`SYNTH-`). Nenhuma alegação de produção.
 *
 * Rastreio: ADR-0021 F1/F3, ADR-0011 P7, ADR-0029 C2, HAZ-0005.
 */
import { expect, test } from "@playwright/test";
import { abrirAplicacao } from "./apoio/base.js";

const ROTA_GRADE = "**/v1/projecoes/grade-leitos*";

/** As quatro bandas do contrato (`@intensicare/contratos`, `BandaRisco`). */
const BANDAS = ["normal", "atencao", "alerta", "critico"] as const;

function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function gradeCom(banda: string): string {
  return JSON.stringify({
    leitos: [
      {
        leitoId: "SYNTH-TENANT-G7-UTI-01-LEITO-01",
        encontroId: "SYNTH-TENANT-G7-ENC-P001",
        pacienteRef: "amh:psr:v1:SYNTH-P001",
        escore: 5,
        banda,
        statusAvaliacao: "valido",
        frescor: "atual",
        atualizadoEm: "2026-08-18T12:00:00.000Z",
        alerta: null,
      },
    ],
  });
}

test.describe("vocabulário de banda em navegador real", () => {
  for (const banda of BANDAS) {
    test(`a banda "${banda}" emitida pela API é a banda nomeada na tela`, async ({ page }) => {
      await page.route(ROTA_GRADE, (rota) =>
        rota.fulfill({
          status: 200,
          contentType: "application/json",
          body: gradeCom(banda),
        }),
      );

      await abrirAplicacao(page);

      // O selo da banda é o que acompanha o total NEWS2 na mesma linha do
      // cartão — âncora estrutural, não textual.
      const linhaDoEscore = page.locator(".cartao-leito__linha", { hasText: "NEWS2:" });
      const selo = linhaDoEscore.locator(".badge-tom");

      // GUARDA DE NÃO-VACUIDADE: sem isto, uma tela vazia (sessão recusada,
      // rota não aplicada, cartão não renderizado) faria as asserções abaixo
      // passarem sobre nada.
      await expect(selo).toHaveCount(1);
      await expect(selo).toBeVisible();

      const rotulo = semAcento((await selo.innerText()).trim());
      expect(rotulo.length, "o selo da banda está vazio").toBeGreaterThan(0);

      // (1) O rótulo NOMEIA a banda que o backend emitiu.
      expect(rotulo, `o selo não nomeia a banda "${banda}" emitida pela API`).toContain(
        semAcento(banda),
      );

      // (2) E não nomeia nenhuma outra — nem por promoção, nem por rebaixamento.
      for (const outra of BANDAS) {
        if (outra === banda) continue;
        expect(rotulo, `o selo da banda "${banda}" também nomeia "${outra}"`).not.toContain(
          semAcento(outra),
        );
      }
    });
  }

  test("o vocabulário antigo da web não aparece em tela para banda alguma", async ({ page }) => {
    // `alerta` é o caso do defeito histórico: era renomeado para "alto", um
    // nível acima do tier *medium* ao qual o contrato o ancora.
    await page.route(ROTA_GRADE, (rota) =>
      rota.fulfill({ status: 200, contentType: "application/json", body: gradeCom("alerta") }),
    );

    await abrirAplicacao(page);

    const linhaDoEscore = page.locator(".cartao-leito__linha", { hasText: "NEWS2:" });
    const selo = linhaDoEscore.locator(".badge-tom");
    await expect(selo).toHaveCount(1);

    const rotulo = semAcento((await selo.innerText()).trim());
    for (const antigo of ["baixo", "medio", "alto"]) {
      expect(
        rotulo,
        `o selo voltou ao vocabulário anterior ao contrato: "${antigo}"`,
      ).not.toContain(antigo);
    }
    // Não-vacuidade: o rótulo medido é o da banda `alerta`, não uma string
    // vazia que passaria por todos os `not.toContain` acima.
    expect(rotulo).toContain("alerta");
  });
});
