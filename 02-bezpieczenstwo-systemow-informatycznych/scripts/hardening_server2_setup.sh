#!/bin/bash
# Linux Hardening - passwd tests on server2
set -e
cd /home/geeko

echo linux | sudo -S ip link set eth5 up 2>/dev/null || true
echo linux | sudo -S ip addr add 192.168.1.2/24 dev eth5 2>/dev/null || true

# Set password remember via PAM (YaST equivalent)
echo linux | sudo -S sed -i 's/\(pam_unix\.so.*\)/\1 remember=5/' /etc/pam.d/common-password 2>/dev/null || true
echo linux | sudo -S grep pam_unix /etc/pam.d/common-password | head -1

# Ensure pwquality checks active
echo linux | sudo -S grep -E 'remember|pam_pwquality' /etc/pam.d/common-password || true
