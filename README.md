# M8Finder

Application React (Vite + Tailwind CSS) permettant a des joueurs Valorant
de creer un profil (role d'agent, rang, disponibilites), de rechercher des coequipiers,
de les contacter, de signaler un profil, et a un administrateur de moderer
la communaute. Le projet suit le diagramme de cas d'utilisation dans
[`UML/uml.drawio`](UML/uml.drawio).

Le backend est **Supabase** (Postgres + Authentification + API auto-generee) :
les comptes, profils, signalements et notifications sont stockes en base et
partages entre tous les joueurs, avec des regles de securite (Row Level
Security) qui limitent ce que chacun peut lire ou modifier.

## Prerequis

- [Node.js](https://nodejs.org/) 18 ou plus recent (`node -v`, `npm -v`).
- Un compte et un projet [Supabase](https://supabase.com) (gratuit).

## 1. Configurer Supabase

1. Cree un projet sur [supabase.com](https://supabase.com).
2. Va dans **SQL Editor**, colle le contenu de [`supabase/schema.sql`](supabase/schema.sql)
   et execute-le. Ce script cree les tables, la Row Level Security et les
   fonctions necessaires. Il est idempotent (peut etre relance sans risque).
3. Dans **Project Settings > API**, recupere :
   - **Project URL**
   - **anon / public key**
4. Copie `.env.example` vers `.env.local` et renseigne ces deux valeurs :

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Ces deux valeurs ne sont pas secretes (elles sont concues pour etre utilisees
cote client) : la securite reelle vient des regles Row Level Security definies
dans `supabase/schema.sql`, pas de la confidentialite de la cle.

### Creer les 2 comptes admin

M8Finder n'a **aucune fonctionnalite pour devenir admin depuis l'app** — c'est
volontaire. Pour creer les 2 comptes autorises :

1. Inscris-toi normalement dans l'application (`/inscription`) avec les 2 emails
   que tu veux utiliser comme admins.
2. Dans le **SQL Editor** Supabase, decommente et adapte la derniere requete de
   `supabase/schema.sql` (ou execute-la directement) :

```sql
insert into public.admins (user_id)
select id from auth.users where email in ('ton-email-admin-1@exemple.com', 'ton-email-admin-2@exemple.com')
on conflict (user_id) do nothing;
```

Ces 2 comptes verront alors le menu **Administration** dans l'app. Aucun autre
compte ne peut obtenir ce role sans que quelqu'un execute cette requete a la main.

### Confirmation email (optionnel, pour tester plus vite)

Par defaut, Supabase envoie un email de confirmation a l'inscription et bloque
la connexion tant qu'il n'est pas valide. Pour du developpement local plus
rapide, tu peux desactiver ca dans **Authentication > Providers > Email >
Confirm email** (a reactiver avant une mise en production reelle).

## 2. Lancer l'application

```bash
npm install
npm run dev
```

Le terminal affiche une URL locale (par defaut `http://localhost:5173`) a ouvrir
dans le navigateur.

Autres commandes utiles :

```bash
npm run build      # build de production dans dist/
npm run preview    # sert le build de production en local
npm run lint        # verifie le code avec ESLint
```

## Fonctionnalites (issues du diagramme UML)

- **S'authentifier** : connexion / inscription par email (`/connexion`,
  `/inscription`), via Supabase Auth.
- **Creer / modifier profil** : role d'agent, rang, disponibilites, Riot ID en
  saisie libre (`/profil`). L'application n'appelle pas l'API Riot Games : le
  Riot ID n'est qu'une information affichee sur le profil, non verifiee.
- **Rechercher des coequipiers** avec filtres role / rang / disponibilite, et
  creation d'une alerte de match (`/recherche`).
- **Recevoir une notification de match** : cloche de notifications dans la
  barre de navigation.
- **Consulter un profil joueur**, le **contacter** (tag Discord) et le
  **signaler** (`/joueurs/:id`).
- **Moderer les profils signales** et **bannir / suspendre** un compte
  (`/admin`, reserve aux 2 comptes admin).

## Structure du projet

```
supabase/
  schema.sql                Tables, Row Level Security, fonctions (a executer dans Supabase)
src/
  main.jsx                  Point d'entree, montage des providers et du router
  App.jsx                   Layout global + declaration des routes
  index.css                 Styles globaux (Tailwind)
  lib/
    supabaseClient.js        Client Supabase (URL + cle depuis les variables d'env)
  context/                  Contextes React (etat global)
    AuthContext.jsx           Session Supabase Auth (connexion/inscription/deconnexion, statut admin)
    DatabaseContext.jsx       Lecture/ecriture des profils, signalements, notifications via Supabase
    ToastContext.jsx          Messages de confirmation/erreur
  hooks/                    Hooks personnalises (useAuth, useDatabase, useToast)
  data/
    constants.js              Enumerations du domaine (roles, rangs, disponibilites, statuts)
  components/
    common/                    Composants UI generiques (Button, Badge, Modal, FormField)
    layout/                    Navbar, route protegee, cloche de notifications
    profile/                   Formulaire de profil, carte joueur, contact, signalement
    search/                    Filtres de recherche, liste de joueurs
    admin/                     Tableaux de moderation (signalements, comptes)
  pages/                    Une page par route (Home, Login, Register, Profile,
                             Search, PlayerProfile, Admin, NotFound)
```

### Conventions de nommage

- Composants React : `PascalCase.jsx` (un composant = un fichier).
- Hooks : `useXxx.js` (camelCase, prefixe `use`).
- Contextes : `XxxContext.jsx`, exportent un `XxxProvider`.
- Fonctions, variables, props : `camelCase`.
- Constantes de domaine (enum-like) : `UPPER_SNAKE_CASE`.
- Tables et colonnes SQL : `snake_case` (convention Postgres), converties en
  `camelCase` cote JS dans `DatabaseContext.jsx`.
- Routes en francais (`/connexion`, `/inscription`, `/recherche`, `/profil`)
  pour rester coherent avec le vocabulaire du diagramme UML.

## Limites connues

- Pas de mises a jour en temps reel (Realtime) : un joueur doit rafraichir la
  page pour voir les changements faits par un autre utilisateur.
- Le statut suspendu/banni est verifie par l'application a la connexion et par
  les regles Row Level Security sur les ecritures, mais ne desactive pas la
  session Supabase Auth elle-meme (cela demanderait l'API d'administration
  Supabase, utilisable uniquement depuis un serveur, pas depuis le frontend).
