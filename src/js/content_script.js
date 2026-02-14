chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'FILL_FORM') {
        fillInpulseForm(request.data);
        sendResponse({ status: "ok" }); // Ack
    } else if (request.action === 'NAVIGATE_TO_COLLAB') {
        navigateToCollab(request.collabName);
        sendResponse({ status: "ok" }); // Ack
    }
    return true; // Keep channel open for async response if needed
});

async function fillInpulseForm(data) {
    console.log('Automating Inpulse Form with data:', data);
    alert("Remplissage lancé..."); // Feedback immédiat

    try {
        let report = [];

        // 1. Mission Tab
        if (data.mission) {
            report.push(...await fillMissionTab(data.mission));
        }

        // 2. Satisfaction Tab
        if (data.satisfaction) {
            report.push(...await fillSatisfactionTab(data.satisfaction));
        }

        // 3. Performance Tab (Strengths, Axes, Synthesis)
        if (data.performance) {
            report.push(...await fillPerformanceTab(data.performance));
        }

        // 4. Objectives Tabs (Past and Future)
        if (data.objectives) {
            report.push(...await fillObjectivesTabs(data.objectives));
        }

        // 5. Final Comments
        if (data.comments) {
            report.push(...await fillCommentsTab(data.comments));
        }

        const errors = report.filter(r => r.status === 'error');
        const success = report.filter(r => r.status === 'success');

        let message = `Remplissage terminé !\n\n✅ Champs remplis : ${success.length}`;
        if (errors.length > 0) {
            message += `\n❌ Éléments introuvables (${errors.length}) :\n- ${errors.map(e => e.msg).join('\n- ')}`;
        } else {
            message += `\nTout semble correct.`;
        }
        alert(message);

    } catch (e) {
        console.error("Erreur fatale content_script:", e);
        alert("❌ Erreur critique pendant le remplissage :\n" + e.message + "\n\n" + e.stack);
    }
}

async function fillMissionTab(mission) {
    let logs = [];
    // Navigate to Mission tab if not selected
    const missionTab = findElementByText('button', 'Missions/Activités actuelles');
    if (missionTab) {
        missionTab.click();
        logs.push({ status: 'success', msg: 'Onglet Mission activé' });
    } else {
        logs.push({ status: 'error', msg: 'Onglet "Missions/Activités actuelles" introuvable' });
    }

    // Click "Modifier" (crayon)
    const editBtn = document.querySelector('button svg[class*="Edit"]').parentElement;
    if (editBtn) {
        editBtn.click();
        await wait(500);

        // Fill context and activities in modal
        const contextField = findTextareaByLabel('Description du contexte');
        if (contextField) {
            setInputValue(contextField, mission.context || '');
            logs.push({ status: 'success', msg: 'Champ "Description du contexte" rempli' });
        } else {
            logs.push({ status: 'error', msg: 'Champ "Description du contexte" introuvable' });
        }

        // Note: activities mapping could be more specific based on MD subheaders
        const activitiesField = findTextareaByLabel('Activités et responsabilités');
        if (activitiesField) {
            setInputValue(activitiesField, mission.activities || '');
            logs.push({ status: 'success', msg: 'Champ "Activités et responsabilités" rempli' });
        } else {
            logs.push({ status: 'error', msg: 'Champ "Activités et responsabilités" introuvable' });
        }

        // Close/Validate modal
        const validateBtn = findElementByText('button', 'Valider');
        if (validateBtn) validateBtn.click();
        await wait(500);
    } else {
        logs.push({ status: 'error', msg: 'Bouton "Modifier" (crayon) introuvable sur l\'onglet Mission' });
    }
    return logs;
}

