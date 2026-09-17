#!/bin/bash
set -e
IP_S2=192.168.1.2
SECRET_B64='__SECRET_B64__'
echo linux | sudo -S ip link set eth2 up 2>/dev/null || true
echo linux | sudo -S ip addr add 192.168.1.1/24 dev eth2 2>/dev/null || true
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
if [ -f /tmp/secret.key ]; then
  echo linux | sudo -S cp /tmp/secret.key /etc/openvpn/secret.key
else
  echo "$SECRET_B64" | base64 -d | sudo tee /etc/openvpn/secret.key >/dev/null
fi
echo linux | sudo -S chmod 600 /etc/openvpn/secret.key
echo linux | sudo -S tee /etc/openvpn/client.conf >/dev/null <<EOF
remote ${IP_S2}
dev tun
ifconfig 10.0.0.2 10.0.0.1
secret secret.key
EOF
echo linux | sudo -S systemctl stop SuSEfirewall2 2>/dev/null || true
echo linux | sudo -S bash -c 'echo 1 > /proc/sys/net/ipv4/ip_forward'
echo linux | sudo -S systemctl restart openvpn@client
sleep 3
echo linux | sudo -S systemctl is-active openvpn@client
echo linux | sudo -S ip addr show tun0 | head -6
ping -c 3 -I tun0 10.0.0.1
