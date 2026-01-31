document.addEventListener('DOMContentLoaded', async () => {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const launchListEl = document.getElementById('launch-list');
    const todayCountEl = document.getElementById('today-count');

    try {
        const response = await fetch('https://fdo.rocketlaunch.live/json/launches/next/5');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const launches = data.result || [];

        if (launches.length === 0) {
            loadingEl.textContent = 'No upcoming launches found';
            todayCountEl.textContent = '0';
            return;
        }

        // Calculate today's launch count (within 24 hours)
        const todayCount = calculateTodayLaunches(launches);
        todayCountEl.textContent = todayCount > 5 ? '5+' : todayCount;

        loadingEl.classList.add('hidden');

        launches.forEach(launch => {
            const launchItem = createLaunchItem(launch);
            launchListEl.appendChild(launchItem);
        });

        // Start countdown updates
        startCountdownUpdates();

    } catch (error) {
        console.error('Error fetching launches:', error);
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        todayCountEl.textContent = '?';
    }
});

function calculateTodayLaunches(launches) {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return launches.filter(launch => {
        const launchDate = new Date(launch.sort_date * 1000);
        return launchDate >= now && launchDate <= twentyFourHoursLater;
    }).length;
}

function createLaunchItem(launch) {
    const li = document.createElement('li');
    li.className = 'launch-item';

    // Parse launch date
    const launchDate = new Date(launch.sort_date * 1000);
    const dateString = launchDate.toISOString();
    li.dataset.launchDate = dateString;

    // Header section (always visible)
    const header = document.createElement('div');
    header.className = 'launch-header';

    const name = document.createElement('div');
    name.className = 'launch-name';
    name.textContent = launch.name || 'Unnamed Launch';

    const countdown = document.createElement('div');
    countdown.className = 'countdown';
    countdown.dataset.date = dateString;
    countdown.innerHTML = formatCountdown(dateString);

    const meta = document.createElement('div');
    meta.className = 'launch-meta';

    const date = document.createElement('span');
    date.className = 'launch-date';
    date.textContent = formatDate(dateString);

    const site = document.createElement('span');
    site.className = 'launch-site';
    site.textContent = launch.pad?.location?.name || 'Site TBD';

    meta.appendChild(date);
    meta.appendChild(site);

    header.appendChild(name);
    header.appendChild(countdown);
    header.appendChild(meta);

    // Expandable details section
    const details = document.createElement('div');
    details.className = 'launch-details';

    const detailsContent = createDetailsContent(launch, dateString);
    details.appendChild(detailsContent);

    li.appendChild(header);
    li.appendChild(details);

    // Click to expand/collapse
    li.addEventListener('click', (e) => {
        // Don't toggle if clicking on buttons
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
            return;
        }

        const isExpanded = li.classList.contains('expanded');

        // Collapse all other items
        document.querySelectorAll('.launch-item.expanded').forEach(item => {
            if (item !== li) {
                item.classList.remove('expanded');
            }
        });

        // Toggle current item
        li.classList.toggle('expanded');
    });

    return li;
}

function createDetailsContent(launch, dateString) {
    const container = document.createElement('div');
    container.className = 'details-content';

    // Provider information
    if (launch.provider) {
        container.appendChild(createDetailRow('Provider', launch.provider.name));
        if (launch.provider.type) {
            container.appendChild(createDetailRow('Provider Type', launch.provider.type));
        }
    }

    // Vehicle information
    if (launch.vehicle) {
        container.appendChild(createDetailRow('Vehicle', launch.vehicle.name));
        if (launch.vehicle.family) {
            container.appendChild(createDetailRow('Vehicle Family', launch.vehicle.family));
        }
        if (launch.vehicle.full_name) {
            container.appendChild(createDetailRow('Full Name', launch.vehicle.full_name));
        }
    }

    // Launch pad details
    if (launch.pad) {
        if (launch.pad.name) {
            container.appendChild(createDetailRow('Launch Pad', launch.pad.name));
        }
        if (launch.pad.location?.name) {
            container.appendChild(createDetailRow('Location', launch.pad.location.name));
        }
        if (launch.pad.location?.country) {
            container.appendChild(createDetailRow('Country', launch.pad.location.country));
        }
    }

    // Mission details
    if (launch.missions && launch.missions.length > 0) {
        launch.missions.forEach((mission, index) => {
            if (mission.name) {
                container.appendChild(createDetailRow(`Mission ${index + 1}`, mission.name));
            }
            if (mission.description) {
                const detailsRow = document.createElement('div');
                detailsRow.className = 'detail-row full-width';

                const label = document.createElement('span');
                label.className = 'detail-label';
                label.textContent = 'Description';

                const value = document.createElement('span');
                value.className = 'detail-value description';
                value.textContent = mission.description;

                detailsRow.appendChild(label);
                detailsRow.appendChild(value);
                container.appendChild(detailsRow);
            }
        });
    }

    // Launch status
    if (launch.status) {
        container.appendChild(createDetailRow('Status', launch.status.name));
    }

    // Action buttons container
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';

    // Alarm button
    const alarmButton = document.createElement('button');
    alarmButton.className = 'action-button alarm-button';
    alarmButton.textContent = 'ALARM';
    alarmButton.dataset.launchDate = dateString;
    alarmButton.dataset.launchName = launch.name || 'Rocket Launch';

    // Check if alarm is already set
    chrome.storage.local.get(['launchAlarms'], (result) => {
        const alarms = result.launchAlarms || {};
        if (alarms[dateString]) {
            alarmButton.classList.add('active');
        }
    });

    alarmButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAlarm(alarmButton, dateString, launch.name || 'Rocket Launch');
    });

    actionButtons.appendChild(alarmButton);

    // Details link button
    if (launch.slug) {
        const detailsLink = document.createElement('a');
        detailsLink.className = 'action-button details-button';
        detailsLink.textContent = 'DETAILS';
        detailsLink.href = `https://rocketlaunch.live/launch/${launch.slug}`;
        detailsLink.target = '_blank';
        detailsLink.rel = 'noopener noreferrer';
        detailsLink.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        actionButtons.appendChild(detailsLink);
    }

    container.appendChild(actionButtons);

    return container;
}

