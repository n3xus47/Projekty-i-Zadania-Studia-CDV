export const LEGAL_URLS = {
  privacy: 'https://n3xus47.github.io/cdv-dzis-legal/privacy-policy.html',
  terms: 'https://n3xus47.github.io/cdv-dzis-legal/terms.html',
  accountDeletion: 'https://n3xus47.github.io/cdv-dzis-legal/account-deletion.html',
  issues: 'https://github.com/n3xus47/cdv-dzis/issues'
};

export const LEGAL_EFFECTIVE = '2026-09-05';

export const LEGAL_DOCUMENTS = {
  privacy: {
    title: 'Polityka prywatności',
    file: 'docs/privacy.md',
    chips: ['local-only', 'pl.cdv.dzis', LEGAL_EFFECTIVE],
    summary: 'Login i plan zostają na telefonie. Nie prowadzimy chmury z Twoim kontem.',
    sections: [
      {
        id: '01',
        heading: 'Dane',
        rows: [
          { k: 'login', v: 'e-mail @edu.cdv.pl / @cdv.pl' },
          { k: 'sekrety', v: 'hasło i sesja WU w SecureStore' },
          { k: 'plan', v: 'zajęcia i profil studenta z WU' },
          { k: 'ui', v: 'motyw i ustawienia' }
        ]
      },
      {
        id: '02',
        heading: 'Cel',
        body: 'Wyłącznie logowanie do wu.cdv.pl i lokalny podgląd Twojego planu.'
      },
      {
        id: '03',
        heading: 'Storage',
        rows: [
          { k: 'telefon', v: 'wszystkie dane aplikacji' },
          { k: 'autorzy', v: 'brak serwera z Twoimi danymi' },
          { k: 'CDV', v: 'wu.cdv.pl, opcjonalnie Blackboard' }
        ]
      },
      {
        id: '04',
        heading: 'Sieć',
        bullets: [
          'Internet tylko do portali CDV.',
          'Bez reklam, analityki i sprzedaży danych.',
          'Bez lokalizacji, kontaktów, mikrofonu i aparatu.'
        ]
      },
      {
        id: '05',
        heading: 'Kontrola',
        rows: [
          { k: 'usunąć', v: 'wyloguj, „Usuń wszystkie dane” albo deinstalacja' },
          { k: 'prawa', v: 'dostęp, poprawa przez ponowne logowanie, usunięcie' },
          { k: 'skarga', v: 'Prezes UODO' }
        ],
        note: 'Aplikacja nie jest dla dzieci poniżej 13 lat. Do czasu umowy z uczelnią nie jest oficjalnym produktem CDV.'
      }
    ]
  },
  terms: {
    title: 'Regulamin',
    file: 'docs/terms.md',
    chips: ['unofficial', 'pl.cdv.dzis', LEGAL_EFFECTIVE],
    summary: 'Podgląd własnego planu CDV. Źródłem prawdy jest Wirtualna Uczelnia.',
    sections: [
      {
        id: '01',
        heading: 'Zakres',
        rows: [
          { k: 'funkcja', v: 'własny plan zajęć Collegium Da Vinci' },
          { k: 'źródło', v: 'wiążący jest wu.cdv.pl' },
          { k: 'status', v: 'nieoficjalna do czasu umowy z uczelnią' }
        ]
      },
      {
        id: '02',
        heading: 'Konto',
        rows: [
          { k: 'konto', v: 'Twoje WU — nie zakładamy osobnego' },
          { k: 'domeny', v: '@edu.cdv.pl, @cdv.pl' },
          { k: 'hasło', v: 'Twoja odpowiedzialność' }
        ]
      },
      {
        id: '03',
        heading: 'Użycie',
        bullets: [
          'Tylko własny plan.',
          'Bez obchodzenia zabezpieczeń i masowego pobierania.',
          'Bez udostępniania hasła.'
        ]
      },
      {
        id: '04',
        heading: 'Ryzyko',
        body: 'Aplikacja działa „tak jak jest”. Nie odpowiadamy za spóźnienia, błędny odczyt planu ani przerwy WU.'
      },
      {
        id: '05',
        heading: 'IP',
        rows: [
          { k: 'kod', v: 'autorzy CDV Dziś' },
          { k: 'marka', v: 'Collegium Da Vinci' }
        ]
      }
    ]
  },
  deletion: {
    title: 'Usuwanie danych',
    file: 'docs/wipe.md',
    chips: ['no-cloud', 'device-only', LEGAL_EFFECTIVE],
    summary: 'Nie ma konta w chmurze. Kasujesz dane na tym telefonie.',
    sections: [
      {
        id: '01',
        heading: 'Model',
        body: 'Login, hasło i plan są tylko na urządzeniu. Autorzy nie trzymają kopii.'
      },
      {
        id: '02',
        heading: 'Procedura',
        steps: [
          'Wyloguj — kasuje bieżącą sesję.',
          'Na logowaniu usuń zapamiętany profil.',
          'Ustawienia → Usuń wszystkie dane.',
          'Odinstaluj — czyści magazyn aplikacji.'
        ]
      },
      {
        id: '03',
        heading: 'Limit',
        body: 'Konta w wu.cdv.pl nie usuniemy. Tym zarządza Collegium Da Vinci.'
      }
    ]
  }
};
