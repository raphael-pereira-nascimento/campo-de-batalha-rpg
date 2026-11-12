import {
  FISICA_CAMPOS,
  EQUIPAMENTO_CATEGORIAS,
  MATERIAL_APLICACOES,
  getCategoriaInfo,
  getRaridadeInfo,
  getQualidadeInfo,
  formatarPrecoPorKg,
  getEfeitoPorEquipamento,
} from '../game/materialRules.js';
import MaterialThumb from './MaterialThumb.jsx';

const ROTULOS_PENDENTES = {
  id: 'Identificador',
  nome: 'Nome',
  categoria: 'Categoria',
  descricao: 'Descrição',
  raridade: 'Raridade',
  qualidade: 'Qualidade',
  precoPorKg: 'Preço por kg',
  bioma: 'Bioma',
  aplicacoes: 'Aplicações',
  compatibilidade: 'Compatibilidade',
  efeitos: 'Efeitos',
  'fisica.caracteristicas': 'Características físicas',
  'fisica.dureza': 'Dureza',
  'fisica.resistencia': 'Resistência',
  'fisica.peso': 'Peso',
  'fisica.densidade': 'Densidade',
  'fisica.flexibilidade': 'Flexibilidade',
  'fisica.condutividadeMagica': 'Condutividade mágica',
};

function valorOuPendente(valor, sufixo = '') {
  if (valor == null || valor === '') return <span className="material-pendente-texto">Pendente</span>;
  return <>{valor}{sufixo}</>;
}

function BonusList({ bonus }) {
  const entradas = Object.entries(bonus || {}).filter(([, valor]) => Number(valor) !== 0);
  if (entradas.length === 0) {
    return <span className="material-pendente-texto">Sem alteração de atributo</span>;
  }
  return (
    <ul className="material-bonus-list">
      {entradas.map(([atributo, valor]) => {
        const numero = Number(valor);
        return (
          <li key={atributo} className={numero > 0 ? 'material-bonus-positivo' : 'material-bonus-negativo'}>
            {numero > 0 ? '+' : ''}{numero} {atributo}
          </li>
        );
      })}
    </ul>
  );
}

