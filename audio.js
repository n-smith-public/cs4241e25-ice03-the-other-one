let audioContext;
let gainNode;

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    const volumeSlider = document.getElementById('volume');
    const initialVolume = volumeSlider.value / 100;
    gainNode.gain.setValueAtTime(initialVolume, audioContext.currentTime);
}

function updateVolume() {
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volume-value');
    const volume = volumeSlider.value / 100;

    volumeValue.textContent = `${volumeSlider.value}%`;

    if (gainNode) {
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    }
}

function playNote(frequency) {
    if (!audioContext) {
        initAudio();
     }

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const pianoSound = createPiano(frequency);
    const noteGain = audioContext.createGain();

    pianoSound.output.connect(noteGain);
    noteGain.connect(gainNode);

    const normalizedVal = calculateNormalizedVolume(frequency);

    noteGain.gain.setValueAtTime(0, audioContext.currentTime);
    noteGain.gain.linearRampToValueAtTime(normalizedVal, audioContext.currentTime + 0.005);
    noteGain.gain.linearRampToValueAtTime(normalizedVal * 0.7, audioContext.currentTime + 0.1);
    noteGain.gain.linearRampToValueAtTime(0.001, audioContext.currentTime + 2);

    pianoSound.oscillators.forEach(oscillator => {
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 2);
    });
}

function calculateFrequency(keyNumber) {
    const A4_KEY = 57;
    const A4_FREQ = 440;
     return A4_FREQ * Math.pow(2, (keyNumber - A4_KEY) / 12);
}

function calculateNormalizedVolume(frequency) {
    const baseVol = 0.4;

    if (frequency < 100) {
        return baseVol * 2.5;
    } else if (frequency < 200) {
        return baseVol * 1.8;
    } else if (frequency < 400) {
        return baseVol * 1.3;
    } else if (frequency < 800) {
        return baseVol;
    } else if (frequency < 1600) {
        return baseVol * 0.8;
    } else if (frequency < 3200) {
        return baseVol * 0.6;
    } else {
        return baseVol * 0.4;
    }
}

function createPiano(frequency) {
    const fundamental = audioContext.createOscillator();
    const harmonic2 = audioContext.createOscillator();
    const harmonic3 = audioContext.createOscillator();

    const fundamentalGain = audioContext.createGain();
    const harmonic2Gain = audioContext.createGain();
    const harmonic3Gain = audioContext.createGain();

    fundamental.frequency.setValueAtTime(frequency, audioContext.currentTime);
    harmonic2.frequency.setValueAtTime(frequency * 2, audioContext.currentTime);
    harmonic3.frequency.setValueAtTime(frequency * 3, audioContext.currentTime);

    fundamental.type = 'triangle';
    harmonic2.type = 'sine';
    harmonic3.type = 'sine';

    fundamentalGain.gain.setValueAtTime(1, audioContext.currentTime);
    harmonic2Gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    harmonic3Gain.gain.setValueAtTime(0.1, audioContext.currentTime);

    fundamental.connect(fundamentalGain);
    harmonic2.connect(harmonic2Gain);
    harmonic3.connect(harmonic3Gain);

    const mixer = audioContext.createGain();
    fundamentalGain.connect(mixer);
    harmonic2Gain.connect(mixer);
    harmonic3Gain.connect(mixer);

    return { oscillators: [fundamental, harmonic2, harmonic3], output: mixer };
}

document.addEventListener('DOMContentLoaded', () => {
    genPianoKeys();

    const volumeSlider = document.getElementById('volume');
    volumeSlider.addEventListener('input', updateVolume);

    let audioInitalized = false;
    document.querySelector('.keyboard').addEventListener('click', () => {
        if (!audioInitalized) {
            initAudio();
            audioInitalized = true;
        }
    });
});