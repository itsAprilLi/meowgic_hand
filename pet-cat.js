// 🐾 获取元素
const kitten = document.getElementById('kitten');
const brushTool = document.getElementById('brush-tool');
const treatTool = document.getElementById('treat-tool');
const catnipTool = document.getElementById('catnip-tool');
const tutorialWindow = document.getElementById('tutorial-window');
const feedbackWindow = document.getElementById('feedback-window');
const feedbackText = document.getElementById('feedback-text');
const startPettingBtn = document.getElementById('start-petting-btn');
const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// 🎵 音效元素
const bgm = document.getElementById('bgm');
const purrSound = document.getElementById('purr-sound');
const meowSound = document.getElementById('meow-sound');
const happySound = document.getElementById('happy-sound');
const brushSound = document.getElementById('brush-sound');

// 🐾 获取URL参数
const urlParams = new URLSearchParams(window.location.search);
const kittenName = urlParams.get('name') || 'Mochi';
const catImageUrl = urlParams.get('catImage') || 'calicocat.png';

// 🎮 游戏状态
let gameStarted = false;
let currentTool = null;
let currentGesture = null;
let lastGestureTime = 0;
let interactionCount = 0;
let kittenMood = 'neutral'; // neutral, happy, excited, content
let gestureHistory = []; // 记录手势历史用于组合技
let lastInteractionType = null;
let achievements = []; // 成就系统
let brushCount = 0;
let treatCount = 0;
let catnipCount = 0;

// 💬 互动反馈语句
const feedbackMessages = {
  brush: [
    `${kittenName}: Purr purr~ So comfortable!`,
    `${kittenName} is enjoying the grooming~`,
    `${kittenName}'s fur is getting smoother!`,
    `${kittenName}: Keep brushing me!`,
    `${kittenName} closes eyes and enjoys the massage~`,
    `${kittenName}: This angle is perfect!`,
    `${kittenName} makes satisfied purring sounds`,
    `${kittenName}: Master's technique is amazing!`
  ],
  treat: [
    `${kittenName}: This treat smells so good!`,
    `${kittenName} can't wait to lick it`,
    `${kittenName}: More! I want more!`,
    `${kittenName} squints eyes with satisfaction`,
    `${kittenName}: What heavenly taste is this!`,
    `${kittenName} wags tail happily`,
    `${kittenName}: Master is the best!`,
    `${kittenName} wants more after finishing`
  ],
  catnip: [
    `${kittenName}: Wow! Catnip!`,
    `${kittenName} rolls excitedly on the ground`,
    `${kittenName}: This is so exciting!`,
    `${kittenName} enters crazy mode!`,
    `${kittenName}: I'm going to fly!`,
    `${kittenName} rubs around frantically`,
    `${kittenName}: This is the taste of heaven!`,
    `${kittenName} completely loses control!`
  ]
};

// 🐾 初始化游戏
function initGame() {
  // 设置小猫图片
  kitten.src = catImageUrl;
  
  // 播放背景音乐
  if (bgm) {
    bgm.volume = 0.3;
    bgm.play().catch(e => console.log("BGM播放被阻止:", e));
  }
  
  // 初始化小猫为满足状态
  kitten.classList.add('kitten-content');
}

// 🎮 开始游戏
startPettingBtn.addEventListener('click', async () => {
  gameStarted = true;
  tutorialWindow.classList.add('hidden');

  // 显示反馈窗口
  feedbackWindow.classList.remove('hidden');
  feedbackText.textContent = `Starting camera and gesture recognition...`;

  // 启动摄像头和手势识别
  setupHandDetection(); // 先设置手势识别
  await setupCamera();

  // 添加键盘测试模式（用于调试）
  addKeyboardTestMode();
});

