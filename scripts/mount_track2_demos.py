import os
import glob
import json
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TRACK2_CATALOG_DIR = os.path.join(ROOT_DIR, 'catalog/track-2')
PUBLIC_DEMOS_DIR = os.path.join(ROOT_DIR, 'tools/ghost-factory-console/public/demos')
INVENTORY_JSON = os.path.join(ROOT_DIR, 'tools/ghost-factory-console/src/data/inventory.json')
FLEET_JSON = os.path.join(ROOT_DIR, 'tools/ghost-factory-console/src/data/fleet.json')
CATALOG_DATA_TS = os.path.join(ROOT_DIR, 'tools/ghost-factory-console/src/catalogData.ts')

PRIMARY_RENDER_URLS = {
    1: 'https://stride-manhattan-beach.onrender.com',
    2: 'https://the-vault-studio.onrender.com',
    3: 'https://velocity-exotic-fleet.onrender.com',
    4: 'https://apex-fight-club.onrender.com',
    5: 'https://elevate-capital-os.onrender.com',
    6: 'https://obsidian-slow-bar.onrender.com',
    7: 'https://the-enclave-villas.onrender.com',
    8: 'https://aura-medspa-os.onrender.com',
}

def clean_html(content: str) -> str:
    # Rewrite absolute /assets/ into relative ./assets/
    content = content.replace('"/assets/', '"./assets/')
    content = content.replace("'/assets/", "'./assets/")
    
    # Liability firewall replacements
    content = content.replace('Delaware Court of Chancery', 'Enterprise Architecture Clearance')
    content = content.replace('Delaware APA', 'Enterprise Asset Spec')
    content = content.replace('micro-APA deliverable', 'Modular Reference Implementation')
    content = content.replace('Monopoly Vault', 'Enterprise Reference Core')
    content = content.replace('Acquire.com Turnkey Buyout Ready', 'Enterprise Production Ready')
    
    # Strip or replace valuation figures ($150,000 USD -> 150,000 PTS)
    content = re.sub(r'\$([0-9]+(?:,[0-9]+)*)\s*(USD)?', r'\1 PTS', content)
    content = re.sub(r'VALUATION:\s*[0-9,]+\s*PTS', 'CLEARANCE: ENTERPRISE SPEC', content)
    return content

def copy_binary_file(src, dst):
    with open(src, 'rb') as f_in, open(dst, 'wb') as f_out:
        f_out.write(f_in.read())

def copy_assets_folder(src_assets, dst_assets):
    if not os.path.exists(src_assets):
        return
    os.makedirs(dst_assets, exist_ok=True)
    for root, dirs, files in os.walk(src_assets):
        rel = os.path.relpath(root, src_assets)
        target_root = os.path.join(dst_assets, rel) if rel != '.' else dst_assets
        os.makedirs(target_root, exist_ok=True)
        for f in files:
            src_f = os.path.join(root, f)
            dst_f = os.path.join(target_root, f)
            try:
                copy_binary_file(src_f, dst_f)
            except Exception as e:
                print(f"Warning copying asset {src_f}: {e}")

def mount_units():
    os.makedirs(TRACK2_CATALOG_DIR, exist_ok=True)
    os.makedirs(PUBLIC_DEMOS_DIR, exist_ok=True)
    
    for uid in range(1, 52):
        tag = f'gf-t2-{uid:03d}'
        cat_unit_dir = os.path.join(TRACK2_CATALOG_DIR, tag)
        pub_unit_dir = os.path.join(PUBLIC_DEMOS_DIR, tag)
        os.makedirs(cat_unit_dir, exist_ok=True)
        os.makedirs(pub_unit_dir, exist_ok=True)
        
        # If uid 1..8 and already in catalog/track-2, sync to public/demos
        if uid <= 8 and os.path.exists(os.path.join(cat_unit_dir, 'index.html')):
            with open(os.path.join(cat_unit_dir, 'index.html'), 'r', encoding='utf-8', errors='ignore') as f:
                c = clean_html(f.read())
            with open(os.path.join(pub_unit_dir, 'index.html'), 'w', encoding='utf-8') as f:
                f.write(c)
            # Copy assets if present in cat_unit_dir
            if os.path.exists(os.path.join(cat_unit_dir, 'assets')):
                copy_assets_folder(os.path.join(cat_unit_dir, 'assets'), os.path.join(pub_unit_dir, 'assets'))
            continue

        # Look in catalog/engines
        eng_matches = glob.glob(os.path.join(ROOT_DIR, f'catalog/engines/gf-unit-{uid:03d}-*'))
        if not eng_matches:
            print(f'Warning: No catalog engine found for {tag}')
            continue
        eng_dir = eng_matches[0]
        
        dist_html = os.path.join(eng_dir, 'dist', 'index.html')
        root_html = os.path.join(eng_dir, 'index.html')
        
        if os.path.exists(dist_html):
            # Read from dist/index.html
            with open(dist_html, 'r', encoding='utf-8', errors='ignore') as f:
                c = clean_html(f.read())
            with open(os.path.join(cat_unit_dir, 'index.html'), 'w', encoding='utf-8') as f:
                f.write(c)
            with open(os.path.join(pub_unit_dir, 'index.html'), 'w', encoding='utf-8') as f:
                f.write(c)
            # Copy dist/assets
            dist_assets = os.path.join(eng_dir, 'dist', 'assets')
            if os.path.exists(dist_assets):
                copy_assets_folder(dist_assets, os.path.join(cat_unit_dir, 'assets'))
                copy_assets_folder(dist_assets, os.path.join(pub_unit_dir, 'assets'))
        elif os.path.exists(root_html):
            # Read from root index.html
            with open(root_html, 'r', encoding='utf-8', errors='ignore') as f:
                c = clean_html(f.read())
            with open(os.path.join(cat_unit_dir, 'index.html'), 'w', encoding='utf-8') as f:
                f.write(c)
            with open(os.path.join(pub_unit_dir, 'index.html'), 'w', encoding='utf-8') as f:
                f.write(c)
            # Copy root assets if any
            root_assets = os.path.join(eng_dir, 'assets')
            if os.path.exists(root_assets):
                copy_assets_folder(root_assets, os.path.join(cat_unit_dir, 'assets'))
                copy_assets_folder(root_assets, os.path.join(pub_unit_dir, 'assets'))
        else:
            print(f'Warning: No HTML found for {tag} in {eng_dir}')

    print('Mounted all 51 Track 2 units into catalog/track-2 and public/demos!')

