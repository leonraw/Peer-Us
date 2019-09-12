// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let matchVideoRules = {
    conditions: [
        new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {schemes: ['http', 'https']},
            css: ["video"]
        })
    ],
    actions: [
        new chrome.declarativeContent.ShowPageAction(),
    ]
};

chrome.runtime.onInstalled.addListener(function (details) {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([matchVideoRules]);
    });
});
