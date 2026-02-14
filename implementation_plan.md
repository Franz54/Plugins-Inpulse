# CR Auto-filler: Browser Extension Plan

This extension will automatically fill a company report (CR) form using data from a Markdown file.

## User Review Required

> [!NOTE]
> L'exemple de fichier Markdown fourni ([CR SM KLA 2026-02-12.md](file:///Users/franz/Library/CloudStorage/GoogleDrive-francois.niclas@gmail.com/My%20Drive/Dev-Drive/Plugins-Inpulse/docs/CR%20SM%20KLA%202026-02-12.md)) a été analysé. Le mapping est défini ci-dessous.

## Proposed Changes

### [Architecture de l'Extension]

Le projet suivra le standard **Manifest V3** avec trois composants principaux :
- **Popup UI** : Pour sélectionner le fichier MD et le collaborateur cible.
- **Content Script (Navigation)** : Pour automatiser la recherche et le filtrage sur la page principale.
- **Content Script (Formulaire)** : Pour remplir les champs une fois le formulaire ouvert.

L'extension supportera deux types de formulaires Inpulse :

#### 1. Open Change (O&C)
- **Satisfaction**: `_r_17_-textarea` (Bilan général)
- **Activités**: 
  - `_r_18_-textarea` (Descriptif)
  - `_r_19_-textarea` (Réussites)
- **Compétences**: `_r_1p_-textarea` (Clés)

#### 2. Suivi de Mission (Actuel)
- **Missions/Activités actuelles** : 
    1. L'extension identifiera la mission et cliquera sur l'icône "Modifier" (crayon).
    2. Dans le modal : 
       - Remplissage des champs `textarea` : Contexte, Activités, Taille équipe, Autonomie.
       - Les données seront extraites de la section `# 0. Formulaire Mission` du MD.
- **Participation & Complexité** : L'extension remplira les indicateurs d'équipe, autonomie et complexité selon les sections dédiées.
- **Satisfaction** :
  - `_r_3o_-textarea` (Bilan général) <- Section `# 1. Satisfaction` > `## Bilan`
  - `_r_3p_-textarea` (Organisation/Télétravail) <- Section `# 1. Satisfaction` > `## Organisation du travail` + `## Télétravail`
- **Performance** :
  - `_r_3m_-select` (Niveau global) <- `## Évaluation` (ex: "À l'attendu")
  - `_r_3n_-textarea` (Commentaires) <- Section `# 2. Performance` > `## Synthèse`
  - **Points forts & Axes de progrès** : 
    1. Cliquer sur le bouton "Ajouter un axe de progrès/point fort".
    2. Dans le modal : 
       - Sélectionner le **Type** ("Point fort" ou "Axe de progrès") selon la première colonne du tableau MD.
       - Sélectionner la **Thématique** selon la deuxième colonne.
       - Saisir la **Description** selon la troisième colonne.
       - Cliquer sur "Valider".
    3. Répéter pour chaque ligne du tableau.
- **Objectifs (Passés)** :
  - Cliquer sur "Apprécier l'objectif" pour chaque ligne de l'onglet "Objectifs sur la période".
  - Dans le modal :
    - Sélectionner le **Statut** (dropdown).
    - Saisir le **Commentaire du Manager** (textarea) depuis la section `## 3.1 Objectifs précédents`.
- **Objectifs (Futurs)** :
  - Cliquer sur "Ajouter un nouvel objectif" dans l'onglet "Objectifs sur la période à venir".
  - Dans le modal :
    - Saisir Titre, Échéance, Descriptif, Indicateurs, Source et Commentaires depuis `## 3.2 Nouveaux éléments`.
- **Commentaires Finaux** :
  - `_r_3t_-textarea` (Commentaire Manager) <- Section `# 4. Commentaire final du manager`
  - `_r_3u_-textarea` (Commentaire Collaborateur) <- Section `# 5. Commentaire final du collaborateur`

> [!NOTE]
> Comme les IDs sont dynamiques (React) et peuvent varier d'une session à l'autre, le script utilisera principalement les labels textuels (ex: "Bilan général", "Synthèse") pour cibler les champs.

> [!NOTE]
> Comme les IDs sont dynamiques (React), le script utilisera les labels pour trouver les champs. Par exemple, il cherchera le `textarea` associé au texte "Bilan général".

### [Automation de la Navigation]

L'extension ajoutera une étape préliminaire sur la page de sélection :

1.  **Recherche** : Saisie automatique du nom (ex: "Karima") dans `input[id^="_r_"][id$="-input-autocomplete"]`.
2.  **Filtrage** : Activation forcée des cases à cocher :
    - Label "À réaliser"
    - Label "Suivi de Mission" ou "Bilan de mission"
3.  **Sélection** : Une fois la liste filtrée, identifier la ligne correspondant au collaborateur et cliquer sur l'icône "œil".

> [!IMPORTANT]
> L'extension agira comme un assistant : elle vous proposera de "Lancer l'automatisation pour [Collaborateur]" quand vous serez sur la page de sélection.

## Verification Plan

### Manual Verification
1. Open the selection page, click the extension, select the file, and verify it navigates to the form.
2. Verify the form fields are filled correctly.
