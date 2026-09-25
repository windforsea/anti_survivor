# 🎨 에셋 및 스프라이트 명세 (Assets & Sprites)

Anti Survivors의 **119종 수묵화풍(Ink-Wash Calligraphy Dark Fantasy)** 비주얼 리메이크 스프라이트 리소스 및 Node.js 픽셀 렌더러(`generate_assets.js`) 규격 명세서입니다.

---

## 📁 에셋 디렉토리 및 해상도 체계

모든 에셋은 `assets/sprites/` 디렉토리에 보관되며, 게임 기동 시 `js/assets.js`의 `AssetManager`에 의해 일괄 프리로드됩니다.  
기존 레트로 네온 도트 에셋 원본은 `assets/backup_retro_sprites/`에 전수 안전 백업되었습니다.
