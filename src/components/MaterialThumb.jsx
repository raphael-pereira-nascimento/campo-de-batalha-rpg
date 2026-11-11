import { useEffect, useState } from 'react';

// Miniatura compartilhada entre o card e a ficha detalhada.
// Se a imagem não existir (ou falhar ao carregar), mostra a inicial e o selo
// "Imagem pendente" em vez de deixar um espaço vazio ou um ícone quebrado.
export default function MaterialThumb({ material, grande = false }) {
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const imagem = material?.imagem || null;
  const inicial = (material?.nome || '?').trim().charAt(0).toUpperCase() || '?';
  const temImagem = Boolean(imagem) && !imagemFalhou;

  useEffect(() => {
    setImagemFalhou(false);
  }, [imagem]);

  return (
    <div className={`material-thumb${grande ? ' material-thumb-grande' : ''}`} aria-hidden="true">
      {temImagem
        ? <img src={imagem} alt="" onError={() => setImagemFalhou(true)} />
        : <span className="material-thumb-inicial">{inicial}</span>}
      {!temImagem && <span className="material-thumb-selo">Imagem pendente</span>}
    </div>
  );
}