function EspecialTexto({ especial }) {
  if (!especial) return null;
  if (typeof especial === 'string') {
    return <p className="material-efeito-especial">Efeito especial: {especial}</p>;
  }

  return (
    <div className="material-efeito-especial">
      {especial.descricao && <p>Efeito especial: {especial.descricao}</p>}
      {Array.isArray(especial.modos) && (
        <ul className="material-bonus-list">
          {especial.modos.map((modo) => (
            <li key={modo.nome}>
              <strong>{modo.nome}</strong>
              {modo.descricao ? `: ${modo.descricao}` : ''}
              {modo.percentuais && ` — ${Object.entries(modo.percentuais)
                .map(([nome, valor]) => `${Number(valor) > 0 ? '+' : ''}${valor}% ${nome}`)
                .join(', ')}`}
              {modo.observacao ? ` (${modo.observacao})` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EfeitoBloco({ chave, info, material }) {
  const efeito = getEfeitoPorEquipamento(material, chave);
  const temPercentuais = efeito?.percentuais && Object.keys(efeito.percentuais).length > 0;
  const temPenalidades = efeito?.penalidades && Object.keys(efeito.penalidades).length > 0;
  const temAjustes = efeito?.ajustes && Object.keys(efeito.ajustes).length > 0;
  const temCondicoes = efeito?.condicoes?.length > 0;
  const temEspecial = Boolean(efeito?.especial);

  return (
    <div className={`material-efeito${efeito ? '' : ' material-efeito-vazio'}`}>
      <div className="material-efeito-head">
        <span>{info.icone} {info.nome}</span>
        {efeito?.fallback && (
          <span className="tag">{efeito.origem === 'geral' ? 'efeito geral' : 'fallback mágico'}</span>
        )}
      </div>

      {!efeito && <span className="material-pendente-texto">Efeito pendente para esta categoria.</span>}

      {efeito && (
        <>
          {efeito.desc && <p className="material-efeito-desc">{efeito.desc}</p>}
          <BonusList bonus={efeito.bonus} />

          {temPercentuais && (
            <ul className="material-bonus-list">
              {Object.entries(efeito.percentuais).map(([nome, valor]) => (
                <li key={nome} className={Number(valor) >= 0 ? 'material-bonus-positivo' : 'material-bonus-negativo'}>
                  {Number(valor) > 0 ? '+' : ''}{valor}% {nome}
                </li>
              ))}
            </ul>
          )}

          {temAjustes && (
            <ul className="material-bonus-list">
              {Object.entries(efeito.ajustes).map(([nome, valor]) => (
                <li key={nome} className={Number(valor) >= 0 ? 'material-bonus-positivo' : 'material-bonus-negativo'}>
                  {Number(valor) > 0 ? '+' : ''}{valor} {nome}
                </li>
              ))}
            </ul>
          )}

          {temPenalidades && (
            <ul className="material-bonus-list">
              {Object.entries(efeito.penalidades).map(([nome, valor]) => (
                <li key={nome} className="material-bonus-negativo">
                  Penalidade: {valor} {nome}
                </li>
              ))}
            </ul>
          )}

          {efeito.chance != null && (
            <p className="material-efeito-condicao">Chance: {efeito.chance}%</p>
          )}
          {efeito.duracao && (
            <p className="material-efeito-condicao">Duração: {efeito.duracao}</p>
          )}
          {efeito.alvo && (
            <p className="material-efeito-condicao">Alvo: {Array.isArray(efeito.alvo) ? efeito.alvo.join('; ') : efeito.alvo}</p>
          )}
          {efeito.status && (
            <p className="material-efeito-condicao">Status: {efeito.status}</p>
          )}

          {temCondicoes && (
            <p className="material-efeito-condicao">Condição: {efeito.condicoes.join('; ')}</p>
          )}

          {temEspecial && <EspecialTexto especial={efeito.especial} />}
        </>
      )}
    </div>
  );
}

export default function MaterialDetails({ material, onClose }) {
  if (!material) return null;

  const categoria = getCategoriaInfo(material);
  const raridade = getRaridadeInfo(material);
  const qualidade = getQualidadeInfo(material);
  const fisica = material.fisica || {};
  const pendentes = material.dadosPendentes || [];

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal material-detalhe"
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${material.nome}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="material-detalhe-head">
          <div className="material-detalhe-identidade">
            <MaterialThumb material={material} grande />
            <div>
              <h2>{material.nome}</h2>
              <div className="material-card-tags">
                <span className="tag">{categoria ? `${categoria.icone} ${categoria.nome}` : 'Categoria pendente'}</span>
                <span className="tag" style={{ color: raridade?.cor || undefined }}>
                  {raridade ? `Raridade: ${raridade.nome}` : 'Raridade pendente'}
                </span>
                <span className="tag" style={{ color: qualidade?.cor || undefined }}>
                  {qualidade ? `Qualidade: ${qualidade.nome}` : 'Qualidade pendente'}
                </span>
                {material.forma && <span className="tag">Forma: {material.forma}</span>}
              </div>
            </div>
          </div>
          <button type="button" className="ghost" onClick={onClose}>Fechar</button>
        </header>

        {!material.imagem && (
          <p className="material-alerta">Imagem pendente: exibindo a inicial do material.</p>
        )}

        <section className="material-detalhe-secao">
          <h3>Descrição</h3>
          <p>{material.descricao || 'Descrição pendente.'}</p>
        </section>

        <section className="material-detalhe-secao">
          <h3>Preço e medida</h3>
          <div className="material-detalhe-grid">
            <div><span className="muted">Preço por kg</span><strong>{formatarPrecoPorKg(material)}</strong></div>
            <div><span className="muted">Peso</span><strong>{valorOuPendente(fisica.peso, ' kg')}</strong></div>
            <div><span className="muted">Densidade</span><strong>{valorOuPendente(fisica.densidade)}</strong></div>
            <div><span className="muted">Dureza</span><strong>{valorOuPendente(fisica.dureza)}</strong></div>
            <div><span className="muted">Resistência</span><strong>{valorOuPendente(fisica.resistencia)}</strong></div>
            <div><span className="muted">Flexibilidade</span><strong>{valorOuPendente(fisica.flexibilidade)}</strong></div>
            <div><span className="muted">Condutividade mágica</span><strong>{valorOuPendente(fisica.condutividadeMagica)}</strong></div>
            <div><span className="muted">Características físicas</span><strong>{valorOuPendente(fisica.caracteristicas)}</strong></div>
          </div>
        </section>

        {material.caracteristicasEspeciais?.length > 0 && (
          <section className="material-detalhe-secao">
            <h3>Características especiais</h3>
            <ul className="material-lista material-lista-especial">
              {material.caracteristicasEspeciais.map((item, indice) => <li key={indice}>{item}</li>)}
            </ul>
          </section>
        )}

        <section className="material-detalhe-secao">
          <h3>Efeitos por equipamento</h3>
          <div className="material-efeitos-grid">
            {Object.entries(EQUIPAMENTO_CATEGORIAS).map(([chave, info]) => (
              <EfeitoBloco key={chave} chave={chave} info={info} material={material} />
            ))}
          </div>
        </section>

        <section className="material-detalhe-secao">
          <h3>Efeitos negativos</h3>
          {material.efeitosNegativos?.length
            ? <ul className="material-lista material-lista-negativa">
                {material.efeitosNegativos.map((item, indice) => <li key={indice}>{item}</li>)}
              </ul>
            : <span className="material-pendente-texto">Nenhum efeito negativo registrado (ou pendente).</span>}
        </section>

        <section className="material-detalhe-secao">
          <h3>Restrições</h3>
          {material.restricoes?.length
            ? <ul className="material-lista material-lista-restricao">
                {material.restricoes.map((item, indice) => <li key={indice}>{item}</li>)}
              </ul>
            : <span className="material-pendente-texto">Nenhuma restrição registrada.</span>}
        </section>

        <section className="material-detalhe-secao">
          <h3>Aplicações na fabricação</h3>
          {material.aplicacoes?.length
            ? <div className="material-tags-lista">
                {material.aplicacoes.map((aplicacao) => (
                  <span key={aplicacao} className="tag">
                    {MATERIAL_APLICACOES[aplicacao]?.icone} {MATERIAL_APLICACOES[aplicacao]?.nome || aplicacao}
                  </span>
                ))}
              </div>
            : <span className="material-pendente-texto">Aplicações pendentes.</span>}
        </section>

        <section className="material-detalhe-secao">
          <h3>Compatibilidade</h3>
          {Array.isArray(material.compatibilidade) && material.compatibilidade.length
            ? <div className="material-tags-lista">
                {material.compatibilidade.map((chave) => (
                  <span key={chave} className="tag">
                    {EQUIPAMENTO_CATEGORIAS[chave]?.nome || chave}
                  </span>
                ))}
              </div>
            : <span className="material-pendente-texto">Compatibilidade não definida.</span>}
        </section>

        {material.observacoes && (
          <section className="material-detalhe-secao">
            <h3>Observações</h3>
            <p>{material.observacoes}</p>
          </section>
        )}

        {material.relacoes?.length > 0 && (
          <section className="material-detalhe-secao">
            <h3>Relações</h3>
            <ul className="material-lista">
              {material.relacoes.map((relacao, indice) => (
                <li key={indice}>
                  {relacao.tipo}: {relacao.materialId}
                  {relacao.observacao ? ` — ${relacao.observacao}` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}

        {material.aliases?.length > 0 && (
          <section className="material-detalhe-secao">
            <h3>Também conhecido como</h3>
            <div className="material-tags-lista">
              {material.aliases.map((alias) => <span key={alias} className="tag">{alias}</span>)}
            </div>
          </section>
        )}

        <section className="material-detalhe-secao">
          <h3>Pendências desta ficha</h3>
          {pendentes.length
            ? <div className="material-tags-lista">
                {pendentes.map((chave) => (
                  <span key={chave} className="tag material-tag-pendente">
                    {ROTULOS_PENDENTES[chave] || chave}
                  </span>
                ))}
              </div>
            : <span className="material-ok-texto">Ficha completa conforme os campos do sistema.</span>}
        </section>
      </div>
    </div>
  );
}