// 📹 设置摄像头
async function setupCamera() {
  try {
    console.log('开始设置摄像头...');

    // 检查浏览器是否支持getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('您的浏览器不支持摄像头功能');
    }

    // 检查MediaPipe库是否加载
    if (typeof Camera === 'undefined') {
      throw new Error('MediaPipe Camera库未正确加载');
    }

    console.log('请求摄像头权限...');
    feedbackText.textContent = '正在启动摄像头，请允许权限...';

    // 创建MediaPipe摄像头
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        if (gameStarted && hands) {
          try {
            await hands.send({ image: videoElement });
          } catch (error) {
            console.error('手势识别处理错误:', error);
          }
        }
      },
      width: 640,
      height: 480
    });

    // 显示视频元素
    videoElement.style.display = 'block';
    canvasElement.style.display = 'block';

    // 启动摄像头
    await camera.start();
    console.log('摄像头启动成功');

    // 更新反馈信息
    feedbackText.textContent = `Camera started! Begin interacting with ${kittenName}! Try different gestures~`;
    feedbackText.style.color = '#333';

    // 测试手势识别是否工作
    setTimeout(() => {
      if (gameStarted) {
        feedbackText.textContent = `👋 Make gestures in front of camera: Open hand=Brush, Peace=Treat, OK=Catnip`;
      }
    }, 3000);

  } catch (error) {
    console.error('摄像头启动失败:', error);

    let errorMessage = '';
    if (error.name === 'NotAllowedError') {
      errorMessage = '请允许浏览器访问摄像头权限，然后刷新页面重试';
    } else if (error.name === 'NotFoundError') {
      errorMessage = '未检测到可用的摄像头设备';
    } else if (error.name === 'NotReadableError') {
      errorMessage = '摄像头正被其他程序使用，请关闭其他应用后重试';
    } else {
      errorMessage = `摄像头启动失败: ${error.message}`;
    }

    // 显示错误提示
    feedbackText.textContent = `❌ ${errorMessage}`;
    feedbackText.style.color = '#ff4444';

    // 隐藏视频元素
    videoElement.style.display = 'none';
    canvasElement.style.display = 'none';

    // 显示备用提示
    setTimeout(() => {
      feedbackText.textContent = 'Cannot start camera. Try refreshing the page or check camera device.';
      feedbackText.style.color = '#666';
    }, 5000);
  }
}

// 🤲 设置手势识别
let hands; // 声明hands变量

function setupHandDetection() {
  try {
    // 检查MediaPipe是否正确加载
    if (typeof Hands === 'undefined') {
      throw new Error('MediaPipe Hands库未正确加载');
    }
    
    hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.onResults(onHandResults);
    console.log('手势识别初始化成功');
    
  } catch (error) {
    console.error('手势识别初始化失败:', error);
    feedbackText.textContent = `❌ 手势识别初始化失败: ${error.message}`;
    feedbackText.style.color = '#ff4444';
  }
}

// 🎯 手势识别结果处理
function onHandResults(results) {
  if (!gameStarted) return;

  // 清除画布并绘制视频
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  // 绘制手部关键点和识别手势
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    console.log(`检测到 ${results.multiHandLandmarks.length} 只手`);

    results.multiHandLandmarks.forEach((landmarks, index) => {
      // 绘制更明显的关键点
      canvasCtx.fillStyle = 'rgba(255, 105, 180, 0.9)';
      landmarks.forEach(point => {
        canvasCtx.beginPath();
        canvasCtx.arc(point.x * canvasElement.width, point.y * canvasElement.height, 6, 0, 2 * Math.PI);
        canvasCtx.fill();
      });

      // 绘制手部连线
      canvasCtx.strokeStyle = 'rgba(255, 105, 180, 0.7)';
      canvasCtx.lineWidth = 2;

      // 连接手指关键点
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // 拇指
        [0, 5], [5, 6], [6, 7], [7, 8], // 食指
        [0, 9], [9, 10], [10, 11], [11, 12], // 中指
        [0, 13], [13, 14], [14, 15], [15, 16], // 无名指
        [0, 17], [17, 18], [18, 19], [19, 20] // 小指
      ];

      connections.forEach(([start, end]) => {
        canvasCtx.beginPath();
        canvasCtx.moveTo(
          landmarks[start].x * canvasElement.width,
          landmarks[start].y * canvasElement.height
        );
        canvasCtx.lineTo(
          landmarks[end].x * canvasElement.width,
          landmarks[end].y * canvasElement.height
        );
        canvasCtx.stroke();
      });

      // 识别手势
      const gesture = recognizeGesture(landmarks);
      if (gesture) {
        console.log(`手 ${index + 1} 识别到手势:`, gesture);
        if (gesture !== currentGesture) {
          handleGestureChange(gesture);
        }
      }
    });
  } else {
    console.log('未检测到手部');
    // 没有检测到手势时隐藏所有工具
    hideAllTools();
    currentGesture = null;
  }

  canvasCtx.restore();
}

