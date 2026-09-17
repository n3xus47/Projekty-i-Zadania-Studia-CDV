#!/bin/bash
echo linux | sudo -S ip link set eth5 up 2>/dev/null || true
echo linux | sudo -S ip addr add 192.168.1.2/24 dev eth5 2>/dev/null || true
echo linux | sudo -S zypper -n in lftp 2>&1 | tail -5
