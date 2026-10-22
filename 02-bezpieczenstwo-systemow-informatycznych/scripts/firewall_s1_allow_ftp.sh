#!/bin/bash
echo linux | sudo -S sed -i 's/^FW_SERVICES_EXT=.*/FW_SERVICES_EXT="vsftpd"/' /etc/sysconfig/SuSEfirewall2
echo linux | sudo -S sed -i 's/^FW_SERVICES_EXT_TCP=.*/FW_SERVICES_EXT_TCP="vsftpd"/' /etc/sysconfig/SuSEfirewall2
echo linux | sudo -S SuSEfirewall2 restart
grep '^FW_SERVICES_EXT=' /etc/sysconfig/SuSEfirewall2