// 🎯 手势识别算法 - 改进版本
function recognizeGesture(landmarks) {
  try {
    const fingerTips = [4, 8, 12, 16, 20]; // 拇指、食指、中指、无名指、小指指尖
    const fingerPips = [3, 6, 10, 14, 18]; // 各手指第二关节

    let extendedFingers = 0;
    let fingerStates = [];

    // 检测伸直的手指（除拇指外）
    for (let i = 1; i < 5; i++) {
      const isExtended = landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y;
      fingerStates.push(isExtended);
      if (isExtended) {
        extendedFingers++;
      }
    }

    // 特殊检测拇指（水平方向）
    const thumbExtended = landmarks[4].x > landmarks[3].x; // 简化拇指检测
    if (thumbExtended) {
      extendedFingers++;
    }

    // 添加调试信息
    console.log(`检测到 ${extendedFingers} 个伸直的手指`, fingerStates);

    // 1. 检测五指展开手势（降低要求）
    if (extendedFingers >= 3) {
      console.log('识别为：五指展开 -> 刷子');
      return 'open_hand';
    }

    // 2. 检测Peace手势（两指并拢）
    const indexUp = fingerStates[0]; // 食指
    const middleUp = fingerStates[1]; // 中指
    const ringDown = !fingerStates[2]; // 无名指
    const pinkyDown = !fingerStates[3]; // 小指

    if (indexUp && middleUp && ringDown && pinkyDown) {
      console.log('识别为：Peace手势 -> 猫条');
      return 'peace';
    }

    // 3. 检测OK手势（拇指和食指形成圆圈）
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2)
    );

    // 放宽OK手势的检测条件
    if (distance < 0.08 && extendedFingers <= 2) {
      console.log('识别为：OK手势 -> 猫薄荷');
      return 'ok';
    }

    // 4. 备用检测：如果只有一个手指伸直，也算作指向手势
    if (extendedFingers === 1 && fingerStates[0]) { // 只有食指伸直
      console.log('识别为：指向手势 -> 猫条');
      return 'peace';
    }

    return null;
  } catch (error) {
    console.error('手势识别错误:', error);
    return null;
  }
}

// 🛠️ 处理手势变化
function handleGestureChange(gesture) {
  const now = Date.now();
  if (now - lastGestureTime < 1000) return; // 防止频繁切换

  lastGestureTime = now;
  currentGesture = gesture;

  // 记录手势历史
  gestureHistory.push(gesture);
  if (gestureHistory.length > 5) {
    gestureHistory.shift(); // 只保留最近5个手势
  }

  // 检查组合技
  checkComboGestures();

  // 隐藏所有工具并显示对应工具
  hideAllTools();

  switch (gesture) {
    case 'open_hand':
      showTool('brush');
      lastInteractionType = 'brush';
      break;
    case 'peace':
      showTool('treat');
      lastInteractionType = 'treat';
      break;
    case 'ok':
      showTool('catnip');
      lastInteractionType = 'catnip';
      break;
  }

  // 显示手势检测效果
  showGestureDetected(gesture);
}

// 🎯 检查组合技
function checkComboGestures() {
  const recent3 = gestureHistory.slice(-3);

  // 组合技1：刷子 -> 猫条 -> 猫薄荷
  if (recent3.length === 3 &&
      recent3[0] === 'open_hand' &&
      recent3[1] === 'peace' &&
      recent3[2] === 'ok') {
    triggerComboEffect('ultimate_combo');
  }

  // 组合技2：连续三次相同手势
  if (recent3.length === 3 &&
      recent3[0] === recent3[1] &&
      recent3[1] === recent3[2]) {
    triggerComboEffect('triple_same');
  }
}

// 🌟 触发组合技效果
function triggerComboEffect(comboType) {
  switch (comboType) {
    case 'ultimate_combo':
      feedbackText.textContent = `🌟 Ultimate Combo! ${kittenName} enters super happy mode!`;
      kitten.style.animation = 'ultimateCombo 3s ease-in-out';
      createRainbowEffect();
      break;
    case 'triple_same':
      feedbackText.textContent = `💫 Triple Hit! ${kittenName} is moved by your dedication!`;
      kitten.style.animation = 'tripleEffect 2s ease-in-out';
      createStarEffect();
      break;
  }

  setTimeout(() => {
    kitten.style.animation = '';
  }, 3000);
}

