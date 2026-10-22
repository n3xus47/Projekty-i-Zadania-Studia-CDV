#!/bin/bash
export GNUPGHOME=/home/geeko/.gnupg
GP=4lic3w0nd3rl4nd
cd /home/geeko
ls -l encrypt_to_alice.gpg cleartext.txt.asc
echo "=== DECRYPT ==="
gpg --batch --yes --passphrase "$GP" --decrypt encrypt_to_alice.gpg
echo "=== VERIFY ==="
gpg --verify cleartext.txt.asc
