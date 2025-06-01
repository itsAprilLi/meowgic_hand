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
    clearInterval(typingInterval);
    const textElement = dialogues[currentStep].element.querySelector('.dialogue-text');
    textElement.textContent = dialogues[currentStep].text;
    typingInterval = null;
  } else {
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
  element.textContent = "";
  let i = 0;
  typingInterval = setInterval(() => {
    element.textContent += text[i];
    if (i % 2 === 0) { typeSound.currentTime = 0; typeSound.play(); }
    i++;
    if (i >= text.length) {
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

// 关闭按钮
closeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.parentElement.parentElement.classList.add('hidden');
  });
});

// 拖动窗口
let isDragging = false, offsetX, offsetY;
document.addEventListener('mousedown', (e) => {
  if (e.target.classList.contains('window-header')) {
    isDragging = true;
    const windowBox = e.target.parentElement;
    offsetX = e.clientX - windowBox.offsetLeft;
    offsetY = e.clientY - windowBox.offsetTop;

    document.onmousemove = (e) => {
      if (isDragging) {
        windowBox.style.left = `${e.clientX - offsetX}px`;
        windowBox.style.top = `${e.clientY - offsetY}px`;
      }
    };
    document.onmouseup = () => {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  }
});