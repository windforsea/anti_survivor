// 🔮 [카드 도메인] 6종 진화 무기 조합 공식 및 힌트 정의 풀
export const EVOLUTION_RECIPES = {
  heavenlySanctuary: { main: 'sanctuary', partner: 'holyWater', partnerKor: '성수', evoName: '천상의 성역', evoIcon: '⛪✨', desc: '성역(5Lv) + 성수(5Lv) -> [천상의 성역 1Lv]' },
  morningstarTempest: { main: 'whip', partner: 'shuriken', partnerKor: '표창', evoName: '모닝스타 선풍', evoIcon: '⛓️🌪️', desc: '채찍(5Lv) + 표창(5Lv) -> [모닝스타 선풍 1Lv]' },
  apocalypseComet: { main: 'fireWand', partner: 'magicMissile', partnerKor: '마법 화살', evoName: '멸망의 혜성', evoIcon: '☄️🔥', desc: '화염 지팡이(5Lv) + 마법 화살(5Lv) -> [멸망의 혜성 1Lv]' },
  slayerBladeStorm: { main: 'sword', partner: 'axe', partnerKor: '도끼', evoName: '학살자의 폭풍검', evoIcon: '⚔️🌪️', desc: '철검(5Lv) + 도끼(5Lv) -> [학살자의 폭풍검 1Lv]' },
  teslaShotgun: { main: 'shotgun', partner: 'lightningRing', partnerKor: '번개 반지', evoName: '테슬라 뇌전포', evoIcon: '⚡💥', desc: '산탄 총포(5Lv) + 번개 반지(5Lv) -> [테슬라 뇌전포 1Lv]' },
  venomBlizzard: { main: 'poisonDagger', partner: 'frostOrb', partnerKor: '빙결 보주', evoName: '베놈 블리자드', evoIcon: '❄️🧪', desc: '맹독 비수(5Lv) + 빙결 보주(5Lv) -> [베놈 블리자드 1Lv]' }
};

if (typeof window !== 'undefined') {
  window.EVOLUTION_RECIPES = EVOLUTION_RECIPES;
}