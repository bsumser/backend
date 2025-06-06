# ~/backend/scripts/image_linker_goldspan_test.py

import os
import re
import sys
import glob
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# --- Configuration ---
# Finds the database.env file in the parent directory (e.g., ~/backend)
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
ENV_FILE_PATH = os.path.join(project_root, 'database.env')

# Load environment variables from the specified file
if os.path.exists(ENV_FILE_PATH):
    print(f"Loading environment variables from: {ENV_FILE_PATH}")
    load_dotenv(dotenv_path=ENV_FILE_PATH)
else:
    print(f"Warning: Environment file not found at '{ENV_FILE_PATH}'. Relying on system-set variables.")

# Read variables using the names from your database.env file
DB_HOST = os.environ.get('POSTGRES_HOST')
DB_NAME = os.environ.get('POSTGRES_DB')
DB_USER = os.environ.get('POSTGRES_USER')
DB_PASSWORD = os.environ.get('POSTGRES_PASS')
DB_PORT = os.environ.get('POSTGRES_PORT', '5432')
IMAGE_DIRECTORY_PATH = os.environ.get('MTG_IMAGE_DIRECTORY_PATH', '/srv/mtg_images')


def sanitize_filename_part(name_part):
    """Sanitizes a string for use in a filename, keeping spaces."""
    if not name_part: return "unknown"
    s = str(name_part).strip().replace(' // ', '_--_')
    s = re.sub(r'[<>:"/\\|?*]', '_', s)
    # The line below is commented out to keep spaces, matching your filenames
    # s = re.sub(r'\s+', '_', s)
    return s


def link_goldspan_dragon_images():
    """
    Specifically targets 'Goldspan Dragon', finds all its images, and inserts
    records into the 'card_images' table.
    """
    required_vars = ['POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASS', 'MTG_IMAGE_DIRECTORY_PATH']
    if not all(os.environ.get(v) for v in required_vars):
        print("Error: Missing one or more required environment variables in your database.env file.")
        sys.exit(1)

    print("Starting specific image linking process for 'Goldspan Dragon'...")
    print(f"Scanning for images in: {IMAGE_DIRECTORY_PATH}")

    conn = None
    inserted_count = 0
    skipped_count = 0

    try:
        conn = psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, port=DB_PORT)
        print("Successfully connected to the PostgreSQL database.")
        cur = conn.cursor()

        # ✅ UPDATED QUERY: Selects cards.id (the integer key) instead of uuid.
        # It specifically targets 'Goldspan Dragon'.
        query = """
            SELECT cards.id, cards.name, ci.scryfallid
            FROM cards
            JOIN cardidentifiers AS ci ON cards.id = ci.id
            WHERE cards.name = 'Goldspan Dragon'
              AND ci.scryfallid IS NOT NULL;
        """

        print("Executing query to find all 'Goldspan Dragon' printings...")
        cur.execute(query)
        cards_to_link = cur.fetchall()

        if not cards_to_link:
            print("Could not find any cards named 'Goldspan Dragon' in the database.")
            return

        print(f"Found {len(cards_to_link)} 'Goldspan Dragon' printings to process.")

        for card_id, card_name, scryfall_id in cards_to_link:
            sanitized_name = sanitize_filename_part(card_name.split(' // ')[0])
            
            # Use glob to find all files that start with this card's name and scryfallid
            # This will find .jpg, .png, and variants like _art_crop.jpg, etc.
            search_pattern = os.path.join(IMAGE_DIRECTORY_PATH, f"{sanitized_name}_{scryfall_id}*")
            found_files = glob.glob(search_pattern)

            if not found_files:
                print(f"  ❌ No image files found for '{card_name}' (scryfallid: {scryfall_id}). Skipping.")
                skipped_count += 1
                continue

            print(f"  Found {len(found_files)} image(s) for '{card_name}' (scryfallid: {scryfall_id})")
            
            for file_path in found_files:
                image_filename = os.path.basename(file_path)
                
                # ✅ UPDATED LOGIC: Inserts a new row into the 'card_images' table.
                # ON CONFLICT DO NOTHING ensures we don't insert duplicates if the script is re-run.
                insert_query = sql.SQL("""
                    INSERT INTO card_images (card_id, image_filename)
                    VALUES (%s, %s)
                    ON CONFLICT (card_id, image_filename) DO NOTHING;
                """)
                
                try:
                    cur.execute(insert_query, (card_id, image_filename))
                    # cur.rowcount will be 1 for a new insert, 0 if it already existed (due to ON CONFLICT)
                    if cur.rowcount > 0:
                        print(f"    ✅ Linked new file: {image_filename}")
                        inserted_count += 1
                    else:
                        print(f"    - Link for file '{image_filename}' already exists. Skipping.")
                except psycopg2.Error as e:
                    print(f"    ❌ DB Error inserting link for {image_filename}: {e}")
                    conn.rollback()

        conn.commit() # Commit all successful inserts at the end
        cur.close()

    except psycopg2.Error as e:
        print(f"\n--- A database error occurred: {e}")
        if conn: conn.rollback()
    except Exception as e:
        print(f"\n--- An unexpected error occurred: {e}")
    finally:
        if conn:
            conn.close()
            print("\nDatabase connection closed.")

    print("\n====== Goldspan Dragon Linking Summary ======")
    print(f"Successfully inserted {inserted_count} new image links.")
    print(f"Skipped {skipped_count} printings due to missing image files.")
    print("===========================================")

if __name__ == "__main__":
    link_goldspan_dragon_images()