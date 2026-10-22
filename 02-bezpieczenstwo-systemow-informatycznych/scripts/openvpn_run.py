#!/usr/bin/env python3
import base64
import os
import subprocess
import time

OUT = "/home/n3xus/Projekty/BezpCDV/screenshots/openvpn"
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


def pass_scp(vm, wait=5):
    time.sleep(wait)
    kb_s(vm, "linux\n")
    time.sleep(2)


def ensure_geeko(vm):
    tty1(vm)
    cmd(vm, "geeko", 1)
    cmd(vm, "linux", 5)


def deploy(vm, script_name, wait=60, scp_at_end=False):
    secret_b64 = base64.b64encode(open(f"{SCRIPTS}/openvpn_secret.key", "rb").read()).decode()
    content = open(f"{SCRIPTS}/{script_name}", "r").read().replace("__SECRET_B64__", secret_b64)
    data = base64.b64encode(content.encode()).decode()
    chunks = [data[i : i + 120] for i in range(0, len(data), 120)]
    cmd(vm, "cd ~ && rm -f /tmp/b64 /tmp/run.sh", 1)
    for ch in chunks:
        cmd(vm, f"printf '%s' '{ch}' >> /tmp/b64", 0.3)
    cmd(vm, "base64 -d /tmp/b64 > /tmp/run.sh && chmod +x /tmp/run.sh && bash /tmp/run.sh", wait)
    if scp_at_end:
        pass_scp(vm, 6)


def main():
    # Server2: install, genkey, start openvpn@server
    ensure_geeko(VM2)
    deploy(VM2, "openvpn_s2_server.sh", wait=90, scp_at_end=True)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "=== OpenVPN SERVER (server2) ==="', 1)
    cmd(VM2, "echo linux | sudo -S systemctl status openvpn@server | head -10", 4)
    cmd(VM2, "echo linux | sudo -S cat /etc/openvpn/server.conf", 2)
    shot(VM2, f"{OUT}/openvpn01_server_setup.png")

    # Server1: client config + tunnel
    ensure_geeko(VM1)
    deploy(VM1, "openvpn_s1_client.sh", wait=120, scp_at_end=True)
    cmd(VM1, "clear", 1)
    cmd(VM1, 'echo "=== OpenVPN CLIENT - interfejs tun0 ==="', 1)
    cmd(VM1, "echo linux | sudo -S ip addr show tun0", 3)
    shot(VM1, f"{OUT}/openvpn02_tunnel_up.png")

    cmd(VM1, "clear", 1)
    cmd(VM1, 'echo "=== Ping przez tunel VPN: 10.0.0.1 ==="', 1)
    cmd(VM1, "ping -c 4 -I tun0 10.0.0.1", 10)
    shot(VM1, f"{OUT}/openvpn03_ping_tunnel.png")

    # Server2: log / connection proof
    ensure_geeko(VM2)
    cmd(VM2, "clear", 1)
    cmd(VM2, 'echo "=== OpenVPN - polaczenie z server1 (log) ==="', 1)
    cmd(VM2, "echo linux | sudo -S grep -i openvpn /var/log/messages 2>/dev/null | tail -8", 4)
    cmd(VM2, "echo linux | sudo -S ip addr show tun0 2>/dev/null | head -6", 3)
    shot(VM2, f"{OUT}/openvpn04_server_connected.png")

    print("done")


if __name__ == "__main__":
    main()
