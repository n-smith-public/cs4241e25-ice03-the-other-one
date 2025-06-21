let isDragging = false;
let playedKeys = new Set();
let activeNotes = new Set();

function getKeyColor(keyNumber) {
    const hue = (keyNumber / 96) * 360;
    return `hsl(${hue}, 70%, 60%)`;
}

const chords = {
    // Major chords
    'C,E,G': 'C Major',
    'D,F#,A': 'D Major',
    'E,G#,B': 'E Major',
    'F,A,C': 'F Major',
    'G,B,D': 'G Major',
    'A,C#,E': 'A Major',
    'B,D#,F#': 'B Major',
    
    // Minor chords
    'C,Eb,G': 'C Minor',
    'D,F,A': 'D Minor',
    'E,G,B': 'E Minor',
    'F,Ab,C': 'F Minor',
    'G,Bb,D': 'G Minor',
    'A,C,E': 'A Minor',
    'B,D,F#': 'B Minor',
    
    // Diminished chords
    'C,Eb,Gb': 'C Diminished',
    'D,F,Ab': 'D Diminished',
    'E,G,Bb': 'E Diminished',
    'F,Ab,B': 'F Diminished',
    'G,Bb,Db': 'G Diminished',
    'A,C,Eb': 'A Diminished',
    'B,D,F': 'B Diminished',
    
    // Augmented chords
    'C,E,G#': 'C Augmented',
    'D,F#,A#': 'D Augmented',
    'E,G#,C': 'E Augmented',
    'F,A,C#': 'F Augmented',
    'G,B,D#': 'G Augmented',
    'A,C#,F': 'A Augmented',
    'B,D#,G': 'B Augmented',
    
    // 7th chords
    'C,E,G,Bb': 'C7',
    'D,F#,A,C': 'D7',
    'E,G#,B,D': 'E7',
    'F,A,C,Eb': 'F7',
    'G,B,D,F': 'G7',
    'A,C#,E,G': 'A7',
    'B,D#,F#,A': 'B7',
    
    // Major 7th chords
    'C,E,G,B': 'CMaj7',
    'D,F#,A,C#': 'DMaj7',
    'E,G#,B,D#': 'EMaj7',
    'F,A,C,E': 'FMaj7',
    'G,B,D,F#': 'GMaj7',
    'A,C#,E,G#': 'AMaj7',
    'B,D#,F#,A#': 'BMaj7'
}

function normalizeNote(note) {
    const sharpToFlat = {
        'C#': 'Db',
        'D#': 'Eb',
        'F#': 'Gb',
        'G#': 'Ab',
        'A#': 'Bb'
    };

    const noteOnly = note.replace(/[#b]/g, '');
    return sharpToFlat[note] || noteOnly;
}

function identifyChord(notes) {
    if (notes.length < 3) return null;

    const uniqueNotes = Array.from(new Set(notes.map(normalizeNote))).sort();
    
    const chordKey = uniqueNotes.join(',');

    if (chords[chordKey]) {
        return chords[chordKey];
    }

    for (let i = 0; i < uniqueNotes.length; i++) {
        const rotated = [...uniqueNotes.slice(i), ...uniqueNotes.slice(0, i)];
        const rotatedKey = rotated.join(',');
        if (chords[rotatedKey]) {
            return chords[rotatedKey] + ' (inverted)';
        }
    }

    return `Unknown chord: ${uniqueNotes.join(', ')}`;
}

function updateChordDisplay() {
    const chordNameElement = document.getElementById('chord-name');
    const activeNotesElement = document.getElementById('active-notes');

    const notesArray = Array.from(activeNotes);
    activeNotesElement.textContent = notesArray.length > 0 ? notesArray.join(', ') : '-';

    if (notesArray.length >= 3) {
        const chordName = identifyChord(notesArray);
        chordNameElement.textContent = chordName || 'Unknown Chord';
    } else if (notesArray.length === 2) {
        chordNameElement.textContent = 'Interval: ' + notesArray.join(', ');
    } else if (notesArray.length === 1) {
        chordNameElement.textContent = 'Single Note: ' + notesArray[0];
    }
    else {
        chordNameElement.textContent = '-';
    }
}

function genPianoKeys() {
     const keyboard = document.querySelector('.keyboard');
    const noteNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const blackKeys = [1, 3, 6, 8, 10];

    let keyCount = 0;

    for(let octave = 0; octave < 8; octave++) {
        for (let noteIndex = 0; noteIndex < noteNames.length; noteIndex++) {
            if (keyCount >= 96) break;

            const noteName = noteNames[noteIndex];
            const isBlack = blackKeys.includes(noteIndex);

            const button = document.createElement('button');
            button.className = isBlack ? 'black-key' : 'white-key';
            button.textContent = `${noteName}${octave}`;
            button.setAttribute('data-note', `${noteName}${octave}`);

            const frequency = calculateFrequency(keyCount);
            button.setAttribute('data-frequency', frequency);

            const keyColor = getKeyColor(keyCount);
            button.style.setProperty('--active-color', keyColor);

            let mouseDownT = 0;
            let wasDragging = false;

            button.addEventListener('mousedown', (event) => {
                event.preventDefault();

                mouseDownT = Date.now();
                wasDragging = false;
                isDragging = true;
                playedKeys.clear();

                activeNotes.add(button.getAttribute('data-note'));
                updateChordDisplay();

                playKeyIfNotPlayed(button, frequency);

                button.classList.add('drag-active');
            });

            button.addEventListener('mouseenter', () => {
                if (isDragging) {
                    wasDragging = true;
                    activeNotes.add(button.getAttribute('data-note'));
                    updateChordDisplay();
                    playKeyIfNotPlayed(button, frequency);
                }
            });

            button.addEventListener('click', (e) => {
                e.preventDefault();

                    const clickTime = Date.now();
                if (clickTime - mouseDownT < 200 && !isDragging) {
                    playNote(frequency);

                    activeNotes.add(button.getAttribute('data-note'));
                    updateChordDisplay();

                    button.classList.add('drag-active');
                    setTimeout(() => {
                        button.classList.remove('drag-active');
                        activeNotes.delete(button.getAttribute('data-note'));
                        updateChordDisplay();
                    }, 150);
                }
             });

            keyboard.appendChild(button);
            keyCount++;
        }
        if (keyCount >= 96) break;
    }
}

document.addEventListener('mouseup', () => {
    setTimeout(() => {
        isDragging = false;
        playedKeys.clear();

        activeNotes.clear();
        updateChordDisplay();

        document.querySelectorAll('.white-key, .black-key').forEach(button => {
            button.classList.remove('drag-active');
        });
    }, 10);
});

function playKeyIfNotPlayed(button, frequency) {
    const key = button.getAttribute('data-note');

    if (!playedKeys.has(key)) {
        playedKeys.add(key);
        playNote(frequency);

        button.classList.add('drag-active');
    }
}