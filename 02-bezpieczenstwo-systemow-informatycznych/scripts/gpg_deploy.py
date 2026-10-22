#!/usr/bin/env python3
import base64
import subprocess
import time

OUT = "/home/n3xus/Projekty/BezpCDV/screenshots/gpg"
SCRIPTS = "/home/n3xus/Projekty/BezpCDV/scripts"
VM1 = "SLES 3125-server1 1"
VM2 = "SLES 3125-server2"


def kb_sc(vm, *c):
    subprocess.run(["VBoxManage", "controlvm", vm, "keyboardputscancode"] + list(c), check=True)


def kb_s(vm, t):
    subprocess.run(["VBoxManage", "controlvm", vm, "keyboardputstring", t], check=True)


def shot(vm, p):
    subprocess.run(["VBoxManage", "controlvm", vm, "screenshotpng", p], check=True)


def tty2(vm):
    kb_sc(vm, "1d", "38", "3c", "9d", "b8", "bc")
    time.sleep(2)


def cmd(vm, c, w=2):
    kb_s(vm, c + "\n")
    time.sleep(w)


def ensure_geeko(vm):
    tty2(vm)
    cmd(vm, "geeko", 1)
    cmd(vm, "linux", 4)
    cmd(vm, "whoami", 1)
    # if root session, switch to geeko
    cmd(vm, "test $(whoami) = root && su - geeko -c 'echo switched' || echo already_geeko", 2)


def pass_scp(vm):
    time.sleep(4)
    kb_s(vm, "linux\n")
    time.sleep(3)


def deploy(vm, script_name, run_wait=30):
    path = f"{SCRIPTS}/{script_name}"
    data = base64.b64encode(open(path, "rb").read()).decode()
    chunks = [data[i : i + 120] for i in range(0, len(data), 120)]
    cmd(vm, "cd ~", 1)
    cmd(vm, "rm -f /tmp/b64 /tmp/run.sh", 1)
    for ch in chunks:
        cmd(vm, f"printf '%s' '{ch}' >> /tmp/b64", 0.4)
    cmd(vm, "base64 -d /tmp/b64 > /tmp/run.sh && chmod +x /tmp/run.sh", 2)
    cmd(vm, "bash /tmp/run.sh", run_wait)
    # scp may ask password once at end
    pass_scp(vm)


def main():
    # screenshots for empty keyring / bob key - use existing if good
    ensure_geeko(VM1)
    cmd(VM1, "clear", 1)
    cmd(VM1, 'echo "GPG - Bob: pusta keyring"', 1)
    cmd(VM1, "gpg --list-keys 2>&1 | head -5", 2)
    shot(VM1, f"{OUT}/gpg01_bob_empty_keyring.png")

    # Step 1: Alice init on server2
    ensure_geeko(VM2)
    cmd(VM2, "eval $(ssh-agent -s) >/dev/null; echo sles12 | ssh-add ~/.ssh/id_rsa 2>/dev/null", 2)
    deploy(VM2, "gpg_alice_init.sh", 40)
    pass_scp(VM2)
    cmd(VM2, "gpg --list-keys", 2)
    shot(VM2, f"{OUT}/gpg04_alice_key_created.png")

    # Step 2: Bob full on server1
    ensure_geeko(VM1)
    cmd(VM1, "eval $(ssh-agent -s) >/dev/null; echo sles12 | ssh-add ~/.ssh/id_rsa 2>/dev/null", 2)
    deploy(VM1, "gpg_bob_full.sh", 45)
    pass_scp(VM1)
    cmd(VM1, "gpg --list-keys", 2)
    shot(VM1, f"{OUT}/gpg02_bob_key_created.png")
    shot(VM1, f"{OUT}/gpg06_bob_sign_alice.png")
    cmd(VM1, "ls -l encrypt_to_alice.gpg cleartext.txt.asc", 2)
    shot(VM1, f"{OUT}/gpg08_bob_encrypt_sign.png")

    # Step 3: Alice sign bob
    ensure_geeko(VM2)
    cmd(VM2, "eval $(ssh-agent -s) >/dev/null; echo sles12 | ssh-add ~/.ssh/id_rsa 2>/dev/null", 2)
    deploy(VM2, "gpg_alice_sign.sh", 20)
    pass_scp(VM2)
    cmd(VM2, "gpg --list-keys", 2)
    shot(VM2, f"{OUT}/gpg07_alice_sign_bob.png")

    # Step 4: Alice decrypt
    ensure_geeko(VM2)
    deploy(VM2, "gpg_alice_decrypt.sh", 15)
    shot(VM2, f"{OUT}/gpg09_alice_decrypt.png")
    cmd(VM2, "gpg --verify cleartext.txt.asc", 3)
    shot(VM2, f"{OUT}/gpg10_alice_verify.png")

    # export scp screenshot
    ensure_geeko(VM1)
    cmd(VM1, "ls -l bob_gpg.pub; scp -o StrictHostKeyChecking=no bob_gpg.pub 192.168.1.2:", 1)
    pass_scp(VM1)
    shot(VM1, f"{OUT}/gpg03_bob_export_scp.png")
    ensure_geeko(VM2)
    cmd(VM2, "ls -l alice_gpg.pub; scp -o StrictHostKeyChecking=no alice_gpg.pub 192.168.1.1:", 1)
    pass_scp(VM2)
    shot(VM2, f"{OUT}/gpg05_alice_export_scp.png")

    print("done")


if __name__ == "__main__":
    main()
