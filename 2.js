// 🐾 元素
const kitten = document.getElementById('kitten');
const door = document.getElementById('door');
const dialogue = document.querySelector('.dialogue-text');
const nextBtn = document.getElementById('next-btn');
const typeSound = document.getElementById('type-sound');
const bgm = document.getElementById('bgm');
const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const goodSound = document.getElementById('good-sound');

// 🐾 小猫信息
const urlParams = new URLSearchParams(window.location.search);
const kittenName = urlParams.get('name') || 'Mochi';
const catSrc = urlParams.get('cat') || 'caliocat.png';
kitten.src = catSrc;

// 🐾 打字机效果
function typeWriter(text, callback) {
  let i = 0;
  dialogue.textContent = '';
  // 清除之前的interval，防止重复执行
  if (window.currentTypingInterval) {
    clearInterval(window.currentTypingInterval);
    window.currentTypingInterval = null;
  }

  window.currentTypingInterval = setInterval(() => {
    if (i < text.length) {
      dialogue.textContent += text[i];
      if (i % 2 === 0 && typeSound) {
        typeSound.currentTime = 0;
        typeSound.play().catch(e => console.log("音效播放被阻止:", e));
      }
      i++;
    } else {
      clearInterval(window.currentTypingInterval);
      window.currentTypingInterval = null;
      if (callback) callback();
    }
  }, 50);
}

// 🐾 页面加载动画
window.addEventListener('DOMContentLoaded', () => {
  if (bgm) {
    bgm.volume = 0.3;
    bgm.play().catch(e => console.log("BGM播放被阻止:", e));
  }
  
  videoElement.style.display = 'none';
  canvasElement.style.display = 'none';
  videoElement.style.transform = 'scaleX(-1)';
  canvasElement.style.transform = 'scaleX(-1)';

  kitten.style.left = '50%';
  kitten.style.top = '50%';
  kitten.style.transform = 'translate(-50%, -50%) scale(2)';

  typeWriter(`Your kitten ${kittenName} is so cute! I want to pat it...`, () => {
    setTimeout(() => {
      const gameRect = document.querySelector('.content-area').getBoundingClientRect();
      const doorRect = door.getBoundingClientRect();
      const targetLeft = doorRect.left - gameRect.left + doorRect.width / 2;
      const targetTop = doorRect.top - gameRect.top + doorRect.height / 2;

      kitten.style.left = `${targetLeft}px`;
      kitten.style.top = `${targetTop}px`;
      kitten.style.transform = 'translate(-50%, -50%) scale(0.2)';

      setTimeout(() => {
        kitten.style.display = 'none';
        typeWriter(`OMG! ${kittenName} ran away and hid in the door! Go find him!`, () => {
          nextBtn.style.display = 'inline-block';
        });
      }, 2000);
    }, 2000);
  });
});

// 🐾 Mediapipe 设置
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// 🐾 摄像头
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});

// 🐾 摄像头启动函数（添加错误处理）
async function startCameraWithErrorHandling() {
  try {
    // 检查浏览器是否支持getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('您的浏览器不支持摄像头功能');
    }
    
    // 检查摄像头权限
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop()); // 先停止测试流
    
    // 启动MediaPipe摄像头
    await camera.start();
    cameraStarted = true;
    console.log('摄像头启动成功');
    
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
    const dialogueTextElement = document.querySelector('.dialogue-text');
    if (dialogueTextElement) {
      dialogueTextElement.textContent = `❌ ${errorMessage}`;
      dialogueTextElement.style.color = '#ff4444';
    }
    
    // 隐藏视频元素
    videoElement.style.display = 'none';
    canvasElement.style.display = 'none';
  }
}

// 🐾 步骤控制
let step = 1;
let cameraStarted = false;
let glassesDetected = false; // 添加眼镜检测状态