async function fillSatisfactionTab(sat) {
    let logs = [];
    const tab = findElementByText('button', 'Satisfaction');
    if (tab) {
        tab.click();
        await wait(300);
        logs.push({ status: 'success', msg: 'Onglet Satisfaction activé' });
    } else {
        logs.push({ status: 'error', msg: 'Onglet "Satisfaction" introuvable' });
        return logs; // Cannot proceed
    }

    const bilanField = findTextareaByLabel('Bilan général');
    if (bilanField) {
        setInputValue(bilanField, sat.bilan || '');
        logs.push({ status: 'success', msg: 'Champ "Bilan général" rempli' });
    } else {
        logs.push({ status: 'error', msg: 'Champ "Bilan général" introuvable' });
    }

    const orgField = findTextareaByLabel('Organisation du travail');
    if (orgField) {
        setInputValue(orgField, sat.organisation || '');
        logs.push({ status: 'success', msg: 'Champ "Organisation du travail" rempli' });
    } else {
        logs.push({ status: 'error', msg: 'Champ "Organisation du travail" introuvable' });
    }
    return logs;
}

async function fillPerformanceTab(perf) {
    let logs = [];
    const tab = findElementByText('button', 'Performance');
    if (tab) {
        tab.click();
        await wait(300);
        logs.push({ status: 'success', msg: 'Onglet Performance activé' });
    } else {
        logs.push({ status: 'error', msg: 'Onglet "Performance" introuvable' });
        return logs;
    }

    const synthField = findTextareaByLabel('Synthèse');
    if (synthField) {
        setInputValue(synthField, perf.synthesis || '');
        logs.push({ status: 'success', msg: 'Champ "Synthèse" rempli' });
    } else {
        logs.push({ status: 'error', msg: 'Champ "Synthèse" introuvable' });
    }

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
            logs.push({ status: 'success', msg: `Ajouté : ${item.type} - ${item.theme}` });
        } else {
            logs.push({ status: 'error', msg: 'Bouton "Ajouter un axe..." introuvable' });
        }
    }
    return logs;
}

async function fillObjectivesTabs(objectives) {
    let logs = [];
    // Past Objectives
    const pastTab = findElementByText('button', 'Objectifs sur la période');
    if (pastTab) {
        pastTab.click();
        await wait(500);
        logs.push({ status: 'success', msg: 'Onglet Objectifs passés activé' });
        // Matching logic would go here: find row by objective title, click "Apprécier"
    } else {
        logs.push({ status: 'info', msg: 'Onglet "Objectifs sur la période" introuvable ou non requis' });
    }

    // Future Objectives
    const futureTab = findElementByText('button', 'Objectifs sur la période à venir');
    if (futureTab) {
        futureTab.click();
        await wait(500);
        logs.push({ status: 'success', msg: 'Onglet Objectifs futurs activé' });

        for (const objTitle of objectives.future) {
            const addBtn = findElementByText('button', 'Ajouter un nouvel objectif');
            if (addBtn) {
                addBtn.click();
                await wait(500);
                const titleField = findInputByLabel('Titre de l\'objectif');
                if (titleField) {
                    setInputValue(titleField, objTitle);
                    logs.push({ status: 'success', msg: `Objectif ajouté : ${objTitle}` });
                } else {
                    logs.push({ status: 'error', msg: 'Champ "Titre de l\'objectif" introuvable' });
                }
                // Add more logic for date, etc.
                const validateBtn = findElementByText('button', 'Valider');
                if (validateBtn) validateBtn.click();
                await wait(300);
            } else {
                logs.push({ status: 'error', msg: 'Bouton "Ajouter un nouvel objectif" introuvable' });
            }
        }
    } else {
        logs.push({ status: 'info', msg: 'Onglet "Objectifs sur la période à venir" introuvable' });
    }
    return logs;
}

async function fillCommentsTab(comments) {
    let logs = [];
    // This often depends on where the final comments are. Usually at step "Validation"
    const managerField = findTextareaByLabel('Commentaire final du manager');
    if (managerField) {
        setInputValue(managerField, comments.manager || '');
        logs.push({ status: 'success', msg: 'Commentaire Manager rempli' });
    } else {
        logs.push({ status: 'error', msg: 'Champ "Commentaire final du manager" introuvable' });
    }
    return logs;
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
