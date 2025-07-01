// 🐾 获取元素
const roomBackground = document.getElementById('room-background');
const hiddenKitten = document.getElementById('hidden-kitten');
const glassesOverlay = document.getElementById('glasses-overlay');
const glassesViewport = document.getElementById('glasses-viewport');
const findCatWindow = document.getElementById('find-cat-window');
const successWindow = document.getElementById('success-window');
const startSearchBtn = document.getElementById('start-search-btn');
const nextStageBtn = document.getElementById('next-stage-btn');
const dialogueText = document.querySelector('#find-cat-window .dialogue-text');
const successText = document.querySelector('#success-window .dialogue-text');
const furnitureElements = document.querySelectorAll('.furniture');
const furnitureSound = document.getElementById('furniture-sound');
const bgm = document.getElementById('bgm');
const successSound = document.getElementById('success-sound');
const meowSound = document.getElementById('meow-sound');

// 🤲 手势识别元素
const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// 🐾 获取URL参数
const urlParams = new URLSearchParams(window.location.search);
const kittenName = urlParams.get('name') || 'Mochi';
const catImageUrl = urlParams.get('catImage') || 'calicocat.png';

// 🐾 游戏状态
let gameStarted = false;
let kittenFound = false;
let kittenPosition = { x: 0, y: 0 };
let glassesPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let hands = null;
let cameraStarted = false;

// 🐾 初始化游戏
function initGame() {
  // 设置小猫图片和随机位置
  hiddenKitten.src = catImageUrl;
  setRandomKittenPosition();

  // 播放背景音乐
  if (bgm) {
    bgm.volume = 0.3;
    bgm.play().catch(e => console.log("BGM播放被阻止:", e));
  }

  // 更新对话文本
  dialogueText.textContent = `Use hand gestures to control the magic glasses and find hidden ${kittenName}!`;
}

// 🐾 随机设置小猫位置
function setRandomKittenPosition() {
  const maxX = window.innerWidth - 60;
  const maxY = window.innerHeight - 60;
  
  kittenPosition.x = Math.random() * maxX;
  kittenPosition.y = Math.random() * maxY;
  
  // 确保小猫不在弹窗区域
  if (kittenPosition.x > window.innerWidth - 500 && kittenPosition.y < 300) {
    kittenPosition.x = Math.random() * (window.innerWidth - 500);
  }
  
  hiddenKitten.style.left = kittenPosition.x + 'px';
  hiddenKitten.style.top = kittenPosition.y + 'px';
}

// 🐾 开始搜索
startSearchBtn.addEventListener('click', async () => {
  gameStarted = true;
  glassesOverlay.style.display = 'block';

  // 启动摄像头和手势识别
  await setupCamera();
  setupHandDetection();

  // 更新弹窗文本
  dialogueText.textContent = `Use gestures to find ${kittenName}! Move your hand to control the glasses!`;
  startSearchBtn.style.display = 'none';

  // 显示摄像头预览
  canvasElement.style.display = 'block';
});

// 🐾 手势控制眼镜视窗（替代鼠标控制）
// 现在通过手势识别在 updateGlassesPosition 函数中处理

// 🐾 检查是否找到小猫
function checkKittenFound(mouseX, mouseY) {
  const kittenRect = hiddenKitten.getBoundingClientRect();
  const kittenCenterX = kittenRect.left + kittenRect.width / 2;
  const kittenCenterY = kittenRect.top + kittenRect.height / 2;
  
  const distance = Math.sqrt(
    Math.pow(mouseX - kittenCenterX, 2) + 
    Math.pow(mouseY - kittenCenterY, 2)
  );
  
  // 如果眼镜视窗覆盖到小猫
  if (distance < 100 && !kittenFound) {
    kittenFound = true;
    foundKitten();
  }
}

// 🐾 找到小猫的处理
function foundKitten() {
  // 播放成功音效
  if (successSound) successSound.play().catch(e => console.log("音效播放被阻止:", e));
  if (meowSound) {
    setTimeout(() => {
      meowSound.play().catch(e => console.log("音效播放被阻止:", e));
    }, 500);
  }

  // 高亮小猫并添加找到效果
  hiddenKitten.classList.add('kitten-found');
  hiddenKitten.style.filter = 'drop-shadow(0 0 20px #ff69b4)';
  hiddenKitten.style.animation = 'bounce 0.5s ease-in-out 3';

  // 隐藏眼镜覆盖层
  glassesOverlay.style.display = 'none';

  // 显示成功弹窗
  const congratsMessages = [
    `Congratulations! You found ${kittenName}! Give him a hug!`,
    `Amazing! You discovered ${kittenName}!`,
    `Great job! ${kittenName} was hiding so well but you found him!`,
    `${kittenName}: Meow~ You found me!`,
    `Wow! There's ${kittenName}! You have great eyes!`,
    `${kittenName}: Master found me! So happy~`,
    `Success! ${kittenName} is waving at you!`,
    `Incredible! The magic glasses really work! ${kittenName} is here!`
  ];

  const randomMessage = congratsMessages[Math.floor(Math.random() * congratsMessages.length)];
  successText.textContent = randomMessage;

  successWindow.classList.remove('hidden');
  findCatWindow.classList.add('hidden');

  // 添加庆祝特效
  createCelebrationEffect();
}

// 🎉 创建庆祝特效
function createCelebrationEffect() {
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      sparkle.style.position = 'absolute';
      sparkle.style.left = Math.random() * window.innerWidth + 'px';
      sparkle.style.top = Math.random() * window.innerHeight + 'px';
      sparkle.style.width = '10px';
      sparkle.style.height = '10px';
      sparkle.style.background = '#ff69b4';
      sparkle.style.borderRadius = '50%';
      sparkle.style.pointerEvents = 'none';
      sparkle.style.zIndex = '999';
      sparkle.style.animation = 'sparkle 1s ease-out forwards';

      document.body.appendChild(sparkle);

      setTimeout(() => {
        sparkle.remove();
      }, 1000);
    }, i * 100);
  }
}