nextBtn.addEventListener('click', () => {
  // 如果当前有打字机效果在进行，立即完成当前文字显示
  if (window.currentTypingInterval) {
    clearInterval(window.currentTypingInterval);
    window.currentTypingInterval = null;
    // 根据当前步骤显示完整文字
    if (step === 1) {
      dialogue.textContent = "Hey, your eyesight isn't so good, you need to learn to wear glasses first...";
    } else if (step === 2) {
      dialogue.textContent = "Firstly, let's learn how to use the meowgic hand! Raise both your hands!";
    } else if (step === 3) {
      dialogue.textContent = "Now, try to make a peace sign (yeah) with your hand!";
    } else if (step === 4) {
      dialogue.textContent = "Finally, make a glasses shape with your hands. When the glasses appear, you'll succeed! Bravo!";
    } else if (step === 5) {
      dialogue.textContent = "Congratulations! You've mastered Meowgic Hand! Let's pet the cat!";
    }
    return;
  }

  step++;
  if (step === 2) {
    typeWriter("Hey, your eyesight isn't so good, you need to learn to wear glasses first...", () => { });
  } else if (step === 3) {
    typeWriter("Firstly, let's learn how to use the meowgic hand! Raise both your hands!", () => {
      videoElement.style.display = 'block';
      canvasElement.style.display = 'block';
      if (!cameraStarted) {
        startCameraWithErrorHandling();
      }
    });
  } else if (step === 4) {
    typeWriter("Now, try to make a peace sign (yeah) with your hand!", () => { });
  } else if (step === 5) {
    typeWriter("Finally, make a glasses shape with your hands. When the glasses appear, you'll succeed! Bravo!", () => { });
  } else if (step === 6) {
    // 跳转到找小猫游戏
    const params = new URLSearchParams({
      catImage: catSrc,
      name: kittenName
    });
    window.location.href = `find-cat.html?${params.toString()}`;
  }
});

hands.onResults((results) => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // 不再反转 canvas，因为 CSS 已经反转了 video
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  // 粉色关键点
  if (results.multiHandLandmarks) {
    results.multiHandLandmarks.forEach(landmarks => {
      canvasCtx.fillStyle = 'rgba(255, 105, 180, 0.9)'; // 粉色
      landmarks.forEach(point => {
        canvasCtx.beginPath();
        canvasCtx.arc(point.x * canvasElement.width, point.y * canvasElement.height, 5, 0, 2 * Math.PI);
        canvasCtx.fill();
      });
    });
  }

  // Peace sign 检测 - 改进的识别逻辑
  if (step === 4 && results.multiHandLandmarks.length >= 1) {
    results.multiHandLandmarks.forEach(landmarks => {
      const indexTip = landmarks[8];   // 食指尖
      const middleTip = landmarks[12];  // 中指尖
      const ringTip = landmarks[16];    // 无名指尖
      const pinkyTip = landmarks[20];   // 小指尖
      const thumbTip = landmarks[4];    // 拇指尖

      if (indexTip && middleTip && ringTip && pinkyTip && thumbTip) {
        // 检查食指和中指是否伸直（Y坐标较小）
        const indexStraight = indexTip.y < landmarks[6].y; // 食指尖比食指中间关节高
        const middleStraight = middleTip.y < landmarks[10].y; // 中指尖比中指中间关节高

        // 检查无名指和小指是否弯曲（Y坐标较大）
        const ringBent = ringTip.y > landmarks[14].y; // 无名指尖比无名指中间关节低
        const pinkyBent = pinkyTip.y > landmarks[18].y; // 小指尖比小指中间关节低

        // Peace手势：食指和中指伸直，无名指和小指弯曲
        const isPeaceSign = indexStraight && middleStraight && ringBent && pinkyBent;

        if (isPeaceSign) {
          goodSound.play().catch(e => console.log("音效播放被阻止:", e));
          console.log("Peace sign detected!");

          // 绘制Peace标志
          canvasCtx.fillStyle = 'rgba(255, 215, 0, 0.8)'; // 金色
          canvasCtx.font = '30px Arial';
          canvasCtx.fillText('✌️', indexTip.x * canvasElement.width - 15, indexTip.y * canvasElement.height - 30);
        }
      }
    });
  }

  // 眼镜形状检测 - 改进的识别逻辑
  if (step === 5 && results.multiHandLandmarks.length >= 2) {
    const leftHand = results.multiHandLandmarks[0];
    const rightHand = results.multiHandLandmarks[1];

    // 使用食指和拇指形成圆形手势
    const leftThumb = leftHand[4];  // 拇指尖
    const leftIndex = leftHand[8];  // 食指尖
    const rightThumb = rightHand[4]; // 拇指尖
    const rightIndex = rightHand[8]; // 食指尖

    if (leftThumb && leftIndex && rightThumb && rightIndex) {
      // 计算左手拇指和食指的距离
      const leftDistance = Math.sqrt(
        Math.pow((leftThumb.x - leftIndex.x) * canvasElement.width, 2) +
        Math.pow((leftThumb.y - leftIndex.y) * canvasElement.height, 2)
      );

      // 计算右手拇指和食指的距离
      const rightDistance = Math.sqrt(
        Math.pow((rightThumb.x - rightIndex.x) * canvasElement.width, 2) +
        Math.pow((rightThumb.y - rightIndex.y) * canvasElement.height, 2)
      );

      // 计算两手之间的距离
      const handsDistance = Math.sqrt(
        Math.pow((leftIndex.x - rightIndex.x) * canvasElement.width, 2) +
        Math.pow((leftIndex.y - rightIndex.y) * canvasElement.height, 2)
      );

      // 眼镜手势：两手都形成小圆圈，且两手距离适中
      const isGlassesGesture = leftDistance < 50 && rightDistance < 50 &&
                               handsDistance > 80 && handsDistance < 200;

      if (isGlassesGesture && !glassesDetected) {
        glassesDetected = true;
        goodSound.play().catch(e => console.log("音效播放被阻止:", e));
        console.log("Glasses gesture detected!");

        // 显示恭喜信息
        typeWriter(`Congratulations! You've mastered Meowgic Hand! Let's pet the cat!`, () => {
          nextBtn.style.display = 'inline-block';
          nextBtn.textContent = 'Find Cat!';
        });
      }

      // 绘制眼镜效果
      if (isGlassesGesture) {
        // 绘制左眼镜片
        canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        canvasCtx.beginPath();
        canvasCtx.arc(
          (leftThumb.x + leftIndex.x) / 2 * canvasElement.width,
          (leftThumb.y + leftIndex.y) / 2 * canvasElement.height,
          25, 0, 2 * Math.PI
        );
        canvasCtx.fill();

        // 绘制右眼镜片
        canvasCtx.beginPath();
        canvasCtx.arc(
          (rightThumb.x + rightIndex.x) / 2 * canvasElement.width,
          (rightThumb.y + rightIndex.y) / 2 * canvasElement.height,
          25, 0, 2 * Math.PI
        );
        canvasCtx.fill();

        // 绘制眼镜连线
        canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        canvasCtx.lineWidth = 3;
        canvasCtx.beginPath();
        canvasCtx.moveTo(
          (leftThumb.x + leftIndex.x) / 2 * canvasElement.width + 25,
          (leftThumb.y + leftIndex.y) / 2 * canvasElement.height
        );
        canvasCtx.lineTo(
          (rightThumb.x + rightIndex.x) / 2 * canvasElement.width - 25,
          (rightThumb.y + rightIndex.y) / 2 * canvasElement.height
        );
        canvasCtx.stroke();
      }
    }
  }

  canvasCtx.restore();
});

