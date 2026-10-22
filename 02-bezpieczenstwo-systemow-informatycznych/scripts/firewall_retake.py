#!/usr/bin/env python3
import subprocess
import time

OUT = "/home/n3xus/Projekty/BezpCDV/screenshots/firewall"
VM1 = "SLES 3125-server1 1"
VM2 = "SLES 3125-server2"

FTP_TEST = (
    "timeout 5 curl -s --connect-timeout 4 ftp://geeko:linux@192.168.1.1/ 2>&1; "
    "echo '---'; "
    "timeout 3 bash -c 'echo > /dev/tcp/192.168.1.1/21' 2>/dev/null "
    "&& echo 'Port 21: OTWARTY' || echo 'Port 21: ZAMKNIETY'"
)


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


def main():
    # ensure vsftpd + network on server1
    ensure_geeko(VM1)
    cmd(
        VM1,
        "echo linux | sudo -S ip link set eth2 up; "
        "echo linux | sudo -S ip addr add 192.168.1.1/24 dev eth2 2>/dev/null; "
        "echo linux | sudo -S zypper -n in vsftpd 2>&1 | tail -2; "
        "echo linux | sudo -S systemctl start vsftpd 2>/dev/null; "
        "echo linux | sudo -S systemctl is-active vsftpd",
        120,
    )

    ensure_geeko(VM2)
    cmd(
        VM2,
        "echo linux | sudo -S ip link set eth5 up; "
        "echo linux | sudo -S ip addr add 192.168.1.2/24 dev eth5 2>/dev/null; true",
        3,
    )

    # firewall off - ftp should work
    ensure_geeko(VM1)
    cmd(VM1, 'echo linux | sudo -S sed -i \'s/^START_FW=.*/START_FW="no"/\' /etc/sysconfig/SuSEfirewall2', 2)
    cmd(VM1, "echo linux | sudo -S SuSEfirewall2 stop 2>/dev/null; true", 5)

    ensure_geeko(VM2)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "=== FTP przed firewallem ==="', 1)
    cmd(VM2, FTP_TEST, 12)
    shot(VM2, f"{OUT}/firewall01_ftp_before.png")

    # enable firewall block ftp
    ensure_geeko(VM1)
    cmd(VM1, 'echo linux | sudo -S sed -i \'s/^START_FW=.*/START_FW="yes"/\' /etc/sysconfig/SuSEfirewall2', 2)
    cmd(VM1, 'echo linux | sudo -S sed -i \'s/^FW_DEV_EXT=.*/FW_DEV_EXT="eth2"/\' /etc/sysconfig/SuSEfirewall2', 2)
    cmd(VM1, 'echo linux | sudo -S sed -i \'s/^FW_SERVICES_EXT=.*/FW_SERVICES_EXT=""/\' /etc/sysconfig/SuSEfirewall2', 2)
    cmd(VM1, 'echo linux | sudo -S sed -i \'s/^FW_SERVICES_EXT_TCP=.*/FW_SERVICES_EXT_TCP=""/\' /etc/sysconfig/SuSEfirewall2', 2)
    cmd(VM1, "echo linux | sudo -S SuSEfirewall2 restart; echo linux | sudo -S SuSEfirewall2 status | head -3", 10)

    ensure_geeko(VM2)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "=== FTP po wlaczeniu SuSEfirewall2 (zablokowane) ==="', 1)
    cmd(VM2, FTP_TEST, 15)
    shot(VM2, f"{OUT}/firewall02_ftp_blocked.png")

    # allow vsftpd
    ensure_geeko(VM1)
    cmd(VM1, 'echo linux | sudo -S sed -i \'s/^FW_SERVICES_EXT=.*/FW_SERVICES_EXT="vsftpd"/\' /etc/sysconfig/SuSEfirewall2', 2)
    cmd(VM1, 'echo linux | sudo -S sed -i \'s/^FW_SERVICES_EXT_TCP=.*/FW_SERVICES_EXT_TCP="vsftpd"/\' /etc/sysconfig/SuSEfirewall2', 2)
    cmd(VM1, "echo linux | sudo -S SuSEfirewall2 restart", 8)

    ensure_geeko(VM2)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "=== FTP po dodaniu vsftpd (dziala) ==="', 1)
    cmd(VM2, FTP_TEST, 12)
    shot(VM2, f"{OUT}/firewall03_ftp_allowed.png")

    print("done")


if __name__ == "__main__":
    main()
