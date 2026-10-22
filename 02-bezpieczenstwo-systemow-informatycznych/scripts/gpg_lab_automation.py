#!/usr/bin/env python3
import subprocess
import time

OUT = "/home/n3xus/Projekty/BezpCDV/screenshots/gpg"
VM1 = "SLES 3125-server1 1"
VM2 = "SLES 3125-server2"
GPG_PASS = "4lic3w0nd3rl4nd"


def kb_sc(vm, *codes):
    subprocess.run(["VBoxManage", "controlvm", vm, "keyboardputscancode"] + list(codes), check=True)


def kb_s(vm, text):
    subprocess.run(["VBoxManage", "controlvm", vm, "keyboardputstring", text], check=True)


def shot(vm, path):
    subprocess.run(["VBoxManage", "controlvm", vm, "screenshotpng", path], check=True)


def tty2(vm):
    kb_sc(vm, "1d", "38", "3c", "9d", "b8", "bc")
    time.sleep(2)


def login(vm, wait=6):
    kb_s(vm, "geeko")
    kb_s(vm, "\n")
    time.sleep(2)
    kb_s(vm, "linux")
    kb_s(vm, "\n")
    time.sleep(wait)


def cmd(vm, c, w=2):
    kb_s(vm, c)
    kb_s(vm, "\n")
    time.sleep(w)


def pass_at(vm, pw, wait=4):
    time.sleep(wait)
    kb_s(vm, pw)
    kb_s(vm, "\n")
    time.sleep(3)


def net(vm, iface, ip):
    cmd(vm, f"echo linux | sudo -S ip link set {iface} up; echo linux | sudo -S ip addr add {ip}/24 dev {iface} 2>/dev/null; true", 2)
    cmd(vm, "echo linux | sudo -S systemctl stop SuSEfirewall2 2>/dev/null; echo linux | sudo -S systemctl start sshd 2>/dev/null; true", 2)


def agent(vm):
    cmd(vm, "eval $(ssh-agent -s) >/dev/null; ssh-add ~/.ssh/id_rsa 2>/dev/null", 1)
    pass_at(vm, "sles12", 2)


def write_keygen_batch(vm, path, name, email, comment):
    lines = [
        "Key-Type: RSA",
        "Key-Length: 4096",
        f"Name-Real: {name}",
        f"Name-Email: {email}",
        f"Name-Comment: {comment}",
        "Expire-Date: 36m",
        f"Passphrase: {GPG_PASS}",
    ]
    cmd(vm, f"rm -f {path}", 1)
    for line in lines:
        cmd(vm, f"echo '{line}' >> {path}", 0.8)
    cmd(vm, f"echo '%commit' >> {path}", 1)


