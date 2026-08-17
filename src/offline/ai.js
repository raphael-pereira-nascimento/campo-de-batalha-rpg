import { SPELLS } from '../game/data.js';

export function pickMonsterAction(monster, battle) {
  const heroes = battle.participants.filter((p) => !p.isMonster && p.alive);
  if (heroes.length === 0) return null;

  const lowestHp = heroes.reduce((a, b) => (a.hp / a.hpMax < b.hp / b.hpMax ? a : b));
  const targetId = lowestHp.characterId;

  const skills = (monster.skills || []).filter((s) => {
    const cd = (monster.cooldowns || {})[s.id];
    return (!cd || cd <= 0) && (s.custo || 0) <= (monster.mp || 0);
  });

  if (skills.length > 0 && Math.random() < 0.35) {
    const skill = skills[Math.floor(Math.random() * skills.length)];
    if (skill.tipo === 'magia' || skill.tipo === 'fisico' || skill.tipo === 'ataque') {
      return { type: 'magic', spellId: skill.id, targetId };
    }
    if (skill.tipo === 'defesa' && (monster.hp / monster.hpMax) < 0.3) {
      return { type: 'magic', spellId: skill.id, targetId: monster.characterId };
    }
    if (skill.tipo === 'cura' && (monster.hp / monster.hpMax) < 0.5) {
      return { type: 'magic', spellId: skill.id, targetId: monster.characterId };
    }
  }

  return { type: 'attack', targetId };
}
