#!/bin/bash
export GNUPGHOME=/home/geeko/.gnupg
GP=4lic3w0nd3rl4nd
IP_S1=192.168.1.1
cd /home/geeko
eval $(ssh-agent -s) >/dev/null
echo sles12 | ssh-add ~/.ssh/id_rsa 2>/dev/null || true
scp -o StrictHostKeyChecking=no ${IP_S1}:bob_gpg.pub .
gpg --import bob_gpg.pub
gpg --batch --yes --passphrase "$GP" --sign-key bob@example.com
gpg --list-keys
