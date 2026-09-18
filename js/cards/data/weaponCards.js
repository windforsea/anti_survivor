// 🗡️ [카드 도메인] 12종 무기 카드 메타 및 강화 옵션 데이터 풀
export const WEAPON_META = {
  sword: { name: '철검', icon: '🗡️', iconKey: 'icon_sword', desc: '가장 가까운 적을 향해 날렵하게 검을 휘둘러 벱니다.' },
  axe: { name: '도끼', icon: '🪓', iconKey: 'icon_axe', desc: '주변을 원형으로 크게 베어내며 적을 밀쳐냅니다.' },
  whip: { name: '채찍', icon: '🪢', iconKey: 'icon_whip', desc: '가장 가까운 적을 자동 조준하여 휘두르고 교차 강타합니다.' },
  shuriken: { name: '표창', icon: '🥷', iconKey: 'icon_shuriken', desc: '가장 가까운 몬스터를 향해 고속 회전하며 관통하는 표창을 던집니다.' },
  magicMissile: { name: '마법 화살', icon: '🔮', iconKey: 'icon_missile', desc: '가장 가까운 적을 유도 추적하는 마법 탄환을 발사합니다.' },
  shotgun: { name: '산탄 총포', icon: '💥', iconKey: 'icon_shotgun', desc: '가장 가까운 적을 향해 부채꼴 형태의 산탄을 일제 사격합니다.' },
  holyWater: { name: '성수', icon: '🧪', iconKey: 'icon_holywater', desc: '바닥에 지속 피해를 입히는 성수를 투척하여 정화 장판을 생성합니다.' },
  sanctuary: { name: '성역', icon: '⛪', iconKey: 'icon_sanctuary', desc: '플레이어를 감싸는 원형 결계로 적들에게 매초 도트 피해를 입힙니다.' },
  lightningRing: { name: '번개 반지', icon: '⚡', iconKey: 'icon_lightning', desc: '무작위 적의 머리 위로 하늘에서 벼락을 내리꽂습니다.' },
  fireWand: { name: '화염 지팡이', icon: '🔥', iconKey: 'icon_firewand', desc: '가장 가까운 적을 향해 폭발 화염구를 발사합니다.' },
  poisonDagger: { name: '맹독 비수', icon: '🗡️🧪', iconKey: 'icon_poisondagger', desc: '가장 가까운 적을 자동 조준하여 맹독 비수를 쾌속 연사합니다.' },
  frostOrb: { name: '빙결 보주', icon: '❄️🔮', iconKey: 'icon_frostorb', desc: '가장 가까운 적을 향해 서서히 전진하며 냉기 파동을 발산합니다.' }
};

if (typeof window !== 'undefined') {
  window.WEAPON_META = WEAPON_META;
}