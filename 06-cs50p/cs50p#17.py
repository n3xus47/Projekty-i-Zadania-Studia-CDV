def main():
    x = get_int("Whats x?: ")
    print (f"x is {x}")

def get_int(prompt):
    while True:
        try:
            a = int(input(prompt))
            return a
        except ValueError:
            pass
main()