def main():
    # Network
    tty2(VM1)
    login(VM1)
    net(VM1, "eth2", "192.168.1.1")
    agent(VM1)

    tty2(VM2)
    login(VM2)
    net(VM2, "eth5", "192.168.1.2")
    agent(VM2)

    # --- Bob on server1 ---
    tty2(VM1)
    login(VM1, 5)
    agent(VM1)
    cmd(VM1, "clear", 1)
    cmd(VM1, 'echo "GPG Lab - Bob (server1) - pusta keyring"', 1)
    cmd(VM1, "gpg --list-keys", 2)
    shot(VM1, f"{OUT}/gpg01_bob_empty_keyring.png")

    write_keygen_batch(VM1, "/tmp/bob.batch", "Robert", "bob@example.com", "This is Bob")
    cmd(VM1, "gpg --batch --gen-key /tmp/bob.batch", 15)
    cmd(VM1, "gpg --list-keys", 2)
    shot(VM1, f"{OUT}/gpg02_bob_key_created.png")

    cmd(VM1, "gpg --armor -o bob_gpg.pub --export bob@example.com", 2)
    cmd(VM1, "scp -o StrictHostKeyChecking=no bob_gpg.pub 192.168.1.2:", 1)
    pass_at(VM1, "linux", 4)
    shot(VM1, f"{OUT}/gpg03_bob_export_scp.png")

    # --- Alice on server2 ---
    tty2(VM2)
    login(VM2, 5)
    agent(VM2)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "GPG Lab - Alice (server2) - generowanie klucza"', 1)
    write_keygen_batch(VM2, "/tmp/alice.batch", "Alice", "alice@example.com", "This is Alice")
    cmd(VM2, "gpg --batch --gen-key /tmp/alice.batch", 15)
    cmd(VM2, "gpg --list-keys", 2)
    shot(VM2, f"{OUT}/gpg04_alice_key_created.png")

    cmd(VM2, "gpg --armor -o alice_gpg.pub --export alice@example.com", 2)
    cmd(VM2, "scp -o StrictHostKeyChecking=no alice_gpg.pub 192.168.1.1:", 1)
    pass_at(VM2, "linux", 4)
    shot(VM2, f"{OUT}/gpg05_alice_export_scp.png")

    # --- Bob imports and signs Alice ---
    tty2(VM1)
    login(VM1, 5)
    agent(VM1)
    cmd(VM1, "clear", 1)
    cmd(VM1, 'echo "Bob importuje i podpisuje klucz Alice"', 1)
    cmd(VM1, "gpg --import alice_gpg.pub", 3)
    cmd(VM1, f"gpg --batch --yes --passphrase {GPG_PASS} --sign-key alice@example.com", 5)
    cmd(VM1, "gpg --list-keys", 2)
    shot(VM1, f"{OUT}/gpg06_bob_sign_alice.png")

    # --- Alice imports and signs Bob ---
    tty2(VM2)
    login(VM2, 5)
    agent(VM2)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "Alice importuje i podpisuje klucz Bob"', 1)
    cmd(VM2, "gpg --import bob_gpg.pub", 3)
    cmd(VM2, f"gpg --batch --yes --passphrase {GPG_PASS} --sign-key bob@example.com", 5)
    cmd(VM2, "gpg --list-keys", 2)
    shot(VM2, f"{OUT}/gpg07_alice_sign_bob.png")

    # --- Bob encrypts and signs ---
    tty2(VM1)
    login(VM1, 5)
    agent(VM1)
    cmd(VM1, 'echo "Tajna wiadomosc" > cleartext.txt', 1)
    cmd(VM1, "clear", 1)
    cmd(VM1, 'echo "Bob szyfruje i podpisuje wiadomosc dla Alice"', 1)
    cmd(VM1, f"gpg --batch --yes --passphrase {GPG_PASS} --encrypt -o encrypt_to_alice.gpg --recipient alice@example.com cleartext.txt", 4)
    cmd(VM1, f"gpg --batch --yes --passphrase {GPG_PASS} --clearsign cleartext.txt", 4)
    cmd(VM1, "ls -l encrypt_to_alice.gpg cleartext.txt.asc", 2)
    shot(VM1, f"{OUT}/gpg08_bob_encrypt_sign.png")

    cmd(VM1, "scp -o StrictHostKeyChecking=no encrypt_to_alice.gpg cleartext.txt.asc 192.168.1.2:", 1)
    pass_at(VM1, "linux", 4)

    # --- Alice decrypts and verifies ---
    tty2(VM2)
    login(VM2, 5)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "Alice odszyfrowuje wiadomosc od Bob"', 1)
    cmd(VM2, f"gpg --batch --yes --passphrase {GPG_PASS} --decrypt encrypt_to_alice.gpg", 4)
    shot(VM2, f"{OUT}/gpg09_alice_decrypt.png")

    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "Alice weryfikuje podpis Bob"', 1)
    cmd(VM2, "gpg --verify cleartext.txt.asc", 4)
    shot(VM2, f"{OUT}/gpg10_alice_verify.png")

    print("done")


if __name__ == "__main__":
    main()