// 🛠️ 显示工具
function showTool(toolType) {
  console.log(`显示工具: ${toolType}`);
  currentTool = toolType;

  let toolElement;
  switch (toolType) {
    case 'brush':
      toolElement = brushTool;
      break;
    case 'treat':
      toolElement = treatTool;
      break;
    case 'catnip':
      toolElement = catnipTool;
      break;
  }

  if (toolElement) {
    console.log(`工具元素找到:`, toolElement);

    // 确保工具可见
    toolElement.classList.remove('hidden');
    toolElement.classList.add('active');
    toolElement.style.display = 'block';
    toolElement.style.position = 'absolute';
    toolElement.style.zIndex = '999';
    toolElement.style.pointerEvents = 'none';

    // 设置初始位置
    toolElement.style.left = '50%';
    toolElement.style.top = '50%';
    toolElement.style.transform = 'translate(-50%, -50%)';

    // 更新工具位置跟随鼠标
    updateToolPosition(toolElement);

    // 触发互动效果
    triggerInteraction(toolType);

    console.log(`工具 ${toolType} 已显示`);
  } else {
    console.error(`工具元素未找到: ${toolType}`);
  }
}

// 🛠️ 隐藏所有工具
function hideAllTools() {
  console.log('隐藏所有工具');
  [brushTool, treatTool, catnipTool].forEach(tool => {
    if (tool) {
      tool.classList.remove('active');
      tool.classList.add('hidden');
      tool.style.display = 'none';
    }
  });
  currentTool = null;
}

// 📍 更新工具位置（跟随鼠标）
function updateToolPosition(toolElement) {
  const mouseMoveHandler = (e) => {
    if (currentTool && !toolElement.classList.contains('hidden')) {
      // 添加平滑跟随效果
      const offsetX = toolElement === brushTool ? -20 : -40;
      const offsetY = toolElement === brushTool ? -20 : -40;

      toolElement.style.left = (e.clientX + offsetX) + 'px';
      toolElement.style.top = (e.clientY + offsetY) + 'px';

      // 检查是否在小猫附近进行互动
      checkToolInteraction(e.clientX, e.clientY, toolElement);
    }
  };

  // 移除之前的事件监听器，避免重复绑定
  document.removeEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mousemove', mouseMoveHandler);
}

// 🎯 检查工具与小猫的互动
function checkToolInteraction(mouseX, mouseY, toolElement) {
  const kittenRect = kitten.getBoundingClientRect();
  const kittenCenterX = kittenRect.left + kittenRect.width / 2;
  const kittenCenterY = kittenRect.top + kittenRect.height / 2;

  const distance = Math.sqrt(
    Math.pow(mouseX - kittenCenterX, 2) +
    Math.pow(mouseY - kittenCenterY, 2)
  );

  // 如果工具靠近小猫，添加互动效果
  if (distance < 100) {
    toolElement.style.filter = 'drop-shadow(0 0 10px #ff69b4)';
    kitten.style.filter = 'brightness(1.2) drop-shadow(0 0 15px #ffb6c1)';
  } else {
    toolElement.style.filter = '';
    kitten.style.filter = '';
  }
}

// 🎭 触发互动效果
function triggerInteraction(toolType) {
  interactionCount++;
  
  // 播放对应音效
  playInteractionSound(toolType);
  
  // 显示反馈信息
  showInteractionFeedback(toolType);
  
  // 触发小猫反应
  triggerKittenReaction(toolType);
  
  // 创建视觉特效
  createVisualEffects(toolType);
}

// 🎵 播放互动音效
function playInteractionSound(toolType) {
  switch (toolType) {
    case 'brush':
      if (brushSound) brushSound.play().catch(e => console.log("音效播放被阻止:", e));
      if (purrSound) purrSound.play().catch(e => console.log("音效播放被阻止:", e));
      break;
    case 'treat':
      if (meowSound) meowSound.play().catch(e => console.log("音效播放被阻止:", e));
      break;
    case 'catnip':
      if (happySound) happySound.play().catch(e => console.log("音效播放被阻止:", e));
      break;
  }
}

