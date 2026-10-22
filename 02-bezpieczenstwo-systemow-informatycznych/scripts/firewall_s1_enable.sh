#!/bin/bash
IF=eth2
echo linux | sudo -S bash -c "
grep -q '^START_FW=' /etc/sysconfig/SuSEfirewall2 || echo 'START_FW=\"yes\"' >> /etc/sysconfig/SuSEfirewall2
grep -q '^FW_DEV_EXT=' /etc/sysconfig/SuSEfirewall2 || echo 'FW_DEV_EXT=\"$IF\"' >> /etc/sysconfig/SuSEfirewall2
grep -q '^FW_SERVICES_EXT=' /etc/sysconfig/SuSEfirewall2 || echo 'FW_SERVICES_EXT=\"\"' >> /etc/sysconfig/SuSEfirewall2
sed -i 's/^START_FW=.*/START_FW=\"yes\"/' /etc/sysconfig/SuSEfirewall2
sed -i 's/^FW_DEV_EXT=.*/FW_DEV_EXT=\"$IF\"/' /etc/sysconfig/SuSEfirewall2
sed -i 's/^FW_SERVICES_EXT=.*/FW_SERVICES_EXT=\"\"/' /etc/sysconfig/SuSEfirewall2
sed -i 's/^FW_SERVICES_EXT_TCP=.*/FW_SERVICES_EXT_TCP=\"\"/' /etc/sysconfig/SuSEfirewall2
"
echo linux | sudo -S SuSEfirewall2 restart
echo linux | sudo -S SuSEfirewall2 status | head -5
