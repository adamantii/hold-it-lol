'use strict';

const shakeDuration = 400;
const extraDuration = shakeDuration + 100;

function makeCourtURL() {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
   }
   return result;
}

function main() {
  for (let bubble of document.querySelectorAll('.bubble-btn')) {
    let timeout;
    bubble.addEventListener('click', function() {
      bubble.classList.remove('bubble-shake');
      bubble.offsetHeight;
      bubble.classList.add('bubble-shake');
      clearTimeout(timeout);
      timeout = setTimeout(() => bubble.classList.remove('bubble-shake'), shakeDuration);
    })
  }

  const btnOptions = document.getElementById('options');
  btnOptions.addEventListener('click', function() {
    setTimeout(function() {
      chrome.runtime.openOptionsPage();
      window.close();
    }, shakeDuration);
  });

  const btnCourt = document.getElementById('new-court');

  btnCourt.addEventListener('click', function() {
    setTimeout(function() {
      chrome.tabs.create({url: 'https://objection.lol/courtroom'});
      window.close();
    }, shakeDuration);
  });
}

main();
