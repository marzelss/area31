export async function loadLocale(section) {

    const userLang = navigator.language.startsWith("it") ? "it" : "en";

    const response = await fetch(`../locales/${userLang}.json`);
    const data = await response.json();

    return data[section];

}
