# CDV Dziś

Dedykowana kopia aplikacji planu zajęć **wyłącznie dla Collegium Da Vinci**.

Logowanie działa tylko na konta `@edu.cdv.pl` i `@cdv.pl`. Plan pochodzi z Wirtualnej Uczelni (`wu.cdv.pl`). Kolorystyka jest oparta na identyfikacji CDV z cdv.pl: fiolet `#7a00df` / `#a699fc`, pomarańcz `#fb7153`, zieleń `#66c981`.

To nie jest publiczny CoMamDziś. To osobny projekt, który można zabrać na uczelnię i powiedzieć: mamy działającą aplikację tylko dla was.

## Co zabrać na spotkanie

| Plik | Po co |
|---|---|
| `docs/DLA-UCZELNI.md` | Jedna strona do wydruku / PDF |
| `docs/OFERTA.md` | Warianty współpracy i kwoty |
| `docs/UMOWA-WSTEPNA.md` | Projekt umowy (do prawnika CDV) |
| `docs/PREZENTACJA.md` | Scenariusz 15 minut |
| ten README | Jak uruchomić demo na telefonie |

## Co robi aplikacja

- loguje wyłącznie do Wirtualnej Uczelni CDV,
- odrzuca loginy spoza domen CDV,
- pobiera plan, zaliczenia i spotkania ogólnouczelniane,
- zapisuje plan lokalnie (szybki start, bez logowania za każdym razem),
- pokazuje widok **Dziś** i **Miesiąc**,
- synchronizuje zmiany w tle i informuje, gdy coś zniknęło albo doszło,
- ma skróty do Wirtualnej Uczelni i Blackboard,
- motyw jasny i ciemny w kolorystyce CDV.

Nie zastępuje WU. Jest mobilną warstwą wygody nad tym, co uczelnia już ma.

## Uruchomienie demo

```bash
cd CDV-Dzis
npm install
npx expo start
```

Build APK:

```bash
npm run build:apk
```

Pakiet Android/iOS: `pl.cdv.dzis` (osobny od publicznego CoMamDziś, żeby obie aplikacje mogły być na jednym telefonie podczas prezentacji).

Nazwa na pulpicie: **CDV Dziś**.

## Bezpieczeństwo

- Login i hasło nie są w kodzie.
- Dane logowania: `expo-secure-store` na telefonie.
- Plan: lokalny `AsyncStorage`.
- Brak własnego serwera z danymi studentów.
- Aplikacja łączy się bezpośrednio z `wu.cdv.pl`.

## Dokumenty prawne w aplikacji

Teksty są w `src/legal.js` i w `docs/`. Do czasu umowy aplikacja **nie jest** oficjalnym produktem CDV — tak jest napisane w regulaminie. Po podpisaniu umowy te zdania trzeba wymienić.

## Relacja do CoMamDziś

Źródło: kopia projektu CoMamDziś z 5 września 2026 r. Publiczna aplikacja wielouczelniana zostaje osobno. W tej kopii logowanie innych uczelni jest wyłączone na poziomie wykrywania konta i klienta planu.
