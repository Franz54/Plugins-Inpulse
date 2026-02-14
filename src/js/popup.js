
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('md-file');
    const collabInput = document.getElementById('collab-name');
    const searchBtn = document.getElementById('search-btn');
    const fillBtn = document.getElementById('fill-btn');

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                try {
                    const data = parseMarkdown(text);
                    if (data.mission && data.mission.collabName) {
                        collabInput.value = data.mission.collabName;
                    }
                } catch (e) {
                    console.error("Parsing failed on change:", e);
                }
            };
            reader.readAsText(file);
        }
    });

    searchBtn.addEventListener('click', async () => {
        const collabName = collabInput.value.trim();
        if (!collabName) {
            alert('Veuillez entrer le nom du collaborateur.');
            return;
        }
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        sendMessageToContentScript(tab.id, { action: 'NAVIGATE_TO_COLLAB', collabName });
    });

    fillBtn.addEventListener('click', async () => {
        alert("1. Bouton Remplir cliqué !");

        // 1. Check URL
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        alert("2. URL détectée: " + tab.url);

        if (!tab.url.includes("inpulse.open-groupe.com")) {
            alert("⚠️ Attention : URL incorrecte !");
        }

        const file = fileInput.files[0];
        if (!file) {
            alert('STOP: Aucun fichier sélectionné.');
            return;
        }
        alert("3. Fichier trouvé: " + file.name);

        const reader = new FileReader();
        reader.onload = async (e) => {
            alert("4. Lecture du fichier terminée.");
            try {
                const text = e.target.result;
                const data = parseMarkdown(text);
                alert("5. Analyse Markdown terminée (Parsing OK).");

                alert("6. Envoi au Content Script...");
                await sendMessageToContentScript(tab.id, { action: 'FILL_FORM', data });
                alert("7. Message envoyé (Fin du popup).");
            } catch (err) {
                alert("ERREUR CRITIQUE DANS POPUP : " + err.message);
            }
        };
        reader.readAsText(file);
    });
});

function parseMarkdown(text) {
    const lines = text.split('\n');
    const data = {
        mission: {},
        satisfaction: {},
        performance: {
            strengthsAndAxes: []
        },
        objectives: {
            past: [],
            future: []
        },
        comments: {}
    };

    let currentSection = '';
    let currentSubsection = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect Sections
        if (line.startsWith('# ')) {
            currentSection = line.replace('# ', '').toLowerCase();
            continue;
        }

        // Detect Subsections
        if (line.startsWith('## ')) {
            currentSubsection = line.replace('## ', '').toLowerCase();
            continue;
        }

        // --- Section 0: Formulaire Mission ---
        if (currentSection.includes('0. formulaire mission')) {
            if (line.startsWith('* **')) {
                const match = line.match(/\*\*\s*(.*?)\s*:\s*\*\*\s*(.*)/);
                if (match) {
                    const key = match[1].toLowerCase();
                    const value = match[2];
                    data.mission[key] = value;
                }
            }
            if (currentSubsection.includes('contexte mission')) {
                if (line && !line.startsWith('#') && !line.startsWith('*')) {
                    data.mission.context = (data.mission.context || '') + line + ' ';
                    // Heuristic: capture the first capitalized word in the context as the collabName
                    if (!data.mission.collabName) {
                        const wordMatch = line.match(/[A-Z][a-z]+/);
                        if (wordMatch) data.mission.collabName = wordMatch[0];
                    }
                }
            }
        }

        // --- Section 1: Satisfaction ---
        if (currentSection.includes('1. satisfaction')) {
            if (currentSubsection.includes('bilan')) {
                if (line && !line.startsWith('#')) {
                    data.satisfaction.bilan = (data.satisfaction.bilan || '') + line + ' ';
                }
            }
            if (currentSubsection.includes('organisation du travail') || currentSubsection.includes('télétravail')) {
                if (line && !line.startsWith('#')) {
                    data.satisfaction.organisation = (data.satisfaction.organisation || '') + line + ' ';
                }
            }
        }

        // --- Section 2: Performance ---
        if (currentSection.includes('2. performance')) {
            if (currentSubsection.includes('synthèse')) {
                if (line && !line.startsWith('#')) {
                    data.performance.synthesis = (data.performance.synthesis || '') + line + ' ';
                }
            }
            if (currentSubsection.includes('évaluation')) {
                const match = line.match(/évaluation\s*:\s*(.*)/i);
                if (match) data.performance.level = match[1].trim();
            }
            // Parse Points forts & Axes table
            if (line.startsWith('|') && !line.includes('---') && !line.includes('Thématique')) {
                const parts = line.split('|').map(p => p.trim()).filter(p => p);
                if (parts.length >= 3) {
                    data.performance.strengthsAndAxes.push({
                        type: parts[0],
                        theme: parts[1],
                        description: parts[2]
                    });
                }
            }
        }

        // --- Section 3: Objectifs ---
        if (currentSection.includes('3. objectifs')) {
            if (currentSubsection.includes('3.1 objectifs précédents')) {
                // Simplified: capture headers as objective titles and text as comments
                if (line.startsWith('### ')) {
                    const title = line.replace('### ', '').trim();
                    let comment = '';
                    let j = i + 1;
                    while (j < lines.length && !lines[j].startsWith('#') && !lines[j].startsWith('---')) {
                        if (lines[j].trim()) comment += lines[j].trim() + ' ';
                        j++;
                    }
                    data.objectives.past.push({ title, comment: comment.trim() });
                    i = j - 1;
                }
            }
            if (currentSubsection.includes('3.2 nouveaux éléments')) {
                if (line.startsWith('* ')) {
                    data.objectives.future.push(line.replace('* ', '').trim());
                }
            }
        }

        // --- Section 4 & 5: Commentaire Final ---
        if (currentSection.includes('4. commentaire final du manager')) {
            if (line && !line.startsWith('#') && !line.startsWith('---')) {
                data.comments.manager = (data.comments.manager || '') + line + ' ';
            }
        }
        if (currentSection.includes('5. commentaire final du collaborateur')) {
            if (line && !line.startsWith('#') && !line.startsWith('---')) {
                data.comments.collaborator = (data.comments.collaborator || '') + line + ' ';
            }
        }
    }

    // Cleanup strings
    for (const key in data.satisfaction) data.satisfaction[key] = data.satisfaction[key].trim();
    for (const key in data.comments) data.comments[key] = data.comments[key].trim();
    if (data.performance.synthesis) data.performance.synthesis = data.performance.synthesis.trim();
    if (data.mission.context) data.mission.context = data.mission.context.trim();

    return data;
}
// --- Helpers ---

async function sendMessageToContentScript(tabId, message) {
    try {
        await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
        // If message fails (likely receiving end does not exist), try injecting the script
        console.warn('Communication failed, attempting to inject content script...', error);
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['src/js/content_script.js']
            });
            // Retry sending message after injection
            await wait(100);
            await chrome.tabs.sendMessage(tabId, message);
        } catch (injectionError) {
            console.error('Script injection failed:', injectionError);
            alert("Erreur critique (Injection échouée) : " + injectionError.message);
        }
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
