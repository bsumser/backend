import requests
import json
import os
import re
import time
from tqdm import tqdm

# --- Configuration ---
BULK_DATA_MANIFEST_URL = "https://api.scryfall.com/bulk-data"
PREFERRED_IMAGE_QUALITY = 'normal'
# ✅ UPDATED: The absolute path on your droplet for all image operations.
IMAGE_OUTPUT_DIRECTORY = 'mtg_images'
REQUEST_DELAY = 0.1
BULK_DATA_FILE_PATH = 'default_cards_bulk.json'

def get_default_cards_download_uri():
    """Fetches the URI for the 'default_cards' bulk data file from Scryfall."""
    print("Fetching bulk data manifest...")
    try:
        response = requests.get(BULK_DATA_MANIFEST_URL)
        response.raise_for_status()
        manifest = response.json()
        for bulk_file in manifest.get('data', []):
            if bulk_file.get('type') == 'default_cards':
                print(f"Found 'default_cards' URI: {bulk_file.get('download_uri')}")
                return bulk_file.get('download_uri')
        print("Error: 'default_cards' bulk data URI not found in manifest.")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching bulk data manifest: {e}")
        return None
    except json.JSONDecodeError:
        print("Error decoding JSON from bulk data manifest.")
        return None

def download_bulk_data(uri, filepath):
    """Downloads the bulk data JSON file if it doesn't already exist."""
    if os.path.exists(filepath):
        print(f"Bulk data file '{filepath}' already exists. Using local copy.")
        return True
    print(f"Downloading bulk data from {uri} to {filepath}...")
    try:
        response = requests.get(uri, stream=True)
        response.raise_for_status()
        total_size = int(response.headers.get('content-length', 0))
        with open(filepath, 'wb') as f, tqdm(
            desc=filepath, total=total_size, unit='iB',
            unit_scale=True, unit_divisor=1024,
        ) as bar:
            for chunk in response.iter_content(chunk_size=8192):
                size = f.write(chunk)
                bar.update(size)
        print("Bulk data downloaded successfully.")
        return True
    except (requests.exceptions.RequestException, IOError) as e:
        print(f"Error during bulk data download: {e}")
        return False

def sanitize_filename(name):
    """
    Sanitizes a string to be used in a filename.
    Keeps spaces in names to match your existing files.
    """
    if not name: return "unknown"
    s = str(name).strip().replace(' // ', '_--_')
    s = re.sub(r'[<>:"/\\|?*]', '_', s)
    return s

def download_images_from_bulk_data(bulk_data_filepath):
    """
    Parses bulk data and efficiently downloads only the images that are not
    already present in the output directory.
    """
    if not os.path.exists(bulk_data_filepath):
        print(f"Error: Bulk data file '{bulk_data_filepath}' not found.")
        return

    os.makedirs(IMAGE_OUTPUT_DIRECTORY, exist_ok=True)
    print(f"Image directory is: '{IMAGE_OUTPUT_DIRECTORY}/'")

    print("Scanning for existing images...")
    try:
        existing_files = set(os.listdir(IMAGE_OUTPUT_DIRECTORY))
        print(f"Found {len(existing_files)} existing images.")
    except OSError as e:
        print(f"Error scanning image directory: {e}")
        return
    
    downloaded_count = 0
    already_exists_count = 0
    no_uri_count = 0
    error_count = 0

    with open(bulk_data_filepath, 'r', encoding='utf-8') as f:
        print("Loading bulk data JSON... (This might take a moment)")
        all_cards_data = json.load(f)
        print(f"Loaded {len(all_cards_data)} card objects from bulk data.")

    print(f"\nStarting image download process (Quality: {PREFERRED_IMAGE_QUALITY})...")
    for card_data in tqdm(all_cards_data, desc="Processing cards"):
        # Use scryfall_id if available for a more stable link, fall back to the card object's id
        image_id = card_data.get('scryfall_id') or card_data.get('id')
        card_name = card_data.get('name', 'UnknownCard')
        
        if not image_id:
            no_uri_count += 1
            continue

        image_uri_to_download = None
        if card_data.get('image_uris'):
            image_uri_to_download = card_data['image_uris'].get(PREFERRED_IMAGE_QUALITY)
        elif 'card_faces' in card_data and card_data['card_faces'][0].get('image_uris'):
            image_uri_to_download = card_data['card_faces'][0]['image_uris'].get(PREFERRED_IMAGE_QUALITY)

        if not image_uri_to_download:
            no_uri_count += 1
            continue

        file_extension = ".jpg"
        if PREFERRED_IMAGE_QUALITY == 'png' or image_uri_to_download.lower().endswith('.png'):
            file_extension = ".png"

        sane_card_name = sanitize_filename(card_name)
        image_filename = f"{sane_card_name}_{image_id}{file_extension}"
        
        if image_filename in existing_files:
            already_exists_count += 1
            continue

        try:
            img_response = requests.get(image_uri_to_download, stream=True)
            img_response.raise_for_status()
            
            image_filepath = os.path.join(IMAGE_OUTPUT_DIRECTORY, image_filename)
            with open(image_filepath, 'wb') as img_f:
                for chunk in img_response.iter_content(chunk_size=8192):
                    img_f.write(chunk)
            
            downloaded_count += 1
            existing_files.add(image_filename)

        except requests.exceptions.RequestException as e:
            tqdm.write(f"Error downloading image for '{card_name}' (ID: {image_id}): {e}")
            error_count += 1
        finally:
            time.sleep(REQUEST_DELAY)

    print("\n--- Download Summary ---")
    print(f"Successfully downloaded: {downloaded_count} new images")
    print(f"Skipped (already exist): {already_exists_count} images")
    print(f"Skipped (no image URI): {no_uri_count} cards")
    print(f"Errors during download: {error_count} images")
    print("------------------------")

if __name__ == "__main__":
    default_cards_uri = get_default_cards_download_uri()
    if default_cards_uri:
        if download_bulk_data(default_cards_uri, BULK_DATA_FILE_PATH):
            download_images_from_bulk_data(BULK_DATA_FILE_PATH)
        else:
            print("Could not download bulk data. Aborting image download.")
    else:
        print("Could not retrieve 'default_cards' URI. Aborting.")