def update_inventory():
    print('Updating inventory.json and fleet.json...')
    with open(INVENTORY_JSON, 'r', encoding='utf-8') as f:
        inv = json.load(f)
        
    for item in inv:
        uid = item.get('id')
        if uid and 1 <= uid <= 51:
            tag = f'GF-T2-{uid:03d}'
            item['unit_id'] = tag
            item['pricing_track'] = 'Track 2'
            item['flagship_qualified'] = True
            item['demo_url'] = f'/demos/{tag.lower()}/index.html'
            if uid in PRIMARY_RENDER_URLS:
                item['live_url'] = PRIMARY_RENDER_URLS[uid]
            else:
                item['live_url'] = f'/demos/{tag.lower()}/index.html'

    with open(INVENTORY_JSON, 'w', encoding='utf-8') as f:
        json.dump(inv, f, indent=2)

    with open(FLEET_JSON, 'r', encoding='utf-8') as f:
        fleet = json.load(f)
        
    for item in fleet:
        uid = item.get('id')
        if uid and 1 <= uid <= 51:
            tag = f'GF-T2-{uid:03d}'
            item['unit_id'] = tag
            item['pricing_track'] = 'Track 2'
            item['flagship_qualified'] = True
            item['demo_url'] = f'/demos/{tag.lower()}/index.html'
            if uid in PRIMARY_RENDER_URLS:
                item['live_url'] = PRIMARY_RENDER_URLS[uid]
            else:
                item['live_url'] = f'/demos/{tag.lower()}/index.html'

    with open(FLEET_JSON, 'w', encoding='utf-8') as f:
        json.dump(fleet, f, indent=2)

    print('Updated inventory.json and fleet.json successfully!')

def update_catalog_data_ts():
    print('Updating catalogData.ts...')
    with open(CATALOG_DATA_TS, 'r', encoding='utf-8') as f:
        content = f.read()
        
    prefix = 'export const CATALOG_DATA: CatalogData = '
    pos = content.find(prefix)
    if pos == -1:
        print('Error: Could not find CATALOG_DATA in catalogData.ts')
        return
        
    end_pos = content.rfind('};') + 1
    json_str = content[pos + len(prefix):end_pos]
    data = json.loads(json_str)
    
    # Update products 1 to 51
    for prod in data.get('products', []):
        uid = prod.get('id')
        if uid and 1 <= uid <= 51:
            tag = f'GF-T2-{uid:03d}'
            prod['unit_id'] = tag
            prod['pricing_track'] = 'Track 2'
            prod['flagship_qualified'] = True
            prod['demo_url'] = f'/demos/{tag.lower()}/index.html'
            if uid in PRIMARY_RENDER_URLS:
                prod['live_url'] = PRIMARY_RENDER_URLS[uid]
            else:
                prod['live_url'] = f'/demos/{tag.lower()}/index.html'

    new_content = content[:pos + len(prefix)] + json.dumps(data, indent=2) + ';\nexport default CATALOG_DATA;\n'
    with open(CATALOG_DATA_TS, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Updated catalogData.ts successfully!')

def verify():
    cat_demos = glob.glob(os.path.join(TRACK2_CATALOG_DIR, 'gf-t2-*/index.html'))
    pub_demos = glob.glob(os.path.join(PUBLIC_DEMOS_DIR, 'gf-t2-*/index.html'))
    print(f'Total catalog/track-2/gf-t2-*/index.html: {len(cat_demos)}')
    print(f'Total public/demos/gf-t2-*/index.html: {len(pub_demos)}')
    
    missing_cat = []
    missing_pub = []
    for uid in range(1, 52):
        tag = f'gf-t2-{uid:03d}'
        if not os.path.exists(os.path.join(TRACK2_CATALOG_DIR, tag, 'index.html')):
            missing_cat.append(tag)
        if not os.path.exists(os.path.join(PUBLIC_DEMOS_DIR, tag, 'index.html')):
            missing_pub.append(tag)
            
    print(f'Missing in catalog (1..51): {missing_cat}')
    print(f'Missing in public/demos (1..51): {missing_pub}')

if __name__ == '__main__':
    mount_units()
    update_inventory()
    update_catalog_data_ts()
    verify()
