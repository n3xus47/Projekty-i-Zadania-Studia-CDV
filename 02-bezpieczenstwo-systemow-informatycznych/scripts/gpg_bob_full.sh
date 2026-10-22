#!/bin/bash
export GNUPGHOME=/home/geeko/.gnupg
GP=4lic3w0nd3rl4nd
IP_S2=192.168.1.2
cd /home/geeko
echo linux | sudo -S ip link set eth2 up 2>/dev/null || true
echo linux | sudo -S ip addr add 192.168.1.1/24 dev eth2 2>/dev/null || true
eval $(ssh-agent -s) >/dev/null
echo sles12 | ssh-add ~/.ssh/id_rsa 2>/dev/null || true
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
rm -f bob_gpg.pub
gpg --armor -o bob_gpg.pub --export bob@example.com
scp -o StrictHostKeyChecking=no bob_gpg.pub ${IP_S2}:
scp -o StrictHostKeyChecking=no ${IP_S2}:alice_gpg.pub .
gpg --import alice_gpg.pub
gpg --batch --yes --passphrase "$GP" --sign-key alice@example.com
echo "Tajna wiadomosc" > cleartext.txt
gpg --batch --yes --passphrase "$GP" --encrypt -o encrypt_to_alice.gpg --recipient alice@example.com cleartext.txt
gpg --batch --yes --passphrase "$GP" --clearsign -o cleartext.txt.asc cleartext.txt
scp -o StrictHostKeyChecking=no encrypt_to_alice.gpg cleartext.txt.asc ${IP_S2}:
gpg --list-keys
ls -l encrypt_to_alice.gpg cleartext.txt.asc
