# CDV Dziś — opis aplikacji

Aktualna wersja: **1.0.0**  
Pakiet: `pl.cdv.dzis`

## Cel

Aplikacja na Androida do szybkiego sprawdzania planu zajęć Collegium Da Vinci z Wirtualnej Uczelni, bez ręcznego wchodzenia w przeglądarkę za każdym razem.

## Zakres uczelni

Wyłącznie **Collegium Da Vinci**.

- Logowanie do `https://wu.cdv.pl/`.
- Konta: `@edu.cdv.pl`, `@cdv.pl`.
- Inny login jest odrzucany z komunikatem, że aplikacja jest tylko dla CDV.
- Skrót do Blackboard CDV w ustawieniach (dla `@edu.cdv.pl`).

## Funkcje

### Logowanie

- E-mail CDV i hasło do Wirtualnej Uczelni.
- Błędne dane zatrzymują na ekranie logowania.
- Opcja „Zapamiętaj profil”.
- Dane w `expo-secure-store`.

### Plan

- Pobranie planu semestru przy pierwszym logowaniu.
- Cache lokalny.
- Synchronizacja po starcie, po powrocie do aplikacji i cyklicznie.
- Komunikat o nowych albo usuniętych zajęciach.
- Widok dnia i miesiąca.

### Szczegóły zajęć

Nazwa, godziny, forma, tryb (online / sala), prowadzący, grupa, opis, link online — jeśli WU je zwraca.

### Interfejs

- Nagłówek **cdv dziś / jutro**.
- Kolory z identyfikacji CDV: fiolet, pomarańcz, zieleń.
- Motyw jasny i ciemny.
- Ustawienia: wylogowanie, portal uczelni, Blackboard, dokumenty prawne, usunięcie danych.

## Poza zakresem (pierwsza wersja dla uczelni)

- Powiadomienia push.
- Kalendarz systemowy.
- iOS (możliwe w ofercie jako dopłata).
- Logowanie innych uczelni.

## Uwagi

Do czasu umowy z CDV aplikacja nie jest oficjalnym produktem uczelni. Po umowie wymienić zdania w `src/legal.js` i w `docs/`.
