import { useMemo, useState } from 'react';
import {
  EQUIPAMENTO_CATEGORIAS,
  calcularBonusComposicao,
  calcularPrecoPorQuantidade,
  formatarCents,
  formatarPrecoPorKg,
  getEfeitoPorEquipamento,
} from '../game/materialRules.js';

function ListaBonus({ bonus, vazio = 'Nenhum atributo alterado.' }) {
  const entradas = Object.entries(bonus || {}).filter(([, valor]) => Number(valor) !== 0);
  if (entradas.length === 0) return <span className="material-pendente-texto">{vazio}</span>;
  return (
    <ul className="material-bonus-list">
      {entradas.map(([atributo, valor]) => (
        <li key={atributo} className={Number(valor) > 0 ? 'material-bonus-positivo' : 'material-bonus-negativo'}>
          {Number(valor) > 0 ? '+' : ''}{valor} {atributo}
        </li>
      ))}
    </ul>
  );
}

export default function MaterialComposition({ materiais = [] }) {
  const [principalId, setPrincipalId] = useState('');
  const [secundarioId, setSecundarioId] = useState('');
  const [categoria, setCategoria] = useState('armadura');
  const [quantidadeKg, setQuantidadeKg] = useState('1');

  const principal = materiais.find((material) => material.id === principalId) || null;
  const secundario = materiais.find((material) => material.id === secundarioId) || null;

  const resultado = useMemo(
    () => calcularBonusComposicao(principal, secundario, categoria),
    [principal, secundario, categoria],
  );

  const efeitoPrincipal = getEfeitoPorEquipamento(principal, categoria);
  const efeitoSecundario = getEfeitoPorEquipamento(secundario, categoria);

  const kg = Number(quantidadeKg) || 0;
  const custoPrincipal = calcularPrecoPorQuantidade(principal?.precoPorKg, kg);
  const custoSecundario = calcularPrecoPorQuantidade(secundario?.precoPorKg, kg * 0.25);
  const custoTotal = (custoPrincipal || 0) + (custoSecundario || 0);
  const temPreco = custoPrincipal != null || custoSecundario != null;

  const opcoes = materiais
    .slice()
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));

  return (
    <div className="material-composicao">
      <p className="muted">
        Material principal fornece 100% dos efeitos. Material secundário fornece no máximo 25%.
        Efeitos idênticos não acumulam: prevalece o valor do material principal.
      </p>

      <div className="material-composicao-form">
        <label>
          Material principal
          <select value={principalId} onChange={(evento) => setPrincipalId(evento.target.value)}>
            <option value="">— selecionar —</option>
            {opcoes.map((material) => (
              <option key={material.id} value={material.id}>{material.nome}</option>
            ))}
          </select>
        </label>

        <label>
          Material secundário (até 25%)
          <select value={secundarioId} onChange={(evento) => setSecundarioId(evento.target.value)}>
            <option value="">— nenhum —</option>
            {opcoes.map((material) => (
              <option key={material.id} value={material.id}>{material.nome}</option>
            ))}
          </select>
        </label>

        <label>
          Categoria do equipamento
          <select value={categoria} onChange={(evento) => setCategoria(evento.target.value)}>
            {Object.entries(EQUIPAMENTO_CATEGORIAS).map(([chave, info]) => (
              <option key={chave} value={chave}>{info.nome}</option>
            ))}
          </select>
        </label>

        <label>
          Quantidade de material (kg)
          <input
            type="number"
            min="0"
            step="0.1"
            value={quantidadeKg}
            onChange={(evento) => setQuantidadeKg(evento.target.value)}
          />
        </label>
      </div>

      {!resultado.ok && (
        <p className="material-alerta material-alerta-forte">
          {resultado.motivo || 'Composição não permitida.'}
        </p>
      )}

      <div className="material-composicao-resultado">
        <div className="material-composicao-coluna">
          <h3>Material principal</h3>
          <strong>{principal ? principal.nome : 'Nenhum'}</strong>
          {principal && <span className="muted">{formatarPrecoPorKg(principal)}</span>}
          {efeitoPrincipal?.desc && <p className="material-efeito-desc">{efeitoPrincipal.desc}</p>}
          <ListaBonus bonus={resultado.principal?.bonus} />
          {resultado.principal?.percentuais && Object.keys(resultado.principal.percentuais).length > 0 && (
            <ul className="material-bonus-list">
              {Object.entries(resultado.principal.percentuais).map(([nome, valor]) => (
                <li key={nome} className={Number(valor) >= 0 ? 'material-bonus-positivo' : 'material-bonus-negativo'}>
                  {Number(valor) > 0 ? '+' : ''}{valor}% {nome}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="material-composicao-coluna">
          <h3>Material secundário (25%)</h3>
          <strong>{secundario ? secundario.nome : 'Nenhum'}</strong>
          {secundario && <span className="muted">{formatarPrecoPorKg(secundario)}</span>}
          {efeitoSecundario?.desc && <p className="material-efeito-desc">{efeitoSecundario.desc}</p>}
          <ListaBonus
            bonus={resultado.secundario?.bonusAplicado}
            vazio="Nada aplicado (valor arredondado para zero ou não acumulável)."
          />
          {resultado.secundario?.ignorados?.length > 0 && (
            <div className="material-ignorados">
              <span className="muted">Não acumulado:</span>
              <ul className="material-lista">
                {resultado.secundario.ignorados.map((item, indice) => (
                  <li key={`${item.atributo}-${indice}`}>
                    {item.atributo} — {item.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="material-composicao-coluna material-composicao-final">
          <h3>Resultado da peça</h3>
          <ListaBonus bonus={resultado.bonusFinal} vazio="Nenhum bônus numérico nesta categoria." />
          {resultado.percentuaisFinal && Object.keys(resultado.percentuaisFinal).length > 0 && (
            <ul className="material-bonus-list">
              {Object.entries(resultado.percentuaisFinal).map(([nome, valor]) => (
                <li key={nome} className={Number(valor) >= 0 ? 'material-bonus-positivo' : 'material-bonus-negativo'}>
                  {Number(valor) > 0 ? '+' : ''}{valor}% {nome}
                </li>
              ))}
            </ul>
          )}

          <div className="material-custo">
            <span className="muted">Custo do material</span>
            {temPreco
              ? <strong>{formatarCents(custoTotal)}</strong>
              : <span className="material-pendente-texto">Preço pendente</span>}
            <span className="material-custo-detalhe">
              {quantidadeKg || 0} kg do principal
              {secundario ? ` + ${(kg * 0.25).toFixed(2)} kg do secundário` : ''}
            </span>
            <span className="material-custo-detalhe">
              Não inclui o preço-base do equipamento.
            </span>
          </div>
        </div>
      </div>

      {resultado.avisos?.length > 0 && (
        <div className="material-avisos">
          {resultado.avisos.map((aviso, indice) => (
            <p key={indice} className="material-aviso">{aviso}</p>
          ))}
        </div>
      )}
    </div>
  );
}
