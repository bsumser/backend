import requests
import json
import os
import time
from tqdm import tqdm # For progress bars

# --- Configuration ---
BULK_DATA_MANIFEST_URL = "https://api.scryfall.com/bulk-data"
# You can choose 'png', 'large', 'normal', 'small', 'art_crop', 'border_crop'
PREFERRED_IMAGE_QUALITY = 'normal'
# Directory to save images
IMAGE_OUTPUT_DIRECTORY = 'mtg_images'
# Scryfall API politeness: delay between image download requests (in seconds)
# Scryfall recommends 50-100ms. Let's use 0.1 seconds (100ms).
REQUEST_DELAY = 0.1
# Path to store the bulk data JSON file to avoid re-downloading it every time
BULK_DATA_FILE_PATH = 'default_cards_bulk.json'

def get_default_cards_download_uri():
    """Fetches the URI for the 'default_cards' bulk data file from Scryfall."""
    print("Fetching bulk data manifest...")
    try:
        response = requests.get(BULK_DATA_MANIFEST_URL)
        response.raise_for_status()  # Raises an exception for HTTP errors
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
            desc=filepath,
            total=total_size,
            unit='iB',
            unit_scale=True,
            unit_divisor=1024,
        ) as bar:
            for chunk in response.iter_content(chunk_size=8192):
                size = f.write(chunk)
                bar.update(size)
        print("Bulk data downloaded successfully.")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error downloading bulk data: {e}")
        return False
    except IOError as e:
        print(f"Error writing bulk data to file: {e}")
        return False


def sanitize_filename(name):
    """Removes or replaces characters that are invalid in filenames."""
    # Replace common problematic characters with an underscore
    invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
    for char in invalid_chars:
        name = name.replace(char, '_')
    return name

def download_images_from_bulk_data(bulk_data_filepath):
    """
    Parses the bulk data JSON and downloads card images.
    """
    if not os.path.exists(bulk_data_filepath):
        print(f"Error: Bulk data file '{bulk_data_filepath}' not found.")
        return

    # Create output directory if it doesn't exist
    os.makedirs(IMAGE_OUTPUT_DIRECTORY, exist_ok=True)
    print(f"Saving images to '{IMAGE_OUTPUT_DIRECTORY}/'")

    downloaded_count = 0
    skipped_count = 0
    error_count = 0

    with open(bulk_data_filepath, 'r', encoding='utf-8') as f:
        print("Loading bulk data JSON... (This might take a moment)")
        all_cards_data = json.load(f)
        print(f"Loaded {len(all_cards_data)} card objects from bulk data.")

    print(f"Starting image download process (Quality: {PREFERRED_IMAGE_QUALITY})...")
    for card_data in tqdm(all_cards_data, desc="Processing cards"):
        card_name = card_data.get('name', 'UnknownCard')
        card_id = card_data.get('id', None) # Scryfall's unique ID for the card print

        if not card_id:
            print(f"Skipping card '{card_name}' due to missing Scryfall ID.")
            skipped_count += 1
            continue

        image_uri_to_download = None

        # Handle multi-faced cards (e.g., Adventures, Modal DFCs)
        # The top-level 'image_uris' usually refers to the front face for MDFCs
        # or the creature part for Adventures.
        # For tokens or cards without standard images, image_uris might be missing.
        if 'image_uris' in card_data:
            image_uri_to_download = card_data['image_uris'].get(PREFERRED_IMAGE_QUALITY)
        elif 'card_faces' in card_data:
            # For cards with multiple faces, we'll try to get the first face's image.
            # You might want to customize this to download all faces.
            faces = card_data.get('card_faces', [])
            if faces and 'image_uris' in faces[0]:
                image_uri_to_download = faces[0]['image_uris'].get(PREFERRED_IMAGE_QUALITY)
                card_name = faces[0].get('name', card_name) # Use face name if available

        if not image_uri_to_download:
            # print(f"No '{PREFERRED_IMAGE_QUALITY}' image URI for '{card_name}' (ID: {card_id}). Skipping.")
            skipped_count += 1
            continue

        # Determine file extension
        file_extension = ".jpg" # Default
        if PREFERRED_IMAGE_QUALITY == 'png' or image_uri_to_download.lower().endswith('.png'):
            file_extension = ".png"

        # Sanitize card name for filename and append Scryfall ID for uniqueness
        sane_card_name = sanitize_filename(card_name)
        image_filename = f"{sane_card_name}_{card_id}{file_extension}"
        image_filepath = os.path.join(IMAGE_OUTPUT_DIRECTORY, image_filename)

        if os.path.exists(image_filepath):
            # print(f"Image for '{card_name}' (ID: {card_id}) already exists. Skipping.")
            skipped_count += 1
            continue

        try:
            # print(f"Downloading: {card_name} from {image_uri_to_download}")
            img_response = requests.get(image_uri_to_download, stream=True)
            img_response.raise_for_status()

            with open(image_filepath, 'wb') as img_f:
                for chunk in img_response.iter_content(chunk_size=8192):
                    img_f.write(chunk)
            downloaded_count += 1
            # print(f"Saved: {image_filepath}")

        except requests.exceptions.RequestException as e:
            print(f"Error downloading image for '{card_name}' (ID: {card_id}): {e}")
            error_count +=1
        except IOError as e:
            print(f"Error saving image for '{card_name}' (ID: {card_id}): {e}")
            error_count +=1
        finally:
            time.sleep(REQUEST_DELAY) # API politeness

    print("\n--- Download Summary ---")
    print(f"Successfully downloaded: {downloaded_count} images")
    print(f"Skipped (no URI or already exists): {skipped_count} images")
    print(f"Errors: {error_count} images")
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