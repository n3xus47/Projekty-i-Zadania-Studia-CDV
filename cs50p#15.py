students = [
    {"name": "harry", "age": 23, "city": "warsaw"},
    {"name": "olivier", "age": 24, "city": "paris"},
    {"name": "mark", "age": 20, "city": None},
    {"name": "david", "age": 21, "city": "paris"},
]

for student in students:
    print(student["name"], student["age"], student["city"], sep=", ")