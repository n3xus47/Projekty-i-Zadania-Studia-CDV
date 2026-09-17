#!/bin/bash
install_openvpn() {
  if rpm -q openvpn >/dev/null 2>&1; then
    rpm -q openvpn
    return 0
  fi
  echo linux | sudo -S mkdir -p /mnt/slesdvd
  echo linux | sudo -S umount /mnt/slesdvd 2>/dev/null || true
  echo linux | sudo -S mount -o ro /dev/sr0 /mnt/slesdvd 2>/dev/null || \
  echo linux | sudo -S mount -o ro /dev/cdrom /mnt/slesdvd
  echo linux | sudo -S zypper mr -d SLES12-12-0 2>/dev/null || true
  echo linux | sudo -S zypper rr SLE12SP5-DVD 2>/dev/null || true
  echo linux | sudo -S zypper ar -fcg "dir:/mnt/slesdvd" SLE12SP5-DVD
  echo linux | sudo -S zypper --non-interactive --no-gpg-checks ref SLE12SP5-DVD 2>&1 | tail -4
  echo linux | sudo -S zypper -n in openvpn 2>&1 | tail -8
  rpm -q openvpn
}
