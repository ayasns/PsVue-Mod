(function () {

  include('languages.js');
  log(lang.loadingMainMenu);

  var currentButton = 0;
  var buttons = [];
  var buttonTexts = [];
  var buttonMarkers = [];
  var buttonOrigPos = [];
  var textOrigPos = [];
  var markerOrigPos = [];
  var normalButtonImg = 'file:///assets/img/button_over_9.png';
  var selectedButtonImg = 'file:///assets/img/button_over_9.png';

  // -- reset scene
  jsmaf.root.children.length = 0;

  new Style({ name: 'white', color: 'white', size: 24 });
  new Style({ name: 'title', color: 'white', size: 32 });


  // - reload timer will reload the song exactly every 156000 ms (2:36)
  var __globalRoot = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : ((typeof self !== 'undefined') ? self : this || {}));
  var bgm = null;

  // reload timer variables
  var bgmReloadTimer = null;
  var bgmReloadIntervalMs = 156000; // 2 minutes 36 seconds

  function clearBgmReloadTimer() {
    try { if (bgmReloadTimer) { jsmaf.clearTimeout(bgmReloadTimer); } } catch (e) {}
    bgmReloadTimer = null;
  }

  function scheduleBgmReload() {
    clearBgmReloadTimer();
    try {
      bgmReloadTimer = jsmaf.setTimeout(function () {
        try {
          reloadSong();
        } catch (e) {}
        // schedule next reload
        try { scheduleBgmReload(); } catch (e) {}
      }, bgmReloadIntervalMs);
    } catch (e) { bgmReloadTimer = null; }
  }

  function reloadSong() {
    try {
      if (!bgm || !bgm._valid) return;
      // attempt graceful stop then reopen and play
      try { if (typeof bgm.stop === 'function') bgm.stop(); } catch (e) {}
      try { bgm._isPlaying = false; } catch (e) {}
      // reopen to ensure a fresh stream (some environments require reopen to truly reload)
      try { bgm.open('file://../download0/sfx/bgm.wav'); } catch (e) {}
      // reattach onended fallback (preserve previous if any)
      try {
        var prevOnEnded = bgm.onended;
        bgm.onended = function () {
          try { if (prevOnEnded) prevOnEnded(); } catch (e) {}
          try { bgm._isPlaying = false; } catch (e) {}
          try { bgm.play(); bgm._isPlaying = true; } catch (e) {}
        };
      } catch (e) {}
      // play
      try { if (typeof bgm.play === 'function') { bgm.play(); bgm._isPlaying = true; } } catch (e) {}
      // mark started once so we don't double-schedule
      try { bgm._startedOnce = true; } catch (e) {}
    } catch (e) { log('bgm reload error: ' + (e.message || e)); }
  }

  if (__globalRoot.__persistentBgm && __globalRoot.__persistentBgm._valid) {
    bgm = __globalRoot.__persistentBgm;
    // if it's already playing, mark startedOnce so we don't start again
    try { if (bgm._isPlaying) bgm._startedOnce = true; } catch (e) {}
  } else {
    bgm = new jsmaf.AudioClip();
    bgm.volume = 0; // fade in
    try {
      bgm.open('file://../download0/sfx/bgm.wav');
      try { bgm.loop = true; } catch (e) {}
      try {
        var prevOnEnded = bgm.onended;
        bgm.onended = function () {
          try { if (prevOnEnded) prevOnEnded(); } catch (e) {}
          try { bgm._isPlaying = false; } catch (e) {}
          try { bgm.play(); bgm._isPlaying = true; } catch (e) {}
        };
      } catch (e) {}
    } catch (e) { log('bgm load error: ' + (e.message || e)); }
    bgm._valid = true;
    bgm._isPlaying = false;
    bgm._startedOnce = false; // track whether we've started the bgm for this app session
    __globalRoot.__persistentBgm = bgm;
  }

  var _bgmFadeInterval = null;

  // click SFX
  var clickSfx = new jsmaf.AudioClip();
  try { clickSfx.open('file://../download0/sfx/click.wav'); } catch (e) { /* optional */ }

  // short UI blip when option loads
  var loadSfx = new jsmaf.AudioClip();
  try { loadSfx.open('file://../download0/sfx/load.wav'); } catch (e) { }

  // visual elements
  var background = new Image({ url: 'file:///../download0/img/multiview_bg_VAF.png', x: 0, y: 0, width: 1920, height: 1080 });
  background.alpha = 0;
  background._baseX = background.x;
  background._baseY = background.y;
  jsmaf.root.children.push(background);

  var centerX = 960;
  var logoWidth = 600;
  var logoHeight = 338;

  // dynamic logo (no extra overlay)
  var logo = new Image({ url: 'file:///../download0/img/logo.png', x: centerX - logoWidth / 2, y: 50, width: logoWidth, height: logoHeight });
  logo.alpha = 0; logo.scaleX = 0.98; logo.scaleY = 0.98;
  jsmaf.root.children.push(logo);

  var menuOptions = [
    { label: lang.jailbreak, script: 'loader.js', imgKey: 'jailbreak' },
    { label: lang.payloadMenu, script: 'payload_host.js', imgKey: 'payloadMenu' },
    { label: lang.config, script: 'config_ui.js', imgKey: 'config' },
    // NEW: File Explorer entry — launches your file-explorer.js page
    { label: (lang.fileExplorer || 'File Explorer'), script: 'file-explorer.js', imgKey: 'explorer' }
  ];

  var startY = 450;
  var buttonSpacing = 120;
  var buttonWidth = 400;
  var buttonHeight = 80;

  // create main menu option buttons (original positions)
  for (var i = 0; i < menuOptions.length; i++) {
    var btnX = centerX - buttonWidth / 2;
    var btnY = startY + i * buttonSpacing;

    // shadow layer for depth (original placement)
    var shadow = new Image({ url: 'file:///assets/img/button_shadow.png', x: btnX + 6, y: btnY + 8, width: buttonWidth, height: buttonHeight });
    shadow.alpha = 0; jsmaf.root.children.push(shadow);

    // button uses original position (no extra offset)
    var button = new Image({ url: normalButtonImg, x: btnX, y: btnY, width: buttonWidth, height: buttonHeight });
    button.alpha = 0; button.scaleX = 1.0; button.scaleY = 1.0; button.elevation = 2;
    buttons.push(button);
    jsmaf.root.children.push(button);

    // orange dot marker (glowing) - only visible for selected button, original placement
    var marker = new Image({ url: 'file:///assets/img/ad_pod_marker.png', x: btnX + buttonWidth - 50, y: btnY + 35, width: 12, height: 12, visible: false });
    marker.alpha = 0; marker._glowPhase = 0; marker.isOrangeDot = true;
    buttonMarkers.push(marker);
    jsmaf.root.children.push(marker);

    var btnText;
    if (typeof useImageText !== 'undefined' && useImageText) {
      // original image-text placement: left padding 20, top 15
      btnText = new Image({ url: (typeof textImageBase !== 'undefined' ? textImageBase : '') + menuOptions[i].imgKey + '.png', x: btnX + 20, y: btnY + 15, width: 300, height: 50 });
    } else {
      btnText = new jsmaf.Text();
      btnText.text = menuOptions[i].label;
      // original centering used x = btnX + buttonWidth/2 - 60 and y = btnY + buttonHeight/2 - 12
      btnText.x = btnX + buttonWidth / 2 - 60;
      btnText.y = btnY + buttonHeight / 2 - 12;
      btnText.style = 'white';
    }
    btnText.alpha = 0;

    buttonTexts.push(btnText);
    jsmaf.root.children.push(btnText);

    buttonOrigPos.push({ x: btnX, y: btnY });
    textOrigPos.push({ x: btnText.x, y: btnText.y });
    markerOrigPos.push({ x: btnX + buttonWidth - 50, y: btnY + 35 });
  }

  // EXIT + RELOAD area: three buttons side-by-side with small gaps
  var gap = 18; // small gap between buttons
  var totalW = buttonWidth * 3 + gap * 2;
  var leftX = centerX - totalW / 2;
  var reloadJsX = leftX;
  var exitX = leftX + buttonWidth + gap;
  var reloadAppX = leftX + (buttonWidth + gap) * 2;
  // moved these a bit up (reduced offset)
  var exitY = startY + menuOptions.length * buttonSpacing + 40;

  // We'll store indices for these three so handleButtonPress can reference them reliably
  var reloadJsIndex = -1;
  var exitIndex = -1;
  var reloadAppIndex = -1;

  // reload-js button (left)
  var reloadJsShadow = new Image({ url: 'file:///assets/img/button_shadow.png', x: reloadJsX + 6, y: exitY + 8, width: buttonWidth, height: buttonHeight });
  reloadJsShadow.alpha = 0; jsmaf.root.children.push(reloadJsShadow);
  var reloadJsButton = new Image({ url: normalButtonImg, x: reloadJsX, y: exitY, width: buttonWidth, height: buttonHeight });
  reloadJsButton.alpha = 0; jsmaf.root.children.push(reloadJsButton);
  reloadJsIndex = buttons.length;
  buttons.push(reloadJsButton);
  var reloadJsMarker = new Image({ url: 'file:///assets/img/ad_pod_marker.png', x: reloadJsX + buttonWidth - 50, y: exitY + 35, width: 12, height: 12, visible: false });
  reloadJsMarker.alpha = 0; reloadJsMarker.isOrangeDot = true; buttonMarkers.push(reloadJsMarker); jsmaf.root.children.push(reloadJsMarker);
  var reloadJsText;
  if (typeof useImageText !== 'undefined' && useImageText) {
    reloadJsText = new Image({ url: (typeof textImageBase !== 'undefined' ? textImageBase : '') + 'reload-js.png', x: reloadJsX + 20, y: exitY + 15, width: 300, height: 50 });
  } else {
    reloadJsText = new jsmaf.Text(); reloadJsText.text = 'Reload-Js'; reloadJsText.x = reloadJsX + buttonWidth / 2 - 40; reloadJsText.y = exitY + buttonHeight / 2 - 12; reloadJsText.style = 'white';
  }
  reloadJsText.alpha = 0; jsmaf.root.children.push(reloadJsText); buttonTexts.push(reloadJsText);
  buttonOrigPos.push({ x: reloadJsX, y: exitY }); textOrigPos.push({ x: reloadJsText.x, y: reloadJsText.y });
  markerOrigPos.push({ x: reloadJsX + buttonWidth - 50, y: exitY + 35 });

  // exit button (middle)
  var exitShadow = new Image({ url: 'file:///assets/img/button_shadow.png', x: exitX + 6, y: exitY + 8, width: buttonWidth, height: buttonHeight });
  exitShadow.alpha = 0; jsmaf.root.children.push(exitShadow);
  var exitButton = new Image({ url: normalButtonImg, x: exitX, y: exitY, width: buttonWidth, height: buttonHeight });
  exitButton.alpha = 0; buttons.push(exitButton); jsmaf.root.children.push(exitButton);
  exitIndex = buttons.length - 1;
  var exitMarker = new Image({ url: 'file:///assets/img/ad_pod_marker.png', x: exitX + buttonWidth - 50, y: exitY + 35, width: 12, height: 12, visible: false });
  exitMarker.alpha = 0; exitMarker._glowPhase = 0; exitMarker.isOrangeDot = true;
  buttonMarkers.push(exitMarker); jsmaf.root.children.push(exitMarker);
  var exitText;
  if (typeof useImageText !== 'undefined' && useImageText) {
    exitText = new Image({ url: (typeof textImageBase !== 'undefined' ? textImageBase : '') + 'exit.png', x: exitX + 20, y: exitY + 15, width: 300, height: 50 });
  } else {
    exitText = new jsmaf.Text();
    exitText.text = lang.exit;
    exitText.x = exitX + buttonWidth / 2 - 20;
    exitText.y = exitY + buttonHeight / 2 - 12;
    exitText.style = 'white';
  }
  exitText.alpha = 0; jsmaf.root.children.push(exitText); buttonTexts.push(exitText);
  buttonOrigPos.push({ x: exitX, y: exitY }); textOrigPos.push({ x: exitText.x, y: exitText.y });
  markerOrigPos.push({ x: exitX + buttonWidth - 50, y: exitY + 35 });

  // reload-app button (right) — reloads the whole app
  var reloadAppShadow = new Image({ url: 'file:///assets/img/button_shadow.png', x: reloadAppX + 6, y: exitY + 8, width: buttonWidth, height: buttonHeight });
  reloadAppShadow.alpha = 0; jsmaf.root.children.push(reloadAppShadow);
  var reloadAppButton = new Image({ url: normalButtonImg, x: reloadAppX, y: exitY, width: buttonWidth, height: buttonHeight });
  reloadAppButton.alpha = 0; jsmaf.root.children.push(reloadAppButton);
  reloadAppIndex = buttons.length;
  buttons.push(reloadAppButton);
  var reloadAppMarker = new Image({ url: 'file:///assets/img/ad_pod_marker.png', x: reloadAppX + buttonWidth - 50, y: exitY + 35, width: 12, height: 12, visible: false });
  reloadAppMarker.alpha = 0; reloadAppMarker.isOrangeDot = true; buttonMarkers.push(reloadAppMarker); jsmaf.root.children.push(reloadAppMarker);
  var reloadAppText;
  if (typeof useImageText !== 'undefined' && useImageText) {
    reloadAppText = new Image({ url: (typeof textImageBase !== 'undefined' ? textImageBase : '') + 'reload-app.png', x: reloadAppX + 20, y: exitY + 15, width: 300, height: 50 });
  } else {
    reloadAppText = new jsmaf.Text(); reloadAppText.text = 'Reload-App'; reloadAppText.x = reloadAppX + buttonWidth / 2 - 40; reloadAppText.y = exitY + buttonHeight / 2 - 12; reloadAppText.style = 'white';
  }
  reloadAppText.alpha = 0; jsmaf.root.children.push(reloadAppText); buttonTexts.push(reloadAppText);
  buttonOrigPos.push({ x: reloadAppX, y: exitY }); textOrigPos.push({ x: reloadAppText.x, y: reloadAppText.y });
  markerOrigPos.push({ x: reloadAppX + buttonWidth - 50, y: exitY + 35 });

  // CURSOR SUPPORT (mouse image + movement + visibility)
  var virtualMouse = { x: 960, y: 540 }; // start center
  var cursorSize = { w: 28, h: 28 };
  var lastRealMouseTime = 0;
  var mouseVisible = false;
  var mouseHideTimeout = null;
  var mouseInactivityMs = 2000; // hide cursor after 2s of inactivity
  var mouseActive = false; // whether we've detected a real mouse (take precedence over gamepad clicks)
  var mouseActiveTimeout = null;

  // Create cursor image and add it on top of UI elements (push after buttons so it's on top)
  var cursor = new Image({ url: 'file:///assets/img/cursor.png', x: virtualMouse.x - cursorSize.w / 2, y: virtualMouse.y - cursorSize.h / 2, width: cursorSize.w, height: cursorSize.h });
  cursor.alpha = 1;
  cursor.visible = false;
  cursor._isCursor = true;
  jsmaf.root.children.push(cursor);

  function showCursor() {
    mouseVisible = true;
    cursor.visible = true;
    lastRealMouseTime = Date.now();
    if (mouseHideTimeout) { try { jsmaf.clearTimeout(mouseHideTimeout); } catch (e) {} mouseHideTimeout = null; }
    mouseHideTimeout = jsmaf.setTimeout(function () {
      var now = Date.now();
      if (now - lastRealMouseTime >= mouseInactivityMs) {
        cursor.visible = false;
        mouseVisible = false;
      }
      mouseHideTimeout = null;
    }, mouseInactivityMs);
    // mark as mouseActive (mouse was used very recently)
    mouseActive = true;
    if (mouseActiveTimeout) try { jsmaf.clearTimeout(mouseActiveTimeout); } catch (e) {}
    mouseActiveTimeout = jsmaf.setTimeout(function () { mouseActive = false; mouseActiveTimeout = null; }, 3000);
  }

  function updateCursorPosition(x, y) {
    virtualMouse.x = x;
    virtualMouse.y = y;
    cursor.x = Math.round(virtualMouse.x - cursorSize.w / 2);
    cursor.y = Math.round(virtualMouse.y - cursorSize.h / 2);
    lastRealMouseTime = Date.now();
    if (!cursor.visible) cursor.visible = true;
  }

  // state & intervals
  var _intervals = [];
  var prevButton = -1;
  var _markerPulseInterval = null;
  var _logoAnimInterval = null;

  function _setInterval(fn, ms) { var id = jsmaf.setInterval(fn, ms); _intervals.push(id); return id; }
  function _clearAllIntervals() { for (var i = 0; i < _intervals.length; i++) { try { jsmaf.clearInterval(_intervals[i]); } catch (e) {} } _intervals = []; if (_markerPulseInterval) { try { jsmaf.clearInterval(_markerPulseInterval); } catch (e) {} _markerPulseInterval = null; } if (_logoAnimInterval) { try { jsmaf.clearInterval(_logoAnimInterval); } catch (e) {} _logoAnimInterval = null; } if (_bgmFadeInterval) { try { jsmaf.clearInterval(_bgmFadeInterval); } catch (e) {} _bgmFadeInterval = null; } }

  // easing helper
  function easeInOut(t) { return (1 - Math.cos(t * Math.PI)) / 2; }

  // generic animate helper (applies numeric props)
  function animate(obj, from, to, duration, onStep, done) {
    var elapsed = 0; var step = 16;
    var id = _setInterval(function () {
      elapsed += step; var t = Math.min(elapsed / duration, 1); var e = easeInOut(t);
      for (var k in to) { var f = (from && from[k] !== undefined) ? from[k] : (obj[k] || 0); obj[k] = f + (to[k] - f) * e; }
      if (onStep) onStep(e);
      if (t >= 1) { try { jsmaf.clearInterval(id); } catch (e2) {} if (done) done(); }
    }, step);
    return id;
  }

  // looped background music fade-in if available
  function startBgm() {
    try {
      if (!bgm || !bgm._valid) return;
      // ensure we only start once per app session (so animation and song start together one time)
      if (bgm._startedOnce) {
        // if it's already playing, ensure fade is applied if needed and schedule reload if not scheduled
        if (bgm._isPlaying) {
          if (!bgmReloadTimer) scheduleBgmReload();
        } else {
          try { bgm.play(); bgm._isPlaying = true; } catch (e) {}
          if (!bgmReloadTimer) scheduleBgmReload();
        }
        return;
      }

      // start playing and mark started
      try { if (typeof bgm.play === 'function') { bgm.play(); bgm._isPlaying = true; } } catch (e) {}
      bgm._startedOnce = true;

      // schedule reload timer to fire exactly after 2:36 and then loop
      scheduleBgmReload();

    } catch (e) {}
    if (_bgmFadeInterval) try { jsmaf.clearInterval(_bgmFadeInterval); } catch (e) {}
    var elapsed = 0; var dur = 900; var step = 50;
    _bgmFadeInterval = jsmaf.setInterval(function () { elapsed += step; var t = Math.min(elapsed / dur, 1); try { bgm.volume = 0.45 * t; } catch (e) {} if (t >= 1) { try { jsmaf.clearInterval(_bgmFadeInterval); } catch (e) {} _bgmFadeInterval = null; } }, step);
  }

  // make the orange dot glow only when that button is selected
  function startOrangeDotLoop() {
    if (_markerPulseInterval) try { jsmaf.clearInterval(_markerPulseInterval); } catch (e) {}
    var phase = 0;
    _markerPulseInterval = jsmaf.setInterval(function () {
      phase += 0.06;
      for (var i = 0; i < buttonMarkers.length; i++) {
        var m = buttonMarkers[i];
        if (!m) continue;
        if (m.isOrangeDot) {
          if (m.visible) {
            var a = 0.6 + Math.sin(phase) * 0.35; // 0.25..0.95
            m.alpha = Math.max(0.25, Math.min(a, 1.0));
            m.scaleX = 1 + Math.sin(phase * 1.2) * 0.06;
            m.scaleY = m.scaleX;
          } else {
            m.alpha = 0; m.scaleX = 1; m.scaleY = 1;
          }
        }
      }
    }, 16);
    _intervals.push(_markerPulseInterval);
  }

  // logo dynamic loop: gentle bob + subtle background parallax
  function startLogoLoop() {
    var phase = 0;
    if (_logoAnimInterval) try { jsmaf.clearInterval(_logoAnimInterval); } catch (e) {}
    _logoAnimInterval = jsmaf.setInterval(function () {
      phase += 0.02;
      logo.y = 50 + Math.sin(phase) * 4;
      logo.scaleX = 0.99 + Math.sin(phase * 0.9) * 0.01;
      logo.scaleY = logo.scaleX;
      if (background) { background.x = background._baseX + Math.sin(phase * 0.4) * 6; }
    }, 16);
    _intervals.push(_logoAnimInterval);
  }

  // entrance sequence (buttons now take 3s to fully finish; markers move with buttons)
  function entrance() {
    // longer entrance durations and stagger so buttons take 3000ms each
    animate(background, { alpha: 0 }, { alpha: 1 }, 800);
    animate(logo, { alpha: 0, scaleX: 0.95, scaleY: 0.95 }, { alpha: 1, scaleX: 1.0, scaleY: 1.0 }, 900);

    // button entrance timing parameters
    var btnDelayBase = 220;
    var btnDelayStep = 140;
    var btnDuration = 3000; // 3 seconds for each button to fully finish

    for (var i = 0; i < buttons.length; i++) {
      (function (idx) {
        var b = buttons[idx]; var t = buttonTexts[idx]; var m = buttonMarkers[idx];
        var delay = btnDelayBase + idx * btnDelayStep;
        jsmaf.setTimeout(function () {
          // animate button
          animate(b, { alpha: 0, y: buttonOrigPos[idx].y + 28 }, { alpha: 1, y: buttonOrigPos[idx].y }, btnDuration);
          // animate text
          animate(t, { alpha: 0, y: textOrigPos[idx].y + 28 }, { alpha: 1, y: textOrigPos[idx].y }, btnDuration);
          // animate marker so it moves with the button during entrance
          if (m) {
            // ensure marker is positioned relative to its original marker position
            var mo = markerOrigPos[idx] || { x: (buttonOrigPos[idx] ? buttonOrigPos[idx].x + buttonWidth - 50 : 0), y: (buttonOrigPos[idx] ? buttonOrigPos[idx].y + 35 : 0) };
            // set initial marker position to match the "from" y
            try { m.x = mo.x; m.y = mo.y + 28; } catch (e) {}
            // animate marker y and alpha
            animate(m, { alpha: 0, y: mo.y + 28 }, { alpha: 1, y: mo.y }, btnDuration);
          }
        }, delay);
      })(i);
    }

    // compute when the last button animation will finish, then start audio + loops once
    var totalButtons = buttons.length;
    var lastDelay = btnDelayBase + (Math.max(0, totalButtons - 1)) * btnDelayStep;
    var startAfter = lastDelay + btnDuration + 100; // small buffer

    jsmaf.setTimeout(function () {
      // startBgm will only actually start the music once per app session
      startBgm();
      startOrangeDotLoop();
      startLogoLoop();
      enforceTextWhite();
    }, startAfter);
  }

  // hover/selection animations
  var _hoverAnimId = null;
  function setSelected(index) { if (index === currentButton) return; prevButton = currentButton; currentButton = index; updateHighlight(); }

  function animateSelectionIn(b, txt, origX, origY) {
    animate(b, { scaleX: b.scaleX || 1 }, { scaleX: 1.08, scaleY: 1.08, x: origX - (buttonWidth * (1.08 - 1)) / 2, y: origY - (buttonHeight * (1.08 - 1)) / 2 }, 160);
    try { if (txt && txt.constructor && txt.constructor.name === 'Text') txt.style = 'white'; } catch (e) {}
    animate(txt, { scaleX: txt.scaleX || 1, alpha: txt.alpha || 1 }, { scaleX: 1.06, scaleY: 1.06, alpha: 1 }, 160);
  }

  function animateSelectionOut(b, txt, origX, origY) {
    animate(b, { scaleX: b.scaleX || 1 }, { scaleX: 1.0, scaleY: 1.0, x: origX, y: origY }, 160);
    try { if (txt && txt.constructor && txt.constructor.name === 'Text') txt.style = 'white'; } catch (e) {}
    animate(txt, { scaleX: txt.scaleX || 1, alpha: txt.alpha || 1 }, { scaleX: 1.0, scaleY: 1.0, alpha: 1 }, 160);
  }

  function updateHighlight() {
    for (var i = 0; i < buttonMarkers.length; i++) { try { buttonMarkers[i].visible = false; buttonMarkers[i].alpha = 0; } catch (e) {} }

    if (prevButton >= 0 && prevButton !== currentButton) {
      var prev = buttons[prevButton]; var prevTxt = buttonTexts[prevButton];
      if (prev) { prev.url = normalButtonImg; prev.alpha = 0.7; prev.borderColor = 'transparent'; prev.borderWidth = 0; animateSelectionOut(prev, prevTxt, buttonOrigPos[prevButton].x, buttonOrigPos[prevButton].y); }
    }

    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i]; var t = buttonTexts[i]; var m = buttonMarkers[i];
      if (!b || !t) continue;
      if (i === currentButton) {
        b.url = selectedButtonImg; b.alpha = 1.0; b.borderColor = 'rgb(100,180,255)'; b.borderWidth = 3;
        if (m) { m.visible = true; animate(m, { alpha: m.alpha || 0 }, { alpha: 1 }, 200); }
        animateSelectionIn(b, t, buttonOrigPos[i].x, buttonOrigPos[i].y);
      } else {
        if (i !== prevButton) { b.url = normalButtonImg; b.alpha = 0.7; b.borderColor = 'transparent'; b.borderWidth = 0; animateSelectionOut(b, t, buttonOrigPos[i].x, buttonOrigPos[i].y); if (m) { m.visible = false; m.alpha = 0; } }
      }
      try { if (t && t.constructor && t.constructor.name === 'Text') t.style = 'white'; } catch (e) {}
    }

    prevButton = currentButton;
  }

  // handle press with better feedback and looping music handling
  function handleButtonPress() {
    var btn = buttons[currentButton]; var txt = buttonTexts[currentButton];
    try { if (clickSfx && typeof clickSfx.play === 'function') clickSfx.play(); } catch (e) {}

    // press animation: quick shrink then release with tiny overshoot
    animate(btn, { scaleX: btn.scaleX || 1, scaleY: btn.scaleY || 1 }, { scaleX: 0.92, scaleY: 0.92 }, 80, null, function () {
      animate(btn, { scaleX: 0.92 }, { scaleX: 1.06, scaleY: 1.06 }, 140, null, function () {
        animate(btn, { scaleX: 1.06 }, { scaleX: 1.0, scaleY: 1.0 }, 120);

        // determine indices (we stored them earlier)
        var reloadJsIdx = reloadJsIndex;
        var exitIdx = exitIndex;
        var reloadAppIdx = reloadAppIndex;

        if (currentButton === exitIdx) {
          try {
            if (typeof libc_addr === 'undefined') { include('userland.js'); }
            fn.register(0x14, 'getpid', [], 'bigint'); fn.register(0x25, 'kill', ['bigint', 'bigint'], 'bigint'); var pid = fn.getpid(); var pid_num = pid instanceof BigInt ? pid.lo : pid; log('Current PID: ' + pid_num); fn.kill(pid, new BigInt(0, 9));
          } catch (e) { log('exit err: ' + (e.message || e)); }
          jsmaf.exit();
        } else if (currentButton === reloadJsIdx) {
          try {
            log('Reloading menu (Reload-Js) and reloading bgm');
            // keep persistent bgm instance but reload the song immediately
            _clearAllIntervals();
            // reload the bgm now (this will stop/open/play and reset the reload timer)
            try { reloadSong(); } catch (e) { log('bgm reload on Reload-Js error: ' + (e.message || e)); }
            jsmaf.setTimeout(function () {
              try { include('main-menu.js'); } catch (e) { log('ERROR reloading main-menu.js: ' + (e.message || e)); }
            }, 120);
          } catch (e) { log('Reload-Js error: ' + (e.message || e)); }
        } else if (currentButton === reloadAppIdx) {
          try {
            log('Reloading entire app (Reload-App) and reloading bgm');
            // clear intervals and reload the bgm now
            _clearAllIntervals();
            try { reloadSong(); } catch (e) { log('bgm reload on Reload-App error: ' + (e.message || e)); }
            // attempt to include a top-level app entry point; adjust the script name if your app uses a different entry file
            jsmaf.setTimeout(function () {
              try { include('app.js'); } catch (e) { 
                try { include('main.js'); } catch (e2) { log('ERROR reloading app entry: ' + (e2.message || e2)); }
              }
            }, 120);
          } catch (e) { log('Reload-App error: ' + (e.message || e)); }
        } else if (currentButton < menuOptions.length) {
          var selectedOption = menuOptions[currentButton]; if (!selectedOption) return;
          try { if (loadSfx && typeof loadSfx.play === 'function') loadSfx.play(); } catch (e) {}
          log('Loading ' + selectedOption.script + '...');
          try { include(selectedOption.script); } catch (e) { log('ERROR loading ' + selectedOption.script + ': ' + (e.message || e)); }
        }

      });
    });
  }

  // input: mouse
  jsmaf.onMouseMove = function (mx, my) {
    updateCursorPosition(mx, my);
    showCursor();

    // mark that a real mouse is present and used (so gamepad doesn't try to emulate clicks)
    mouseActive = true;
    if (mouseActiveTimeout) try { jsmaf.clearTimeout(mouseActiveTimeout); } catch (e) {}
    mouseActiveTimeout = jsmaf.setTimeout(function () { mouseActive = false; mouseActiveTimeout = null; }, 3000);

    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i]; if (!b) continue; var bx = b.x, by = b.y, bw = b.width, bh = b.height;
      if (mx >= bx && my >= by && mx <= bx + bw && my <= by + bh) { if (currentButton !== i) { prevButton = currentButton; currentButton = i; updateHighlight(); } return; }
    }
  };
  jsmaf.onMouseDown = function (mx, my, button) {
    updateCursorPosition(mx, my);
    showCursor();
    mouseActive = true;
    if (mouseActiveTimeout) try { jsmaf.clearTimeout(mouseActiveTimeout); } catch (e) {}
    mouseActiveTimeout = jsmaf.setTimeout(function () { mouseActive = false; mouseActiveTimeout = null; }, 3000);

    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i]; if (!b) continue; var bx = b.x, by = b.y, bw = b.width, bh = b.height;
      if (mx >= bx && my >= by && mx <= bx + bw && my <= by + bh) { currentButton = i; updateHighlight(); handleButtonPress(); return; }
    }
  };

  // keyboard/gamepad nav & gamepad->mouse emulation (but respect real mouse presence)
  jsmaf.onKeyDown = function (keyCode) {
    if (keyCode === 6 || keyCode === 5) {
      currentButton = (currentButton + 1) % buttons.length; updateHighlight();
    } else if (keyCode === 4 || keyCode === 7) {
      currentButton = (currentButton - 1 + buttons.length) % buttons.length; updateHighlight();
    } else if (keyCode === 14) { handleButtonPress(); }
  };

  // PS4 controller -> mouse emulation (non-blocking; will NOT generate clicks while mouseActive is true)
  (function startGamepadMouse() {
    var gpPollInterval = null;
    var gpSensitivity = 12.0;
    var gpDeadzone = 0.15;
    var lastGpButtons = [];
    var gpPollStepMs = 16; // ~60Hz

    try {
      gpPollInterval = jsmaf.setInterval(function () {
        try {
          if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;
          var gps = navigator.getGamepads();
          if (!gps) return;
          var gp = gps[0];
          if (!gp) return;

          var ax = (gp.axes && gp.axes.length > 2) ? gp.axes[2] : 0;
          var ay = (gp.axes && gp.axes.length > 3) ? gp.axes[3] : 0;
          ax = Math.abs(ax) < gpDeadzone ? 0 : ax;
          ay = Math.abs(ay) < gpDeadzone ? 0 : ay;
          var dt = gpPollStepMs / 1000.0;
          var dx = ax * gpSensitivity * dt * 60;
          var dy = ay * gpSensitivity * dt * 60;

          // If mouse recently used, avoid gamepad mouse emulation clicks (but still allow cursor movement)
          virtualMouse.x += dx;
          virtualMouse.y += dy;
          virtualMouse.x = Math.max(0, Math.min(1920, virtualMouse.x));
          virtualMouse.y = Math.max(0, Math.min(1080, virtualMouse.y));
          updateCursorPosition(Math.round(virtualMouse.x), Math.round(virtualMouse.y));
          // notify hover handler so highlight follows the synthetic cursor
          try { jsmaf.onMouseMove(Math.round(virtualMouse.x), Math.round(virtualMouse.y)); } catch (e) {}

          var btnIndex = 0;
          var pressed = false;
          if (gp.buttons && gp.buttons.length > btnIndex) {
            var b = gp.buttons[btnIndex];
            pressed = !!(b && (b.pressed || b.value > 0.5));
          }
          if (lastGpButtons[btnIndex] === undefined) lastGpButtons[btnIndex] = false;

          // Only emulate a click when there has NOT been recent real mouse activity
          if (pressed && !lastGpButtons[btnIndex] && !mouseActive) {
            try { jsmaf.onMouseDown(Math.round(virtualMouse.x), Math.round(virtualMouse.y), 0); } catch (e) {}
          }
          lastGpButtons[btnIndex] = pressed;

          // allow dpad/left stick navigation regardless of mouseActive
          var lax = (gp.axes && gp.axes.length > 0) ? gp.axes[0] : 0;
          var lay = (gp.axes && gp.axes.length > 1) ? gp.axes[1] : 0;
          var navThreshold = 0.75;
          if (lax > navThreshold) { currentButton = Math.min(buttons.length - 1, currentButton + 1); updateHighlight(); }
          else if (lax < -navThreshold) { currentButton = Math.max(0, currentButton - 1); updateHighlight(); }
          else if (lay > navThreshold) { currentButton = (currentButton + 1) % buttons.length; updateHighlight(); }
          else if (lay < -navThreshold) { currentButton = (currentButton - 1 + buttons.length) % buttons.length; updateHighlight(); }

        } catch (e) {
          // tolerate polling errors silently
        }
      }, gpPollStepMs);
      _intervals.push(gpPollInterval);
    } catch (e) {}
  })();

  // Ensure text objects keep the white style after reloads or re-initialization
  function enforceTextWhite() {
    for (var i = 0; i < buttonTexts.length; i++) {
      try {
        var t = buttonTexts[i];
        if (t && typeof t === 'object' && t.constructor && t.constructor.name === 'Text') {
          t.style = 'white';
        }
      } catch (e) {}
    }
  }

  // start entrance
  entrance();

})();
