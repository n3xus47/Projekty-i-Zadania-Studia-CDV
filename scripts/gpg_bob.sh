#!/bin/bash
set -e
export GNUPGHOME=/home/geeko/.gnupg
GP=4lic3w0nd3rl4nd
IP_S2=192.168.1.2
IP_S1=192.168.1.1

echo linux | sudo -S ip link set eth2 up 2>/dev/null || true
echo linux | sudo -S ip addr add 192.168.1.1/24 dev eth2 2>/dev/null || true
echo linux | sudo -S systemctl stop SuSEfirewall2 2>/dev/null || true

eval $(ssh-agent -s) >/dev/null
echo sles12 | SSH_ASKPASS=/bin/false DISPLAY=:0 ssh-add ~/.ssh/id_rsa 2>/dev/null || echo sles12 | ssh-add ~/.ssh/id_rsa 2>/dev/null || true

# Bob key if missing
if ! gpg --list-keys bob@example.com >/dev/null 2>&1; then
  cat > /tmp/bob.batch <<EOF
Key-Type: RSA
Key-Length: 4096
Name-Real: Robert
Name-Email: bob@example.com
Name-Comment: This is Bob
Expire-Date: 36m
Passphrase: ${GP}
%commit
EOF
  gpg --batch --gen-key /tmp/bob.batch
fi

rm -f bob_gpg.pub alice_gpg.pub encrypt_to_alice.gpg cleartext.txt cleartext.txt.asc
gpg --armor -o bob_gpg.pub --export bob@example.com
sshpass -p linux scp -o StrictHostKeyChecking=no bob_gpg.pub geeko@${IP_S2}: 2>/dev/null || scp -o StrictHostKeyChecking=no bob_gpg.pub ${IP_S2}: || true

# wait for alice pub from server2 - pull it
sleep 3
sshpass -p linux scp -o StrictHostKeyChecking=no geeko@${IP_S2}:alice_gpg.pub . 2>/dev/null || scp -o StrictHostKeyChecking=no ${IP_S2}:alice_gpg.pub . || true

if [ -f alice_gpg.pub ]; then
  gpg --import alice_gpg.pub
  gpg --batch --yes --passphrase "$GP" --sign-key alice@example.com
fi

echo "Tajna wiadomosc" > cleartext.txt
gpg --batch --yes --passphrase "$GP" --encrypt -o encrypt_to_alice.gpg --recipient alice@example.com cleartext.txt
gpg --batch --yes --passphrase "$GP" --clearsign -o cleartext.txt.asc cleartext.txt
sshpass -p linux scp -o StrictHostKeyChecking=no encrypt_to_alice.gpg cleartext.txt.asc geeko@${IP_S2}: 2>/dev/null || scp -o StrictHostKeyChecking=no encrypt_to_alice.gpg cleartext.txt.asc ${IP_S2}:

echo "=== BOB DONE ==="
gpg --list-keys
ls -l encrypt_to_alice.gpg cleartext.txt.asc bob_gpg.pub alice_gpg.pub 2>/dev/null || true
