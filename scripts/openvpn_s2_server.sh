#!/bin/bash
set -e
IP_S1=192.168.1.1
SECRET_B64='__SECRET_B64__'
echo linux | sudo -S ip link set eth5 up 2>/dev/null || true
echo linux | sudo -S ip addr add 192.168.1.2/24 dev eth5 2>/dev/null || true
if ! rpm -q openvpn >/dev/null 2>&1; then
  echo linux | sudo -S mkdir -p /mnt/slesdvd
  echo linux | sudo -S mount -o ro /dev/sr0 /mnt/slesdvd 2>/dev/null || true
  echo linux | sudo -S zypper mr -d SLES12-12-0 2>/dev/null || true
  echo linux | sudo -S zypper rr SLE12SP5-DVD 2>/dev/null || true
  echo linux | sudo -S zypper ar -fcg "dir:/mnt/slesdvd" SLE12SP5-DVD 2>/dev/null || true
  echo linux | sudo -S zypper --no-gpg-checks ref SLE12SP5-DVD 2>&1 | tail -2
  echo linux | sudo -S zypper -n in openvpn 2>&1 | tail -4
fi
echo linux | sudo -S mkdir -p /etc/openvpn
echo "$SECRET_B64" | base64 -d | sudo tee /etc/openvpn/secret.key >/dev/null
echo linux | sudo -S chmod 600 /etc/openvpn/secret.key
echo linux | sudo -S tee /etc/openvpn/server.conf >/dev/null <<'EOF'
dev tun
ifconfig 10.0.0.1 10.0.0.2
secret secret.key
EOF
echo linux | sudo -S systemctl stop SuSEfirewall2 2>/dev/null || true
echo linux | sudo -S bash -c 'echo 1 > /proc/sys/net/ipv4/ip_forward'
echo linux | sudo -S systemctl restart openvpn@server
sleep 2
echo linux | sudo -S systemctl is-active openvpn@server
echo linux | sudo -S ip addr show tun0 | head -6
echo linux | sudo -S cp /etc/openvpn/secret.key /tmp/secret.key
echo linux | sudo -S chmod 644 /tmp/secret.key
scp -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no /tmp/secret.key geeko@${IP_S1}:/tmp/secret.key
