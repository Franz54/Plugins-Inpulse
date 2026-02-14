# Démarche de Création de l'Extension Inpulse CR Auto-Filler

Ce document explique à l'équipe RM la démarche technique suivie pour concevoir cette extension de remplissage automatique.

## 1. Analyse de l'Existant
Nous avons commencé par étudier une extension similaire (**Instagram Downloader**) pour comprendre la structure standard d'une extension Chrome moderne (Manifest V3).

## 2. Exploration des Cibles (Inpulse)
Sans accès direct initial, nous avons utilisé un agent de navigation pour :
*   **Vérifier l'accès** : Identification de l'authentification Azure AD.
*   **Mapper les formulaires** : Une fois connecté, nous avons analysé deux types d'entretiens :
    *   **Open Change (O&C)**
    *   **Suivi de Mission/d'activité**
*   **Identification technique** : Nous avons découvert que les formulaires sont en **React**, avec des identifiants (IDs) dynamiques. La stratégie choisie est donc de cibler les champs par leurs **labels** (ex: "Bilan général") pour plus de robustesse.

## 3. Automatisation de la Navigation
Pour faire gagner du temps aux RM, nous avons décidé d'automatiser non seulement le remplissage, mais aussi la recherche :
*   Saisie du nom du collaborateur dans la barre de recherche.
*   Application automatique des filtres ("À réaliser", "Suivi de mission").
*   Clic automatique sur l'icône de visualisation pour ouvrir le bon formulaire.

## 4. Stratégie de Données
Le plugin lira un fichier **Markdown** simple, le découpera par sections, et injectera le texte dans les zones correspondantes du formulaire Inpulse.

## 5. Preuves de Concept (Vidéo)
Vous trouverez dans le dossier `docs/recordings/` les enregistrements des tests de navigation et d'inspection effectués par l'IA lors de la phase de conception.
