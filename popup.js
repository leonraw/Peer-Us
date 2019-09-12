// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
(function () {
    function getEById(id) {
        return document.getElementById(id)
    }

    function show(element) {
        element.style.display = 'inline-block';
    }

    function hide(element) {
        element.style.display = 'none';
    }

    let peerId = getEById("peer-id");
    let loading = peerId.parentElement;
    let connId = getEById("conn-id");
    let refreshBtn = getEById("refresh");
    let tips = getEById('tips');
    let peerUsBtn = getEById("peer-us");
    let connectingBtn = getEById("connecting");
    let disconnectBtn = getEById("disconnect");

    // Get active tab.
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {

        // Send message to current tab.
        function sendToCurrentTab(message) {
            chrome.tabs.sendMessage(tabs[0].id, message);
        }

        // Init peer.
        let peerIdTimer;

        function initPeer(e) {
            loading.className = 'connecting';
            peerId.innerText = 'Connecting';
            peerIdTimer = waitingText(peerId);
            refreshBtn.style.display = 'none';

            let refresh = false;
            if (e && e.target === refreshBtn) {
                refresh = true
            }
            sendToCurrentTab({action: 'init', refresh: refresh});
        }

        // Connect to another.
        function connect() {
            sendToCurrentTab({
                action: 'connect',
                connId: connId.value
            })
        }

        // Disconnect.
        function disconnect() {
            sendToCurrentTab({
                action: 'disconnect'
            })
        }

        // Listen ~
        chrome.runtime.onMessage.addListener((message, sender, sendRespond) => {
            if (message.peerId) {
                peerId.innerText = message.peerId;
                clearInterval(peerIdTimer);
                loading.className = 'connected';
//             refreshBtn.style.display = 'inline-block';
            }

            if (message.connId) {
                connId.value = message.connId;
                hide(connectingBtn);
                clearInterval(btnTimer)
            }

            if (message.disableInput) {
                hide(peerUsBtn);
                show(disconnectBtn);
            } else {
                hide(disconnectBtn);
                show(peerUsBtn);
            }

            connId.disabled = message.disableInput;
        });

        function waitingText(element, i = 3) {
            let text = element.innerText;
            let count = 0;
            return setInterval(() => {
                if (count < i) {
                    element.innerText += '.';
                    count++;
                } else {
                    element.innerText = text;
                    count = 0;
                }
            }, 500)
        }

        let btnTimer;
        peerUsBtn.onclick = () => {
            hide(peerUsBtn);
            show(connectingBtn);
            btnTimer = waitingText(connectingBtn);
            connect();
        };
        disconnectBtn.onclick = disconnect;
        refreshBtn.onclick = initPeer;

        // Double click to copy.
        function createTextArea(text) {
            let textArea = document.createElement('textArea');
            textArea.value = text;
            hide(textArea);
            document.body.appendChild(textArea);
            return textArea
        }

        function copyToClipboard() {
            try {
                if (document.execCommand("copy")) {
                    tips.className = 'success';
                    tips.innerText = 'Copied!';
                } else {
                    tips.className = 'error';
                    tips.innerText = 'Failed. Please copy manually...';
                }
            } catch (err) {
                tips.className = 'error';
                tips.innerText = 'Failed. Please copy manually...';
            }
        }

        peerId.ondblclick = () => {
            let textArea = createTextArea(peerId.innerText);
            textArea.select();
            copyToClipboard();
            document.body.removeChild(textArea);

            function getRandomColor() {
                let result = '#';
                let colorRange = '0123456789abcdef';

                function getRandomBits(count, randomBits = '') {
                    randomBits += colorRange[Math.floor(Math.random() * colorRange.length)];

                    if (randomBits.length < count) {
                        randomBits = getRandomBits(count, randomBits);
                    }

                    return randomBits
                }

                return result + getRandomBits(6)
            }

            tips.onclick = () => {
                tips.className = '';
                tips.innerText = 'Tips: Double click to funny.';
                tips.userSelect = 'none';
                tips.ondblclick = () => {
                    tips.style.color = getRandomColor()
                }
            };
        };

        initPeer();
    });
})();
