# Craft Lab bot — vérification

Rôle **Verified** : tant qu'un membre n'a pas cliqué sur « Verify / Je vérifie » dans #rules, il ne voit que #rules, #welcome et #announcements (en lecture seule).

Pourquoi ces deux salons en plus : le guide du serveur (mode Communauté) exige 3 tâches dans 3 salons publics différents,
Discord refuse de cacher un salon utilisé par le guide, et les bots ne peuvent pas modifier le guide.
La liste est dans `config.json` → `publicChannels`.

## Installation (une seule fois)

1. https://discord.com/developers/applications → **New Application** → nom « Craft Lab ».
2. Onglet **Bot** → **Reset Token** → copie le token dans `.env` (`DISCORD_TOKEN=`).
3. Dans Discord : clic droit sur le serveur Craft Lab → **Copier l'identifiant du serveur** → `.env` (`GUILD_ID=`).
   (Il faut le *Mode développeur* : Paramètres → Avancés.)
4. Invite le bot (remplace `APPLICATION_ID` par l'« Application ID » de l'onglet General Information) :
   `https://discord.com/oauth2/authorize?client_id=APPLICATION_ID&scope=bot&permissions=268520496`
   (Gérer les rôles, Gérer les salons, Gérer le serveur, Voir les salons, Envoyer des messages, Intégrer des liens, Voir l'historique.)
5. `npm install` puis `npm run setup` : crée le rôle, cache les salons, coupe le processus d'accueil et poste le règlement FR/EN.
6. `npm start` : le bot doit tourner **en permanence** pour que le bouton marche.

## Faire tourner le bot sur ce PC (sans fenêtre)

- `powershell -ExecutionPolicy Bypass -File .\install-autostart.ps1` crée la tâche planifiée **Craft Lab Bot** :
  le bot démarre caché à chaque ouverture de session et redémarre tout seul s'il plante (`run-bot.ps1`).
- Journal : `logs\bot.log`.
- Arrêter : `Stop-ScheduledTask -TaskName 'Craft Lab Bot'` puis fermer le `node.exe` du bot dans le Gestionnaire des tâches.
- Désinstaller : `Unregister-ScheduledTask -TaskName 'Craft Lab Bot' -Confirm:$false`.

`npm run setup` peut être relancé sans risque (il met à jour le message au lieu d'en poster un nouveau).
Les catégories déjà privées (ex. STAFF) ne sont pas touchées.
