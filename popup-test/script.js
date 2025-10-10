//? commented out because editor no likey same var names across script

// IIFE to avoid global scope pollution and prevent "Cannot redeclare" errors
(function() {
  'use strict';

  // Cache DOM elements at the top - throw errors if missing
  const openBtn = document.getElementById('openPopup');
  if (!openBtn) throw new Error('Element with id "openPopup" not found');
  
  const closeBtn = document.getElementById('closePopup');
  if (!closeBtn) throw new Error('Element with id "closePopup" not found');
  
  const textInput = /** @type {HTMLInputElement} */ (document.getElementById('textInput'));
  if (!textInput) throw new Error('Element with id "textInput" not found');
  
  const updateBtn = document.getElementById('updateText');
  if (!updateBtn) throw new Error('Element with id "updateText" not found');
  
  const colorBtn = document.getElementById('changeColor');
  if (!colorBtn) throw new Error('Element with id "changeColor" not found');
  
  const addBtn = document.getElementById('addElement');
  if (!addBtn) throw new Error('Element with id "addElement" not found');

  /**
   * @type {Window | null}
   */
  let popupWindow = null;

  /**
   * Opens a borderless popup window
   * @returns {void}
   */
  function openPopup() {
    const features = 'width=600,height=400,left=100,top=100,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes';
    
    // Open the popup with the external HTML file
    popupWindow = window.open('popup.html', 'PopupWindow', features);
    
    if (popupWindow) {
      openBtn.disabled = true;
      closeBtn.disabled = false;
      
      // Check if popup is closed
      const checkClosed = setInterval(() => {
        if (popupWindow && popupWindow.closed) {
          clearInterval(checkClosed);
          handlePopupClosed();
        }
      }, 500);
    }
  }

  /**
   * Closes the popup window
   * @returns {void}
   */
  function closePopup() {
    if (popupWindow && !popupWindow.closed) {
      popupWindow.close();
    }
    handlePopupClosed();
  }

  /**
   * Handles popup closed state
   * @returns {void}
   */
  function handlePopupClosed() {
    popupWindow = null;
    openBtn.disabled = false;
    closeBtn.disabled = true;
  }

  /**
   * Updates text content in the popup
   * @returns {void}
   */
  function updatePopupText() {
    if (!popupWindow || popupWindow.closed) {
      alert('Popup is not open!');
      return;
    }

    const text = textInput.value;
    const contentDiv = popupWindow.document.getElementById('content');
    
    if (!contentDiv) {
      throw new Error('Element with id "content" not found in popup window');
    }
    
    contentDiv.textContent = text || 'No text entered';
  }

  /**
   * Changes background color of popup
   * @returns {void}
   */
  function changePopupColor() {
    if (!popupWindow || popupWindow.closed) {
      alert('Popup is not open!');
      return;
    }

    const colors = ['#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    popupWindow.document.body.style.backgroundColor = randomColor;
  }

  /**
   * Adds a new element to the popup
   * @returns {void}
   */
  function addElementToPopup() {
    if (!popupWindow || popupWindow.closed) {
      alert('Popup is not open!');
      return;
    }

    const container = popupWindow.document.getElementById('dynamicContainer');
    
    if (!container) {
      throw new Error('Element with id "dynamicContainer" not found in popup window');
    }
    
    const newElement = popupWindow.document.createElement('p');
    newElement.textContent = `Element added at ${new Date().toLocaleTimeString()}`;
    container.appendChild(newElement);
  }

  // Event listeners
  openBtn.addEventListener('click', openPopup);
  closeBtn.addEventListener('click', closePopup);
  updateBtn.addEventListener('click', updatePopupText);
  colorBtn.addEventListener('click', changePopupColor);
  addBtn.addEventListener('click', addElementToPopup);
})();