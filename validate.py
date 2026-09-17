import re

email = input("Enter your email: ").strip()

username, domain = email.split("@")

if re.search(r"^\w+@(\w+.)?\w+\.pl$", email, re.IGNORECASE):
    print("valid")
else:
    print("invalid")

print(f"user: {username}")
print(f"domain: {domain}")