// 🐾 检查家具交互
let lastTriggeredFurniture = null;
function checkFurnitureInteraction(mouseX, mouseY) {
  furnitureElements.forEach(furniture => {
    const rect = furniture.getBoundingClientRect();
    
    // 检查鼠标是否在家具区域内
    if (mouseX >= rect.left && mouseX <= rect.right &&
        mouseY >= rect.top && mouseY <= rect.bottom) {
      
      // 避免重复触发同一家具
      if (lastTriggeredFurniture !== furniture.id) {
        lastTriggeredFurniture = furniture.id;
        triggerFurnitureInteraction(furniture);
      }
    }
  });
  
  // 检查鼠标是否离开所有家具
  let mouseOnFurniture = false;
  furnitureElements.forEach(furniture => {
    const rect = furniture.getBoundingClientRect();
    if (mouseX >= rect.left && mouseX <= rect.right &&
        mouseY >= rect.top && mouseY <= rect.bottom) {
      mouseOnFurniture = true;
    }
  });
  
  if (!mouseOnFurniture) {
    lastTriggeredFurniture = null;
  }
}

// 🐾 触发家具交互
function triggerFurnitureInteraction(furniture) {
  const furnitureText = furniture.dataset.text;
  const soundFile = furniture.dataset.sound;
  
  // 替换小猫名字占位符
  const displayText = furnitureText.replace(/\[xxx\]/g, kittenName);
  
  // 更新对话文本
  dialogueText.textContent = displayText;
  
  // 播放家具音效（如果有的话）
  if (soundFile && furnitureSound) {
    furnitureSound.src = soundFile;
    furnitureSound.play().catch(e => console.log("家具音效播放被阻止:", e));
  }
  
  // 2秒后恢复默认文本
  setTimeout(() => {
    if (!kittenFound) {
      dialogueText.textContent = `Use gestures to find ${kittenName}! Move near furniture for hints!`;
    }
  }, 2000);
}

// 🐾 进入撸猫环节
nextStageBtn.addEventListener('click', () => {
  const params = new URLSearchParams({
    catImage: catImageUrl,
    name: kittenName
  });
  window.location.href = `pet-cat.html?${params.toString()}`;
});

// 🐾 弹窗拖拽功能
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

// 🐾 关闭按钮 - 修改为最小化而不是隐藏
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

// 📹 设置摄像头
async function setupCamera() {
  try {
    console.log('Starting camera for gesture control...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera not supported in this browser');
    }

    if (typeof Camera === 'undefined') {
      throw new Error('MediaPipe Camera library not loaded');
    }

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        if (gameStarted && hands) {
          try {
            await hands.send({ image: videoElement });
          } catch (error) {
            console.error('Hand detection error:', error);
          }
        }
      },
      width: 640,
      height: 480
    });

    await camera.start();
    console.log('Camera started successfully');
    cameraStarted = true;

  } catch (error) {
    console.error('Camera setup failed:', error);
    dialogueText.textContent = `Camera error: ${error.message}. Try refreshing the page.`;
  }
}

// 🤲 设置手势识别
function setupHandDetection() {
  try {
    if (typeof Hands === 'undefined') {
      throw new Error('MediaPipe Hands library not loaded');
    }

    hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.onResults(onHandResults);
    console.log('Hand detection initialized');

  } catch (error) {
    console.error('Hand detection setup failed:', error);
    dialogueText.textContent = `Gesture recognition error: ${error.message}`;
  }
}

// 🎯 手势识别结果处理
function onHandResults(results) {
  if (!gameStarted || kittenFound) return;

  // 清除画布并绘制视频
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    // 绘制手部关键点
    canvasCtx.fillStyle = 'rgba(255, 105, 180, 0.9)';
    landmarks.forEach(point => {
      canvasCtx.beginPath();
      canvasCtx.arc(point.x * canvasElement.width, point.y * canvasElement.height, 4, 0, 2 * Math.PI);
      canvasCtx.fill();
    });

    // 使用手部位置控制眼镜
    const handCenter = landmarks[9]; // 中指根部作为手部中心
    updateGlassesPosition(handCenter.x, handCenter.y);

    // 检测OK手势进行搜索
    const gesture = recognizeGesture(landmarks);
    if (gesture === 'ok') {
      checkKittenFound(glassesPosition.x, glassesPosition.y);
    }
  }

  canvasCtx.restore();
}

// 🎯 手势识别
function recognizeGesture(landmarks) {
  // 检测OK手势（拇指和食指形成圆圈）
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const distance = Math.sqrt(
    Math.pow(thumbTip.x - indexTip.x, 2) +
    Math.pow(thumbTip.y - indexTip.y, 2)
  );

  if (distance < 0.08) {
    return 'ok';
  }

  return null;
}

// 🔍 更新眼镜位置
function updateGlassesPosition(handX, handY) {
  // 将手部坐标转换为屏幕坐标
  glassesPosition.x = handX * window.innerWidth;
  glassesPosition.y = handY * window.innerHeight;

  // 更新眼镜视窗位置
  const viewportSize = 200;
  const x = glassesPosition.x - viewportSize / 2;
  const y = glassesPosition.y - viewportSize / 2;

  glassesViewport.style.left = x + 'px';
  glassesViewport.style.top = y + 'px';

  // 检查家具交互
  checkFurnitureInteraction(glassesPosition.x, glassesPosition.y);
}

// 🐾 页面加载时初始化
window.addEventListener('DOMContentLoaded', initGame);