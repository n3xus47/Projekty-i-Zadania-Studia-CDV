#!/usr/bin/env python3
import base64
import os
import subprocess
import time

OUT = "/home/n3xus/Projekty/BezpCDV/screenshots/firewall"
SCRIPTS = "/home/n3xus/Projekty/BezpCDV/scripts"
VM1 = "SLES 3125-server1 1"
VM2 = "SLES 3125-server2"

os.makedirs(OUT, exist_ok=True)


def kb_sc(vm, *c):
    subprocess.run(["VBoxManage", "controlvm", vm, "keyboardputscancode"] + list(c), check=True)


def kb_s(vm, t):
    subprocess.run(["VBoxManage", "controlvm", vm, "keyboardputstring", t], check=True)


def shot(vm, p):
    subprocess.run(["VBoxManage", "controlvm", vm, "screenshotpng", p], check=True)


def tty1(vm):
    kb_sc(vm, "1d", "38", "3b", "9d", "b8", "bb")
    time.sleep(2)


def cmd(vm, c, w=2):
    kb_s(vm, c + "\n")
    time.sleep(w)


def ensure_geeko(vm):
    tty1(vm)
    cmd(vm, "geeko", 1)
    cmd(vm, "linux", 5)


def deploy(vm, script_name, wait=20):
    data = base64.b64encode(open(f"{SCRIPTS}/{script_name}", "rb").read()).decode()
    chunks = [data[i : i + 120] for i in range(0, len(data), 120)]
    cmd(vm, "cd ~ && rm -f /tmp/b64 /tmp/run.sh", 1)
    for ch in chunks:
        cmd(vm, f"printf '%s' '{ch}' >> /tmp/b64", 0.3)
    cmd(vm, "base64 -d /tmp/b64 > /tmp/run.sh && chmod +x /tmp/run.sh && bash /tmp/run.sh", wait)


def ftp_test(vm, label, outfile, wait=12):
    cmd(vm, "clear", 1)
    cmd(vm, f'echo "=== {label} ==="', 1)
    cmd(
        vm,
        "lftp -e 'ls; bye' -u geeko,linux 192.168.1.1 2>&1 || echo 'POLACZENIE FTP NIEUDANE (zablokowane przez firewall)'",
        wait,
    )
    shot(vm, outfile)


def main():
    ensure_geeko(VM1)
    deploy(VM1, "firewall_s1_install.sh", 90)

    ensure_geeko(VM2)
    deploy(VM2, "firewall_s2_install.sh", 90)

    ftp_test(VM2, "FTP przed firewallem (powinno dzialac)", f"{OUT}/firewall01_ftp_before.png", 10)

    ensure_geeko(VM1)
    deploy(VM1, "firewall_s1_enable.sh", 25)

    ftp_test(
        VM2,
        "FTP po wlaczeniu SuSEfirewall2 (zablokowane)",
        f"{OUT}/firewall02_ftp_blocked.png",
        15,
    )

    ensure_geeko(VM1)
    deploy(VM1, "firewall_s1_allow_ftp.sh", 20)

    ftp_test(
        VM2,
        "FTP po dodaniu vsftpd do firewall (dziala)",
        f"{OUT}/firewall03_ftp_allowed.png",
        10,
    )

    ensure_geeko(VM1)
    cmd(VM1, "clear", 1)
    cmd(VM1, 'echo "=== SuSEfirewall2 / iptables -L ==="', 1)
    cmd(VM1, "echo linux | sudo -S iptables -L -n 2>&1 | head -25", 4)
    cmd(
        VM1,
        "grep -v '^#' /etc/sysconfig/SuSEfirewall2 | grep -v '^$' | grep -E 'START_FW|FW_DEV|FW_SERVICES'",
        2,
    )
    shot(VM1, f"{OUT}/firewall04_iptables_rules.png")

    print("done")


if __name__ == "__main__":
    main()
