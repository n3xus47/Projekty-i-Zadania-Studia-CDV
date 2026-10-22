def main():
    x = int(input("enter a number: "))
    if is_even(x):
        print("even")
    else:
        print("odd")

def is_even(y):
    return y % 2 == 0

main()
