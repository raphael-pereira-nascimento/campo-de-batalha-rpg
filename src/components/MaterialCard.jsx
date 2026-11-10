import {
  getCategoriaInfo,
  getRaridadeInfo,
  getQualidadeInfo,
  formatarPrecoPorKg,
  precoKgEmCents,
} from '../game/materialRules.js';

// Placeholder com a inicial do material + selo "Imagem pendente" (decisão C-10).
function MaterialThumb({ material }) {
  const inicial = (material.nome || '?').trim().charAt(0).toUpperCase();
  const temImagem = Boolean(material.imagem);

  return (
    <div className="material-thumb" aria-hidden="true">
      {temImagem
        ? <img src={material.imagem} alt="" onError={(evento) => { evento.currentTarget.style.display = 'none'; }} />
        : <span className="material-thumb-inicial">{inicial}</span>}
      {!temImagem && <span className="material-thumb-selo">Imagem pendente</span>}
    </div>
  );
}

export default function MaterialCard({ material, onSelect }) {
  const categoria = getCategoriaInfo(material);
  const raridade = getRaridadeInfo(material);
  const qualidade = getQualidadeInfo(material);
  const preco = precoKgEmCents(material.precoPorKg);

  return (
    <button
      type="button"
      className={`material-card${material.status === 'pendente' ? ' material-card-pendente' : ''}`}
      onClick={() => onSelect(material)}
      title={`Abrir ficha de ${material.nome}`}
    >
      <MaterialThumb material={material} />

      <div className="material-card-body">
        <div className="material-card-head">
          <strong>{material.nome}</strong>
          <span className={`material-categoria-tag material-categoria-${material.categoria}`}>
            {categoria ? `${categoria.icone} ${categoria.nome}` : 'Categoria pendente'}
          </span>
        </div>

        <div className="material-card-tags">
          <span className="tag" style={{ color: raridade?.cor || undefined }}>
            {raridade ? raridade.nome : 'Raridade pendente'}
          </span>
          <span className="tag" style={{ color: qualidade?.cor || undefined }}>
            {qualidade ? qualidade.nome : 'Qualidade pendente'}
          </span>
        </div>

        <p className="material-card-desc">
          {material.descricao || 'Descrição pendente.'}
        </p>

        <div className="material-card-footer">
          <span className="material-preco">{formatarPrecoPorKg(material)}</span>
          <span className="material-card-status">
            {material.status === 'completo' ? 'Ficha completa' : 'Dados pendentes'}
          </span>
        </div>

        {preco == null && (
          <span className="material-alerta">Preço por kg ainda não definido</span>
        )}
      </div>
    </button>
  );
}