function toggleAlarm(button, dateString, launchName) {
    const isActive = button.classList.contains('active');

    if (!isActive) {
        // Set alarm
        const launchDate = new Date(dateString);
        const alarmTime = new Date(launchDate.getTime() - 60 * 60 * 1000); // 1 hour before

        // Store alarm in storage
        chrome.storage.local.get(['launchAlarms'], (result) => {
            const alarms = result.launchAlarms || {};
            alarms[dateString] = {
                launchName: launchName,
                launchDate: dateString,
                alarmTime: alarmTime.toISOString()
            };
            chrome.storage.local.set({ launchAlarms: alarms });
        });

        // Send message to background script to schedule notification
        chrome.runtime.sendMessage({
            action: 'scheduleAlarm',
            launchDate: dateString,
            launchName: launchName,
            alarmTime: alarmTime.toISOString()
        });

        button.classList.add('active');

        // Show notification (2 seconds auto-dismiss)
        chrome.notifications.create(`alarm_set_${Date.now()}`, {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Alarm Set',
            message: `You will be notified 1 hour before ${launchName}`,
            priority: 1
        }, (notificationId) => {
            // Auto-dismiss after 2 seconds
            setTimeout(() => {
                chrome.notifications.clear(notificationId);
            }, 2000);
        });
    } else {
        // Cancel alarm - no notification
        chrome.storage.local.get(['launchAlarms'], (result) => {
            const alarms = result.launchAlarms || {};
            delete alarms[dateString];
            chrome.storage.local.set({ launchAlarms: alarms });
        });

        chrome.runtime.sendMessage({
            action: 'cancelAlarm',
            launchDate: dateString
        });

        button.classList.remove('active');
    }
}

function createDetailRow(label, value) {
    const row = document.createElement('div');
    row.className = 'detail-row';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'detail-label';
    labelSpan.textContent = label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'detail-value';
    valueSpan.textContent = value;

    row.appendChild(labelSpan);
    row.appendChild(valueSpan);

    return row;
}

function formatCountdown(dateString) {
    const targetDate = new Date(dateString);
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
        return '<span class="countdown-value liftoff">LIFTOFF</span>';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let html = '<span class="countdown-value">';

    // Build time parts array
    const parts = [];

    if (days > 0) {
        parts.push(`${days}DAY`);
    }
    if (hours > 0 || days > 0) {
        parts.push(String(hours).padStart(2, '0'));
    }
    if (minutes > 0 || hours > 0 || days > 0) {
        parts.push(String(minutes).padStart(2, '0'));
    }
    // Always show seconds if less than a day, or if it's the only value
    if (days === 0) {
        parts.push(String(seconds).padStart(2, '0'));
    }

    // Join parts with colons
    html += parts.join(':');

    html += '</span>';

    return html;
}

function startCountdownUpdates() {
    // Update countdowns every second
    setInterval(() => {
        document.querySelectorAll('.countdown').forEach(countdownEl => {
            const date = countdownEl.dataset.date;
            if (date) {
                countdownEl.innerHTML = formatCountdown(date);
            }
        });
    }, 1000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    };
    return date.toLocaleDateString('en-US', options);
}