// 💬 显示互动反馈
function showInteractionFeedback(toolType) {
  const messages = feedbackMessages[toolType];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  feedbackText.textContent = randomMessage;
  
  // 3秒后恢复默认文本
  setTimeout(() => {
    feedbackText.textContent = `继续和${kittenName}互动吧！试试不同的手势~`;
  }, 3000);
}

// 🐱 触发小猫反应
function triggerKittenReaction(toolType) {
  // 清除之前的动画类
  kitten.classList.remove('kitten-happy', 'kitten-excited', 'kitten-content');

  switch (toolType) {
    case 'brush':
      kitten.classList.add('kitten-content');
      kittenMood = 'content';
      // 刷毛效果：轻微摇摆
      kitten.style.animation = 'sway 2s ease-in-out';
      setTimeout(() => {
        kitten.style.animation = '';
      }, 2000);
      break;
    case 'treat':
      kitten.classList.add('kitten-happy');
      kittenMood = 'happy';
      // 猫条效果：上下跳跃
      kitten.style.animation = 'jump 0.5s ease-in-out 3';
      setTimeout(() => {
        kitten.style.animation = '';
      }, 1500);
      break;
    case 'catnip':
      kitten.classList.add('kitten-excited');
      kittenMood = 'excited';
      // 猫薄荷特殊效果：疯狂翻滚
      kitten.style.animation = 'crazyRoll 2s ease-in-out';
      setTimeout(() => {
        kitten.style.animation = '';
      }, 2000);
      break;
  }

  // 添加互动次数和统计
  interactionCount++;

  // 统计各种工具使用次数
  switch (toolType) {
    case 'brush':
      brushCount++;
      break;
    case 'treat':
      treatCount++;
      break;
    case 'catnip':
      catnipCount++;
      break;
  }

  // 检查成就
  checkAchievements();

  // 根据互动次数增加特殊效果
  if (interactionCount % 5 === 0) {
    createHeartEffect();
  }

  // 3秒后恢复默认状态
  setTimeout(() => {
    kitten.classList.remove('kitten-happy', 'kitten-excited');
    if (!kitten.classList.contains('kitten-content')) {
      kitten.classList.add('kitten-content');
    }
    if (gameStarted) {
      feedbackText.textContent = `Continue interacting with ${kittenName}! Try different gestures~`;
    }
  }, 3000);
}

// 💖 创建爱心特效
function createHeartEffect() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const heart = document.createElement('div');
      heart.textContent = '💖';
      heart.style.position = 'absolute';
      heart.style.left = (kitten.offsetLeft + Math.random() * 100) + 'px';
      heart.style.top = (kitten.offsetTop + Math.random() * 100) + 'px';
      heart.style.fontSize = '20px';
      heart.style.pointerEvents = 'none';
      heart.style.zIndex = '999';
      heart.style.animation = 'floatUp 2s ease-out forwards';

      document.body.appendChild(heart);

      setTimeout(() => {
        heart.remove();
      }, 2000);
    }, i * 200);
  }
}

// 🌈 创建彩虹特效
function createRainbowEffect() {
  const colors = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'];
  for (let i = 0; i < colors.length; i++) {
    setTimeout(() => {
      const rainbow = document.createElement('div');
      rainbow.textContent = colors[i];
      rainbow.style.position = 'absolute';
      rainbow.style.left = (kitten.offsetLeft + i * 30) + 'px';
      rainbow.style.top = (kitten.offsetTop - 50) + 'px';
      rainbow.style.fontSize = '30px';
      rainbow.style.pointerEvents = 'none';
      rainbow.style.zIndex = '999';
      rainbow.style.animation = 'rainbowFloat 3s ease-out forwards';

      document.body.appendChild(rainbow);

      setTimeout(() => {
        rainbow.remove();
      }, 3000);
    }, i * 100);
  }
}

// ⭐ 创建星星特效
function createStarEffect() {
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const star = document.createElement('div');
      star.textContent = '⭐';
      star.style.position = 'absolute';
      star.style.left = (kitten.offsetLeft + Math.random() * 150 - 75) + 'px';
      star.style.top = (kitten.offsetTop + Math.random() * 150 - 75) + 'px';
      star.style.fontSize = '25px';
      star.style.pointerEvents = 'none';
      star.style.zIndex = '999';
      star.style.animation = 'starTwinkle 2s ease-out forwards';

      document.body.appendChild(star);

      setTimeout(() => {
        star.remove();
      }, 2000);
    }, i * 150);
  }
}

