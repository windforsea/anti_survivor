// Anti Survivors - 모바일 동적 플로팅 가상 조이스틱 (js/joystick.js)

UIManager.prototype.initJoystick = function() {
    const zone = document.getElementById('joystickZone');
    const base = document.getElementById('joystickBase');
    const knob = document.getElementById('joystickKnob');
    if (!zone || !base || !knob) return;

    let touchId = null;
    let touchOrigin = { x: 0, y: 0 };
    const maxRadius = 48;

    zone.addEventListener('touchstart', (e) => {
      // 모달창이 열려있거나 일시정지 중이면 무시
      if (this.game.gameState !== 'PLAYING') return;

      const touch = e.changedTouches[0];
      // 상단 60px(HUD 조작 바 영역) 터치는 버튼 클릭을 위해 제외
      if (touch.clientY < 60) return;

      e.preventDefault();
      touchId = touch.identifier;
      touchOrigin = { x: touch.clientX, y: touch.clientY };

      // 터치한 바로 그 좌표에 조이스틱 베이스 배치 및 활성화 (왼손/오른손잡이 완전 대응)
      base.style.left = `${touch.clientX}px`;
      base.style.top = `${touch.clientY}px`;
      base.classList.add('active');
      knob.style.transform = 'translate(-50%, -50%)';
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      if (touchId === null) return;
      e.preventDefault();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          let dx = touch.clientX - touchOrigin.x;
          let dy = touch.clientY - touchOrigin.y;
          const dist = Math.hypot(dx, dy);

          let clampX = dx;
          let clampY = dy;
          if (dist > maxRadius) {
            clampX = (dx / dist) * maxRadius;
            clampY = (dy / dist) * maxRadius;
          }

          knob.style.transform = `translate(calc(-50% + ${clampX}px), calc(-50% + ${clampY}px))`;

          this.game.input.joystick.active = true;
          this.game.input.joystick.x = clampX / maxRadius;
          this.game.input.joystick.y = clampY / maxRadius;
          break;
        }
      }
    }, { passive: false });

    const endTouch = (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          base.classList.remove('active');
          knob.style.transform = 'translate(-50%, -50%)';
          this.game.input.joystick.active = false;
          this.game.input.joystick.x = 0;
          this.game.input.joystick.y = 0;
          break;
        }
      }
    };

    zone.addEventListener('touchend', endTouch);
    zone.addEventListener('touchcancel', endTouch);
  }