// 🐾 关闭弹窗
document.querySelector('.close-btn').addEventListener('click', (e) => {
  e.stopPropagation(); // 防止事件冒泡
  // 不隐藏弹窗，只是最小化或重置位置
  const popupWindow = document.getElementById('popup-window');
  popupWindow.style.top = '50%';
  popupWindow.style.left = '50%';
  popupWindow.style.transform = 'translate(-50%, -50%)';
});

// 🐾 改进的拖拽功能
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

document.addEventListener('mousedown', (e) => {
  const windowHeader = e.target.closest('.window-header');
  if (windowHeader && !e.target.classList.contains('close-btn')) {
    isDragging = true;
    const popupWindow = document.getElementById('popup-window');
    const rect = popupWindow.getBoundingClientRect();
    
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    
    // 临时禁用transform，改用left/top定位
    popupWindow.style.transform = 'none';
    popupWindow.style.left = rect.left + 'px';
    popupWindow.style.top = rect.top + 'px';
    
    e.preventDefault();
  }
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const popupWindow = document.getElementById('popup-window');
    let newLeft = e.clientX - dragOffsetX;
    let newTop = e.clientY - dragOffsetY;
    
    // 限制边界，防止拖出屏幕
    const maxLeft = window.innerWidth - popupWindow.offsetWidth;
    const maxTop = window.innerHeight - popupWindow.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    popupWindow.style.left = newLeft + 'px';
    popupWindow.style.top = newTop + 'px';
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});