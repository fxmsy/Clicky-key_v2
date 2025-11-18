const ADMIN_CONFIG = {
  password: "61646d696e313233657869740000000000000000000000000000000000000000",
  enabled: true
};

function decryptAdminPassword() {
  const hexString = ADMIN_CONFIG.password;
  let result = '';
  for (let i = 0; i < hexString.length; i += 2) {
    result += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
  }
  return result.replace(/\0/g, '');
}

function activateAdminMode() {
  adminMode = true;
  if (!started) startTimer();
  
  while (currentIndex < wordList.length) {
    const target = wordList[currentIndex];
    const span = wordsEl.children[currentIndex];
    
    span.classList.remove("current");
    span.classList.add("correct");
    correctCount++;
    charsTyped += target.length;
    currentIndex++;
  }
  
  updateStats();
  finish();
}