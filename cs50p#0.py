#zadania z 1 filmu kursu cs50p by harvard university

# prosi o nazwe goscia
# usuwa spacje, puste pola z imienia uzytkownika za pomoca wbudowanej w stringa funkcji strip
# zmienia imie uzytkownika na 1 duzy znak (capitalize tylko 1 znak 1 slowa, dobre dla zdan)
name = input("Please enter your name: ").strip().title()

#podzielimy nazwe na imie i nazwisko
first, last = name.split(" ")

# drukuje przywitanie
print(f"Hello {first} {last}")


