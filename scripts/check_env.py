#!/usr/bin/env python3
import os
import re
import sys

def get_env_keys(file_path):
    keys = set()
    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if line.startswith("export "):
                        line = line[len("export "):]
                    key = line.split('=')[0].strip()
                    if key:
                        keys.add(key)
    except FileNotFoundError:
        pass
    return keys

def get_config_keys_from_dir(directory):
    keys = set()
    for root, dirs, files in os.walk(directory):
        if 'tests' in dirs:
            dirs.remove('tests')
        for file in files:
            if file.endswith('.php'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', errors='ignore') as f:
                        content = f.read()
                        matches = re.findall(r"Environment::getValue\('([^']*)'", content)
                        for match in matches:
                            keys.add(match)
                except Exception:
                    pass
    return keys

SERVICES = {
    'app.c-link': 'app.c-link/docker/.env.template',
    'framework': 'framework/docker/.env.template',
    'account_service': 'account_service/docker/.env.template',
    'project_service': 'project_service/docker/.env.template',
    'document_service': 'document_service/docker/.env.template',
}

def main():
    if os.environ.get('CI'):
        print("CI environment detected, skipping .env checks.")
        sys.exit(0)

    all_errors = []

    for service_name, template_file in SERVICES.items():
        env_file = os.path.join(service_name, '.env')

        errors = []

        env_keys = get_env_keys(env_file)
        template_keys = get_env_keys(template_file)

        # Check for missing keys in .env from template
        missing_keys = template_keys - env_keys
        if missing_keys:
            errors.append(f"Missing environment variables in {env_file} (from template {template_file}):")
            for key in sorted(missing_keys):
                errors.append(f"- {key}")

        # Check for missing keys in config files against the template
        config_keys = get_config_keys_from_dir(service_name)
        missing_config_keys = config_keys - template_keys
        if missing_config_keys:
            errors.append(f"Missing environment variables in {template_file} required by files in '{service_name}':")
            for key in sorted(missing_config_keys):
                errors.append(f"- {key}")

        if errors:
            all_errors.append(f"\n--- Errors for {service_name} ---")
            all_errors.extend(errors)

    if all_errors:
        for error in all_errors:
            print(error)
        sys.exit(1)

    print("All environment variables are in place.")
    sys.exit(0)

if __name__ == "__main__":
    main()
