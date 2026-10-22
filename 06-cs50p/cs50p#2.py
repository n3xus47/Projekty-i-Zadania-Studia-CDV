def main():
    name = input("Please enter your name: ").strip().title()
    hello(name)

def hello(to):
    print("Hello",to)

main()
