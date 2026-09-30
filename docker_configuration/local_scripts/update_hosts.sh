#!/bin/bash
# Array of host entries you want to ensure exist
entries=(
    "127.0.0.1 app.c-link.local"
    "127.0.0.1 document.local"
    "127.0.0.1 project.local"
    "127.0.0.1 account.local"
    "127.0.0.1 supply_chain.local"
    "127.0.0.1 app.prosper.local"
    "127.0.0.1 admin.local"
    "127.0.0.1 react_service.local"
    "127.0.0.1 api.local"
    "127.0.0.1 react_service_v2.local"
)

# Ask for confirmation
read -p "Are you sure you want to modify your hosts file? (y/n) " -n 1 -r
echo    # move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Loop through each entry
    for entry in "${entries[@]}"
    do
        # Check if the entry exists in /etc/hosts
        if ! grep -q "$entry" /etc/hosts; then
            # Entry does not exist, append it
            echo "$entry" | sudo tee -a /etc/hosts > /dev/null
        fi
    done
fi
