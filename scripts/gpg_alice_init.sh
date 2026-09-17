#!/bin/bash
export GNUPGHOME=/home/geeko/.gnupg
GP=4lic3w0nd3rl4nd
IP_S1=192.168.1.1
cd /home/geeko
eval $(ssh-agent -s) >/dev/null
echo sles12 | ssh-add ~/.ssh/id_rsa 2>/dev/null || true
echo linux | sudo -S ip link set eth5 up 2>/dev/null || true
echo linux | sudo -S ip addr add 192.168.1.2/24 dev eth5 2>/dev/null || true
if ! gpg --list-keys alice@example.com >/dev/null 2>&1; then
  cat > /tmp/alice.batch <<EOF
Key-Type: RSA
Key-Length: 4096
Name-Real: Alice
Name-Email: alice@example.com
Name-Comment: This is Alice
Expire-Date: 36m
Passphrase: ${GP}
%commit
EOF
  gpg --batch --gen-key /tmp/alice.batch
fi
rm -f alice_gpg.pub
gpg --armor -o alice_gpg.pub --export alice@example.com
scp -o StrictHostKeyChecking=no alice_gpg.pub ${IP_S1}:
gpg --list-keys
