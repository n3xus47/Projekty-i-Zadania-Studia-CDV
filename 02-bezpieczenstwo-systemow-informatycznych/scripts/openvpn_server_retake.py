#!/usr/bin/env python3
"""Fix OpenVPN server-side screenshots (01, 04) via direct VM commands."""
import base64
import subprocess
import time

OUT = "/home/n3xus/Projekty/BezpCDV/screenshots/openvpn"
SCRIPTS = "/home/n3xus/Projekty/BezpCDV/scripts"
VM1 = "SLES 3125-server1 1"
VM2 = "SLES 3125-server2"
SECRET_B64 = base64.b64encode(open(f"{SCRIPTS}/openvpn_secret.key", "rb").read()).decode()


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


def pass_scp(vm, wait=5):
    time.sleep(wait)
    kb_s(vm, "linux\n")
    time.sleep(2)


def ensure_geeko(vm):
    tty1(vm)
    cmd(vm, "geeko", 1)
    cmd(vm, "linux", 5)


def setup_server2():
    ensure_geeko(VM2)
    cmd(
        VM2,
        "echo linux | sudo -S ip link set eth5 up; "
        "echo linux | sudo -S ip addr add 192.168.1.2/24 dev eth5 2>/dev/null; true",
        3,
    )
    cmd(VM2, "rpm -q openvpn || echo NEED_INSTALL", 2)
    cmd(
        VM2,
        "rpm -q openvpn >/dev/null 2>&1 || "
        "(echo linux | sudo -S zypper -n in openvpn 2>&1 | tail -5)",
        180,
    )
    cmd(VM2, "echo linux | sudo -S mkdir -p /etc/openvpn", 2)
    half = len(SECRET_B64) // 2
    cmd(VM2, f"printf '%s' '{SECRET_B64[:half]}' > /tmp/sk.b64", 1)
    cmd(VM2, f"printf '%s' '{SECRET_B64[half:]}' >> /tmp/sk.b64", 1)
    cmd(
        VM2,
        "echo linux | sudo -S bash -c 'base64 -d /tmp/sk.b64 > /etc/openvpn/secret.key'",
        2,
    )
    cmd(VM2, "echo linux | sudo -S chmod 600 /etc/openvpn/secret.key", 2)
    cmd(
        VM2,
        "echo linux | sudo -S bash -c \"printf 'dev tun\\nifconfig 10.0.0.1 10.0.0.2\\nsecret secret.key\\n' > /etc/openvpn/server.conf\"",
        2,
    )
    cmd(VM2, "echo linux | sudo -S systemctl stop SuSEfirewall2 2>/dev/null; true", 3)
    cmd(VM2, "echo linux | sudo -S bash -c 'echo 1 > /proc/sys/net/ipv4/ip_forward'", 2)
    cmd(VM2, "echo linux | sudo -S systemctl restart openvpn@server", 5)
    cmd(VM2, "echo linux | sudo -S cp /etc/openvpn/secret.key /tmp/secret.key", 2)
    cmd(VM2, "echo linux | sudo -S chmod 644 /tmp/secret.key", 2)
    cmd(
        VM2,
        "scp -o StrictHostKeyChecking=no -o PreferredAuthentications=password "
        "-o PubkeyAuthentication=no /tmp/secret.key geeko@192.168.1.1:/tmp/secret.key",
        2,
    )
    pass_scp(VM2, 6)


def setup_client():
    ensure_geeko(VM1)
    cmd(
        VM1,
        "echo linux | sudo -S ip link set eth2 up; "
        "echo linux | sudo -S ip addr add 192.168.1.1/24 dev eth2 2>/dev/null; true",
        3,
    )
    cmd(VM1, "test -f /tmp/secret.key && echo linux | sudo -S cp /tmp/secret.key /etc/openvpn/secret.key || true", 2)
    cmd(VM1, "echo linux | sudo -S chmod 600 /etc/openvpn/secret.key", 2)
    cmd(
        VM1,
        "echo linux | sudo -S bash -c \"printf 'remote 192.168.1.2\\ndev tun\\nifconfig 10.0.0.2 10.0.0.1\\nsecret secret.key\\n' > /etc/openvpn/client.conf\"",
        2,
    )
    cmd(VM1, "echo linux | sudo -S systemctl restart openvpn@client", 5)
    time.sleep(3)


def main():
    setup_server2()
    setup_client()

    ensure_geeko(VM2)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "=== OpenVPN SERVER (server2) ==="', 1)
    cmd(VM2, "echo linux | sudo -S systemctl status openvpn@server | head -12", 4)
    cmd(VM2, "echo linux | sudo -S cat /etc/openvpn/server.conf", 2)
    shot(VM2, f"{OUT}/openvpn01_server_setup.png")

    ensure_geeko(VM1)
    cmd(VM1, "clear", 1)
    cmd(VM1, 'echo "=== OpenVPN CLIENT - interfejs tun0 ==="', 1)
    cmd(VM1, "echo linux | sudo -S ip addr show tun0", 3)
    shot(VM1, f"{OUT}/openvpn02_tunnel_up.png")

    cmd(VM1, "clear", 1)
    cmd(VM1, 'echo "=== Ping przez tunel VPN: 10.0.0.1 ==="', 1)
    cmd(VM1, "ping -c 4 -I tun0 10.0.0.1", 10)
    shot(VM1, f"{OUT}/openvpn03_ping_tunnel.png")

    ensure_geeko(VM2)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "=== OpenVPN - polaczenie z server1 (log) ==="', 1)
    cmd(VM2, "echo linux | sudo -S systemctl is-active openvpn@server", 3)
    cmd(VM2, "echo linux | sudo -S ip addr show tun0 | head -6", 3)
    cmd(VM2, "echo linux | sudo -S grep -i openvpn /var/log/messages 2>/dev/null | tail -5", 4)
    shot(VM2, f"{OUT}/openvpn04_server_connected.png")

    print("done")


if __name__ == "__main__":
    main()
