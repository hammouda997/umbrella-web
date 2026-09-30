export const NAV_LINKS = [
  { href: "#parcours", label: "Parcours" },
  { href: "#choisir", label: "Pourquoi nous" },
  { href: "#services", label: "Services" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
] as const;

/** Premium journey labels for the hero status marquee (not back-office chips). */
export const MARQUEE_STATS = [
  "PICKUP",
  "IN TRANSIT",
  "OUT FOR DELIVERY",
  "DELIVERED",
  "COD COLLECTED",
  "RETURNS",
  "SAME DAY",
  "NATIONWIDE",
] as const;

export const WHY_POINTS = [
  {
    n: "01",
    title: "Pickup sur votre rythme",
    body: "Collecte planifiée selon votre flux — matin, après-midi, ou volume du jour.",
  },
  {
    n: "02",
    title: "Livreurs qui connaissent le terrain",
    body: "Équipes locales sur les gouvernorats — moins de ratés, plus de remises.",
  },
  {
    n: "03",
    title: "Tarifs lisibles",
    body: "Une grille claire. Vous savez ce que coûte chaque colis, avant l’envoi.",
  },
  {
    n: "04",
    title: "COD sans friction",
    body: "Encaissement à la porte, versement sur votre solde — suivi dans la console.",
  },
] as const;

export const SERVICES = [
  {
    n: "01",
    title: "Pickup",
    body: "Récupération chez vous ou en entreprise, créneaux calés sur votre flux.",
  },
  {
    n: "02",
    title: "Livraison",
    body: "Livreurs Umbrella sur tout le territoire tunisien.",
  },
  {
    n: "03",
    title: "Suivi live",
    body: "Chaque statut visible pour vous et votre client.",
  },
  {
    n: "04",
    title: "COD",
    body: "Encaissement cash, versement sur votre solde.",
  },
  {
    n: "05",
    title: "Retours",
    body: "Échanges et retours traités dans le même pipeline.",
  },
  {
    n: "06",
    title: "Console",
    body: "Une seule interface — colis, livreurs, versements.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: "Umbrella Express, c’est quoi ?",
    a: "Un service de livraison last-mile pour commerçants e-commerce en Tunisie : pickup, suivi, livraison et COD dans une console unique.",
  },
  {
    q: "Travaillez-vous avec les petites boutiques ?",
    a: "Oui. Que vous expédiiez quelques colis par semaine ou des centaines, le parcours reste le même — simple et suivi.",
  },
  {
    q: "Comment fonctionne le COD ?",
    a: "Le livreur encaisse à la livraison. Les montants sont versés sur votre solde selon le rythme ouvré convenu.",
  },
  {
    q: "Quelle est la couverture ?",
    a: "Toute la Tunisie, 6 jours sur 7, avec des équipes qui connaissent les gouvernorats et le terrain.",
  },
  {
    q: "Comment suivre un colis ?",
    a: "Depuis la page d’accueil avec le numéro de commande, ou depuis votre espace après connexion.",
  },
  {
    q: "Quand créer un compte ?",
    a: "Dès que vous voulez centraliser pickup, statuts et versements — plutôt que gérer le last-mile à la main.",
  },
] as const;
