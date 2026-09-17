#!/usr/bin/env python3
import base64
import subprocess
import time

OUT = "/home/n3xus/Projekty/BezpCDV/screenshots/hardening"
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


def pass_lines(vm, *passwords, wait=3):
    for p in passwords:
        time.sleep(wait)
        kb_s(vm, p + "\n")
        time.sleep(1)


def ensure_geeko(vm):
    tty2(vm)
    cmd(vm, "geeko", 1)
    cmd(vm, "linux", 4)


def deploy(vm, script_name, wait=8):
    data = base64.b64encode(open(f"{SCRIPTS}/{script_name}", "rb").read()).decode()
    chunks = [data[i : i + 120] for i in range(0, len(data), 120)]
    cmd(vm, "cd ~ && rm -f /tmp/b64 /tmp/run.sh", 1)
    for ch in chunks:
        cmd(vm, f"printf '%s' '{ch}' >> /tmp/b64", 0.3)
    cmd(vm, "base64 -d /tmp/b64 > /tmp/run.sh && chmod +x /tmp/run.sh && bash /tmp/run.sh", wait)


def main():
    # --- Kernel hardening: ping before ---
    ensure_geeko(VM2)
    deploy(VM2, "hardening_server2_setup.sh", 5)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "Hardening - ping server1 PRZED zmiana kernel"', 1)
    cmd(VM2, "ping -c 3 192.168.1.1", 6)
    shot(VM2, f"{OUT}/hardening01_ping_before.png")

    # Enable ignore ping on server1
    ensure_geeko(VM1)
    deploy(VM1, "hardening_server1.sh", 5)
    cmd(VM1, "clear", 1)
    cmd(VM1, 'echo "Hardening - ignorowanie ping (icmp_echo_ignore_all=1)"', 1)
    cmd(VM1, "cat /proc/sys/net/ipv4/icmp_echo_ignore_all", 1)
    shot(VM1, f"{OUT}/hardening02_ignore_ping_enabled.png")

    # Ping after - should fail
    ensure_geeko(VM2)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "Hardening - ping server1 PO zmianie (brak odpowiedzi)"', 1)
    cmd(VM2, "ping -c 3 192.168.1.1", 8)
    shot(VM2, f"{OUT}/hardening03_ping_blocked.png")

    # Revert ping on server1 for future labs
    cmd(VM1, 'echo linux | sudo -S bash -c "echo 0 > /proc/sys/net/ipv4/icmp_echo_ignore_all"', 2)

    # --- Password hardening tests ---
    ensure_geeko(VM2)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "YaST/PAM - test hasla slownikowego (sles12)"', 1)
    cmd(VM2, "passwd", 1)
    pass_lines(VM2, "linux", "sles12", "sles12", wait=2)
    time.sleep(2)
    shot(VM2, f"{OUT}/hardening04_passwd_dictionary_fail.png")

    # Reset password to linux if changed
    cmd(VM2, "echo linux | sudo -S chpasswd <<< 'geeko:linux' 2>/dev/null || echo linux | sudo -S bash -c \"echo geeko:linux | chpasswd\"", 3)

    print("done")


if __name__ == "__main__":
    main()
