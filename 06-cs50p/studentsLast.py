import csv

name = input("Enter student name: ")
city = input("Enter city: ")

with open("studentsLast.csv", "a") as file:
    writer = csv.DictWriter(file, fieldnames=["name", "city"])
    writer.writerow({"name": name, "city": city})
