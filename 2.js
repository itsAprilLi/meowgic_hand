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
  const interval = setInterval(() => {
    dialogue.textContent += text[i];
    if (i % 2 === 0 && typeSound) {
      typeSound.currentTime = 0;
      typeSound.play();
    }
    i++;  // ✅ 这里补上
    if (i >= text.length) {
      clearInterval(interval);
      if (callback) callback();
    }
  }, 50);
}

// 🐾 页面加载动画
window.addEventListener('DOMContentLoaded', () => {
  if (bgm) bgm.play();
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

// 🐾 步骤控制
let step = 1;
let cameraStarted = false;

nextBtn.addEventListener('click', () => {
  step++;
  if (step === 2) {
    typeWriter("Hey, your eyesight isn't so good, you need to learn to wear glasses first...", () => { });
  } else if (step === 3) {
    typeWriter("Firstly, let's learn how to use the meowgic hand! Raise both your hands!", () => {
      videoElement.style.display = 'block';
      canvasElement.style.display = 'block';
      if (!cameraStarted) {
        camera.start();
        cameraStarted = true;
      }
    });
  } else if (step === 4) {
    typeWriter("Now, try to make a peace sign (yeah) with your hand!", () => { });
  } else if (step === 5) {
    typeWriter("Finally, make a glasses shape with your hands. When the glasses appear, you'll succeed! Bravo!", () => { });
  } else if (step === 6) {
    window.location.href = "game.html";
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

  // Peace sign
  if (step === 4 && results.multiHandLandmarks.length >= 1) {
    results.multiHandLandmarks.forEach(landmarks => {
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      if (indexTip && middleTip) {
        goodSound.play();
        console.log("Peace sign detected!");
        // 你可以在这里绘制 yeah.png 或其他提示动画
      }
    });
  }

  // 眼镜形状 (实心白色圆)
  if (step === 5 && results.multiHandLandmarks.length >= 2) {
    const leftHand = results.multiHandLandmarks[0];
    const rightHand = results.multiHandLandmarks[1];
    const leftIndex = leftHand[8];
    const rightIndex = rightHand[8];

    if (leftIndex && rightIndex) {
      const dx = (leftIndex.x - rightIndex.x) * canvasElement.width;
      const dy = (leftIndex.y - rightIndex.y) * canvasElement.height;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 50) {
        goodSound.play();
        console.log("Glasses detected!");

        // 两个白色实心圆（镜头孔）
        canvasCtx.fillStyle = 'white';
        canvasCtx.beginPath();
        canvasCtx.arc(leftIndex.x * canvasElement.width, leftIndex.y * canvasElement.height, 30, 0, 2 * Math.PI);
        canvasCtx.fill();

        canvasCtx.beginPath();
        canvasCtx.arc(rightIndex.x * canvasElement.width, rightIndex.y * canvasElement.height, 30, 0, 2 * Math.PI);
        canvasCtx.fill();

        // 可选：绘制眼镜连线
        canvasCtx.strokeStyle = 'white';
        canvasCtx.lineWidth = 4;
        canvasCtx.beginPath();
        canvasCtx.moveTo(leftIndex.x * canvasElement.width + 30, leftIndex.y * canvasElement.height);
        canvasCtx.lineTo(rightIndex.x * canvasElement.width - 30, rightIndex.y * canvasElement.height);
        canvasCtx.stroke();
      }
    }
  }

  canvasCtx.restore();
});

// 🐾 关闭弹窗
document.querySelector('.close-btn').addEventListener('click', () => {
  document.getElementById('popup-window').style.display = 'none';
});