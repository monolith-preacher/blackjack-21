import type { Rules } from '../../engine';
import { formatAmount } from '../../utils/format';

const SHORTCUTS: Array<[string, string]> = [
  ['1 – 5', 'Adicionar ficha (5, 25, 100, 500, 1K)'],
  ['U / Backspace', 'Desfazer última ficha'],
  ['C', 'Limpar aposta'],
  ['R', 'Repetir aposta anterior'],
  ['X', 'Dobrar aposta (antes de distribuir)'],
  ['Enter / Espaço', 'Distribuir · Nova rodada'],
  ['H', 'Pedir carta (Hit)'],
  ['S', 'Parar (Stand)'],
  ['D', 'Dobrar (Double Down)'],
  ['P', 'Dividir (Split)'],
  ['M', 'Ativar/desativar som'],
  ['T · ?', 'Estatísticas · Regras'],
  ['Esc', 'Fechar painel'],
];

export function RulesPanel({ rules }: { rules: Rules }) {
  return (
    <div className="rules-panel">
      <p className="muted">
        Objetivo: chegar mais perto de 21 do que o dealer sem ultrapassar. Cartas numéricas valem seu número, figuras
        (J, Q, K) valem 10 e o Ás vale 1 ou 11 — o que for melhor para a mão. Mãos com Ás contado como 11 são
        chamadas de <em>suaves</em> (ex.: A+6 = 7 / 17).
      </p>

      <h3 className="panel-subtitle">Regras desta mesa</h3>
      <ul className="rules-list">
        <li><strong>Shoe:</strong> {rules.decks} baralhos, reembaralhado ao atingir o corte (~{Math.round(rules.penetration * 100)}% distribuído).</li>
        <li><strong>Dealer:</strong> {rules.dealerHitsSoft17 ? 'compra até 17 e compra no 17 suave (H17).' : 'compra até 17 e para em todos os 17, inclusive 17 suave (S17).'}</li>
        <li><strong>Blackjack natural</strong> (Ás + carta de valor 10 nas duas primeiras cartas) paga <strong>3:2</strong>.</li>
        <li><strong>Vitória comum</strong> paga <strong>1:1</strong>. <strong>Empate</strong> devolve a aposta.</li>
        <li>{rules.dealerPeek ? 'Com Ás ou 10 à mostra, o dealer verifica se tem Blackjack antes da sua jogada — se tiver, você perde apenas a aposta original.' : 'O dealer não verifica Blackjack antecipadamente.'}</li>
        <li><strong>Dobrar (Double):</strong> em quaisquer duas primeiras cartas; dobra a aposta, recebe exatamente uma carta e para.</li>
        <li><strong>Dividir (Split):</strong> pares de mesmo valor {rules.splitByValue ? '(inclusive 10 com figuras)' : '(mesma carta, ex.: 8-8 ou K-K)'}, até {rules.maxHands} mãos. Cada mão recebe aposta igual à original.</li>
        <li>{rules.doubleAfterSplit ? 'Pode dobrar após dividir.' : 'Não é permitido dobrar após dividir.'}</li>
        <li><strong>Ases divididos</strong> recebem apenas uma carta cada e não podem ser divididos novamente.</li>
        <li>21 formado após uma divisão conta como 21 comum (paga 1:1), não como Blackjack.</li>
        <li>Ao atingir 21 a mão para automaticamente.</li>
        <li>Seguro (insurance) e rendição (surrender) não são oferecidos.</li>
        <li><strong>Limites:</strong> aposta mínima {formatAmount(rules.minBet)}, máxima {formatAmount(rules.maxBet)}.</li>
      </ul>

      <h3 className="panel-subtitle">Atalhos de teclado</h3>
      <dl className="shortcut-list">
        {SHORTCUTS.map(([k, d]) => (
          <div key={k}>
            <dt><kbd>{k}</kbd></dt>
            <dd>{d}</dd>
          </div>
        ))}
      </dl>

      <p className="disclaimer">Jogo de entretenimento com fichas virtuais. Nenhum dinheiro real é utilizado.</p>
    </div>
  );
}
