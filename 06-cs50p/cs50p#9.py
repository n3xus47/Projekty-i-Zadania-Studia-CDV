name = int(input("Please enter your name: "))

match name:
    case "Nikodem"|"Franek"|"Mateusz":
        print("Garbary")
    case "Alan":
        print("Szczepankowo")
    case _:
        print("nie wiem gdzie on mieszka")