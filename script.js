const timerDisplay = document.getElementById('timerDisplay');
const sessionTypeEl = document.getElementById('sessionType');
const sessionCounterEl = document.getElementById('sessionCounter');
const messageText = document.getElementById('messageText');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const settingsForm = document.getElementById('settingsForm');
const workDurationInput = document.getElementById('workDuration');
const shortBreakDurationInput = document.getElementById('shortBreakDuration');
const longBreakDurationInput = document.getElementById('longBreakDuration');

const STORAGE_KEY = 'pomodoroTimerState';
const DEFAULTS = {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
};

const messages = {
    work: [
        "Stay focused and make it count.",
        "Deep work builds momentum.",
        "Small progress is still progress.",
        "You are closer than yesterday."
    ],
    shortBreak: [
        "Nice work! Take a quick breath.",
        "Short break, then back to brilliance.",
        "Refresh your mind before the next round.",
        "You earned this pause."
    ],
    longBreak: [
        "Great job! Enjoy a longer break.",
        "Recharge fully before the next cycle.",
        "Long break time — relax and reset.",
        "You deserve a longer rest."
    ]
};

let timerState = {
    mode: 'work',
    secondsLeft: DEFAULTS.workMinutes * 60,
    workCount: 0,
    running: false,
    durations: { ...DEFAULTS },
};
let intervalId = null;

function loadState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            timerState = JSON.parse(stored);
        } catch {
            timerState = { ...timerState };
        }
    }

    if (!timerState.durations) {
        timerState.durations = { ...DEFAULTS };
    }

    if (typeof timerState.secondsLeft !== 'number' || timerState.secondsLeft < 0) {
        timerState.secondsLeft = timerState.durations.workMinutes * 60;
    }

    workDurationInput.value = timerState.durations.workMinutes;
    shortBreakDurationInput.value = timerState.durations.shortBreakMinutes;
    longBreakDurationInput.value = timerState.durations.longBreakMinutes;
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState));
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateDisplay() {
    timerDisplay.textContent = formatTime(timerState.secondsLeft);
    sessionTypeEl.textContent = sessionTypeLabel(timerState.mode);
    sessionCounterEl.textContent = `${timerState.workCount} / 4`;
}

function sessionTypeLabel(mode) {
    if (mode === 'work') return 'Work';
    if (mode === 'shortBreak') return 'Short Break';
    return 'Long Break';
}

function nextSession() {
    if (timerState.mode === 'work') {
        timerState.workCount += 1;
        if (timerState.workCount % 4 === 0) {
            timerState.mode = 'longBreak';
            timerState.secondsLeft = timerState.durations.longBreakMinutes * 60;
        } else {
            timerState.mode = 'shortBreak';
            timerState.secondsLeft = timerState.durations.shortBreakMinutes * 60;
        }
    } else {
        timerState.mode = 'work';
        timerState.secondsLeft = timerState.durations.workMinutes * 60;
    }

    showMotivation();
    updateDisplay();
    saveState();
    notifySessionChange();
}

function showMotivation() {
    const mode = timerState.mode;
    const list = mode === 'work' ? messages.work : mode === 'shortBreak' ? messages.shortBreak : messages.longBreak;
    const message = list[Math.floor(Math.random() * list.length)];
    messageText.textContent = message;
}

function notifySessionChange() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const title = sessionTypeLabel(timerState.mode);
    const body = timerState.mode === 'work'
        ? 'Time to focus!'
        : 'Take a break.';

    new Notification(title, {
        body,
        silent: true,
    });
}

function tick() {
    if (timerState.secondsLeft <= 0) {
        clearInterval(intervalId);
        intervalId = null;
        timerState.running = false;
        nextSession();
        startTimer();
        return;
    }

    timerState.secondsLeft -= 1;
    updateDisplay();
    saveState();
}

function startTimer() {
    if (timerState.running) return;
    timerState.running = true;
    intervalId = setInterval(tick, 1000);
    saveState();
}

function pauseTimer() {
    if (!timerState.running) return;
    timerState.running = false;
    clearInterval(intervalId);
    intervalId = null;
    saveState();
}

function resetTimer() {
    pauseTimer();
    timerState.mode = 'work';
    timerState.workCount = 0;
    timerState.secondsLeft = timerState.durations.workMinutes * 60;
    showMotivation();
    updateDisplay();
    saveState();
}

function handleSettingsSubmit(event) {
    event.preventDefault();
    const workMinutes = Math.max(1, Number(workDurationInput.value));
    const shortBreakMinutes = Math.max(1, Number(shortBreakDurationInput.value));
    const longBreakMinutes = Math.max(1, Number(longBreakDurationInput.value));

    timerState.durations.workMinutes = workMinutes;
    timerState.durations.shortBreakMinutes = shortBreakMinutes;
    timerState.durations.longBreakMinutes = longBreakMinutes;
    timerState.secondsLeft = timerState.mode === 'work'
        ? workMinutes * 60
        : timerState.mode === 'shortBreak'
            ? shortBreakMinutes * 60
            : longBreakMinutes * 60;

    updateDisplay();
    showMotivation();
    saveState();
}

function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
settingsForm.addEventListener('submit', handleSettingsSubmit);

window.addEventListener('beforeunload', () => {
    if (timerState.running) {
        saveState();
    }
});

loadState();
showMotivation();
updateDisplay();
requestNotificationPermission();
