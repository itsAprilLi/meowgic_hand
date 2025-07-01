const enterBtn = document.getElementById('enter-btn');
const dialogueWindow = document.getElementById('dialogue-window');
const dialogueText = dialogueWindow.querySelector('.dialogue-text');
const nextBtn = document.getElementById('next-btn');
const catSelectWindow = document.getElementById('cat-select-window');
const catDialogueText = catSelectWindow.querySelector('.dialogue-text');
const catOptions = document.querySelectorAll('.cat-option');
const kittenNameInput = document.getElementById('kitten-name');
const catNextBtn = document.getElementById('cat-next-btn');
const typeSound = document.getElementById('type-sound');
const bgm = document.getElementById('bgm');
const closeBtns = document.querySelectorAll('.close-btn');

const dialogues = [
  { element: dialogueWindow, text: "Welcome to meowgic hand! Do we play?" },
  { element: dialogueWindow, text: "You are an office worker with a cat! Your favorite thing is to come home and give your cat endless kisses!" },
  { element: dialogueWindow, text: "Let's go and pat your cat?" },
  { element: catSelectWindow, text: "Choose and name your kitten:" }
];

let currentStep = 0;
let typingInterval = null;
let windowOffset = 0;

// 进入游戏
enterBtn.addEventListener('click', () => {
  enterBtn.style.display = "none";
  if (bgm.paused) {
    bgm.volume = 0.5;
    bgm.play().catch(e => console.log("BGM 播放被浏览器拦截:", e));
  }
  showStep(currentStep);
});

// Next
nextBtn.addEventListener('click', () => {
  if (typingInterval) {
    // 如果正在打字，立即完成当前文字显示
    clearInterval(typingInterval);
    const textElement = dialogues[currentStep].element.querySelector('.dialogue-text');
    textElement.textContent = dialogues[currentStep].text;
    typingInterval = null;
  } else {
    // 进入下一步
    currentStep++;
    if (currentStep < dialogues.length) {
      showStep(currentStep);
    }
  }
});

// 猫咪选择高亮
catOptions.forEach(option => {
  option.addEventListener('click', () => {
    catOptions.forEach(o => o.classList.remove('selected'));
    option.classList.add('selected');
  });
});

// 猫咪选择确认
catNextBtn.addEventListener('click', () => {
  const selectedCat = document.querySelector('.cat-option.selected');
  const kittenName = kittenNameInput.value.trim();
  if (!selectedCat || !kittenName) {
    alert("Please select a kitten and enter a name!");
    return;
  }
  alert(`You chose cat ${selectedCat.dataset.cat} named ${kittenName}. Let's start the meowgic!`);
  const catImageUrl = selectedCat.querySelector('img').src;
  const params = new URLSearchParams({
    catImage: catImageUrl,
    name: kittenName
  });
  window.location.href = `index2.html?${params.toString()}`;
});

// 显示步骤
function showStep(index) {
  const step = dialogues[index];
  showWindow(step.element);
  const textElement = step.element.querySelector('.dialogue-text');
  startTyping(textElement, step.text);
}

// 打字机效果
function startTyping(element, text) {
  // 清除之前的打字机效果
  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }

  element.textContent = "";
  let i = 0;
  typingInterval = setInterval(() => {
    if (i < text.length) {
      element.textContent += text[i];
      // 播放打字音效
      if (i % 2 === 0 && typeSound) {
        typeSound.currentTime = 0;
        typeSound.play().catch(e => console.log("音效播放被阻止:", e));
      }
      i++;
    } else {
      clearInterval(typingInterval);
      typingInterval = null;
    }
  }, 50);
}

// 窗口错位显示 + zIndex
  function showWindow(windowElement) {
    windowElement.classList.remove('hidden');
    windowElement.style.zIndex = 10 + windowOffset;
    windowElement.style.left = `${50 + windowOffset * 20}px`;
    windowElement.style.top = `${50 + windowOffset * 20}px`;
    windowOffset++;
}

// 关闭按钮 - 修改为最小化而不是隐藏
closeBtns.forEach(btn => {
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

// 改进的拖动窗口逻辑
let isDragging = false, offsetX, offsetY, currentWindow = null;

document.addEventListener('mousedown', (e) => {
  const windowHeader = e.target.closest('.window-header');
  if (windowHeader && !e.target.classList.contains('close-btn')) {
    isDragging = true;
    currentWindow = windowHeader.closest('.window');

    // 重置窗口样式（如果之前被最小化）
    currentWindow.style.transform = 'scale(1)';
    currentWindow.style.opacity = '1';

    const rect = currentWindow.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // 提升当前窗口的z-index
    currentWindow.style.zIndex = 1001;

    e.preventDefault();
  }
});

document.addEventListener('mousemove', (e) => {
  if (isDragging && currentWindow) {
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;

    // 限制窗口在屏幕边界内
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