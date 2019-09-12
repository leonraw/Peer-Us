// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
(function () {

    let video = document.getElementsByTagName('video')[0];

    if (!video || document.body.dataset.peerus) {
        return
    }

    document.body.dataset.peerus = 'peerus';

    let peerus = {};

    // Receive actions.
    chrome.runtime.onMessage.addListener(function (message, sender, sendRespond) {
        let action = message.action;

        switch (action) {
            case 'init':
                initPeer(message.refresh);
                break;
            case 'connect':
                connect(message.connId);
                break;
            case 'disconnect':
                disconnect();
                break;
        }
    });

    // Send message to background.
    function sendToBG(message) {
        chrome.runtime.sendMessage(message);
    }

    // Init peer.
    function initPeer(refresh) {
        if (refresh) {
            delete peerus.peer;
            delete peerus.connection;
        }
        if (peerus.peer) {
            if (peerus.connection) {
                sendToBG({
                    peerId: peerus.peer.id,
                    connId: peerus.connection.peer,
                    disableInput: true
                });
            } else {
                sendToBG({
                    peerId: peerus.peer.id,
                    disableInput: false
                });
            }
        } else {
            let peerOptions = {
                config: {
                    iceServers: [{
                            url: 'stun:stun.turnservers.com:3478'
                        },
                        {
                            url: 'stun:stun01.sipphone.com'
                        },
                        {
                            url: 'stun:stun.ekiga.net'
                        },
                        {
                            url: 'stun:stun.fwdnet.net'
                        },
                        {
                            url: 'stun:stun.ideasip.com'
                        },
                        {
                            url: 'stun:stun.iptel.org'
                        },
                        {
                            url: 'stun:stun.rixtelecom.se'
                        },
                        {
                            url: 'stun:stun.schlund.de'
                        },
                        {
                            url: 'stun:stunserver.org'
                        },
                        {
                            url: 'stun:stun.softjoys.com'
                        },
                        {
                            url: 'stun:stun.voiparound.com'
                        },
                        {
                            url: 'stun:stun.voipbuster.com'
                        },
                        {
                            url: 'stun:stun.voipstunt.com'
                        },
                        {
                            url: 'stun:stun.voxgratia.org'
                        },
                        {
                            url: 'stun:stun.xten.com'
                        },
                        {
                            url: 'turn:numb.viagenie.ca',
                            credential: 'muazkh',
                            username: 'webrtc@live.com'
                        },
                        {
                            url: 'turn:192.158.29.39:3478?transport=udp',
                            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                            username: '28224511:1379330808'
                        },
                        {
                            url: 'turn:192.158.29.39:3478?transport=tcp',
                            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                            username: '28224511:1379330808'
                        }
                    ]
                }
            };

            // peerOptions.key = 'peerjs';
            // peerOptions.host = 'www.angang77.live';
            // peerOptions.port = 5000;
            // peerOptions.secure = true;
            // peerOptions.path = '/';


            let peer = new Peer(peerOptions);

            peerus.peer = peer;

            peer.on('open', function (id) {
                sendToBG({
                    peerId: id,
                    disableInput: false
                });
            });

            peer.on('connection', initConnections);
        }

    }

    // Init connections.
    function initConnections(conn) {

        peerus.connection = conn;
        changeVideoListener('init');

        sendToBG({
            connId: conn.peer,
            disableInput: true
        });

        conn.on('data', function (data) {
            switch (data.dataType) {
                case 'videoStatus':
                    changeStatus(data);
                    break;
                case 'heartBeatSYN':
                    conn.send({
                        dataType: 'heartBeatACK'
                    });
                    break;
                case 'heartBeatACK':
                    break;
            }
        });

        conn.on('close', function () {

            delete peerus.connection;
            changeVideoListener('remove');
            clearInterval(heartBeatTimer);

            sendToBG({
                disableInput: false
            });
        });

        let heartBeatTimer;

        function heartBeat() {
            heartBeatTimer = setInterval(() => {
                conn.send({
                    dataType: 'heartBeatSYN'
                });
            }, 1000);
        }

        heartBeat()
    }

    // Connect to another.
    function connect(remoteId) {
        let conn = peerus.peer.connect(remoteId);

        conn.on('open', function () {
            initConnections(conn)
        });
    }

    // disconnect
    function disconnect() {
        let conn = peerus.connection;
        if (conn) {
            conn.close();
        }
    }

    // Init video Listener.
    let receiveTime = 0;

    function changeVideoListener(action) {

        function sendVideoInfo() {
            let conn = peerus.connection;
            if (conn && new Date().getTime() - receiveTime > 1000) {

                let videoStatus = {
                    dataType: 'videoStatus',
                    timesTamp: new Date().getTime(),
                    currentTime: video.currentTime,
                    paused: video.paused,
                };

                let timer;
                let count = 5;
                timer = setInterval(() => {
                    count--;
                    conn.send(videoStatus);
                    if (count <= 0) {
                        clearInterval(timer)
                    }
                }, 200);
            }
        }

        if (action === 'init') {
            video.onplaying = video.onpause = video.onseeking = sendVideoInfo
        } else if (action === 'remove') {
            video.onplaying = video.onpause = video.onseeking = undefined;
        }
    }

    // Video controller.
    let timeArray = [];

    function changeStatus(data) {
        if (timeArray.includes(data.timesTamp)) {
            return
        }
        timeArray.push(data.timesTamp);


        receiveTime = new Date().getTime();
        video.currentTime = data.currentTime;

        if (data.paused) {
            video.pause()
        } else {
            video.play()
        }
    }

    //    console.log('\nPeer us loaded.');

})();