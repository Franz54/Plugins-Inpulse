
if (!window.hasInpulseContentScript) {
    window.hasInpulseContentScript = true;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        alert("Content Script a reçu le message : " + request.action);
        if (request.action === 'FILL_FORM') {
            fillInpulseForm(request.data);
            sendResponse({ status: "ok" }); // Ack
        } else if (request.action === 'NAVIGATE_TO_COLLAB') {
            navigateToCollab(request.collabName);
            sendResponse({ status: "ok" }); // Ack
        }
        return true; // Keep channel open for async response if needed
    });
}

async function fillInpulseForm(data) {
    console.log('Automating Inpulse Form with data:', data);
    alert('Début du remplissage automatique...');
    alert('Début du remplissage automatique...');

    // 1. Mission Tab
    if (data.mission) {
        await fillMissionTab(data.mission);
    }

    // 2. Satisfaction Tab
    if (data.satisfaction) {
        await fillSatisfactionTab(data.satisfaction);
    }

    // 3. Performance Tab (Strengths, Axes, Synthesis)
    if (data.performance) {
        await fillPerformanceTab(data.performance);
    }

    // 4. Objectives Tabs (Past and Future)
    if (data.objectives) {
        await fillObjectivesTabs(data.objectives);
    }

    // 5. Final Comments
    if (data.comments) {
        await fillCommentsTab(data.comments);
    }

    alert('Remplissage automatique terminé. Veuillez vérifier les champs avant de valider.');
}

async function fillMissionTab(mission) {
    // Navigate to Mission tab if not selected
    const missionTab = findElementByText('button', 'Missions/Activités actuelles');
    if (missionTab) missionTab.click();

    // Click "Modifier" (crayon)
    const editBtn = document.querySelector('button svg[class*="Edit"]').parentElement;
    if (editBtn) {
        editBtn.click();
        await wait(500);

        // Fill context and activities in modal
        const contextField = findTextareaByLabel('Description du contexte');
        if (contextField) setInputValue(contextField, mission.context || '');

        // Note: activities mapping could be more specific based on MD subheaders
        const activitiesField = findTextareaByLabel('Activités et responsabilités');
        if (activitiesField) {
            // Placeholder: concat for now, or use specific activities if parsed
            setInputValue(activitiesField, mission.activities || '');
        }

        // Close/Validate modal
        const validateBtn = findElementByText('button', 'Valider');
        if (validateBtn) validateBtn.click();
        await wait(500);
    }
}

async function fillSatisfactionTab(sat) {
    const tab = findElementByText('button', 'Satisfaction');
    if (tab) tab.click();
    await wait(300);

    const bilanField = findTextareaByLabel('Bilan général');
    if (bilanField) setInputValue(bilanField, sat.bilan || '');

    const orgField = findTextareaByLabel('Organisation du travail');
    if (orgField) setInputValue(orgField, sat.organisation || '');
}

async function fillPerformanceTab(perf) {
    const tab = findElementByText('button', 'Performance');
    if (tab) tab.click();
    await wait(300);

    const synthField = findTextareaByLabel('Synthèse');
    if (synthField) setInputValue(synthField, perf.synthesis || '');

    // Handle Strengths and Axes Modal
    for (const item of perf.strengthsAndAxes) {
        const addBtn = findElementByText('button', 'Ajouter un axe de progrès/point fort');
        if (addBtn) {
            addBtn.click();
            await wait(500);

            // Modal: Type (Point fort / Axe de progrès)
            const typeDropdown = findDropdownByLabel('Type');
            if (typeDropdown) {
                await selectDropdownOption(typeDropdown, item.type);
            }

            const themeDropdown = findDropdownByLabel('Thématique');
            if (themeDropdown) {
                await selectDropdownOption(themeDropdown, item.theme);
            }

            const descField = findTextareaByLabel('Descriptif');
            if (descField) setInputValue(descField, item.description);

            const validateBtn = findElementByText('button', 'Valider');
            if (validateBtn) validateBtn.click();
            await wait(300);
        }
    }
}

async function fillObjectivesTabs(objectives) {
    // Past Objectives
    const pastTab = findElementByText('button', 'Objectifs sur la période');
    if (pastTab) {
        pastTab.click();
        await wait(500);
        // Matching logic would go here: find row by objective title, click "Apprécier"
    }

    // Future Objectives
    const futureTab = findElementByText('button', 'Objectifs sur la période à venir');
    if (futureTab) {
        futureTab.click();
        await wait(500);
        for (const objTitle of objectives.future) {
            const addBtn = findElementByText('button', 'Ajouter un nouvel objectif');
            if (addBtn) {
                addBtn.click();
                await wait(500);
                const titleField = findInputByLabel('Titre de l\'objectif');
                if (titleField) setInputValue(titleField, objTitle);
                // Add more logic for date, etc.
                const validateBtn = findElementByText('button', 'Valider');
                if (validateBtn) validateBtn.click();
                await wait(300);
            }
        }
    }
}

async function fillCommentsTab(comments) {
    // This often depends on where the final comments are. Usually at step "Validation"
    const managerField = findTextareaByLabel('Commentaire final du manager');
    if (managerField) setInputValue(managerField, comments.manager || '');
}

// --- Helpers ---

function findElementByText(tag, text) {
    return Array.from(document.querySelectorAll(tag)).find(el => el.textContent.includes(text));
}

function findTextareaByLabel(labelText) {
    const labels = Array.from(document.querySelectorAll('label'));
    const label = labels.find(l => l.textContent.includes(labelText));
    if (label) {
        const id = label.getAttribute('for');
        if (id) return document.getElementById(id);
        // Fallback: look for sibling or child textarea
        return label.parentElement.querySelector('textarea');
    }
    return null;
}

function findInputByLabel(labelText) {
    const labels = Array.from(document.querySelectorAll('label'));
    const label = labels.find(l => l.textContent.includes(labelText));
    if (label) {
        const id = label.getAttribute('for');
        if (id) return document.getElementById(id);
        return label.parentElement.querySelector('input');
    }
    return null;
}

function findDropdownByLabel(labelText) {
    const labels = Array.from(document.querySelectorAll('label'));
    const label = labels.find(l => l.textContent.includes(labelText));
    if (label) {
        return label.parentElement.querySelector('[class*="dropdown"], [class*="select"]');
    }
    return null;
}

async function selectDropdownOption(dropdown, optionText) {
    dropdown.click();
    await wait(200);
    const option = findElementByText('div, li, span', optionText);
    if (option) option.click();
}

function setInputValue(el, value) {
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
}

async function navigateToCollab(collabName) {
    console.log('Navigating to collaborator:', collabName);

    // 1. Search for the name
    const searchInput = document.querySelector('input[id^="_r_"][id$="-input-autocomplete"]');
    if (searchInput) {
        setInputValue(searchInput, collabName);
        await wait(1000); // Wait for list to update
    }

    // 2. Ensure filters are set
    const filters = ['À réaliser', 'Suivi de Mission/d\'activité'];
    for (const filterText of filters) {
        const labels = Array.from(document.querySelectorAll('label'));
        const label = labels.find(l => l.textContent.includes(filterText));
        if (label) {
            const checkbox = label.parentElement.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.checked) {
                checkbox.click();
                await wait(500);
            }
        }
    }

    // 3. Find and click the collaborator row
    const collabLink = document.querySelector(`a[aria-label*="${collabName}"]`);
    if (collabLink) {
        collabLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await wait(500);
        collabLink.click();
    } else {
        console.warn('Collaborator link not found for:', collabName);
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
