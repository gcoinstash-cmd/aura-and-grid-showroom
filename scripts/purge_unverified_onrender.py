import os
import json
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CONSOLE_DIR = os.path.join(ROOT_DIR, 'tools/ghost-factory-console')

INVENTORY_JSON = os.path.join(CONSOLE_DIR, 'src/data/inventory.json')
FLEET_JSON = os.path.join(CONSOLE_DIR, 'src/data/fleet.json')
CATALOG_MANIFEST_JSON = os.path.join(CONSOLE_DIR, 'src/data/CATALOG_MANIFEST.json')
CATALOG_DATA_TS = os.path.join(CONSOLE_DIR, 'src/catalogData.ts')
FLEET_DATA_TS = os.path.join(CONSOLE_DIR, 'src/data/fleetData.ts')

VERIFIED_EXTERNAL_URLS = [
    'https://stride-manhattan-beach.onrender.com',
    'https://the-vault-studio.onrender.com',
    'https://velocity-exotic-fleet.onrender.com',
    'https://apex-fight-club.onrender.com',
    'https://elevate-capital-os.onrender.com',
    'https://obsidian-slow-bar.onrender.com',
    'https://the-enclave-villas.onrender.com',
    'https://aura-medspa-os.onrender.com'
]

VERIFIED_HOSTS = [
    'stride-manhattan-beach.onrender.com',
    'the-vault-studio.onrender.com',
    'velocity-exotic-fleet.onrender.com',
    'apex-fight-club.onrender.com',
    'elevate-capital-os.onrender.com',
    'obsidian-slow-bar.onrender.com',
    'the-enclave-villas.onrender.com',
    'aura-medspa-os.onrender.com'
]

def is_verified(url):
    if not url:
        return False
    return any(host in str(url) for host in VERIFIED_HOSTS)

def clean_item(item):
    uid = item.get('id')
    is_top8 = uid and 1 <= uid <= 8
    
    # Clean live_url
    if not is_top8:
        item['live_url'] = None
    elif item.get('live_url') and not is_verified(item.get('live_url')):
        item['live_url'] = None

    # Clean other fields containing onrender.com
    for key in ['preview_url', 'admin_url', 'demo_url']:
        val = item.get(key)
        if val and 'onrender.com' in str(val):
            if not is_top8 or not is_verified(val):
                item[key] = None

    # Ensure demo_url points to local static route
    unit_id = item.get('unit_id')
    if unit_id:
        item['demo_url'] = f"/demos/{unit_id.lower()}/index.html"

def clean_json_file(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                clean_item(item)
    elif isinstance(data, dict):
        if 'products' in data and isinstance(data['products'], list):
            for item in data['products']:
                if isinstance(item, dict):
                    clean_item(item)
        if 'items' in data and isinstance(data['items'], list):
            for item in data['items']:
                if isinstance(item, dict):
                    clean_item(item)
        for k, v in list(data.items()):
            if isinstance(v, dict):
                clean_item(v)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Cleaned {file_path}")

def clean_catalog_data_ts():
    if not os.path.exists(CATALOG_DATA_TS):
        return
    with open(CATALOG_DATA_TS, 'r', encoding='utf-8') as f:
        content = f.read()

    prefix = 'export const CATALOG_DATA: CatalogData = '
    pos = content.find(prefix)
    if pos == -1:
        print("Prefix not found in catalogData.ts")
        return

    end_pos = content.rfind('};') + 1
    json_str = content[pos + len(prefix):end_pos]
    data = json.loads(json_str)

    for item in data.get('products', []):
        if isinstance(item, dict):
            clean_item(item)

    new_content = content[:pos + len(prefix)] + json.dumps(data, indent=2) + ';\nexport default CATALOG_DATA;\n'
    with open(CATALOG_DATA_TS, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Cleaned catalogData.ts")

def clean_fleet_data_ts():
    if not os.path.exists(FLEET_DATA_TS):
        return
    # In fleetData.ts, replace unverified .onrender.com lines with null
    with open(FLEET_DATA_TS, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    modified_lines = []
    for line in lines:
        if 'onrender.com' in line:
            if any(host in line for host in VERIFIED_HOSTS):
                modified_lines.append(line)
            else:
                # Replace url with null
                new_line = re.sub(r':\s*["\']https?://[^"\']+["\']', ': null', line)
                modified_lines.append(new_line)
        else:
            modified_lines.append(line)

    with open(FLEET_DATA_TS, 'w', encoding='utf-8') as f:
        f.writelines(modified_lines)
    print("Cleaned fleetData.ts")

if __name__ == '__main__':
    clean_json_file(INVENTORY_JSON)
    clean_json_file(FLEET_JSON)
    clean_json_file(CATALOG_MANIFEST_JSON)
    clean_catalog_data_ts()
    clean_fleet_data_ts()
    print("Finished purging all unverified onrender.com URLs!")
