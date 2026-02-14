
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('md-file');
    const fillBtn = document.getElementById('fill-btn');

    fillBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
            alert('Veuillez sélectionner un fichier Markdown.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const data = parseMarkdown(text);
            
            // Send data to content script
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.tabs.sendMessage(tab.id, { action: 'FILL_FORM', data });
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
                const match = line.match(/\*\* (.*?)\s*:\s*\*\*\s*(.*)/);
                if (match) {
                    const key = match[1].toLowerCase();
                    const value = match[2];
                    data.mission[key] = value;
                }
            }
            if (currentSubsection.includes('contexte mission')) {
                if (line && !line.startsWith('#') && !line.startsWith('*')) {
                    data.mission.context = (data.mission.context || '') + line + ' ';
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
