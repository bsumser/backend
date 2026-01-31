import requests
import json
import os
import re
import time
import sys
import boto3
from dotenv import load_dotenv
from pathlib import Path
from tqdm import tqdm

# --- Environment Setup ---
ROOT_DIR = Path(__file__).resolve().parents[1]
env_path = ROOT_DIR / 'database.env'

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"Loaded environment from {env_path}")
else:
    print("No database.env found, relying on system environment variables.")

# --- Configuration ---
BULK_DATA_MANIFEST_URL = "https://api.scryfall.com/bulk-data"
PREFERRED_IMAGE_QUALITY = 'normal'
BULK_DATA_FILE_PATH = ROOT_DIR / 'default_cards_bulk.json'
CACHE_FILE = ROOT_DIR / 'image_cache.txt'
REQUEST_DELAY = 0.1 

ACCESS_KEY = os.getenv('DO_ACCESS_KEY')
SECRET_KEY = os.getenv('DO_SECRET_KEY')
SPACE_NAME = os.getenv('DO_SPACE_NAME', 'mtg-image') 
REGION = os.getenv('DO_REGION', 'sfo3') 
ENDPOINT_URL = f'https://{REGION}.digitaloceanspaces.com'

def get_s3_client():
    if not all([ACCESS_KEY, SECRET_KEY, SPACE_NAME]):
        print("CRITICAL ERROR: Credentials missing.")
        sys.exit(1)
    session = boto3.session.Session()
    return session.client('s3',
                          region_name=REGION,
                          endpoint_url=ENDPOINT_URL,
                          aws_access_key_id=ACCESS_KEY,
                          aws_secret_access_key=SECRET_KEY)

def get_existing_filenames(client):
    existing_files = set()
    
    # 1. Try to download remote cache
    try:
        print("Checking for remote cache...")
        client.download_file(SPACE_NAME, 'image_cache.txt', str(CACHE_FILE))
        with open(CACHE_FILE, 'r') as f:
            existing_files = set(line.strip() for line in f)
        print(f"Cache loaded: {len(existing_files)} files found.")
        return existing_files
    except Exception:
        print("No cache found or failed to download. Performing full bucket scan...")

    # 2. Fallback to full scan
    paginator = client.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=SPACE_NAME):
        if 'Contents' in page:
            for obj in page['Contents']:
                existing_files.add(obj['Key'])
    
    print(f"Scan complete. Found {len(existing_files)} files.")
    return existing_files

def save_and_upload_cache(client, existing_files):
    """Saves the set to a local file and uploads it to the Space."""
    print("Saving and uploading updated cache...")
    with open(CACHE_FILE, 'w') as f:
        # Sort them to keep the text file clean
        for filename in sorted(existing_files):
            f.write(f"{filename}\n")
    client.upload_file(str(CACHE_FILE), SPACE_NAME, 'image_cache.txt')

def get_default_cards_download_uri():
    print("Fetching Scryfall manifest...")
    response = requests.get(BULK_DATA_MANIFEST_URL)
    response.raise_for_status()
    for bulk_file in response.json().get('data', []):
        if bulk_file.get('type') == 'default_cards':
            return bulk_file.get('download_uri')
    return None

def download_bulk_data(uri, filepath):
    if filepath.exists():
        return True
    print(f"Downloading bulk data JSON...")
    response = requests.get(uri, stream=True)
    response.raise_for_status()
    with open(filepath, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    return True

def sanitize_filename(name):
    s = str(name).strip().replace(' // ', '_--_')
    return re.sub(r'[<>:"/\\|?*]', '_', s)

def sync_images_to_space():
    client = get_s3_client()
    existing_files = get_existing_filenames(client)

    uri = get_default_cards_download_uri()
    if not uri or not download_bulk_data(uri, BULK_DATA_FILE_PATH):
        print("Failed to get bulk data.")
        return

    with open(BULK_DATA_FILE_PATH, 'r', encoding='utf-8') as f:
        all_cards_data = json.load(f)

    print(f"Starting Sync...")
    new_uploads = 0
    skipped = 0

    try:
        for card_data in tqdm(all_cards_data, desc="Processing"):
            image_id = card_data.get('scryfall_id') or card_data.get('id')
            card_name = card_data.get('name', 'Unknown')
            
            image_uri = card_data.get('image_uris', {}).get(PREFERRED_IMAGE_QUALITY)
            if not image_uri and 'card_faces' in card_data:
                image_uri = card_data['card_faces'][0].get('image_uris', {}).get(PREFERRED_IMAGE_QUALITY)

            if not image_uri: continue

            ext = ".png" if ".png" in image_uri.lower() else ".jpg"
            filename = f"{sanitize_filename(card_name)}_{image_id}{ext}"

            if filename in existing_files:
                skipped += 1
                continue

            # Upload logic
            img_res = requests.get(image_uri, stream=True)
            img_res.raise_for_status()
            client.upload_fileobj(
                img_res.raw, SPACE_NAME, filename,
                ExtraArgs={'ACL': 'public-read', 'ContentType': f'image/{"png" if "png" in ext else "jpeg"}'}
            )
            
            # IMPORTANT: Add to the set so we don't upload it again if the script restarts
            existing_files.add(filename)
            new_uploads += 1
            time.sleep(REQUEST_DELAY)

    except KeyboardInterrupt:
        print("\nInterrupted! Saving progress...")
    except Exception as e:
        print(f"\nError during sync: {e}")
    finally:
        # ALWAYS upload the cache at the end if we added new files
        if new_uploads > 0:
            save_and_upload_cache(client, existing_files)
            print(f"Done! Uploaded: {new_uploads}, Skipped: {skipped}")
        else:
            print("No changes made.")

if __name__ == "__main__":
    sync_images_to_space()