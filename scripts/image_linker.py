# ~/backend/scripts/image_linker_full.py

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
    # This line is commented out to keep spaces in the name, matching your file naming convention.
    # s = re.sub(r'\s+', '_', s)
    return s


def link_all_images():
    """
    Scans the entire database for card printings with a scryfallid, checks for
    corresponding local image files, and updates the card_images table.
    """
    required_vars = ['POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASS', 'MTG_IMAGE_DIRECTORY_PATH']
    if not all(os.environ.get(v) for v in required_vars):
        print("Error: Missing one or more required environment variables in your database.env file.")
        sys.exit(1)

    print("Starting full image linking process for entire collection...")
    print(f"Scanning for images in: {IMAGE_DIRECTORY_PATH}")

    if not os.path.isdir(IMAGE_DIRECTORY_PATH):
        print(f"Error: Image directory not found at '{IMAGE_DIRECTORY_PATH}'. Please check the path in your .env file.")
        sys.exit(1)

    conn = None
    inserted_count = 0
    
    try:
        conn = psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, port=DB_PORT)
        print("Successfully connected to the PostgreSQL database.")
        cur = conn.cursor()

        # ✅ UPDATED QUERY: Selects ALL card printings that have a scryfallid.
        query = """
            SELECT cards.id, cards.name, ci.scryfallid
            FROM cards
            JOIN cardidentifiers AS ci ON cards.id = ci.id
            WHERE ci.scryfallid IS NOT NULL;
        """

        print("Executing query to find all card printings with a scryfallid...")
        cur.execute(query)
        all_card_printings = cur.fetchall()

        if not all_card_printings:
            print("Could not find any cards with a scryfallid in the database.")
            return

        total_to_process = len(all_card_printings)
        print(f"Found {total_to_process} card printings to process.")

        for index, (card_id, card_name, scryfall_id) in enumerate(all_card_printings):
            # Log progress periodically
            if (index + 1) % 1000 == 0:
                print(f"  Processed {index + 1} of {total_to_process} cards...")
            
            sanitized_name = sanitize_filename_part(card_name.split(' // ')[0])
            
            # Use glob to find all files that start with this card's name and scryfallid
            search_pattern = os.path.join(IMAGE_DIRECTORY_PATH, f"{sanitized_name}_{scryfall_id}*")
            found_files = glob.glob(search_pattern)

            if not found_files:
                continue # No files found, move to the next card

            for file_path in found_files:
                image_filename = os.path.basename(file_path)
                
                # Insert the file link into the 'card_images' table.
                # ON CONFLICT DO NOTHING ensures we don't insert duplicates and makes the script safe to re-run.
                insert_query = sql.SQL("""
                    INSERT INTO card_images (card_id, image_filename)
                    VALUES (%s, %s)
                    ON CONFLICT (card_id, image_filename) DO NOTHING;
                """)
                
                try:
                    cur.execute(insert_query, (card_id, image_filename))
                    if cur.rowcount > 0:
                        inserted_count += 1
                except psycopg2.Error as e:
                    print(f"  Database Error inserting link for {image_filename}: {e}")
                    conn.rollback() # Rollback this specific insert

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

    print("\n====== Full Linking Process Summary ======")
    print(f"Successfully inserted {inserted_count} new image links into the database.")
    print("Run complete.")
    print("=========================================")


if __name__ == "__main__":
    link_all_images()