export const LEGAL_URLS = {
  privacy: 'https://n3xus47.github.io/cdv-dzis-legal/privacy-policy.html',
  terms: 'https://n3xus47.github.io/cdv-dzis-legal/terms.html',
  accountDeletion: 'https://n3xus47.github.io/cdv-dzis-legal/account-deletion.html',
  issues: 'https://github.com/n3xus47/cdv-dzis/issues'
};

export const LEGAL_DOCUMENTS = {
  privacy: {
    title: 'Polityka prywatności',
    subtitle: 'CDV Dziś — aplikacja planu zajęć Collegium Da Vinci',
    sections: [
      {
        heading: 'Kim jesteśmy',
        body: 'CDV Dziś („aplikacja”) to narzędzie mobilne do podglądu planu zajęć studentów i pracowników Collegium Da Vinci. Łączy się wyłącznie z Wirtualną Uczelnią uczelni (wu.cdv.pl) oraz, w razie potrzeby, z Blackboard CDV. Do czasu podpisania umowy z uczelnią aplikacja nie jest oficjalnym produktem Collegium Da Vinci. Kontakt: autorzy projektu przekazani uczelni wraz z ofertą.'
      },
      {
        heading: 'Jakie dane przetwarzamy',
        body: 'Aplikacja może zapisać na Twoim telefonie: login lub e-mail CDV, hasło lub ciasteczka sesji Wirtualnej Uczelni, zapamiętane profile, plan zajęć, dane profilu studenta zwrócone przez WU (np. imię, nr albumu, grupa) oraz ustawienia interfejsu. Nie prowadzimy własnego konta użytkownika ani własnego serwera z Twoimi danymi.'
      },
      {
        heading: 'Po co te dane',
        body: 'Dane logowania służą wyłącznie do zalogowania Cię w Wirtualnej Uczelni CDV i pobrania Twojego planu. Plan zapisujemy lokalnie, żeby kolejne uruchomienia były szybkie. Zapamiętane profile pozwalają wrócić do konta jednym kliknięciem.'
      },
      {
        heading: 'Gdzie dane są przechowywane',
        body: 'Login, hasło i dane sesji zapisujemy lokalnie w bezpiecznym magazynie systemowym (expo-secure-store). Plan i ustawienia zapisujemy lokalnie na urządzeniu. Nie wysyłamy tych danych na serwery autorów aplikacji. Hasło i login trafiają wyłącznie do systemów Collegium Da Vinci (wu.cdv.pl, ewentualnie Blackboard).'
      },
      {
        heading: 'Udostępnianie stronom trzecim',
        body: 'Aplikacja łączy się bezpośrednio z portalami Collegium Da Vinci. Nie sprzedajemy danych, nie używamy ich do reklam i nie przekazujemy ich analityce reklamowej.'
      },
      {
        heading: 'Uprawnienia',
        body: 'Aplikacja potrzebuje Internetu, aby zalogować się do Wirtualnej Uczelni i pobrać plan. Nie żądamy lokalizacji, kontaktów, mikrofonu ani aparatu.'
      },
      {
        heading: 'Okres przechowywania i usuwanie',
        body: 'Dane zostają na urządzeniu, dopóki ich nie usuniesz. Możesz: wylogować się, usunąć pojedynczy zapamiętany profil, użyć w ustawieniach opcji „Usuń wszystkie dane” albo odinstalować aplikację.'
      },
      {
        heading: 'Twoje prawa',
        body: 'Masz prawo dostępu do danych zapisanych w aplikacji, ich poprawienia przez ponowne logowanie oraz usunięcia. Skargi dotyczące ochrony danych możesz złożyć do Prezesa Urzędu Ochrony Danych Osobowych.'
      },
      {
        heading: 'Dzieci',
        body: 'Aplikacja jest przeznaczona dla studentów i słuchaczy pełnoletnich albo korzystających za zgodą rodzica lub opiekuna. Nie kierujemy jej do dzieci poniżej 13. roku życia.'
      },
      {
        heading: 'Zmiany',
        body: 'Aktualną treść polityki znajdziesz w aplikacji oraz pod adresem https://n3xus47.github.io/cdv-dzis-legal/privacy-policy.html. Data obowiązywania: 5 września 2026 r.'
      }
    ]
  },
  terms: {
    title: 'Regulamin',
    subtitle: 'Zasady korzystania z aplikacji CDV Dziś',
    sections: [
      {
        heading: 'Charakter aplikacji',
        body: 'CDV Dziś jest aplikacją pomocniczą dla społeczności Collegium Da Vinci. Nie zastępuje Wirtualnej Uczelni, dziekanatu ani Blackboarda. Nie gwarantujemy, że plan w aplikacji jest kompletny, aktualny w każdej minucie ani tożsamy z oficjalnym komunikatem uczelni. W razie rozbieżności wiążący jest system uczelni (wu.cdv.pl).'
      },
      {
        heading: 'Konto uczelni',
        body: 'Korzystasz z własnego, istniejącego konta w Wirtualnej Uczelni CDV. Nie tworzymy osobnego konta CDV Dziś. Logowanie jest ograniczone do domen @edu.cdv.pl i @cdv.pl. Jesteś odpowiedzialny za poufność hasła.'
      },
      {
        heading: 'Dozwolone użycie',
        body: 'Aplikację wolno używać wyłącznie do podglądu własnego planu zajęć. Zabronione jest obchodzenie zabezpieczeń, masowe pobieranie cudzych danych, udostępnianie swojego hasła i wykorzystywanie aplikacji w sposób sprzeczny z regulaminem uczelni.'
      },
      {
        heading: 'Dostępność',
        body: 'Działanie zależy od Wirtualnej Uczelni, sieci i zmian na stronie wu.cdv.pl. Integracja może przestać działać bez winy autorów, jeśli uczelnia zmieni portal. Aplikację dostarczamy „tak jak jest”, bez gwarancji nieprzerwanego działania — o ile umowa z uczelnią nie stanowi inaczej.'
      },
      {
        heading: 'Odpowiedzialność',
        body: 'Nie odpowiadamy za nieobecność na zajęciach, błędny odczyt planu, blokadę konta przez uczelnię ani szkody wynikłe z polegania wyłącznie na aplikacji. Korzystasz z niej na własną odpowiedzialność.'
      },
      {
        heading: 'Własność intelektualna',
        body: 'Kod i nazwa CDV Dziś należą do autorów projektu, dopóki umowa z Collegium Da Vinci nie przeniesie praw albo nie udzieli licencji. Nazwa, logo i materiały Collegium Da Vinci pozostają własnością uczelni. Do czasu umowy aplikacja nie jest oficjalnym produktem CDV.'
      },
      {
        heading: 'Zmiany i kontakt',
        body: 'Regulamin może się zmieniać wraz z aplikacją. Data: 5 września 2026 r.'
      }
    ]
  },
  deletion: {
    title: 'Usuwanie danych',
    subtitle: 'Jak skasować dane CDV Dziś z telefonu',
    sections: [
      {
        heading: 'Brak konta w chmurze',
        body: 'CDV Dziś nie zakłada konta na serwerach autorów. Nie przechowujemy Twojego loginu, hasła ani planu poza Twoim urządzeniem. Usunięcie danych w aplikacji albo odinstalowanie aplikacji usuwa dane, które aplikacja zapisała lokalnie.'
      },
      {
        heading: 'W aplikacji',
        body: '1) Wyloguj — usuwa bieżącą sesję. 2) Na ekranie logowania możesz usunąć pojedynczy zapamiętany profil. 3) W ustawieniach wybierz „Usuń wszystkie dane”, aby skasować loginy, hasła, profile, plan, pliki cookie sesji Wirtualnej Uczelni i dane studenta z tego telefonu.'
      },
      {
        heading: 'Odinstalowanie',
        body: 'Odinstalowanie CDV Dziś usuwa lokalny magazyn aplikacji na tym urządzeniu. Konto w Wirtualnej Uczelni CDV pozostaje bez zmian — tym zarządza wyłącznie uczelnia.'
      },
      {
        heading: 'Czego nie możemy usunąć',
        body: 'Nie mamy dostępu do konta w wu.cdv.pl ani Blackboard. Żądania usunięcia konta studenckiego kieruj do Collegium Da Vinci.'
      }
    ]
  }
};
