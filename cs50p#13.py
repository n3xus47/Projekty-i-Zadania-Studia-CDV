def main():
    x = get_number()
    meow(x)

def get_number():
    while True:
        n = int(input("enter a number: "))
        if n > 0:
            return n

def meow(n):
    for _ in range(n):
        print ("meow")
main()
