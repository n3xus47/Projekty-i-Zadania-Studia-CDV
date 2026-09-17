
def main():
    x = int(input("Please enter a number x: "))
    print(f"x do kwadratu to: {square(x)}")

def square(n):
    return n*n
    # moze byc return pow(n, 2) power do drugiej potegi inaczej
main()