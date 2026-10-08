import { useState } from 'react';

const SECTIONS = [
  {
    id: 'conceito',
    titulo: '1. Conceito',
    conteudo: (
      <>
        <p>RPG de fantasia medieval + fantasia sombria + exploração de masmorras.</p>
        <p>O mundo possui tecnologia equivalente ao Renascimento, incluindo armas de fogo.</p>
        <p><strong>Principais inspirações:</strong></p>
        <ul>
          <li>D&amp;D: fantasia, raças, classes e masmorras.</li>
          <li>Pokémon/Final Fantasy: combate por turnos e foco reduzido em posicionamento.</li>
          <li>Empires &amp; Puzzles: simplicidade, classes, passivas, magia, Mana e HP.</li>
          <li>Guts &amp; Blackpowder: armas de fogo de época.</li>
          <li>Wakfu: mochila/armazenamento mágico.</li>
          <li>Berserk: atmosfera sombria e inspiração para o evento O Eclipse.</li>
        </ul>
        <p>O sistema usa <strong>D20</strong>.</p>
        <p>NÃO utilizar testes de Carisma como parte fundamental do sistema.</p>
      </>
    ),
  },
  {
    id: 'atributos',
    titulo: '2. Atributos',
    conteudo: (
      <>
        <p>Os 5 atributos principais são: FOR (Força), INT (Inteligência), RES (Resistência), DEX/AGI (Destreza/Agilidade) e REF (Reflexo).</p>
        <p>Escala normal dos atributos: 1–10.</p>
        <p><strong>ATRIBUTO FINAL = ATRIBUTO BASE + BR + BC + OUTROS MODIFICADORES</strong> (bônus racial, de classe, de habilidades, equipamentos e efeitos temporários).</p>
        <ul>
          <li>RES → influencia HP.</li>
          <li>INT → influencia Mana.</li>
          <li>DEX/AGI → ações de precisão, movimento e controle.</li>
          <li>REF → reação, esquiva e ações rápidas.</li>
          <li>FOR → força física, carga e equipamentos pesados.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'nivel',
    titulo: '3. Nível',
    conteudo: (
      <>
        <p>O limite máximo de nível ainda não está definido (possibilidade de chegar a aproximadamente LV 1100).</p>
        <p>Ao subir de nível, os atributos evoluem automaticamente. A progressão não é simplesmente +1 em tudo: atributos maiores podem gerar aumentos maiores conforme a fórmula de progressão.</p>
        <p className="muted">Não inventar nova fórmula de progressão sem autorização.</p>
      </>
    ),
  },
  {
    id: 'hp',
    titulo: '4. HP',
    conteudo: (
      <p>HP é derivado principalmente da Resistência. A fórmula definitiva considera RES, bônus racial, bônus de classe e outros modificadores. Não substituir a fórmula atual por uma fórmula antiga ou genérica.</p>
    ),
  },
  {
    id: 'mana',
    titulo: '5. Mana',
    conteudo: (
      <>
        <p>Mana é o recurso fundamental para magia e habilidades mágicas. INT influencia diretamente a Mana máxima.</p>
        <p><strong>Versão atual do sistema:</strong> Vida = 500 + (Resistência Final × 10) · Mana = (Inteligência Final × 10).</p>
        <p>O Atributo Final já inclui BR + BC + outros modificadores (raça, classe, equipamentos, gemas e efeitos).</p>
      </>
    ),
  },
  {
    id: 'recuperacao-mana',
    titulo: '6. Recuperação de Mana',
    conteudo: (
      <>
        <p><strong>RECUPERAÇÃO = GASTO DE MANA ÷ 2</strong></p>
        <ul>
          <li>5 Mana → recupera aproximadamente 3</li>
          <li>10 Mana → recupera 5</li>
          <li>15 Mana → recupera aproximadamente 8</li>
          <li>20 Mana → recupera 10</li>
          <li>30 Mana → recupera 15</li>
        </ul>
        <p>A recuperação natural NÃO deve ser tão alta a ponto de tornar poções inúteis.</p>
      </>
    ),
  },
  {
    id: 'combate',
    titulo: '7. Combate',
    conteudo: (
      <>
        <p>Combate baseado em turnos, com D20 como principal dado. Sem posicionamento tático extremamente detalhado.</p>
        <p><strong>Versão atual do sistema de dano:</strong> Dano físico = (Força Final + danoBase da arma) × 10 · Golpe de habilidade = Força Final × poder% × 1,5 × 10 (mega: × 2,2) · Dano mágico = (Inteligência Final × 10) × poder% × 1,4 · Cura = (Inteligência Final × 10) × poder% × 1,4 (cura mega: × 2,2) · Poções de HP restauram 250 / 600 — tudo na mesma escala da vida.</p>
        <p>O dano é determinístico pelos Atributos Finais (sem dados), como a vida e a mana. A defesa da armadura reduz o dano na mesma escala (× 10); o acerto ainda é decidido no D20, e crítico (×2), elementos e buffs são multiplicadores por cima. Constantes provisórias — ajuste único em <code>sistema.js</code>.</p>
        <p>Distância simplificada: perto, médio alcance, longe, fora do alcance.</p>
        <p><strong>Estados e condições:</strong> voando, ferido, envenenado, atordoado, queimando, congelado, sangrando, efeitos mágicos, buffs e debuffs.</p>
      </>
    ),
  },
  {
    id: 'classes',
    titulo: '8. Classes',
    conteudo: (
      <p>Classes definem função, bônus, habilidades, passivas, estilo de combate e especializações. Não impedem outras construções (ex.: um tanque pode usar armadura leve, mas sua classe tem maior sinergia com pesadas).</p>
    ),
  },
  {
    id: 'racas',
    titulo: '9. Raças',
    conteudo: (
      <p>Raças fornecem BR, passivas, habilidades, modificadores de atributos, características físicas e diferenças de fome/saciedade. Algumas possuem voo natural — que não torna o personagem invulnerável.</p>
    ),
  },
  {
    id: 'voo',
    titulo: '10. Voo',
    conteudo: (
      <>
        <p>Voo é uma condição de combate/exploração, não um sistema 3D complexo. Pode haver altitude simplificada.</p>
        <p><strong>Alcance vertical dos ataques:</strong> ataque terrestre não alcança certas altitudes; arcos e armas de fogo têm maior alcance; certas magias atingem voadores; outras têm alcance limitado.</p>
        <p>Voo pode ser natural (exige resistência/fadiga em viagens longas) ou mágico (pode usar Mana). DEX/AGI e REF influenciam controle e reação durante o voo.</p>
      </>
    ),
  },
  {
    id: 'experiencia',
    titulo: '11. Experiência',
    conteudo: (
      <p>A XP de um combate é dividida conforme a participação de cada personagem (dano, cura, suporte, ações importantes, objetivos). A fórmula definitiva pode ser refinada, mas nenhum jogador deve monopolizar toda a XP. Progressão com inspiração em Pokémon.</p>
    ),
  },
  {
    id: 'equipamentos',
    titulo: '12. Equipamentos',
    conteudo: (
      <p>Equipamentos fornecem bônus, malefícios, resistências, habilidades e efeitos especiais. O jogador administra peso, quantidade, espaço e recursos. Não são apenas cosméticos.</p>
    ),
  },
  {
    id: 'armaduras',
    titulo: '13. Armaduras',
    conteudo: (
      <>
        <ul>
          <li><strong>Leve</strong> — mais mobilidade, menor proteção. Sinergia: ladinos, arqueiros, exploradores.</li>
          <li><strong>Média</strong> — equilíbrio entre proteção e mobilidade.</li>
          <li><strong>Pesada</strong> — maior proteção, menor mobilidade. Sinergia: tanques, cavaleiros.</li>
          <li><strong>Superpesada</strong> — proteção extrema com grandes penalidades. Sinergia: tanques pesados, gigantes, alta FOR/RES.</li>
          <li><strong>Mágica</strong> — características especiais e efeitos variados.</li>
        </ul>
        <p>A armadura não é restrição absoluta de classe — apenas sinergia.</p>
      </>
    ),
  },
  {
    id: 'armas-fogo',
    titulo: '14. Armas de Fogo',
    conteudo: (
      <p>Tecnologia limitada ao Renascimento: pistola, mosquete, bacamarte, rifle, canhões. Características: alto dano, custo elevado, munição relevante, recarga lenta, grande recompensa ao acertar e risco ao falhar. Canhões: dano extremamente alto, pesados, caros e lentos. Não avançar para armas modernas.</p>
    ),
  },
  {
    id: 'falhas',
    titulo: '15. Falhas e Manutenção',
    conteudo: (
      <>
        <p>Qualquer arma pode sofrer falhas: ataque muito forte, uso defensivo, falha crítica, natural 1 no D20, desgaste. Exemplos: espada perde o fio, machado quebra o cabo, mosquete emperra, arma mágica fica instável, escudo sofre dano estrutural.</p>
        <p>O ferreiro tem importância real: repara, reforça, modifica, instala gemas, fabrica, cuida de armas de fogo e mantém veículos.</p>
      </>
    ),
  },
  {
    id: 'inventario',
    titulo: '16. Inventário',
    conteudo: (
      <p>Inventário usa peso, quantidade e espaço/capacidade. Itens mágicos especiais: cinto de bolsos, cinto de bolsos mágicos, bolsa de flechas, bolsa de flechas mágica e mochila sem fundo (item caro que funciona quase como uma sala de armazenamento móvel).</p>
    ),
  },
  {
    id: 'fome',
    titulo: '17. Fome',
    conteudo: (
      <p>Existe sistema de fome/saciedade. Raças podem ter diferenças de consumo, saciedade e resistência. Não comer gera penalidades e interage com exploração e preparação de aventuras.</p>
    ),
  },
  {
    id: 'alcool',
    titulo: '18. Álcool',
    conteudo: (
      <p>Álcool tem efeitos temporários que variam entre personagens/raças: bônus temporários, penalidades, redução de precisão, redução de Reflexo, dificuldade para usar magia e perda de ações em estados extremos. Não usar Carisma para determinar efeitos.</p>
    ),
  },
  {
    id: 'gemas',
    titulo: '19. Pedras Preciosas / Gemas',
    conteudo: (
      <>
        <p>Instaláveis em armas, armaduras, acessórios e golems. Precisam ser lapidadas, têm efeitos permanentes, normalmente não quebram (podem quebrar em falha crítica) e a remoção exige magia específica.</p>
        <p><strong>Limite de encaixes:</strong> armas leves 2–3 · médias até 5 · pesadas/grandes 7–8 · armaduras 4 · acessórios 3.</p>
        <p>Tipos de efeito: dano, defesa, resistência, magia, elementos, suporte, cura, veneno, dor, sangue, metal, ilusão, tempo, invocação, luz, escuridão, fogo, água, gelo, ar, planta, eletricidade e psíquico. Efeitos muito fortes precisam de contrapartidas.</p>
      </>
    ),
  },
  {
    id: 'golems',
    titulo: '20. Golems',
    conteudo: (
      <p>Golems comuns não têm Mana e lutam fisicamente. Golems especiais usam gemas/mana — a gema instalada determina parte de suas características. Exemplo: Diamante aumenta defesa e ataque, reduz velocidade; Obsidiana dá resistência a fogo, magia sombria e ataques. Valores seguem a tabela oficial de gemas.</p>
    ),
  },
  {
    id: 'hordas',
    titulo: '21. Hordas',
    conteudo: (
      <p>Hordas são tratadas como uma única unidade com HP total, dano, resistência, quantidade aproximada, moral, nível e habilidades. Conforme o HP diminui, a quantidade efetiva diminui. Podem ser pequenas, grandes, enormes, mistas ou em ondas.</p>
    ),
  },
  {
    id: 'chefes',
    titulo: '22. Chefes',
    conteudo: (
      <>
        <p><strong>BOSS HP = HP TOTAL DOS JOGADORES × 2</strong> (ex.: (210 + 310 + 120 + 510) × 2), ajustável por quantidade de jogadores e tipo de chefe.</p>
        <p>Chefes podem ter fases, passivas, habilidades exclusivas, resistências e mecânicas especiais.</p>
      </>
    ),
  },
  {
    id: 'dungeons',
    titulo: '23. Dungeons',
    conteudo: (
      <>
        <p>Progressão inicial de exemplo:</p>
        <ul>
          <li>Manequim de madeira → LV 1–5</li>
          <li>Esqueleto → LV 5–10</li>
          <li>Zumbi → LV 10–15</li>
          <li>Mini Golem → mini-chefe LV 20</li>
          <li>Golem de Pedra → chefe LV 25</li>
        </ul>
        <p>Dungeons podem ter puzzles, inimigos, subchefes, chefes, recompensas, equipamentos, gemas e eventos especiais.</p>
      </>
    ),
  },
  {
    id: 'eclipse',
    titulo: '24. O Eclipse',
    conteudo: (
      <>
        <p>Evento mundial periódico inspirado em Berserk, mas com identidade própria. Durante o Eclipse: monstros pacíficos ficam agressivos, animais mudam de comportamento, monstros e chefes ficam mais fortes, variantes especiais surgem, chefes ganham habilidades e passivas, XP aumenta, equipamentos melhores aparecem e raças recebem buffs.</p>
        <p><strong>Periodicidade proposta:</strong> aproximadamente a cada 30 dias. Dias 1–24 normais, 25–27 primeiros sinais, 28–29 aumento de atividade, dia 30 Eclipse, com influência residual nos dias seguintes. Tipos: comum, maior e extremamente raro/especial.</p>
      </>
    ),
  },
  {
    id: 'economia',
    titulo: '25. Economia',
    conteudo: (
      <>
        <ul>
          <li>Bronze = R$1</li>
          <li>Prata = R$100</li>
          <li>Ouro = R$1.000</li>
          <li><strong>Ouropla = R$10.000</strong> (NÃO vale R$1.000)</li>
          <li>Platina = R$100.000</li>
        </ul>
        <p>Preços coerentes com nível, qualidade, raridade, região, disponibilidade e função do item.</p>
      </>
    ),
  },
  {
    id: 'veiculos',
    titulo: '26. Veículos',
    conteudo: (
      <>
        <ul>
          <li><strong>Carroça de Carga</strong> — grande capacidade, pesada, para recursos.</li>
          <li><strong>Carroça de Corrida</strong> — rápida, leve, pequena, mais frágil.</li>
          <li><strong>Carroça de Transporte</strong> — transporte de pessoas/carga comum.</li>
          <li><strong>Carroça de Defesa</strong> — resistente, pesada, difícil de destruir/roubar.</li>
        </ul>
        <p>Podem existir veículos mágicos: quartos, cozinha, oficina, armazenamento dimensional, estábulo, laboratório, voadores, barcos e submarinos mágicos.</p>
      </>
    ),
  },
  {
    id: 'regra-fundamental',
    titulo: '27. Regra Fundamental',
    conteudo: (
      <>
        <p>NÃO alterar uma regra já estabelecida sem autorização. NÃO transformar sugestão antiga em regra oficial. NÃO inventar fórmulas quando uma regra estiver incompleta.</p>
        <p>Quando houver conflito: verificar a versão mais recente, priorizar a correção do criador, registrar a inconsistência e perguntar antes de alterar regra importante.</p>
        <p>Classificação: <strong>CONFIRMADA</strong> → regra definida · <strong>PROVISÓRIA</strong> → ideia em teste · <strong>PENDENTE</strong> → precisa ser decidida · <strong>DESCARTADA</strong> → não deve mais ser usada.</p>
      </>
    ),
  },
];

export default function Rules({ onBack }) {
  const [aberta, setAberta] = useState(null);

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>📖 Contexto Base — RPG</h1>
          <span className="player-name">Regras oficiais do Campo de Batalha</span>
        </div>
        <div className="topbar-actions">
          <button className="ghost" onClick={onBack}>← Voltar</button>
        </div>
      </header>

      <div className="content">
        <p className="muted" style={{ marginBottom: 12 }}>
          Toque em uma seção para abrir. Use a busca do navegador (Ctrl+F) para encontrar uma regra específica.
        </p>
        <div className="rules-list">
          {SECTIONS.map((s) => (
            <div key={s.id} className={`rules-section ${aberta === s.id ? 'open' : ''}`}>
              <button className="rules-section-head" onClick={() => setAberta(aberta === s.id ? null : s.id)}>
                <span>{s.titulo}</span>
                <span>{aberta === s.id ? '▲' : '▼'}</span>
              </button>
              {aberta === s.id && <div className="rules-section-body">{s.conteudo}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