// 🏆 成就系统
function checkAchievements() {
  const newAchievements = [];

  // 成就1：初次互动
  if (interactionCount === 1 && !achievements.includes('first_interaction')) {
    newAchievements.push({
      id: 'first_interaction',
      title: 'First Meeting',
      description: `First interaction with ${kittenName}!`
    });
  }

  // 成就2：刷毛专家
  if (brushCount >= 10 && !achievements.includes('brush_master')) {
    newAchievements.push({
      id: 'brush_master',
      title: 'Brush Master',
      description: `Brushed ${kittenName} 10 times!`
    });
  }

  // 成就3：零食达人
  if (treatCount >= 5 && !achievements.includes('treat_lover')) {
    newAchievements.push({
      id: 'treat_lover',
      title: 'Treat Lover',
      description: `Fed ${kittenName} 5 treats!`
    });
  }

  // 成就4：猫薄荷狂热者
  if (catnipCount >= 3 && !achievements.includes('catnip_crazy')) {
    newAchievements.push({
      id: 'catnip_crazy',
      title: 'Catnip Enthusiast',
      description: `Let ${kittenName} enjoy catnip 3 times!`
    });
  }

  // 成就5：全能铲屎官
  if (brushCount >= 5 && treatCount >= 5 && catnipCount >= 5 && !achievements.includes('all_rounder')) {
    newAchievements.push({
      id: 'all_rounder',
      title: 'All-Round Cat Parent',
      description: `Mastered all cat petting skills!`
    });
  }

  // 成就6：互动达人
  if (interactionCount >= 20 && !achievements.includes('interaction_master')) {
    newAchievements.push({
      id: 'interaction_master',
      title: 'Interaction Master',
      description: `Interacted with ${kittenName} 20 times!`
    });
  }

  // 显示新成就
  newAchievements.forEach(achievement => {
    achievements.push(achievement.id);
    showAchievement(achievement);
  });
}

