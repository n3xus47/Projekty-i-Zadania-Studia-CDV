#!/bin/bash
set -e
echo linux | sudo -S ip link set eth2 up 2>/dev/null || true
echo linux | sudo -S ip addr add 192.168.1.1/24 dev eth2 2>/dev/null || true
echo linux | sudo -S bash -c 'echo 0 > /proc/sys/net/ipv4/icmp_echo_ignore_all' 2>/dev/null || true
echo linux | sudo -S zypper -n in vsftpd 2>&1 | tail -5
echo linux | sudo -S systemctl enable vsftpd
echo linux | sudo -S systemctl start vsftpd
echo linux | sudo -S sed -i 's/^START_FW=.*/START_FW="no"/' /etc/sysconfig/SuSEfirewall2
echo linux | sudo -S SuSEfirewall2 stop 2>/dev/null || true
systemctl is-active vsftpd 2>/dev/null || echo linux | sudo -S systemctl status vsftpd | head -3
