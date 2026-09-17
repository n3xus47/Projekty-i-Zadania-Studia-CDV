#!/bin/bash
# Linux Hardening - password policy + ping ignore
set -e
cd /home/geeko

echo linux | sudo -S ip link set eth2 up 2>/dev/null || true
echo linux | sudo -S ip addr add 192.168.1.1/24 dev eth2 2>/dev/null || true

# Ignore ping on server1
echo linux | sudo -S bash -c 'echo 1 > /proc/sys/net/ipv4/icmp_echo_ignore_all'
echo linux | sudo -S cat /proc/sys/net/ipv4/icmp_echo_ignore_all
