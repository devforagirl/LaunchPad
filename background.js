// Background script for handling notifications and alarms

chrome.runtime.onInstalled.addListener(() => {
    console.log('LaunchPad extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scheduleAlarm') {
        scheduleAlarm(request.launchDate, request.launchName, request.alarmTime);
        sendResponse({ success: true });
    } else if (request.action === 'cancelAlarm') {
        cancelAlarm(request.launchDate);
        sendResponse({ success: true });
    } else if (request.action === 'showNotification') {
        showCustomNotification(request.title, request.message);
        sendResponse({ success: true });
    }
    return true;
});

function scheduleAlarm(launchDate, launchName, alarmTime) {
    const alarmId = `launch_${launchDate}`;
    const when = new Date(alarmTime).getTime();

    chrome.alarms.create(alarmId, {
        when: when
    });

    console.log(`Alarm scheduled for ${launchName} at ${new Date(when).toLocaleString()}`);
}

function cancelAlarm(launchDate) {
    const alarmId = `launch_${launchDate}`;
    chrome.alarms.clear(alarmId);
    console.log(`Alarm cancelled for ${launchDate}`);
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith('launch_')) {
        chrome.storage.local.get(['launchAlarms'], (result) => {
            const alarms = result.launchAlarms || {};
            const alarmData = Object.values(alarms).find(a => `launch_${a.launchDate}` === alarm.name);

            if (alarmData) {
                showLaunchNotification(alarmData);

                delete alarms[alarmData.launchDate];
                chrome.storage.local.set({ launchAlarms: alarms });
            }
        });
    }
});

function showLaunchNotification(alarmData) {
    const notificationOptions = {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Launch Alert',
        message: `${alarmData.launchName} will launch in 1 hour!`,
        priority: 2,
        requireInteraction: true
    };

    chrome.notifications.create(`notification_${Date.now()}`, notificationOptions);
}

function showCustomNotification(title, message) {
    const notificationOptions = {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: title,
        message: message,
        priority: 1
    };

    chrome.notifications.create(`status_${Date.now()}`, notificationOptions);
}

chrome.runtime.onStartup.addListener(() => {
    cleanupOldAlarms();
});

function cleanupOldAlarms() {
    const now = new Date().toISOString();

    chrome.storage.local.get(['launchAlarms'], (result) => {
        const alarms = result.launchAlarms || {};
        let hasChanges = false;

        for (const [key, alarm] of Object.entries(alarms)) {
            if (alarm.launchDate < now) {
                delete alarms[key];
                hasChanges = true;
            }
        }

        if (hasChanges) {
            chrome.storage.local.set({ launchAlarms: alarms });
        }
    });
}