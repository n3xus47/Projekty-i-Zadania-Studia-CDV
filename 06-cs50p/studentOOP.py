class Student:
    def __init__(self, name, house):
        if not name:
            raise ValueError("Student must have a name")
        if house not in ["Gryffindor", "Hufflepuff","Slytherin","Ravenclaw"]:
            raise ValueError("Student must have a house")
        self.name = name
        self.house = house

    def __str__(self):
        return f"{self.name} from {self.house}"

    @classmethod
    def get(cls):
        name = input("Enter your name: ")
        house = input("Enter your house: ")
        return cls(name, house)

def main():
    print(Student.get())

if __name__ == "__main__":
    main()