// 🎉 显示成就
function showAchievement(achievement) {
  const achievementDiv = document.createElement('div');
  achievementDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #ff69b4, #ff1493);
      color: white;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(255, 105, 180, 0.5);
      z-index: 9999;
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      max-width: 250px;
      animation: slideInRight 0.5s ease-out;
    ">
      <div style="font-size: 16px; margin-bottom: 5px;">🏆 ${achievement.title}</div>
      <div style="font-size: 10px; opacity: 0.9;">${achievement.description}</div>
    </div>
  `;

  document.body.appendChild(achievementDiv);

  // 3秒后移除
  setTimeout(() => {
    achievementDiv.style.animation = 'slideOutRight 0.5s ease-in forwards';
    setTimeout(() => {
      achievementDiv.remove();
    }, 500);
  }, 3000);
}

// ✨ 创建视觉特效
function createVisualEffects(toolType) {
  const kittenRect = kitten.getBoundingClientRect();
  const centerX = kittenRect.left + kittenRect.width / 2;
  const centerY = kittenRect.top + kittenRect.height / 2;
  
  // 创建粒子特效
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      createParticle(centerX, centerY);
    }, i * 100);
  }
  
  // 特殊效果
  if (toolType === 'catnip') {
    // 猫薄荷创建爱心特效
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        createHeartEffect(centerX, centerY);
      }, i * 200);
    }
  }
}

// 🌟 创建粒子
function createParticle(x, y) {
  const particle = document.createElement('div');
  particle.classList.add('particle');
  particle.style.left = x + (Math.random() - 0.5) * 100 + 'px';
  particle.style.top = y + (Math.random() - 0.5) * 100 + 'px';
  document.body.appendChild(particle);
  
  setTimeout(() => {
    particle.remove();
  }, 2000);
}

// 💖 创建爱心特效
function createHeartEffect(x, y) {
  const heart = document.createElement('div');
  heart.classList.add('heart-effect');
  heart.textContent = '💖';
  heart.style.left = x + (Math.random() - 0.5) * 80 + 'px';
  heart.style.top = y + 'px';
  document.body.appendChild(heart);
  
  setTimeout(() => {
    heart.remove();
  }, 3000);
}

// 🎯 显示手势检测效果
function showGestureDetected(gesture) {
  const gestureMap = {
    'open_hand': '✋',
    'peace': '✌️',
    'ok': '👌'
  };
  
  const gestureIcon = document.createElement('div');
  gestureIcon.classList.add('gesture-detected');
  gestureIcon.textContent = gestureMap[gesture] || '👋';
  document.body.appendChild(gestureIcon);
  
  setTimeout(() => {
    gestureIcon.remove();
  }, 1000);
}

// 🚪 窗口拖拽功能
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let currentWindow = null;

document.addEventListener('mousedown', (e) => {
  const windowHeader = e.target.closest('.window-header');
  if (windowHeader && !e.target.classList.contains('close-btn')) {
    isDragging = true;
    currentWindow = windowHeader.closest('.window');

    // 重置窗口样式（如果之前被最小化）
    currentWindow.style.transform = 'scale(1)';
    currentWindow.style.opacity = '1';

    const rect = currentWindow.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    // 提升当前窗口的z-index
    currentWindow.style.zIndex = 1001;

    e.preventDefault();
  }
});

document.addEventListener('mousemove', (e) => {
  if (isDragging && currentWindow) {
    let newLeft = e.clientX - dragOffsetX;
    let newTop = e.clientY - dragOffsetY;

    // 限制边界
    const maxLeft = window.innerWidth - currentWindow.offsetWidth;
    const maxTop = window.innerHeight - currentWindow.offsetHeight;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    currentWindow.style.left = newLeft + 'px';
    currentWindow.style.top = newTop + 'px';
    currentWindow.style.right = 'auto'; // 重置right属性
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    if (currentWindow) {
      currentWindow.style.zIndex = 1000; // 恢复正常z-index
    }
    currentWindow = null;
  }
});

// ❌ 关闭按钮 - 修改为最小化而不是隐藏
document.querySelectorAll('.close-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const window = btn.closest('.window');
    // 最小化到屏幕角落而不是完全隐藏
    window.style.top = '10px';
    window.style.right = '10px';
    window.style.left = 'auto';
    window.style.transform = 'scale(0.8)';
    window.style.opacity = '0.7';
  });
});

// 🎹 添加键盘测试模式（用于调试）
function addKeyboardTestMode() {
  console.log('Adding keyboard test mode: Press 1=Brush, 2=Treat, 3=Catnip');

  // 显示键盘提示
  const keyboardHint = document.createElement('div');
  keyboardHint.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 9999;
    ">
      🎹 Test Mode:<br>
      Press 1 = Brush<br>
      Press 2 = Treat<br>
      Press 3 = Catnip
    </div>
  `;
  document.body.appendChild(keyboardHint);

  // 添加键盘事件监听
  document.addEventListener('keydown', (e) => {
    if (!gameStarted) return;

    let gesture = null;
    switch(e.key) {
      case '1':
        gesture = 'open_hand';
        console.log('Keyboard test: Open hand -> Brush');
        break;
      case '2':
        gesture = 'peace';
        console.log('Keyboard test: Peace sign -> Treat');
        break;
      case '3':
        gesture = 'ok';
        console.log('Keyboard test: OK gesture -> Catnip');
        break;
    }

    if (gesture) {
      handleGestureChange(gesture);

      // 显示测试提示
      feedbackText.textContent = `🎹 Keyboard test: ${gesture === 'open_hand' ? 'Brush' : gesture === 'peace' ? 'Treat' : 'Catnip'}`;
      setTimeout(() => {
        if (gameStarted) {
          feedbackText.textContent = `Continue interacting with ${kittenName}! Try different gestures~`;
        }
      }, 2000);
    }
  });
}

// 🧪 测试工具函数（全局函数，供HTML调用）
window.testTool = function(toolType) {
  console.log(`测试工具: ${toolType}`);
  if (!gameStarted) {
    gameStarted = true;
    feedbackWindow.classList.remove('hidden');
    tutorialWindow.classList.add('hidden');
  }

  hideAllTools();
  showTool(toolType);

  feedbackText.textContent = `🧪 Test mode: ${toolType === 'brush' ? 'Brush' : toolType === 'treat' ? 'Treat' : 'Catnip'} tool`;
};

// 🐾 页面加载时初始化
window.addEventListener('DOMContentLoaded', initGame);