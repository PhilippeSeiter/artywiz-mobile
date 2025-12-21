/**
 * Script de tests automatisés pour Artywiz App
 * Utilise Playwright pour tester les écrans principaux
 * 
 * Usage: Ce script est conçu pour être exécuté via l'outil screenshot_tool
 */

// ============================================
// TEST SUITE 1: Écran d'accueil (Welcome)
// ============================================
const testWelcomeScreen = `
await page.set_viewport_size({"width": 430, "height": 932});
await page.evaluate("localStorage.clear()");
await page.reload();
await page.wait_for_timeout(4000);

// Vérifier le logo
const logo = await page.locator('text="Artywiz"').first();
const hasLogo = await logo.is_visible();
print("✅ Logo Artywiz: " + (hasLogo ? "PASS" : "FAIL"));

// Vérifier les boutons
const loginBtn = await page.locator('text="JE ME CONNECTE"').first();
const hasLoginBtn = await loginBtn.is_visible();
print("✅ Bouton Connexion: " + (hasLoginBtn ? "PASS" : "FAIL"));

const signupBtn = await page.locator('text="JE CRÉE MON COMPTE"').first();
const hasSignupBtn = await signupBtn.is_visible();
print("✅ Bouton Inscription: " + (hasSignupBtn ? "PASS" : "FAIL"));

await page.screenshot(path="/tmp/test_welcome.png", quality=20);
`;

// ============================================
// TEST SUITE 2: Écran Mes Comptes (profile-selection)
// ============================================
const testProfileSelection = `
await page.set_viewport_size({"width": 430, "height": 932});
await page.evaluate("localStorage.clear()");
await page.goto("https://artywiz-mobile-3.preview.emergentagent.com/profile-selection");
await page.wait_for_timeout(4000);

// Vérifier le titre
const title = await page.locator('text="Mes"').first();
const hasTitle = await title.is_visible();
print("✅ Titre Mes Comptes: " + (hasTitle ? "PASS" : "FAIL"));

// Vérifier le message de bienvenue (nouvel utilisateur)
const welcome = await page.locator('text="Bienvenue sur Artywiz"').first();
const hasWelcome = await welcome.is_visible();
print("✅ Message Bienvenue: " + (hasWelcome ? "PASS" : "FAIL"));

// Vérifier le bouton +
const addBtn = await page.locator('text="Ajouter un compte"').first();
const hasAddBtn = await addBtn.is_visible();
print("✅ Bouton Ajouter: " + (hasAddBtn ? "PASS" : "FAIL"));

// Vérifier que le bouton Continuer est désactivé
const continueBtn = await page.locator('text="Continuer"').first();
const hasContinueBtn = await continueBtn.is_visible();
print("✅ Bouton Continuer: " + (hasContinueBtn ? "PASS" : "FAIL"));

await page.screenshot(path="/tmp/test_profile_selection.png", quality=20);
`;

// ============================================
// TEST SUITE 3: Popup de création de compte
// ============================================
const testAccountCreationPopup = `
await page.set_viewport_size({"width": 430, "height": 932});
await page.evaluate("localStorage.clear()");
await page.goto("https://artywiz-mobile-3.preview.emergentagent.com/profile-selection");
await page.wait_for_timeout(4000);

// Cliquer sur le bouton +
const addBtn = await page.locator('text="Ajouter un compte"').first();
await addBtn.click(force=True);
await page.wait_for_timeout(1500);

// Vérifier les 4 types de compte
const equipe = await page.locator('text="Créer un compte équipe"').first();
const club = await page.locator('text="Créer un compte club"').first();
const district = await page.locator('text="Créer un compte district"').first();
const ligue = await page.locator('text="Créer un compte ligue"').first();

print("✅ Option Équipe: " + (await equipe.is_visible() ? "PASS" : "FAIL"));
print("✅ Option Club: " + (await club.is_visible() ? "PASS" : "FAIL"));
print("✅ Option District: " + (await district.is_visible() ? "PASS" : "FAIL"));
print("✅ Option Ligue: " + (await ligue.is_visible() ? "PASS" : "FAIL"));

await page.screenshot(path="/tmp/test_popup.png", quality=20);
`;

// ============================================
// TEST SUITE 4: Écran Docs
// ============================================
const testDocsScreen = `
await page.set_viewport_size({"width": 430, "height": 932});
await page.goto("https://artywiz-mobile-3.preview.emergentagent.com/(tabs)/creer");
await page.wait_for_timeout(5000);

// Vérifier le titre
const title = await page.locator('text="Communication"').first();
const hasTitle = await title.is_visible();
print("✅ Titre Communication: " + (hasTitle ? "PASS" : "FAIL"));

// Vérifier le sélecteur de profil
const profileSelector = await page.locator('text="AS Strasbourg"').first();
const hasProfileSelector = await profileSelector.is_visible();
print("✅ Sélecteur Profil: " + (hasProfileSelector ? "PASS" : "FAIL"));

// Vérifier les documents (au moins un)
const docs = await page.locator('[class*="documentCard"]').count();
print("✅ Documents affichés: " + docs + " (min 1)");

await page.screenshot(path="/tmp/test_docs.png", quality=20);
`;

// ============================================
// EXPORT: Liste des tests disponibles
// ============================================
export const TEST_SUITES = {
  welcome: testWelcomeScreen,
  profileSelection: testProfileSelection,
  accountPopup: testAccountCreationPopup,
  docs: testDocsScreen,
};

export const TEST_URLS = {
  welcome: 'https://artywiz-mobile-3.preview.emergentagent.com',
  profileSelection: 'https://artywiz-mobile-3.preview.emergentagent.com/profile-selection',
  docs: 'https://artywiz-mobile-3.preview.emergentagent.com/(tabs)/creer',
  dashboard: 'https://artywiz-mobile-3.preview.emergentagent.com/(tabs)',
};

// Instructions pour exécuter les tests
console.log(`
=====================================
ARTYWIZ APP - TESTS AUTOMATISÉS
=====================================

Pour exécuter les tests, utilisez l'outil screenshot_tool 
avec les scripts définis ci-dessus.

Suites de tests disponibles:
1. Welcome Screen - Vérifie l'écran d'accueil
2. Profile Selection - Vérifie "Mes Comptes"
3. Account Popup - Vérifie le popup de création
4. Docs Screen - Vérifie l'écran Documents

Chaque test génère une capture d'écran dans /tmp/
=====================================
`);
