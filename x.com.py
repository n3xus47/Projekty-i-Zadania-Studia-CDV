import re

url = input("Enter your url: ").strip()

username = re.sub(r"https://x.com/", "", url)
print(f"user: {username}")
